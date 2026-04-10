# Work Split

## Tech Stack Overview

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind, Three.js |
| Backend logic | Next.js Server Actions (`src/actions/`) |
| Database | Supabase Postgres + Row Level Security |
| Auth | Supabase Auth (Google OAuth only) |
| AI | Gemini API (`src/lib/ai/claude.ts`) |
| Integrations | Google Calendar API (Centralized Account) |
| Hosting | Vercel |
| Testing | Playwright (E2E), Vitest (unit) |

---

## Person 1 — Core Platform & Backend Logic (AJ)

### Responsibility

Everything that defines how the platform works: data model, business rules, server actions, and the UI screens that use them.

---

### Files & Folders

```
supabase/
  migrations/
    001_init.sql              ← DB schema: all tables, RLS policies, indexes

src/
  types/
    index.ts                  ← All shared TypeScript types (User, Session, Rating, etc.)

  lib/
    supabase/
      client.ts               ← Supabase browser client
      server.ts               ← Supabase server client (for server actions)

  actions/
    auth.ts                   ← Google OAuth session helpers, profile bootstrap, sign out
    sessions.ts               ← Create/confirm/validate sessions (manual honor system)
    ratings.ts                ← Submit rating, enforce once-per-session rule
    credits.ts                ← Award credits on high rating, read credit balance
    disputes.ts               ← File dispute, pause credits, admin resolution

  app/
    layout.tsx                ← Root layout, global providers
    page.tsx                  ← Landing / home page
    (auth)/
      login/page.tsx          ← Google sign-in screen
    (dashboard)/
      profile/page.tsx        ← View/edit profile (bio, skills, school, degree)
      search/page.tsx         ← Search mentors by skill/keyword (calls AI action)
      sessions/
        page.tsx              ← Session history list
        [id]/page.tsx         ← Session detail + rate button
      credits/page.tsx        ← Credit balance + history
      disputes/page.tsx       ← File and view disputes
```

---

### What to Build

1. **DB schema** (`001_init.sql`) — tables: `users`, `profiles`, `skills`, `sessions`, `bookings`, `ratings`, `credits`, `disputes`, `flags`. Add RLS so users can only read/write their own data.
2. **Types** (`types/index.ts`) — TypeScript interfaces for every table row + action return shapes.
3. **Auth actions** — `signInWithGoogle()`, `getSession()`, `ensureProfile()`, `signOut()`.
4. **Session actions** — `createSession()`, `confirmSession()`, `markCompleted()`, `validateSession()` (requires mutual or mentee confirmation before allowing rating).
5. **Rating actions** — `submitRating()` (enforce: session must be validated, one rating max, mentee only).
6. **Credits actions** — `awardCredits()` (triggered by high rating), `getUserCredits()`.
7. **Disputes actions** — `fileDispute()`, `pauseCredit()`, `resolveDispute()`.
8. **UI pages** — Google sign-in screen, profile editor, session history, rating form, credits view, disputes form.

---

### How to Test

**Unit tests** (`tests/unit/`) — use Vitest:
```bash
npx vitest run tests/unit/credits.test.ts
npx vitest run tests/unit/ratings.test.ts
npx vitest run tests/unit/sessions.test.ts
```
Test cases to write:
- Credits only increase, never decrease
- Rating blocked if session not validated
- Rating blocked if already rated
- Dispute pauses credit award
- State machine transitions (Active → Flagged → Warning → Ban)

**DB tests** — spin up local Supabase:
```bash
npx supabase start
npx supabase db reset       # applies migrations fresh
npx supabase db push        # push schema changes
```
Then test RLS with two different user JWTs to confirm isolation.

