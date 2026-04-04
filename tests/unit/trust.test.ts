import { describe, it, expect } from 'vitest'

// ─────────────────────────────────────────────────────────────────────────────
// Pure logic tests for the trust-status state machine.
// These mirror the thresholds defined in src/actions/trust.ts.
//
// Thresholds:
//   Low rating (score <= 2) counts in 30 days:
//     >= 3 → 'flagged'
//     >= 5 → 'warning_issued'
//     >= 8 → 'temporary_ban'
//
// State escalation rule:
//   We never downgrade trust_status automatically.
//   The helper picks the HIGHEST required status.
// ─────────────────────────────────────────────────────────────────────────────

type TrustStatus =
  | 'active'
  | 'flagged'
  | 'warning_issued'
  | 'temporary_ban'
  | 'tribunal_review'
  | 'permanent_ban'

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

const LOW_RATING_FLAG_THRESHOLD = 3
const LOW_RATING_WARN_THRESHOLD = 5
const LOW_RATING_BAN_THRESHOLD  = 8

function computeRequiredStatus(input: {
  currentStatus: TrustStatus
  lowRatingCount30d: number
  openDisputesAgainstUser: number
  hasFraudFlags: boolean
  hasFraudReviewFlag: boolean
}): TrustStatus {
  if (input.currentStatus === 'permanent_ban') return 'permanent_ban'

  let required: TrustStatus = input.currentStatus

  // Low-rating thresholds
  if (input.lowRatingCount30d >= LOW_RATING_BAN_THRESHOLD) {
    required = higherStatus(required, 'temporary_ban')
  } else if (input.lowRatingCount30d >= LOW_RATING_WARN_THRESHOLD) {
    required = higherStatus(required, 'warning_issued')
  } else if (input.lowRatingCount30d >= LOW_RATING_FLAG_THRESHOLD) {
    required = higherStatus(required, 'flagged')
  }

  // Open disputes filed against the user
  if (input.openDisputesAgainstUser > 0) {
    required = higherStatus(required, 'flagged')
  }

  // Fraud flags
  if (input.hasFraudReviewFlag) {
    required = higherStatus(required, 'tribunal_review')
  } else if (input.hasFraudFlags) {
    required = higherStatus(required, 'flagged')
  }

  return required
}

// ─────────────────────────────────────────────────────────────────────────────
describe('trust state machine — low rating thresholds', () => {
  it('stays active with fewer than 3 low ratings', () => {
    const status = computeRequiredStatus({
      currentStatus: 'active',
      lowRatingCount30d: 2,
      openDisputesAgainstUser: 0,
      hasFraudFlags: false,
      hasFraudReviewFlag: false,
    })
    expect(status).toBe('active')
  })

  it('escalates to flagged at exactly 3 low ratings', () => {
    const status = computeRequiredStatus({
      currentStatus: 'active',
      lowRatingCount30d: 3,
      openDisputesAgainstUser: 0,
      hasFraudFlags: false,
      hasFraudReviewFlag: false,
    })
    expect(status).toBe('flagged')
  })

  it('escalates to warning_issued at 5 low ratings', () => {
    const status = computeRequiredStatus({
      currentStatus: 'active',
      lowRatingCount30d: 5,
      openDisputesAgainstUser: 0,
      hasFraudFlags: false,
      hasFraudReviewFlag: false,
    })
    expect(status).toBe('warning_issued')
  })

  it('escalates to temporary_ban at 8 low ratings', () => {
    const status = computeRequiredStatus({
      currentStatus: 'active',
      lowRatingCount30d: 8,
      openDisputesAgainstUser: 0,
      hasFraudFlags: false,
      hasFraudReviewFlag: false,
    })
    expect(status).toBe('temporary_ban')
  })
})

