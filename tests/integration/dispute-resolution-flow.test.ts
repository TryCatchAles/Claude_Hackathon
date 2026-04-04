import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─────────────────────────────────────────────────────────────────────────────
// Integration tests: dispute lifecycle
//   fileDispute() → session status becomes 'disputed'
//   resolveDispute(favor_mentor) → credit is granted, session becomes 'completed'
//   resolveDispute(favor_mentee) → credit blocked, session becomes 'cancelled'
//
// VERIFICATION STATUS
// -------------------
// These tests use vi.mock to stub all Supabase calls. They verify that the
// action functions apply correct business logic (guard ordering, DB call
// sequencing, return values) but they do NOT verify:
//   - RLS policies (Postgres-level access control)
//   - The DB trigger `enforce_no_credit_during_dispute` actually fires
//   - The `is_admin` column on `profiles` actually exists and is read
//   - The `resolved_in_favor_of` CHECK constraint on `disputes` actually fires
//
// MANUAL VERIFICATION CHECKLIST (requires local Supabase: `npx supabase start`)
// -------------------------------------------------------------------------------
// Run after `npx supabase db reset` to apply all migrations fresh:
//
// 1. Admin flag exists:
//    SELECT column_name FROM information_schema.columns
//    WHERE table_name = 'profiles' AND column_name = 'is_admin';
//    -- Expected: one row returned
//
// 2. Duplicate dispute guard (RLS + server guard):
//    a. File a dispute for session S via the UI / action.
//    b. Call fileDispute(S, 'second reason') again.
//    -- Expected: error 'An open dispute already exists for this session'
//
// 3. Disputed session cannot be cancelled:
//    a. File a dispute for session S → status becomes 'disputed'.
//    b. Call cancelSession(S) as either participant.
//    -- Expected: error 'Cannot cancel a session that is under dispute'
//
// 4. DB trigger blocks credit during open dispute:
//    a. File a dispute for session S.
//    b. Attempt INSERT INTO credits (session_id = S) directly in psql.
//    -- Expected: trigger raises exception (row rejected).
//
// 5. resolveDispute() requires is_admin = true:
//    a. Call resolveDispute() as a non-admin user.
//    -- Expected: error 'Admin access required'
//
// 6. Credit is granted after favor_mentor resolution:
//    a. Submit a rating score=5 for session S (credit blocked by open dispute).
//    b. Resolve dispute favor_mentor.
//    -- Expected: credits table gains one row for session S.
//
// 7. No credit after favor_mentee resolution:
//    a. Same as 6, but resolve favor_mentee.
//    -- Expected: no credits row for session S.
// ─────────────────────────────────────────────────────────────────────────────

/** Chainable thenable query mock that resolves to `result`. */
function makeQueryMock(result: unknown) {
  const methods = ['select', 'insert', 'update', 'eq', 'or', 'gte', 'lte', 'not', 'neq', 'in', 'single', 'maybeSingle', 'order']
  const chain: Record<string, unknown> = {}
  const thenable = {
    ...chain,
    then: (res: (v: unknown) => unknown) => Promise.resolve(result).then(res),
  }
  for (const m of methods) {
    ;(thenable as Record<string, unknown>)[m] = vi.fn(() => thenable)
  }
  return thenable
}

// ── Module mocks ─────────────────────────────────────────────────────────────

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({ getAll: () => [], set: vi.fn() })),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/supabase/server-admin', () => ({
  createAdminClient: vi.fn(),
}))

// Mock checkAndUpdateTrustStatus so it doesn't need its own DB chain.
vi.mock('@/actions/trust', () => ({
  checkAndUpdateTrustStatus: vi.fn().mockResolvedValue({ data: { trust_status: 'flagged' }, error: null }),
}))

// ── Lazy imports ──────────────────────────────────────────────────────────────
import { fileDispute, resolveDispute } from '@/actions/disputes'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server-admin'

const mockCreateClient    = vi.mocked(createClient)
const mockCreateAdminClient = vi.mocked(createAdminClient)

// ── IDs ──────────────────────────────────────────────────────────────────────
const MENTOR_ID  = 'mentor-uuid-aaaa'
const MENTEE_ID  = 'mentee-uuid-bbbb'
const SESSION_ID = 'session-uuid-cccc'
const DISPUTE_ID = 'dispute-uuid-dddd'
const RATING_ID  = 'rating-uuid-eeee'

