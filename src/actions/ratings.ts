'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server-admin'
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

  // Enforce one rating per session.
  const { data: existing, error: dupError } = await supabase
    .from('ratings')
    .select('id')
    .eq('session_id', sessionId)
    .single()

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
    })
    .select()
    .single()

  if (ratingError) return { data: null, error: ratingError.message }

  // Award 1 credit to the mentor for ratings >= 4.
  if (score >= 4) {
    await admin.from('credits').insert({
      user_id: session.mentor_id,
      session_id: sessionId,
      rating_id: rating.id,
      amount: 1,
    })
    // Credit insert failure is non-fatal — rating is already saved.
    // The DB trigger also enforces no credit during open disputes.
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
