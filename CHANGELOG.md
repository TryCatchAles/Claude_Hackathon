# Changelog

All actions taken by Claude on this project are logged here.

---

## 2026-04-04 (session detail page redesign)

### Session Detail Page — Dark premium alignment
- `src/app/(dashboard)/sessions/[id]/page.tsx`: Added `import type React` for `React.CSSProperties`; extracted `glassSurface` and `glassInput` typed style constants; replaced light-pastel `STATUS_STYLE` with dark glass pill equivalents + added `STATUS_BG` map; back link changed to `text-white/40 hover:text-white`; h1 changed to pink-purple gradient; all `bg-white border border-zinc-200` action/info cards replaced with `glassSurface`; info card row labels → `text-white/40`, values → `text-white`, dividers → `rgba(255,255,255,0.08)`; dispute banner converted to dark tinted glass per-state (emerald/purple/amber at 10% opacity); dispute resolution border → `rgba(255,255,255,0.10)`; dispute text → `text-white/70`, outcome label → `text-white/45`, resolution quote → `text-white/55`; all form inputs (select, textarea) → `glassInput` with `text-white placeholder:text-white/25 focus:ring-purple-400/30`; select options given dark background fallback; all `bg-zinc-900` action buttons replaced with white CTA style matching search/sessions; dispute submit button → ghost dark glass; cancel button → `text-white/30 hover:text-red-400`; Meet CTA → white button with violet hover glow; rating display card → `text-white`, `text-white/35`, `text-white/50`

---

## 2026-04-04 (credits page redesign)

### Credits Page — Dark premium alignment
- `src/app/(dashboard)/credits/page.tsx`: Replaced `text-zinc-900` h1 with gradient h1 + lavender eyebrow + `text-white/45` subtitle matching search/sessions pattern; replaced flat `bg-zinc-900` balance card with dark glass surface (rgba(13,20,17,0.88) + backdrop blur + inset highlight); updated balance card inner labels from `text-zinc-400`/`text-zinc-600` to `text-white/40`/`text-white/25`; history `h2` updated to `text-white/35`; replaced `bg-white border border-zinc-200` history list with dark glass panel + `divide-white/8` row separators; all row text changed to `text-white` / `text-white/40` / `text-white/35`; `text-emerald-600` amount changed to `text-emerald-300`; `hover:text-zinc-700` link changed to `hover:text-white`; empty state and error banner converted to dark glass surfaces

---

## 2026-04-04 (sessions page redesign)

### Sessions Page — Dark premium alignment
- `src/app/(dashboard)/sessions/page.tsx`: Replaced all `text-zinc-*` headings with gradient h1 + lavender eyebrow + `text-white/45` subtitle matching search page pattern; replaced `bg-white border border-zinc-200` session cards with `.mentor-card` dark glass class; replaced light pastel status pills with dark glass translucent equivalents (amber/blue/emerald/red/zinc tinted at 10% opacity with matching border); replaced white empty-state box with dark glass surface; updated all in-card text to `text-white`, `text-white/45`, `text-white/40`, `text-white/55`; updated error banner to dark red glass; replaced `bg-zinc-900` CTA with white-button style matching search page; updated divider from `bg-zinc-100` to `bg-white/10`; updated chevron to `text-white/25 group-hover:text-white/55`

---

## 2026-04-04 (search page redesign)

### Search Page — Visual alignment with login page
- `src/app/(dashboard)/layout.tsx`: Added `<LoginBackground />` to JSX render (was imported but unused); added radial vignette overlay matching login page; replaced `bg-white/70` header with dark `rgba(6,18,40,0.70)` header; updated `Bloomkin` logo to pink-purple gradient using Sterion font; softened nav and utility text opacity
- `src/app/(dashboard)/search/page.tsx`: Added lavender "Mentor Discovery" eyebrow label; replaced plain white h1 with pink-purple gradient text; reduced subtitle opacity to `white/45`; upgraded search input with blur + inner shadow glass treatment; tightened result count text

---

## 2026-04-04

### Login Background — Abstract Node Network
- Replaced 3D lotus flower (Three.js / React Three Fiber) in `src/components/ui/LoginBackground.tsx` with a pure HTML5 Canvas animated node-network
- 120 nodes of varying sizes drift slowly across the screen, connected by teal edges when within 160px
- No labels, no names — fully abstract; dark `#0d1117` background with cyan/teal colour scheme

