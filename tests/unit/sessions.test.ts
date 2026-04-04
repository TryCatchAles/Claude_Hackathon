import { describe, it, expect } from 'vitest'

// Pure logic tests — no DB required

type SessionStatus = 'pending' | 'active' | 'completed' | 'disputed' | 'cancelled'

function canValidateSession(session: {
  menteeId: string
  callerId: string
  validated: boolean
  status: SessionStatus
}): { allowed: boolean; reason?: string } {
  if (session.callerId !== session.menteeId) return { allowed: false, reason: 'Only the mentee can validate' }
  if (session.validated) return { allowed: false, reason: 'Session already validated' }
  if (session.status === 'cancelled') return { allowed: false, reason: 'Cannot validate a cancelled session' }
  return { allowed: true }
}

function canCancelSession(session: {
  mentorId: string
  menteeId: string
  callerId: string
  status: SessionStatus
}): { allowed: boolean; reason?: string } {
  if (session.callerId !== session.mentorId && session.callerId !== session.menteeId) {
    return { allowed: false, reason: 'Access denied' }
  }
  if (session.status === 'completed') return { allowed: false, reason: 'Cannot cancel a completed session' }
  return { allowed: true }
}

function canAwardCredit(session: {
  status: SessionStatus
  hasOpenDispute: boolean
}): { allowed: boolean; reason?: string } {
  if (session.hasOpenDispute) return { allowed: false, reason: 'Open dispute pauses credit award' }
  if (session.status !== 'completed') return { allowed: false, reason: 'Session must be completed' }
  return { allowed: true }
}

describe('session validation', () => {
  it('allows mentee to validate a pending session', () => {
    expect(canValidateSession({ menteeId: 'u1', callerId: 'u1', validated: false, status: 'pending' }).allowed).toBe(true)
  })

  it('blocks mentor from validating', () => {
    const r = canValidateSession({ menteeId: 'u1', callerId: 'u2', validated: false, status: 'pending' })
    expect(r.allowed).toBe(false)
    expect(r.reason).toMatch(/mentee/i)
  })

  it('blocks validating an already validated session', () => {
    const r = canValidateSession({ menteeId: 'u1', callerId: 'u1', validated: true, status: 'completed' })
    expect(r.allowed).toBe(false)
    expect(r.reason).toMatch(/already validated/i)
  })

  it('blocks validating a cancelled session', () => {
    const r = canValidateSession({ menteeId: 'u1', callerId: 'u1', validated: false, status: 'cancelled' })
    expect(r.allowed).toBe(false)
    expect(r.reason).toMatch(/cancelled/i)
  })
})

describe('session cancellation', () => {
  it('allows mentor to cancel a pending session', () => {
    expect(canCancelSession({ mentorId: 'u1', menteeId: 'u2', callerId: 'u1', status: 'pending' }).allowed).toBe(true)
  })

  it('allows mentee to cancel a pending session', () => {
    expect(canCancelSession({ mentorId: 'u1', menteeId: 'u2', callerId: 'u2', status: 'pending' }).allowed).toBe(true)
  })

  it('blocks cancelling a completed session', () => {
    const r = canCancelSession({ mentorId: 'u1', menteeId: 'u2', callerId: 'u1', status: 'completed' })
    expect(r.allowed).toBe(false)
    expect(r.reason).toMatch(/completed/i)
  })

  it('blocks a third party from cancelling', () => {
    const r = canCancelSession({ mentorId: 'u1', menteeId: 'u2', callerId: 'u3', status: 'pending' })
    expect(r.allowed).toBe(false)
    expect(r.reason).toMatch(/access denied/i)
  })
})

describe('credit award gate', () => {
  it('allows credit for a completed session with no dispute', () => {
    expect(canAwardCredit({ status: 'completed', hasOpenDispute: false }).allowed).toBe(true)
  })

  it('blocks credit when there is an open dispute', () => {
    const r = canAwardCredit({ status: 'completed', hasOpenDispute: true })
    expect(r.allowed).toBe(false)
    expect(r.reason).toMatch(/dispute/i)
  })

  it('blocks credit for a non-completed session', () => {
    const r = canAwardCredit({ status: 'pending', hasOpenDispute: false })
    expect(r.allowed).toBe(false)
    expect(r.reason).toMatch(/completed/i)
  })
})
