'use server'

import { createAdminClient } from '@/lib/supabase/server-admin'
import type { ActionResult, TrustStatus } from '@/types'

// ─────────────────────────────────────────────────────────────────────────────
// Trust-status state machine
//
// States (in escalation order):
//   active → flagged → warning_issued → temporary_ban → tribunal_review
//   (permanent_ban is set manually by admins only, never by this helper)
//
// Triggers evaluated by checkAndUpdateTrustStatus():
//   1. Repeated low ratings (score <= 2) received in the last 30 days:
//        >= LOW_RATING_FLAG_THRESHOLD (3)  → 'flagged'
//        >= LOW_RATING_WARN_THRESHOLD (5)  → 'warning_issued'
//        >= LOW_RATING_BAN_THRESHOLD  (8)  → 'temporary_ban'
//   2. An open dispute filed against the user → at minimum 'flagged'
//   3. fraud_flags set by the AI fraud-detection agent:
//        any flag present          → at minimum 'flagged'
//        flag contains 'review'    → 'tribunal_review'
//
// Transitions are one-way and additive: we never downgrade trust_status here.
// Downgrading (e.g. clearing a ban after tribunal review) is an admin action.
// ─────────────────────────────────────────────────────────────────────────────

const LOW_RATING_FLAG_THRESHOLD = 3  // 3+ low ratings in 30 days → flagged
const LOW_RATING_WARN_THRESHOLD = 5  // 5+ low ratings in 30 days → warning_issued
const LOW_RATING_BAN_THRESHOLD  = 8  // 8+ low ratings in 30 days → temporary_ban

// Severity ranking so we never downgrade within a single helper call.
const TRUST_RANK: Record<TrustStatus, number> = {
  active:          0,
  flagged:         1,
  warning_issued:  2,
  temporary_ban:   3,
  tribunal_review: 4,
  permanent_ban:   5,
}

function higherStatus(a: TrustStatus, b: TrustStatus): TrustStatus {
  return TRUST_RANK[a] >= TRUST_RANK[b] ? a : b
}

// ─────────────────────────────────────────────────────────────────────────────
// checkAndUpdateTrustStatus
//
// Call this after any event that could affect a user's trust:
//   - a low-score rating is submitted against them
//   - a dispute is filed against them
//   - fraud flags are detected
//
// The function reads current state from the DB, computes the highest required
// trust status, and writes it back only if it represents an escalation.
// It is idempotent: calling it multiple times is safe.
// ─────────────────────────────────────────────────────────────────────────────
export async function checkAndUpdateTrustStatus(
  userId: string,
): Promise<ActionResult<{ trust_status: TrustStatus }>> {
  const admin = createAdminClient()

  // ── 1. Fetch current profile state ────────────────────────────────────────
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('trust_status, low_rating_count_30d')
    .eq('id', userId)
    .single()

  if (profileError || !profile) {
    return { data: null, error: profileError?.message ?? 'Profile not found' }
  }

  const currentStatus = profile.trust_status as TrustStatus
  let required: TrustStatus = currentStatus

  // Never touch permanent_ban — that is admin-only territory.
  if (currentStatus === 'permanent_ban') {
    return { data: { trust_status: currentStatus }, error: null }
  }

  // ── 2. Recompute low-rating count for the last 30 days ────────────────────
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const { count: lowRatingCount } = await admin
    .from('ratings')
    .select('*', { count: 'exact', head: true })
    .eq('mentor_id', userId)          // ratings against this user AS mentor
    .lte('score', 2)
    .gte('created_at', cutoff)

  const count = lowRatingCount ?? 0

  // Update the cached column so the next call is faster.
  await admin
    .from('profiles')
    .update({ low_rating_count_30d: count })
    .eq('id', userId)

  // Apply low-rating thresholds (highest threshold wins).
  if (count >= LOW_RATING_BAN_THRESHOLD) {
    required = higherStatus(required, 'temporary_ban')
  } else if (count >= LOW_RATING_WARN_THRESHOLD) {
    required = higherStatus(required, 'warning_issued')
  } else if (count >= LOW_RATING_FLAG_THRESHOLD) {
    required = higherStatus(required, 'flagged')
  }

  // ── 3. Check for open disputes filed against this user ────────────────────
  // A dispute is "against" a user if they are a session participant and they
  // did NOT file the dispute themselves.
  // Two-step: get user's session IDs first to avoid unreliable PostgREST
  // joined-resource filter syntax inside .or().
  const { data: userSessions } = await admin
    .from('sessions')
    .select('id')
    .or(`mentor_id.eq.${userId},mentee_id.eq.${userId}`)

  const sessionIds = userSessions?.map((s: { id: string }) => s.id) ?? []

  const openDisputeCount = sessionIds.length === 0 ? 0 : await admin
    .from('disputes')
    .select('id', { count: 'exact', head: true })
    .neq('filed_by', userId)
    .eq('status', 'open')
    .in('session_id', sessionIds)
    .then(r => r.count ?? 0)

  if ((openDisputeCount ?? 0) > 0) {
    required = higherStatus(required, 'flagged')
  }

  // ── 4. Check for active fraud flags on recent ratings ─────────────────────
  // Look at fraud_flags on ratings submitted BY this user (as mentee) in the
  // last 30 days — the fraud agent flags the rater, not the rated.
  const { data: flaggedRatings } = await admin
    .from('ratings')
    .select('fraud_flags')
    .eq('mentee_id', userId)
    .not('fraud_flags', 'is', null)
    .gte('created_at', cutoff)

  if (flaggedRatings && flaggedRatings.length > 0) {
    const hasReviewFlag = flaggedRatings.some(
      (r) => Array.isArray(r.fraud_flags) && r.fraud_flags.some((f: string) => f.includes('review')),
    )
    if (hasReviewFlag) {
      required = higherStatus(required, 'tribunal_review')
    } else {
      required = higherStatus(required, 'flagged')
    }
  }

  // ── 5. Write back if escalation is needed ─────────────────────────────────
  if (TRUST_RANK[required] > TRUST_RANK[currentStatus]) {
    const { error: updateError } = await admin
      .from('profiles')
      .update({ trust_status: required })
      .eq('id', userId)

    if (updateError) {
      return { data: null, error: updateError.message }
    }
  }

  return { data: { trust_status: required }, error: null }
}