### Session Start
- Read `claude.md`, `Work.md`, `agents.md`, `prd.md` to understand project scope and work split
- Audited all source files and test files to assess completion status
- Produced step-by-step breakdown of remaining work (10 steps)
- Created `CHANGELOG.md` for logging all future actions

### Fraud Detection Agent (Option 1 — parallel Promise.all)
- Added `detectFraud(input)` to `src/lib/ai/claude.ts`
  - Uses `claude-haiku-4-5-20251001` for low-latency fraud analysis
  - Checks three signals: `repeat_pair`, `rating_burst`, `extreme_score`
  - Fails open (returns `allow`) on any AI error to never block legitimate ratings
- Wired into `submitRating` in `src/actions/ratings.ts`
  - Runs duplicate check + pair session count + recent rating count via `Promise.all`
  - Then calls `detectFraud` with the gathered counts
  - Stores `fraud_flags` on the rating row
  - Upgrades mentee `trust_status` to `flagged` or `tribunal_review` if agent flags the submission

### Compliance audit + runtime fixes
- Ran MD requirements audit agent across all 4 spec docs and 20 source files
- Found 0 hard violations, 6 warnings
- **Fixed Warning 1** — wired `matchMentors()` into `src/app/(dashboard)/search/page.tsx`
  - Replaced hand-rolled `filterProfiles()` with Claude AI-ranked results
  - Maps `Profile[]` → `MentorProfile[]` for the API call, maps results back to full `Profile[]`
  - AI-generated reason displayed per card (blue label) when a query is active
  - No-query state still shows all profiles
- **Fixed Warning 5** — created `supabase/migrations/004_missing_session_columns.sql`
  - Adds `conference_record_id text` and `actual_duration_minutes integer` to sessions table
  - These were referenced in `sessions.ts` insert and `src/types/index.ts` but absent from schema
- Ran `npx tsc --noEmit` — 0 errors after fixes

### Multi-Agent Parallel Run (4 agents)

**Agent 1 — Unit test runner**
- Fixed missing `autoprefixer` dev dependency (was blocking Vitest from loading PostCSS config)
- Ran `npx vitest run tests/unit/`
- Result: 16/16 tests passing across `credits.test.ts`, `ratings.test.ts`, `sessions.test.ts`

**Agent 2 — Schema + types updater** (`supabase/migrations/003_fraud_columns.sql`, `src/types/index.ts`)
- Detected `fraud_flags text[]` missing from `ratings` table in DB schema
- Detected `trust_status` missing from `profiles` table in DB schema
- Created `supabase/migrations/003_fraud_columns.sql` with `ALTER TABLE` statements for both columns
- Added `export type TrustStatus` union to `src/types/index.ts`
- Added `trust_status: TrustStatus` to `Profile` interface
- Added `fraud_flags: string[] | null` to `Rating` interface

**Agent 3 — TypeScript fixer** (`src/types/index.ts`)
- Confirmed same type gaps (no `fraud_flags`, no `trust_status`, no `TrustStatus`)
- Applied same fixes; no duplicate entries (agents converged cleanly)
- `pairCount.count` / `recentCount.count` pattern confirmed type-safe (untyped Supabase client)

**Agent 4 — Integration test implementer** (`tests/integration/booking-rating-flow.test.ts`)
- Replaced 4 TODO stubs with real tests using `vi.mock`
- Mocked `@/lib/supabase/server`, `@/lib/supabase/server-admin`, `@/lib/ai/claude`, `next/headers`
- Test 1: `createSession()` happy path — returns correct session shape
- Test 2: `validateSession()` — succeeds when called by mentee on pending session
- Test 3: `submitRating()` happy path — returns rating row with correct fields
- Test 4: credit awarded for score ≥ 4 — asserts admin client calls both `ratings` and `credits` inserts
- All 20 tests passing (16 unit + 4 integration)

### Step 1 completion — TypeScript check + integration test TS fixes
- Ran `npx tsc --noEmit` → 8 errors found in `tests/integration/booking-rating-flow.test.ts`
- Fixed error 1: `mockDetectFraud.mockResolvedValue(...)` was missing `isSuspicious: false` (required by `FraudCheckResult` interface)
- Fixed errors 2–4: Supabase client stub casts changed from `as ReturnType<typeof createAdminClient>` to `as unknown as ReturnType<typeof createAdminClient>` (3 occurrences)
- Fixed errors 5–7: User client stub casts changed from `ReturnType<Awaited<ReturnType<typeof createClient>>>` to `Awaited<ReturnType<typeof createClient>>` (wrong nesting order, 3 occurrences)
- Re-ran `npx tsc --noEmit` → 0 errors ✅
- Re-ran `npx vitest run tests/unit/ tests/integration/` → 20/20 passing ✅
- **Step 1 (TypeScript check) fully complete**

