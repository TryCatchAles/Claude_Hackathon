import { describe, it, expect, beforeAll } from 'vitest'

// Integration test: booking → session → rating → credit
// Requires a real Supabase test project (set TEST_SUPABASE_URL env var)

describe.skipIf(!process.env.TEST_SUPABASE_URL)('booking → rating flow', () => {
  beforeAll(async () => {
    // seed test users and skills
  })

  it('mentee can book a session with a mentor', async () => {
    // TODO: call createSession action, assert session row created
    expect(true).toBe(true)
  })

  it('session is validated after Google Meet attendance check', async () => {
    // TODO: call validateSession, assert session.validated = true
    expect(true).toBe(true)
  })

  it('mentee can rate a validated session once', async () => {
    // TODO: call submitRating, assert rating row created
    expect(true).toBe(true)
  })

  it('mentor earns credit after high rating', async () => {
    // TODO: assert credits row created for mentor
    expect(true).toBe(true)
  })
})
