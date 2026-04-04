'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server-admin'
import { checkAndUpdateTrustStatus } from '@/actions/trust'
import type { ActionResult, Dispute, DisputeResolution } from '@/types'

// Files a dispute for a session. Either participant can file.
// Disputes pause credit awards for the session (enforced by DB trigger in
// 001_init.sql: enforce_no_credit_during_dispute).
// After filing, the trust status of the other party is re-evaluated via
// checkAndUpdateTrustStatus() — a dispute filed against you is a trust signal.
export async function fileDispute(
  sessionId: string,
  reason: string,
): Promise<ActionResult<Dispute>> {
  if (!reason.trim()) return { data: null, error: 'Reason is required' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Not authenticated' }

  // Verify the user is a participant in the session.
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('mentor_id, mentee_id, status')
    .eq('id', sessionId)
    .single()

  if (sessionError || !session) return { data: null, error: 'Session not found' }
  if (session.mentor_id !== user.id && session.mentee_id !== user.id) {
    return { data: null, error: 'You are not a participant in this session' }
  }
  if (session.status === 'cancelled') {
    return { data: null, error: 'Cannot dispute a cancelled session' }
  }

  // Server-side duplicate guard: a session may only have one open (unresolved)
  // dispute at a time.  The UI hides the form once a dispute is open, but this
  // check ensures the rule is enforced even if the form is submitted directly.
  const { data: existingDispute } = await supabase
    .from('disputes')
    .select('id, status')
    .eq('session_id', sessionId)
    .in('status', ['open', 'escalated'])
    .maybeSingle()

  if (existingDispute) {
    return { data: null, error: 'An open dispute already exists for this session' }
  }

  const { data, error } = await supabase
    .from('disputes')
    .insert({
      session_id: sessionId,
      filed_by: user.id,
      reason: reason.trim(),
      status: 'open',
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  // Mark the session status as 'disputed' so the UI reflects the open case.
  // Non-fatal: if this update fails the dispute is still filed.
  const admin = createAdminClient()
  await admin
    .from('sessions')
    .update({ status: 'disputed' })
    .eq('id', sessionId)

  // Re-evaluate trust status of the OTHER party (the one being disputed against).
  const otherPartyId = user.id === session.mentor_id ? session.mentee_id : session.mentor_id
  await checkAndUpdateTrustStatus(otherPartyId)

  return { data, error: null }
}

// ─────────────────────────────────────────────────────────────────────────────
// resolveDispute
//
// Admin-only action: resolves an open or escalated dispute.
//
// Parameters:
//   disputeId        — the dispute to resolve
//   outcome          — 'favor_mentor' | 'favor_mentee'
//   resolutionNote   — free-text explanation recorded for audit purposes
//
// Side effects:
//   1. Sets dispute.status = 'resolved', dispute.resolved_in_favor_of,
//      dispute.resolution, dispute.resolved_at.
//   2. Updates session.status:
//        favor_mentor → 'completed'  (session is considered valid)
//        favor_mentee → 'cancelled'  (session outcome is voided)
//   3. If outcome = 'favor_mentor' AND the session already has a qualifying
//      rating (score >= 4), attempts to award the withheld credit now.
//      The DB trigger (enforce_no_credit_during_dispute) will no longer block
//      the insert because the dispute is resolved before we attempt it.
//   4. Re-evaluates trust status of the party that lost the dispute.
//
// Uses the admin (service-role) client because:
//   - Normal users have no RLS UPDATE policy on disputes.
//   - The sessions update needs to bypass participant-only RLS for this path.
// ─────────────────────────────────────────────────────────────────────────────
export async function resolveDispute(
  disputeId: string,
  outcome: DisputeResolution,
  resolutionNote: string,
): Promise<ActionResult<Dispute>> {
  if (!resolutionNote.trim()) return { data: null, error: 'Resolution note is required' }
  if (outcome !== 'favor_mentor' && outcome !== 'favor_mentee') {
    return { data: null, error: 'Outcome must be favor_mentor or favor_mentee' }
  }

  // Admin-only: verify the calling user has is_admin = true.
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Not authenticated' }

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()
  if (!profile?.is_admin) return { data: null, error: 'Admin access required' }

  // ── 1. Fetch dispute + session ─────────────────────────────────────────────
  const { data: dispute, error: disputeError } = await admin
    .from('disputes')
    .select('*, sessions(id, mentor_id, mentee_id, status)')
    .eq('id', disputeId)
    .single()

  if (disputeError || !dispute) return { data: null, error: 'Dispute not found' }
  if (dispute.status === 'resolved') {
    return { data: null, error: 'Dispute is already resolved' }
  }

  const session = dispute.sessions as {
    id: string
    mentor_id: string
    mentee_id: string
    status: string
  } | null

  if (!session) return { data: null, error: 'Session linked to dispute not found' }

  // ── 2. Resolve the dispute row ─────────────────────────────────────────────
  const { data: resolvedDispute, error: resolveError } = await admin
    .from('disputes')
    .update({
      status: 'resolved',
      resolved_in_favor_of: outcome,
      resolution: resolutionNote.trim(),
      resolved_at: new Date().toISOString(),
    })
    .eq('id', disputeId)
    .select()
    .single()

  if (resolveError) return { data: null, error: resolveError.message }

  // ── 3. Update session status ───────────────────────────────────────────────
  // favor_mentor → the session is validated and the mentor's contribution is
  //   recognised; restore to 'completed' so credit can flow.
  // favor_mentee → the session outcome is voided; set to 'cancelled' so that
  //   no further credit can ever be issued for it.
  const newSessionStatus = outcome === 'favor_mentor' ? 'completed' : 'cancelled'
  await admin
    .from('sessions')
    .update({ status: newSessionStatus })
    .eq('id', session.id)

  // ── 4. Grant withheld credit if mentor wins ────────────────────────────────
  // Only attempt if:
  //   a) outcome favors the mentor
  //   b) the session has a rating with score >= 4 (credit-qualifying)
  //   c) no credit has already been issued for this session (idempotent guard)
  if (outcome === 'favor_mentor') {
    const { data: rating } = await admin
      .from('ratings')
      .select('id, score')
      .eq('session_id', session.id)
      .single()

    if (rating && rating.score >= 4) {
      // Check if credit was already issued (e.g. rated before dispute was filed
      // — the DB trigger would have blocked it, but defensive check here too).
      const { data: existingCredit } = await admin
        .from('credits')
        .select('id')
        .eq('session_id', session.id)
        .single()

      if (!existingCredit) {
        // The dispute is now resolved, so the DB trigger will not block this.
        await admin.from('credits').insert({
          user_id: session.mentor_id,
          session_id: session.id,
          rating_id: rating.id,
          amount: 1,
        })
        // Credit insert failure is non-fatal — dispute resolution is already saved.
      }
    }
  }

  // ── 5. Re-evaluate trust status of the losing party ───────────────────────
  // The losing party may have had disputes filed against them; trust can escalate.
  const losingPartyId =
    outcome === 'favor_mentor' ? session.mentee_id : session.mentor_id
  await checkAndUpdateTrustStatus(losingPartyId)

  return { data: resolvedDispute, error: null }
}

// Returns all disputes the logged-in user is involved in.
export async function getUserDisputes(): Promise<ActionResult<Dispute[]>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Not authenticated' }

  // Two-step: get user's session IDs first, then query disputes for those sessions.
  // This avoids PostgREST joined-resource filter syntax which is unreliable in .or().
  const { data: userSessions } = await supabase
    .from('sessions')
    .select('id')
    .or(`mentor_id.eq.${user.id},mentee_id.eq.${user.id}`)

  const sessionIds = userSessions?.map((s: { id: string }) => s.id) ?? []
  if (sessionIds.length === 0) return { data: [], error: null }

  const { data, error } = await supabase
    .from('disputes')
    .select('*')
    .in('session_id', sessionIds)
    .order('created_at', { ascending: false })

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}