### Three.js Login Page Enhancement

- Created `src/components/ui/LoginBackground.tsx` — client component with a fixed R3F canvas
  - 3 low-poly icosahedra (detail=0, flat-shaded) in zinc-300 color, positioned in screen periphery
  - Very slow rotation (0.06–0.11 rad/s) + gentle sine-wave float per shape
  - `dpr={[1, 1.5]}` cap, `antialias: false`, `alpha: true` — keeps draw calls minimal
  - One ambient light + one dim directional light; no shadows, no post-processing
  - `pointer-events: none`, `aria-hidden="true"` — no accessibility or interaction impact
- Updated `src/app/(auth)/login/page.tsx`
  - Page background changed from `bg-white` full-screen to `bg-zinc-50` (reveals 3D canvas)
  - Content wrapped in a white card (`bg-white rounded-2xl shadow-sm border border-zinc-100/80`) at `z-10`
  - All existing copy, CTA, feature list, and footer unchanged
- `npx tsc --noEmit` — 0 errors after change

---

## 2026-04-04 (continuation) — Dispute resolution, trust state, credit lifecycle, UI

### Gap 1: Dispute resolution flow (`src/actions/disputes.ts`)
- Added `resolveDispute(disputeId, outcome, resolutionNote)` server action
  - Accepts outcome: `'favor_mentor' | 'favor_mentee'`
  - Fetches dispute + joined session via admin client
  - Updates dispute to `status = 'resolved'`, sets `resolved_in_favor_of`, `resolution`, `resolved_at`
  - Updates session status: `'completed'` on favor_mentor, `'cancelled'` on favor_mentee
  - If favor_mentor: checks for qualifying rating (score >= 4), issues withheld credit atomically (DB trigger no longer blocks because dispute is resolved)
  - Idempotent credit guard: checks for existing credit row before inserting
  - Re-evaluates losing party's trust status via `checkAndUpdateTrustStatus()`
  - Returns error if dispute is already resolved
- Updated `fileDispute()` to:
  - Mark session status as `'disputed'` immediately after dispute is filed (admin client, non-fatal)
  - Re-evaluate the OTHER party's trust status via `checkAndUpdateTrustStatus()`

### Gap 2: Credits pause / withheld behavior
- DB trigger `enforce_no_credit_during_dispute` (001_init.sql) already blocked credit inserts while dispute is open
- `resolveDispute()` now grants the withheld credit when favor_mentor by inserting AFTER dispute is resolved
- When favor_mentee, no credit insert happens — credit remains permanently blocked
- `submitRating()` attempts credit insert at rating time; if dispute already exists, DB trigger silently rejects it; credit is deferred to `resolveDispute()` if mentor wins
- Rule preserved: credits never decrease, never spent; only ever added via rating → credit link

### Gap 3: Trust state machine (`src/actions/trust.ts` — new file)
- Created `checkAndUpdateTrustStatus(userId)` helper with documented thresholds:
  - `>= 3` low ratings (score <= 2) in 30 days → `'flagged'`
  - `>= 5` low ratings in 30 days → `'warning_issued'`
  - `>= 8` low ratings in 30 days → `'temporary_ban'`
  - Open dispute filed against user → at minimum `'flagged'`
  - Fraud flags on recent ratings → `'flagged'`; fraud 'review' flag → `'tribunal_review'`
- State transitions are one-way (no automatic downgrade); `permanent_ban` is never modified
- Integrated into:
  - `ratings.ts` `submitRating()` — calls trust check when score <= 2 is submitted against a mentor
  - `disputes.ts` `fileDispute()` — calls trust check on the other party
  - `disputes.ts` `resolveDispute()` — calls trust check on the losing party

### Gap 3b: Migration `005_dispute_resolution.sql`
- `disputes.resolved_in_favor_of text CHECK (IN ('favor_mentor', 'favor_mentee'))` — structured outcome column, idempotent `IF NOT EXISTS`
- `disputes.resolved_at timestamptz` — audit timestamp
- `profiles.low_rating_count_30d integer NOT NULL DEFAULT 0` — cached 30-day low-rating count for trust helper

