import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─────────────────────────────────────────────────────────────────────────────
// Integration test: booking → session → validateSession → submitRating → credit
//
// These tests mock the Supabase clients and the fraud-detection agent so the
// full action-layer logic (auth checks, guards, DB writes) can be exercised
// without a live database.  Each test sets up a self-contained fake "DB state"
// via the mock return values and then calls the real action functions.
// ─────────────────────────────────────────────────────────────────────────────

// ── Shared mock factories ────────────────────────────────────────────────────

/** Builds a chainable Supabase query mock that resolves to `result`. */
function makeQueryMock(result: unknown) {
  const chain: Record<string, unknown> = {}
  const methods = ['select', 'insert', 'update', 'eq', 'or', 'gte', 'single', 'order']
  for (const m of methods) {
    chain[m] = vi.fn(() => chain)
  }
  // The terminal `.single()` and plain awaits both resolve to `result`.
  // We make every method return a thenable so `await chain.X()` works too.
  const thenable = { ...chain, then: (res: (v: unknown) => unknown) => Promise.resolve(result).then(res) }
  for (const m of methods) {
    ;(thenable as Record<string, unknown>)[m] = vi.fn(() => thenable)
  }
  return thenable
}

/** Creates a minimal Supabase client stub whose `.from()` dispatches to a map
 *  of table → query result.  Each entry in `tableMap` is the resolved value
 *  that will be returned when that table is queried. */
function makeClientStub(tableMap: Record<string, unknown>) {
  return {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn((table: string) => makeQueryMock(tableMap[table] ?? { data: null, error: null })),
  }
}

// ── Module mocks (must be at top-level before imports) ──────────────────────

// Mock Next.js server cookies so `createClient` from @/lib/supabase/server
// does not throw "cookies() was called outside a request scope".
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    getAll: () => [],
    set: vi.fn(),
  })),
}))

// Mock the fraud-detection agent (Person 2's file, do not touch source).
vi.mock('@/lib/ai/claude', () => ({
  detectFraud: vi.fn(),
}))

// Mock both Supabase client factories so we control all DB interactions.
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/supabase/server-admin', () => ({
  createAdminClient: vi.fn(),
}))

// ── Lazy imports after mocks are registered ──────────────────────────────────
import { createSession, validateSession } from '@/actions/sessions'
import { submitRating } from '@/actions/ratings'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server-admin'
import { detectFraud } from '@/lib/ai/claude'

// ── Typed mock helpers ───────────────────────────────────────────────────────
const mockCreateClient = vi.mocked(createClient)
const mockCreateAdminClient = vi.mocked(createAdminClient)
const mockDetectFraud = vi.mocked(detectFraud)

// ── Test IDs ─────────────────────────────────────────────────────────────────
const MENTOR_ID = 'mentor-uuid-1111'
const MENTEE_ID = 'mentee-uuid-2222'
const BOOKING_ID = 'booking-uuid-3333'
const SESSION_ID = 'session-uuid-4444'
const RATING_ID = 'rating-uuid-5555'
const SCHEDULED_AT = '2025-06-01T10:00:00.000Z'
const DURATION = 60

