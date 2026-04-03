import { describe, it, expect } from 'vitest'

// Enforce: one rating per session, session must be validated

interface RatingInput {
  sessionId: string
  sessionValidated: boolean
  existingRatingCount: number
}

function canSubmitRating(input: RatingInput): { allowed: boolean; reason?: string } {
  if (!input.sessionValidated) return { allowed: false, reason: 'Session not validated' }
  if (input.existingRatingCount > 0) return { allowed: false, reason: 'Already rated' }
  return { allowed: true }
}

describe('rating validation', () => {
  it('allows rating a validated unrated session', () => {
    expect(canSubmitRating({ sessionId: 'x', sessionValidated: true, existingRatingCount: 0 }).allowed).toBe(true)
  })

  it('blocks rating an unvalidated session', () => {
    const r = canSubmitRating({ sessionId: 'x', sessionValidated: false, existingRatingCount: 0 })
    expect(r.allowed).toBe(false)
    expect(r.reason).toMatch(/not validated/i)
  })

  it('blocks duplicate rating', () => {
    const r = canSubmitRating({ sessionId: 'x', sessionValidated: true, existingRatingCount: 1 })
    expect(r.allowed).toBe(false)
    expect(r.reason).toMatch(/already rated/i)
  })
})