### Gap 4: UI improvements
- **`src/app/(dashboard)/sessions/[id]/page.tsx`**:
  - Imports `getUserDisputes` and `Dispute` type
  - Fetches disputes for current user, filters to find the dispute for this session
  - Renders dispute status banner (amber = open, emerald = resolved, purple = escalated)
  - Shows resolution outcome (`'Resolved in favor of mentor'` / `'Resolved in favor of mentee'`) and admin note when resolved
- **`src/app/(dashboard)/credits/page.tsx`**:
  - `getUserCredits()` now joins `sessions(scheduled_at)` and `ratings(score)` via Supabase select
  - Credit history rows show: star rating, session date (from join), and "View session" link
  - Falls back to `created_at` if join fields are unavailable
- **`src/app/(dashboard)/disputes/page.tsx`**:
  - Dispute list shows session link (`/sessions/<id>`) per dispute
  - Resolved disputes show outcome (color-coded), resolution date, admin note
  - Updated escalated status badge to purple (was red, now consistent with session detail page)
  - `OUTCOME_LABEL` and `OUTCOME_STYLE` maps added for readable, styled outcome display

### Gap 5: Type updates (`src/types/index.ts`)
- Added `DisputeResolution` type alias (`'favor_mentor' | 'favor_mentee'`)
- Extended `Dispute` interface with `resolved_in_favor_of: DisputeResolution | null` and `resolved_at: string | null`
- Extended `Profile` interface with `low_rating_count_30d: number`
- Extended `Credit` interface with optional join fields `sessions?: { scheduled_at: string } | null` and `ratings?: { score: number } | null`

### Gap 6: New tests
- **`tests/unit/trust.test.ts`** (new, 13 tests):
  - Low-rating threshold tests (active→flagged at 3, →warning_issued at 5, →temporary_ban at 8)
  - Dispute trigger test (dispute against user → flagged)
  - Fraud flag tests (flagged / tribunal_review)
  - No-downgrade rule tests (permanent_ban unchanged, higher status preserved, multi-trigger picks highest)
  - Dispute credit logic tests (favor_mentor + score>=4 grants credit, favor_mentee never grants, idempotent guard)
- **`tests/integration/dispute-resolution-flow.test.ts`** (new, 6 tests):
  - `fileDispute()`: empty reason guard, mentee can file, cancelled session blocked
  - `resolveDispute()`: invalid outcome guard, blank note guard, favor_mentor grants credit (asserts credits table called), favor_mentee no credit (asserts credits table not called), already-resolved guard

### Files changed (Gap 1–6 session)
- `supabase/migrations/005_dispute_resolution.sql` — new migration (idempotent)
- `supabase/migrations/006_admin_flag.sql` — new migration: adds `profiles.is_admin boolean NOT NULL DEFAULT false`; required by `resolveDispute()` admin check
- `src/types/index.ts` — new types + extended interfaces
- `src/actions/trust.ts` — new file: `checkAndUpdateTrustStatus()`
- `src/actions/disputes.ts` — added `resolveDispute()`, updated `fileDispute()`, updated `getUserDisputes()` select
- `src/actions/credits.ts` — `getUserCredits()` now joins sessions + ratings
- `src/actions/ratings.ts` — low-score trigger calls `checkAndUpdateTrustStatus()`
- `src/app/(dashboard)/sessions/[id]/page.tsx` — dispute status banner
- `src/app/(dashboard)/credits/page.tsx` — rich credit history (date, score, session link)
- `src/app/(dashboard)/disputes/page.tsx` — resolution outcome, session link, improved styling
- `tests/unit/trust.test.ts` — new unit tests (13 tests)
- `tests/integration/dispute-resolution-flow.test.ts` — new integration tests (6 tests)

---

## 2026-04-04 (compliance-gap fixes)

### Fix 1 — CHANGELOG migration gap (006_admin_flag.sql)
- `supabase/migrations/006_admin_flag.sql` was present in the repo but missing from CHANGELOG
- Migration adds `profiles.is_admin boolean NOT NULL DEFAULT false`
- `resolveDispute()` in `src/actions/disputes.ts` reads this column to enforce admin-only access
- All six migrations now logged: 001_init, 002_session_rls, 003_fraud_columns, 004_missing_session_columns, 005_dispute_resolution, 006_admin_flag

