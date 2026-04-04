'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server-admin'
import { detectFraud } from '@/lib/ai/claude'
import { checkAndUpdateTrustStatus } from '@/actions/trust'
import type { ActionResult, Rating } from '@/types'

// Submits a rating from the mentee for a validated session.
// Rules enforced:
//   - caller must be the mentee of the session
//   - session must be validated (completed)
//   - one rating per session max
// If score >= 4, a credit is awarded to the mentor automatically.
export async function submitRating(
  sessionId: string,
  score: number,
  comment?: string,
): Promise<ActionResult<Rating>> {
  if (score < 1 || score > 5 || !Number.isInteger(score)) {
    return { data: null, error: 'Score must be an integer between 1 and 5' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Not authenticated' }

  // Verify session exists, caller is the mentee, and session is validated.
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('id, mentor_id, mentee_id, validated, status')
    .eq('id', sessionId)
    .single()

  if (sessionError || !session) return { data: null, error: 'Session not found' }
  if (session.mentee_id !== user.id) return { data: null, error: 'Only the mentee can rate a session' }
  if (!session.validated) return { data: null, error: 'Session must be validated before rating' }
  if (session.status !== 'completed') return { data: null, error: 'Session is not completed' }

  // Fetch duplicate check + fraud inputs in parallel, then run the fraud agent.
  const [dupCheck, pairCount, recentCount] = await Promise.all([
    // 1. One-rating-per-session guard
    supabase
      .from('ratings')
      .select('id')
      .eq('session_id', sessionId)
      .single(),
    // 2. Total sessions between this mentor-mentee pair (fraud signal: friend-farming)
    supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .or(`and(mentor_id.eq.${session.mentor_id},mentee_id.eq.${user.id}),and(mentor_id.eq.${user.id},mentee_id.eq.${session.mentor_id})`),
    // 3. Ratings this mentee submitted in the last 24 h (fraud signal: rating burst)
    supabase
      .from('ratings')
      .select('*', { count: 'exact', head: true })
      .eq('mentee_id', user.id)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
  ])

  const { data: existing, error: dupError } = dupCheck

  // Claude fraud-detection agent — runs after counts are known.
  const fraud = await detectFraud({
    menteeId: user.id,
    mentorId: session.mentor_id,
    score,
    pastSessionCount: pairCount.count ?? 0,
    menteeRatingsLast24h: recentCount.count ?? 0,
  })

  if (dupError && dupError.code !== 'PGRST116') return { data: null, error: dupError.message }
  if (existing) return { data: null, error: 'This session has already been rated' }

  // Insert rating using admin client (no user-facing insert RLS policy on ratings for server writes).
  const admin = createAdminClient()
  const { data: rating, error: ratingError } = await admin
    .from('ratings')
    .insert({
      session_id: sessionId,
      mentor_id: session.mentor_id,
      mentee_id: user.id,
      score,
      comment: comment ?? null,
      fraud_flags: fraud.flags.length > 0 ? fraud.flags : null,
    })
    .select()
    .single()

  if (ratingError) return { data: null, error: ratingError.message }

  // Flag the mentee's account if the fraud agent flagged the submission.
  if (fraud.recommendation === 'flag' || fraud.recommendation === 'review') {
    await admin
      .from('profiles')
      .update({ trust_status: fraud.recommendation === 'review' ? 'tribunal_review' : 'flagged' })
      .eq('id', user.id)
    // Non-fatal — rating is saved; tribunal can assess asynchronously.
  }

  // Star-accumulation credit system:
  // Add this score to the mentor's star_balance. Every 5 cumulative stars = 1 credit.
  const { data: mentorProfile } = await admin
    .from('profiles')
    .select('star_balance')
    .eq('id', session.mentor_id)
    .single()

  if (mentorProfile) {
    const newBalance = (mentorProfile.star_balance ?? 0) + score
    const creditsEarned = Math.floor(newBalance / 5)
    const remainingStars = newBalance % 5

    await admin
      .from('profiles')
      .update({ star_balance: remainingStars })
      .eq('id', session.mentor_id)

    if (creditsEarned > 0) {
      await admin.from('credits').insert({
        user_id: session.mentor_id,
        session_id: sessionId,
        rating_id: rating.id,
        amount: creditsEarned,
      })
    }
  }

  // For low scores (<=2), re-evaluate the mentor's trust status.
  // This feeds the repeated-low-rating escalation path in the trust state machine.
  if (score <= 2) {
    await checkAndUpdateTrustStatus(session.mentor_id)
  }

  return { data: rating, error: null }
}

// Returns all ratings the logged-in user has received as a mentor.
export async function getReceivedRatings(): Promise<ActionResult<Rating[]>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('ratings')
    .select('*')
    .eq('mentor_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

// Returns the rating for a specific session, if one exists.
export async function getSessionRating(sessionId: string): Promise<ActionResult<Rating | null>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('ratings')
    .select('*')
    .eq('session_id', sessionId)
    .single()

  if (error && error.code === 'PGRST116') return { data: null, error: null } // no rating yet
  if (error) return { data: null, error: error.message }
  return { data, error: null }
}