// ─────────────────────────────────────────────────────────────────────────────
describe('booking → rating flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default fraud response: clean submission, no flags.
    mockDetectFraud.mockResolvedValue({
      isSuspicious: false,
      flags: [],
      recommendation: 'allow',
    })
  })

  // ── Test 1 ─────────────────────────────────────────────────────────────────
  it('mentee can book a session with a mentor (createSession happy path)', async () => {
    // The booking row that passes all validation checks.
    const fakeBooking = {
      id: BOOKING_ID,
      mentor_id: MENTOR_ID,
      mentee_id: MENTEE_ID,
      scheduled_at: SCHEDULED_AT,
      duration_minutes: DURATION,
      status: 'confirmed',
    }

    // The session row that will be inserted.
    const fakeSession = {
      id: SESSION_ID,
      booking_id: BOOKING_ID,
      mentor_id: MENTOR_ID,
      mentee_id: MENTEE_ID,
      scheduled_at: SCHEDULED_AT,
      duration_minutes: DURATION,
      validated: false,
      validated_at: null,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // createSession uses the admin client only.
    // We need from() to behave differently per call:
    //   call 1 → bookings lookup  → { data: fakeBooking, error: null }
    //   call 2 → sessions dup check → { data: null, error: { code: 'PGRST116' } }
    //   call 3 → sessions insert  → { data: fakeSession, error: null }
    let adminFromCallCount = 0
    const adminStub = {
      from: vi.fn(() => {
        adminFromCallCount++
        if (adminFromCallCount === 1) return makeQueryMock({ data: fakeBooking, error: null })
        if (adminFromCallCount === 2) return makeQueryMock({ data: null, error: { code: 'PGRST116' } })
        return makeQueryMock({ data: fakeSession, error: null })
      }),
    }
    mockCreateAdminClient.mockReturnValue(adminStub as unknown as ReturnType<typeof createAdminClient>)

    const result = await createSession({
      booking_id: BOOKING_ID,
      mentor_id: MENTOR_ID,
      mentee_id: MENTEE_ID,
      scheduled_at: SCHEDULED_AT,
      duration_minutes: DURATION,
    })

    expect(result.error).toBeNull()
    expect(result.data).not.toBeNull()
    expect(result.data?.booking_id).toBe(BOOKING_ID)
    expect(result.data?.mentor_id).toBe(MENTOR_ID)
    expect(result.data?.mentee_id).toBe(MENTEE_ID)
    expect(result.data?.validated).toBe(false)
    expect(result.data?.status).toBe('pending')
  })

  // ── Test 2 ─────────────────────────────────────────────────────────────────
  it('session is validated after mutual confirmation (honor system)', async () => {
    // validateSession uses the user-scoped client.
    // Calls: getUser → sessions.select (fetch) → sessions.update
    const fakeSession = {
      mentee_id: MENTEE_ID,
      status: 'pending',
      validated: false,
    }

    let userFromCallCount = 0
    const userStub = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: MENTEE_ID } }, error: null }),
      },
      from: vi.fn(() => {
        userFromCallCount++
        if (userFromCallCount === 1) return makeQueryMock({ data: fakeSession, error: null })
        // Second call is the .update() — return success.
        return makeQueryMock({ data: null, error: null })
      }),
    }
    mockCreateClient.mockResolvedValue(userStub as unknown as Awaited<ReturnType<typeof createClient>>)

    const result = await validateSession(SESSION_ID)

    expect(result.error).toBeNull()
    // validateSession returns { data: null, error: null } on success.
    expect(result.data).toBeNull()
  })

  // ── Test 3 ─────────────────────────────────────────────────────────────────
  it('mentee can rate a validated session once', async () => {
    // submitRating uses BOTH clients:
    //   userClient  → auth.getUser, sessions.select, ratings dup check, ratings recent count, sessions pair count
    //   adminClient → ratings.insert, (conditionally) credits.insert
    const fakeSession = {
      id: SESSION_ID,
      mentor_id: MENTOR_ID,
      mentee_id: MENTEE_ID,
      validated: true,
      status: 'completed',
    }

    const fakeRating = {
      id: RATING_ID,
      session_id: SESSION_ID,
      mentor_id: MENTOR_ID,
      mentee_id: MENTEE_ID,
      score: 5,
      comment: 'Great session!',
      fraud_flags: null,
      created_at: new Date().toISOString(),
    }

    // User client: sessions fetch, then three parallel queries (dup, pairCount, recentCount).
    // Promise.all fires three from() calls simultaneously.
    let userFromCallCount = 0
    const userStub = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: MENTEE_ID } }, error: null }),
      },
      from: vi.fn(() => {
        userFromCallCount++
        if (userFromCallCount === 1) {
          // sessions.select → session lookup
          return makeQueryMock({ data: fakeSession, error: null })
        }
        if (userFromCallCount === 2) {
          // ratings dup check → no existing rating (PGRST116 = not found)
          return makeQueryMock({ data: null, error: { code: 'PGRST116' } })
        }
        // pairCount and recentCount → return count = 1 (non-fraud level)
        return makeQueryMock({ data: null, error: null, count: 1 })
      }),
    }
    mockCreateClient.mockResolvedValue(userStub as unknown as Awaited<ReturnType<typeof createClient>>)

    // Admin client: ratings.insert → fakeRating, then credits.insert for score >= 4.
    let adminFromCallCount = 0
    const adminStub = {
      from: vi.fn(() => {
        adminFromCallCount++
        if (adminFromCallCount === 1) return makeQueryMock({ data: fakeRating, error: null })
        // credits.insert
        return makeQueryMock({ data: null, error: null })
      }),
    }
    mockCreateAdminClient.mockReturnValue(adminStub as unknown as ReturnType<typeof createAdminClient>)

    const result = await submitRating(SESSION_ID, 5, 'Great session!')

    expect(result.error).toBeNull()
    expect(result.data).not.toBeNull()
    expect(result.data?.session_id).toBe(SESSION_ID)
    expect(result.data?.mentor_id).toBe(MENTOR_ID)
    expect(result.data?.mentee_id).toBe(MENTEE_ID)
    expect(result.data?.score).toBe(5)
  })

  // ── Test 4 ─────────────────────────────────────────────────────────────────
  it('mentor earns credit after high rating (score >= 4)', async () => {
    // Same as test 3 but we verify the credits.insert is called.
    const fakeSession = {
      id: SESSION_ID,
      mentor_id: MENTOR_ID,
      mentee_id: MENTEE_ID,
      validated: true,
      status: 'completed',
    }

    const fakeRating = {
      id: RATING_ID,
      session_id: SESSION_ID,
      mentor_id: MENTOR_ID,
      mentee_id: MENTEE_ID,
      score: 4,
      comment: null,
      fraud_flags: null,
      created_at: new Date().toISOString(),
    }

    let userFromCallCount = 0
    const userStub = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: MENTEE_ID } }, error: null }),
      },
      from: vi.fn(() => {
        userFromCallCount++
        if (userFromCallCount === 1) return makeQueryMock({ data: fakeSession, error: null })
        if (userFromCallCount === 2) return makeQueryMock({ data: null, error: { code: 'PGRST116' } })
        return makeQueryMock({ data: null, error: null, count: 0 })
      }),
    }
    mockCreateClient.mockResolvedValue(userStub as unknown as Awaited<ReturnType<typeof createClient>>)

    // Track admin client from() calls so we can assert credits.insert was reached.
    const adminFromMock = vi.fn()
    let adminFromCallCount = 0
    const adminStub = {
      from: (table: string) => {
        adminFromCallCount++
        adminFromMock(table)
        if (adminFromCallCount === 1) return makeQueryMock({ data: fakeRating, error: null })
        // Second from() call should be credits.insert
        return makeQueryMock({ data: null, error: null })
      },
    }
    mockCreateAdminClient.mockReturnValue(adminStub as unknown as ReturnType<typeof createAdminClient>)

    const result = await submitRating(SESSION_ID, 4)

    expect(result.error).toBeNull()
    expect(result.data).not.toBeNull()
    expect(result.data?.score).toBe(4)

    // The admin client should have been called twice:
    //   1st → ratings.insert
    //   2nd → credits.insert (because score >= 4)
    expect(adminFromCallCount).toBe(2)
    expect(adminFromMock).toHaveBeenNthCalledWith(1, 'ratings')
    expect(adminFromMock).toHaveBeenNthCalledWith(2, 'credits')
  })
})