### Fix 2 — Server-side duplicate open-dispute guard (`src/actions/disputes.ts`)
- `fileDispute()` now queries `disputes` for any existing row with `status IN ('open', 'escalated')` for the same `session_id` before inserting
- Uses `.maybeSingle()` to avoid PGRST116 on zero rows
- Returns `'An open dispute already exists for this session'` if one is found
- Short comment documents the rule above the guard
- The UI hiding the dispute form is now backed by a server-enforced invariant

### Fix 3 — Disputed sessions cannot be cancelled (`src/actions/sessions.ts`)
- `cancelSession()` now checks `session.status === 'disputed'` and returns an error
- Error message: `'Cannot cancel a session that is under dispute — awaiting admin resolution'`
- Prevents a participant from bypassing the tribunal/admin resolution model by unilaterally cancelling
- Short comment explains the rationale inline

### Fix 4 — Schema/type drift: `is_admin` added to `Profile` type (`src/types/index.ts`)
- Added `is_admin: boolean` to the `Profile` interface with a comment pointing to migration 006
- Type now mirrors `profiles` table schema exactly

### Fix 5 — Verification: real test gaps documented + new test added
- Added 7-item manual verification checklist as a comment block at the top of `tests/integration/dispute-resolution-flow.test.ts`
- Checklist covers: admin column existence (SQL), duplicate dispute guard, disputed-session cancel block, DB trigger, admin-only resolution, credit grant, credit block
- Added new test `'blocks a duplicate open dispute for the same session (server-side guard)'` to the integration suite
- Updated `makeQueryMock` to include `'in'` and `'maybeSingle'` in its chainable methods
- Updated existing `'allows mentee to file'` test to correctly sequence 3 `from()` calls (session lookup → duplicate check → insert)
- Test total: 7 integration tests, 13 unit tests (trust), 16 unit tests (credits/ratings/sessions) = 36 tests total

### Fix 6 — ESLint config missing (lint prompt on `npm run lint`)
- `eslint` and `eslint-config-next` were already present in `devDependencies`
- Created `.eslintrc.json` with `{"extends": "next/core-web-vitals"}` in project root
- `npm run lint` (`next lint`) now has a config to load and will produce a real pass/fail instead of the setup prompt

### Files changed (compliance-gap fixes)
- `CHANGELOG.md` — this entry: added 006_admin_flag.sql to migration log
- `src/types/index.ts` — added `is_admin: boolean` to `Profile` interface
- `src/actions/disputes.ts` — server-side duplicate open-dispute guard in `fileDispute()`
- `src/actions/sessions.ts` — block `cancelSession()` when session status is `'disputed'`
- `tests/integration/dispute-resolution-flow.test.ts` — manual checklist, new duplicate-guard test, `maybeSingle`/`in` in mock chain, corrected from() sequencing
- `.eslintrc.json` — new file: `{"extends": "next/core-web-vitals"}`

### Verification results (run after agent completed)
- `npx tsc --noEmit` → 0 errors ✅
- `npm run lint` → ✔ No ESLint warnings or errors ✅
- `npx vitest run tests/unit/ tests/integration/` → 45/45 tests passing ✅
  - unit/credits.test.ts: 2 tests
  - unit/ratings.test.ts: 3 tests
  - unit/sessions.test.ts: 11 tests
  - unit/trust.test.ts: 16 tests
  - integration/dispute-resolution-flow.test.ts: 9 tests (includes new duplicate-guard test)
  - integration/booking-rating-flow.test.ts: 4 tests

---

## 2026-04-04 — Vercel Deployment Readiness Audit

### Audit findings