**Manual flow** (after Person 2 has Google Meet/Calendar wired up):
1. Sign in with Google
2. Fill profile (skill hashtags, bio, school)
3. Book a session (requires Person 2's Google Calendar work)
4. Mark session completed → validate session
5. Submit rating → check credit awarded
6. File dispute → confirm credit paused

---

## Person 2 — Integrations & Infrastructure (Ales)

### Responsibility

All external service connections (Google Meet, Google Calendar, Claude AI), deployment config, and the testing harness. Also owns the booking flow that bridges Person 1's session actions with real Google Meet calls and calendar events.

---

### Files & Folders

```
src/
  lib/
    meet/
      client.ts               ← Google Meet API client: read conference records, participant sessions, validate overlap
    calendar/
      client.ts               ← Google Calendar API: create event, check availability, create Meet link, send invite
    ai/
      claude.ts               ← Gemini API: map search query → ranked mentor list (pass all mentor profiles directly in prompt)

  actions/
    bookings.ts               ← (NEW) createBooking(): calls Calendar + Meet + writes to DB

  app/
    (dashboard)/
      book/[mentorId]/page.tsx ← Time slot picker UI → calls createBooking()

next.config.ts                ← Env vars, allowed domains, API rewrites
vercel.json                   ← Deployment config, function regions, env mapping
playwright.config.ts          ← E2E test config
tests/
  e2e/
    booking.spec.ts           ← Full booking flow E2E
    search.spec.ts            ← Search returns mentors, no name search possible
    auth.spec.ts              ← Google OAuth login flow
```

---

### What to Build

1. **Google Calendar client** (`lib/calendar/client.ts`):
   - `createEvent(mentorId, menteeId, startTime)` → creates event, generates Meet link, sends invites
   - `getAvailableSlots(mentorId, date)` → returns free slots for booking UI

2. **Gemini AI client** (`lib/ai/claude.ts`):
   - `matchMentors(query, mentors[])` → sends query + the full array of mentor profiles to Claude, returns ranked list with relevance scores.
   - *Note on Scalability*: Keep it simple. Pass the entire array of users directly in the prompt. Do not set up complex vector databases right now.
   - Prompt must enforce: no name matching, skill/keyword only.

3. **Booking action** (`actions/bookings.ts`):
   - `createBooking(mentorId, menteeId, slot)`:
     1. Call `createEvent()` → create the Calendar event and Meet link
     2. Write booking + session row to DB
     3. Return confirmation

4. **Book page** (`app/(dashboard)/book/[mentorId]/page.tsx`) — slot picker that calls `createBooking()`.

5. **Vercel + env config** — set up all env vars in `vercel.json` and `.env.local.example`:
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`
   - `APP_CENTRAL_GOOGLE_REFRESH_TOKEN` (for centralized calendar service)
   - `GEMINI_API_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

6. **Playwright E2E tests** — full flows that run against local dev server.

---

### How to Test

**Run E2E tests:**
```bash
npx playwright install           # first time only
npx playwright test              # run all E2E
npx playwright test --ui         # visual mode
npx playwright test tests/e2e/booking.spec.ts  # single file
```

**Test each integration in isolation:**

Google Calendar:
```bash
npx tsx scripts/test-calendar.ts
# Should create an event visible in your Google Calendar with a Meet link
```

Claude AI:
```bash
npx tsx scripts/test-ai-search.ts "I want to learn Python"
# Should return ranked mentor list, no name-based results
```

**Local dev server:**
```bash
npx supabase start               # start local DB (coordinate with Person 1)
npm run dev                      # Next.js on http://localhost:3000
```

**Deployment check:**
```bash
vercel --prod                    # deploy to Vercel
vercel logs                      # check function logs
```

---

## Coordination Points

| When | Who does what |
|---|---|
| Day 1 | Person 1 finalizes DB schema + types; Person 2 sets up env vars and tests each API client in isolation |
| After schema is stable | Person 2 writes `bookings.ts` action using Person 1's session table |
| After booking action works | Person 1 wires rating/credit flow on top of validated sessions |
| After all actions done | Person 2 writes Playwright E2E covering full user journey |
| Final | Both run `npx vitest run` + `npx playwright test` and fix failures |

---

## Test After Every Feature

Per `agents.md`: **after every feature, run tests before moving on.**

Checklist after each feature:
- [ ] Unit test written and passing
- [ ] Manual test in local dev confirmed working
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] No lint errors (`npm run lint`)