// ─────────────────────────────────────────────────────────────────────────────
describe('fileDispute()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns error if reason is empty', async () => {
    // No DB calls should happen for this early-exit guard.
    const fakeUser = { id: MENTEE_ID }
    const userStub = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: fakeUser } }) },
      from: vi.fn(),
    }
    mockCreateClient.mockResolvedValue(userStub as unknown as Awaited<ReturnType<typeof createClient>>)

    const result = await fileDispute(SESSION_ID, '   ')
    expect(result.error).toBe('Reason is required')
    expect(result.data).toBeNull()
    expect(userStub.from).not.toHaveBeenCalled()
  })

  it('allows mentee to file a dispute and returns the dispute row', async () => {
    const fakeSession = { mentor_id: MENTOR_ID, mentee_id: MENTEE_ID, status: 'completed' }
    const fakeDispute = {
      id: DISPUTE_ID,
      session_id: SESSION_ID,
      filed_by: MENTEE_ID,
      reason: 'No show',
      status: 'open',
      resolution: null,
      resolved_in_favor_of: null,
      resolved_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    let userFromCount = 0
    const userStub = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: MENTEE_ID } } }) },
      from: vi.fn(() => {
        userFromCount++
        // 1st call: session lookup
        if (userFromCount === 1) return makeQueryMock({ data: fakeSession, error: null })
        // 2nd call: duplicate-dispute check → no existing open dispute
        if (userFromCount === 2) return makeQueryMock({ data: null, error: null })
        // 3rd call: dispute insert
        return makeQueryMock({ data: fakeDispute, error: null })
      }),
    }
    mockCreateClient.mockResolvedValue(userStub as unknown as Awaited<ReturnType<typeof createClient>>)

    // Admin client is used for session status update + trust check.
    const adminStub = {
      from: vi.fn(() => makeQueryMock({ data: null, error: null })),
    }
    mockCreateAdminClient.mockReturnValue(adminStub as unknown as ReturnType<typeof createAdminClient>)

    const result = await fileDispute(SESSION_ID, 'No show')
    expect(result.error).toBeNull()
    expect(result.data).not.toBeNull()
    expect(result.data?.status).toBe('open')
    expect(result.data?.filed_by).toBe(MENTEE_ID)
  })

  it('blocks filing a dispute for a cancelled session', async () => {
    const fakeSession = { mentor_id: MENTOR_ID, mentee_id: MENTEE_ID, status: 'cancelled' }
    const userStub = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: MENTEE_ID } } }) },
      from: vi.fn(() => makeQueryMock({ data: fakeSession, error: null })),
    }
    mockCreateClient.mockResolvedValue(userStub as unknown as Awaited<ReturnType<typeof createClient>>)

    const result = await fileDispute(SESSION_ID, 'Problem with session')
    expect(result.error).toBe('Cannot dispute a cancelled session')
  })

  it('blocks a duplicate open dispute for the same session (server-side guard)', async () => {
    // Session is completed and user is a participant — would normally proceed.
    // But an open dispute already exists → server-side guard must reject.
    const fakeSession = { mentor_id: MENTOR_ID, mentee_id: MENTEE_ID, status: 'completed' }
    const existingOpenDispute = { id: 'existing-dispute-id', status: 'open' }

    let userFromCount = 0
    const userStub = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: MENTEE_ID } } }) },
      from: vi.fn(() => {
        userFromCount++
        // 1st call: session lookup
        if (userFromCount === 1) return makeQueryMock({ data: fakeSession, error: null })
        // 2nd call: existing open dispute check → returns existing dispute
        return makeQueryMock({ data: existingOpenDispute, error: null })
      }),
    }
    mockCreateClient.mockResolvedValue(userStub as unknown as Awaited<ReturnType<typeof createClient>>)

    const result = await fileDispute(SESSION_ID, 'Second attempt at same session')
    expect(result.error).toBe('An open dispute already exists for this session')
    expect(result.data).toBeNull()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('resolveDispute()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns error for invalid outcome value', async () => {
    // No DB calls; early validation guard.
    const adminStub = { from: vi.fn() }
    mockCreateAdminClient.mockReturnValue(adminStub as unknown as ReturnType<typeof createAdminClient>)

    const result = await resolveDispute(DISPUTE_ID, 'bad_value' as 'favor_mentor', 'Some note')
    expect(result.error).toMatch(/favor_mentor|favor_mentee/)
    expect(adminStub.from).not.toHaveBeenCalled()
  })

  it('returns error if resolution note is blank', async () => {
    const adminStub = { from: vi.fn() }
    mockCreateAdminClient.mockReturnValue(adminStub as unknown as ReturnType<typeof createAdminClient>)

    const result = await resolveDispute(DISPUTE_ID, 'favor_mentor', '   ')
    expect(result.error).toBe('Resolution note is required')
    expect(adminStub.from).not.toHaveBeenCalled()
  })

  it('favor_mentor: resolves dispute, sets session to completed, grants credit for score>=4', async () => {
    const fakeDispute = {
      id: DISPUTE_ID,
      session_id: SESSION_ID,
      filed_by: MENTEE_ID,
      status: 'open',
      sessions: { id: SESSION_ID, mentor_id: MENTOR_ID, mentee_id: MENTEE_ID, status: 'disputed' },
    }
    const resolvedDisputeRow = { ...fakeDispute, status: 'resolved', resolved_in_favor_of: 'favor_mentor', resolution: 'Session confirmed', resolved_at: new Date().toISOString() }
    const fakeRating = { id: RATING_ID, score: 5 }

    // Admin user required for resolveDispute()
    const adminUserStub = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: MENTOR_ID } } }) },
      from: vi.fn(),
    }
    mockCreateClient.mockResolvedValue(adminUserStub as unknown as Awaited<ReturnType<typeof createClient>>)

    const tableCallLog: string[] = []
    let adminFromCount = 0
    const adminStub = {
      from: vi.fn((table: string) => {
        adminFromCount++
        tableCallLog.push(table)
        // 1: profiles.select (admin check → is_admin: true)
        if (adminFromCount === 1) return makeQueryMock({ data: { is_admin: true }, error: null })
        // 2: disputes.select (fetch dispute+session join)
        if (adminFromCount === 2) return makeQueryMock({ data: fakeDispute, error: null })
        // 3: disputes.update (resolve)
        if (adminFromCount === 3) return makeQueryMock({ data: resolvedDisputeRow, error: null })
        // 4: sessions.update (set completed)
        if (adminFromCount === 4) return makeQueryMock({ data: null, error: null })
        // 5: ratings.select (check score)
        if (adminFromCount === 5) return makeQueryMock({ data: fakeRating, error: null })
        // 6: credits.select (existing credit check → none)
        if (adminFromCount === 6) return makeQueryMock({ data: null, error: { code: 'PGRST116' } })
        // 7: credits.insert (grant the withheld credit)
        return makeQueryMock({ data: null, error: null })
      }),
    }
    mockCreateAdminClient.mockReturnValue(adminStub as unknown as ReturnType<typeof createAdminClient>)

    const result = await resolveDispute(DISPUTE_ID, 'favor_mentor', 'Session confirmed')

    expect(result.error).toBeNull()
    expect(result.data?.status).toBe('resolved')
    expect(result.data?.resolved_in_favor_of).toBe('favor_mentor')

    // Verify that credits table was touched (grant)
    expect(tableCallLog).toContain('credits')
    // sessions should have been updated
    expect(tableCallLog).toContain('sessions')
  })

  it('favor_mentee: resolves dispute, sets session to cancelled, no credit granted', async () => {
    const fakeDispute = {
      id: DISPUTE_ID,
      session_id: SESSION_ID,
      filed_by: MENTEE_ID,
      status: 'open',
      sessions: { id: SESSION_ID, mentor_id: MENTOR_ID, mentee_id: MENTEE_ID, status: 'disputed' },
    }
    const resolvedDisputeRow = {
      ...fakeDispute,
      status: 'resolved',
      resolved_in_favor_of: 'favor_mentee',
      resolution: 'Session did not take place',
      resolved_at: new Date().toISOString(),
    }

    const adminUserStub = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: MENTOR_ID } } }) },
      from: vi.fn(),
    }
    mockCreateClient.mockResolvedValue(adminUserStub as unknown as Awaited<ReturnType<typeof createClient>>)

    const tableCallLog: string[] = []
    let adminFromCount = 0
    const adminStub = {
      from: vi.fn((table: string) => {
        adminFromCount++
        tableCallLog.push(table)
        // 1: profiles.select (admin check)
        if (adminFromCount === 1) return makeQueryMock({ data: { is_admin: true }, error: null })
        // 2: disputes.select
        if (adminFromCount === 2) return makeQueryMock({ data: fakeDispute, error: null })
        // 3: disputes.update
        if (adminFromCount === 3) return makeQueryMock({ data: resolvedDisputeRow, error: null })
        // 4: sessions.update (set cancelled)
        return makeQueryMock({ data: null, error: null })
      }),
    }
    mockCreateAdminClient.mockReturnValue(adminStub as unknown as ReturnType<typeof createAdminClient>)

    const result = await resolveDispute(DISPUTE_ID, 'favor_mentee', 'Session did not take place')

    expect(result.error).toBeNull()
    expect(result.data?.resolved_in_favor_of).toBe('favor_mentee')
    // credits table must NOT have been called (no credit for mentee win)
    expect(tableCallLog).not.toContain('credits')
    // sessions should have been updated (to cancelled)
    expect(tableCallLog).toContain('sessions')
  })

  it('returns error if dispute is already resolved', async () => {
    const fakeDispute = {
      id: DISPUTE_ID,
      session_id: SESSION_ID,
      status: 'resolved',  // already resolved
      sessions: { id: SESSION_ID, mentor_id: MENTOR_ID, mentee_id: MENTEE_ID, status: 'completed' },
    }

    const adminUserStub = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: MENTOR_ID } } }) },
      from: vi.fn(),
    }
    mockCreateClient.mockResolvedValue(adminUserStub as unknown as Awaited<ReturnType<typeof createClient>>)

    let adminFromCount = 0
    const adminStub = {
      from: vi.fn(() => {
        adminFromCount++
        // 1: profiles.select (admin check)
        if (adminFromCount === 1) return makeQueryMock({ data: { is_admin: true }, error: null })
        // 2: disputes.select → already resolved
        return makeQueryMock({ data: fakeDispute, error: null })
      }),
    }
    mockCreateAdminClient.mockReturnValue(adminStub as unknown as ReturnType<typeof createAdminClient>)

    const result = await resolveDispute(DISPUTE_ID, 'favor_mentor', 'Retry')
    expect(result.error).toBe('Dispute is already resolved')
  })
})