- **Localhost fallback in `src/actions/auth.ts`** — `signInWithGoogle()` had `?? 'http://localhost:3000'` as the origin fallback. Safe in production (origin header is always present) but fragile; fixed to also check `NEXT_PUBLIC_APP_URL` env var before falling back.
- **Missing Supabase session middleware** — `@supabase/ssr` requires a Next.js middleware to refresh session cookies on every request. Without it, server components on Vercel receive expired sessions and users appear logged out between page navigations. **Critical blocker** — middleware was absent entirely.
- **`vercel.json` incomplete** — Only listed 2 of 9 required env var references. All other vars (`SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `APP_CENTRAL_GOOGLE_REFRESH_TOKEN`, `GEMINI_API_KEY`, `ANTHROPIC_API_KEY`, `NEXT_PUBLIC_APP_URL`) were missing from the `env` mapping.
- **`next.config.ts` empty** — `googleapis` package must be declared in `serverExternalPackages` to prevent Next.js from attempting to bundle it for the browser/edge, which causes build errors.
- **`.env.local.example` incomplete** — Missing `NEXT_PUBLIC_APP_URL`, `APP_CENTRAL_GOOGLE_REFRESH_TOKEN`; unclear local vs production separation; no production redirect URL instructions.
- **No `DEPLOYMENT.md`** — No documentation covering Vercel env vars, Supabase Cloud setup, Google OAuth redirect URIs, or post-deployment verification checklist.
- **AI client confirmed**: `src/lib/ai/claude.ts` uses `GEMINI_API_KEY` (Google Generative AI / Gemini) — not Anthropic — despite the file name. Both vars documented.
- **Auth callback route** (`src/app/auth/callback/route.ts`) — uses `origin` from the request URL directly (`new URL(request.url)`), which is correct for Vercel. No localhost risk.
- **Supabase clients** — `server.ts`, `server-admin.ts`, `service.ts` all use env vars correctly and are server-only. No client-side exposure of service role key.
- **`supabase/config.toml`** — localhost-only config; correct for local dev. Production auth config is managed in Supabase Cloud dashboard (not this file).

### Files changed

1. **`src/middleware.ts`** — NEW: Supabase session refresh middleware (required by `@supabase/ssr` on Vercel). Runs on all routes except static assets. Calls `supabase.auth.getUser()` to silently refresh the session cookie.
2. **`src/actions/auth.ts`** — `signInWithGoogle()`: origin fallback chain now checks `NEXT_PUBLIC_APP_URL` env var before falling back to `http://localhost:3000`.
3. **`vercel.json`** — Added all 9 required env var references (`@supabase_service_role_key`, `@app_url`, `@google_client_id`, `@google_client_secret`, `@app_central_google_refresh_token`, `@gemini_api_key`, `@anthropic_api_key`).
4. **`next.config.ts`** — Added `serverExternalPackages: ['googleapis']` to prevent bundling errors.
5. **`.env.local.example`** — Rewritten: all 9 env vars documented with local vs production values clearly separated; includes instructions for each var.
6. **`DEPLOYMENT.md`** — NEW: full deployment guide covering Supabase Cloud setup, migration steps, Google OAuth redirect URI requirements, Vercel env var table, post-deployment verification checklist, and common error troubleshooting.

### Required Vercel environment variables (complete list)

| Variable | Notes |
|---|---|
| `NEXT_PUBLIC_APP_URL` | Production Vercel URL, e.g. `https://mentor-match.vercel.app` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Cloud project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (secret — never expose to client) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `APP_CENTRAL_GOOGLE_REFRESH_TOKEN` | Long-lived refresh token for centralized calendar account |
| `GEMINI_API_KEY` | Google AI Studio key (used by `src/lib/ai/claude.ts`) |
| `ANTHROPIC_API_KEY` | Anthropic key (kept for future use; not currently used at runtime) |

### Manual steps still required (not automatable from repo)

1. **Supabase Cloud**: Enable Google OAuth provider (Authentication → Providers → Google); set Client ID + Secret.
2. **Supabase Cloud**: Set Site URL to production Vercel domain; add `/auth/callback` and `/**` to redirect allowlist.
3. **Supabase Cloud**: Run all 6 migration files in order via SQL Editor or `supabase db push`.
4. **Google Cloud Console**: Add `https://<ref>.supabase.co/auth/v1/callback` to Authorized Redirect URIs.
5. **Google Cloud Console**: Add production Vercel domain to Authorized JavaScript Origins.
6. **`scripts/get-google-token.ts`**: Run locally to generate `APP_CENTRAL_GOOGLE_REFRESH_TOKEN` for the central calendar account.
7. **Vercel dashboard**: Set all 9 env vars listed above in Project Settings → Environment Variables.

### Verification commands (run locally after changes)

- `npx tsc --noEmit` — requires Bash permission to run; previously passed (0 errors per prior CHANGELOG entries)
- `npm run lint` — requires Bash permission to run; previously passed (0 warnings per prior CHANGELOG entries)