describe('trust state machine — dispute trigger', () => {
  it('escalates to flagged when a dispute is filed against the user', () => {
    const status = computeRequiredStatus({
      currentStatus: 'active',
      lowRatingCount30d: 0,
      openDisputesAgainstUser: 1,
      hasFraudFlags: false,
      hasFraudReviewFlag: false,
    })
    expect(status).toBe('flagged')
  })

  it('does not downgrade an already higher status when dispute is filed', () => {
    const status = computeRequiredStatus({
      currentStatus: 'warning_issued',
      lowRatingCount30d: 0,
      openDisputesAgainstUser: 1,
      hasFraudFlags: false,
      hasFraudReviewFlag: false,
    })
    expect(status).toBe('warning_issued')
  })
})

describe('trust state machine — fraud flags', () => {
  it('escalates to flagged when fraud flags are present', () => {
    const status = computeRequiredStatus({
      currentStatus: 'active',
      lowRatingCount30d: 0,
      openDisputesAgainstUser: 0,
      hasFraudFlags: true,
      hasFraudReviewFlag: false,
    })
    expect(status).toBe('flagged')
  })

  it('escalates to tribunal_review when review fraud flag is present', () => {
    const status = computeRequiredStatus({
      currentStatus: 'active',
      lowRatingCount30d: 0,
      openDisputesAgainstUser: 0,
      hasFraudFlags: true,
      hasFraudReviewFlag: true,
    })
    expect(status).toBe('tribunal_review')
  })
})

describe('trust state machine — no downgrade rule', () => {
  it('never downgrades permanent_ban', () => {
    const status = computeRequiredStatus({
      currentStatus: 'permanent_ban',
      lowRatingCount30d: 0,
      openDisputesAgainstUser: 0,
      hasFraudFlags: false,
      hasFraudReviewFlag: false,
    })
    expect(status).toBe('permanent_ban')
  })

  it('keeps existing tribunal_review even with zero triggers', () => {
    const status = computeRequiredStatus({
      currentStatus: 'tribunal_review',
      lowRatingCount30d: 0,
      openDisputesAgainstUser: 0,
      hasFraudFlags: false,
      hasFraudReviewFlag: false,
    })
    expect(status).toBe('tribunal_review')
  })

  it('picks the highest status when multiple triggers apply', () => {
    // 5 low ratings → warning_issued, fraud review flag → tribunal_review
    // tribunal_review should win
    const status = computeRequiredStatus({
      currentStatus: 'active',
      lowRatingCount30d: 5,
      openDisputesAgainstUser: 1,
      hasFraudFlags: true,
      hasFraudReviewFlag: true,
    })
    expect(status).toBe('tribunal_review')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('dispute resolution — credit logic', () => {
  // Mirror the logic in resolveDispute()
  function shouldGrantCreditOnResolve(input: {
    outcome: 'favor_mentor' | 'favor_mentee'
    ratingScore: number | null
    creditAlreadyIssued: boolean
  }): boolean {
    if (input.outcome !== 'favor_mentor') return false
    if (input.ratingScore === null || input.ratingScore < 4) return false
    if (input.creditAlreadyIssued) return false
    return true
  }

  it('grants credit when mentor wins and rating >= 4', () => {
    expect(shouldGrantCreditOnResolve({ outcome: 'favor_mentor', ratingScore: 4, creditAlreadyIssued: false })).toBe(true)
    expect(shouldGrantCreditOnResolve({ outcome: 'favor_mentor', ratingScore: 5, creditAlreadyIssued: false })).toBe(true)
  })

  it('does not grant credit when mentor wins but rating < 4', () => {
    expect(shouldGrantCreditOnResolve({ outcome: 'favor_mentor', ratingScore: 3, creditAlreadyIssued: false })).toBe(false)
  })

  it('does not grant credit when outcome favors mentee', () => {
    expect(shouldGrantCreditOnResolve({ outcome: 'favor_mentee', ratingScore: 5, creditAlreadyIssued: false })).toBe(false)
  })

  it('does not double-issue credit if already granted', () => {
    expect(shouldGrantCreditOnResolve({ outcome: 'favor_mentor', ratingScore: 5, creditAlreadyIssued: true })).toBe(false)
  })

  it('does not grant credit when no rating exists', () => {
    expect(shouldGrantCreditOnResolve({ outcome: 'favor_mentor', ratingScore: null, creditAlreadyIssued: false })).toBe(false)
  })
})
