# Mentor Match

A mentor-mentee skill exchange platform. Users find mentors by skill, book sessions via Google Calendar + Google Meet, and earn reputation credits through high ratings.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, TypeScript, Tailwind |
| Backend | Next.js Server Actions, Supabase Edge Functions |
| Database | Supabase Postgres + Row Level Security |
| Auth | Supabase Auth — Google OAuth only |
| AI | Claude API (mentor matching) |
| Integrations | Google Calendar API, Google Meet API |
| Hosting | Vercel |
| Testing | Vitest (unit), Playwright (E2E) |

---

## Local Development

### Prerequisites

| Tool | Purpose | Install |
|---|---|---|
| Docker Desktop | Required by Supabase CLI to run local Postgres + Auth | [docker.com](https://www.docker.com/products/docker-desktop) |
| Node.js 20+ | Run Next.js and scripts | [nodejs.org](https://nodejs.org) |
| Supabase CLI | Manage local DB | `npm install -g supabase` |

**Docker Desktop must be open and running** before any `supabase` command will work.
You do not need to create any containers yourself — the Supabase CLI manages them.

---

### 1. Clone and install

```bash
git clone <repo-url>
cd Claude_Hackathon
npm install
```

---

### 2. Set up environment variables

```bash
cp .env.local.example .env.local
```

Open `.env.local` and fill in:

- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` from [Google Cloud Console](https://console.cloud.google.com/)
- `ANTHROPIC_API_KEY` from [console.anthropic.com](https://console.anthropic.com)
- Leave the Supabase values for now — Step 3 will print them for you

---

### 3. Start the local Supabase stack

```bash
npx supabase start
```

This starts Postgres, Auth, Storage, and Studio inside Docker. First run downloads ~1 GB of images.

When it finishes, you will see output like:

```
API URL:      http://localhost:54321
DB URL:       postgresql://postgres:postgres@localhost:54322/postgres
Studio URL:   http://localhost:54323
anon key:     eyJ...
service_role: eyJ...
```

Copy the `anon key` and `service_role` values into your `.env.local`:

```
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

---

### 4. Apply the database migration

```bash
npx supabase db reset
```

This drops and recreates the local database from scratch, applying `supabase/migrations/001_init.sql`.
Run this every time you change the migration file.

To verify the schema was applied:

```bash
# Connect directly to the local Postgres
psql postgresql://postgres:postgres@localhost:54322/postgres

# Inside psql:
\dt public.*       # should list all 8 tables
\q                 # quit
```

Or open Studio at **http://localhost:54323** and check the Table Editor.

---

### 5. Configure Google OAuth (required for auth to work locally)

In [Google Cloud Console](https://console.cloud.google.com/):

1. Go to **APIs & Services → Credentials → OAuth 2.0 Client IDs**
2. Add these to **Authorized Redirect URIs**:
   ```
   http://localhost:54321/auth/v1/callback
   ```
3. Copy the Client ID and Secret into `.env.local`

The Supabase CLI reads `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` from your environment when it starts, via `supabase/config.toml`.

> If you change these values after `supabase start`, run `supabase stop && supabase start` to reload them.

---

### 6. Start the Next.js dev server

```bash
npm run dev
```

App runs at **http://localhost:3000**.

---

## Common Commands

```bash
# Start local Supabase (Docker must be running)
npx supabase start

# Stop local Supabase
npx supabase stop

# Reset DB and rerun all migrations (use after any schema change)
npx supabase db reset

# Check status of local stack
npx supabase status

# View Supabase logs
npx supabase logs

# Start Next.js dev server
npm run dev

# Run unit tests
npm run test:unit

# Run E2E tests (requires dev server running)
npm run test:e2e

# Type check
npx tsc --noEmit

# Lint
npm run lint
```

---

## Docker — What It's Used For

**Docker is used exclusively by the Supabase CLI** to run the local database stack (Postgres, Auth, Storage, Studio). You never interact with Docker directly.

The Next.js app runs locally with `npm run dev` — no app container is needed for development. Deployment is handled by Vercel.

There is no `docker-compose.yml` in this repo because the Supabase CLI manages its own internal containers via `supabase/config.toml`.

---

## Project Structure

```
supabase/
  config.toml          ← Supabase CLI config (ports, auth providers, Google OAuth)
  migrations/
    001_init.sql        ← Full DB schema: tables, RLS policies, triggers, indexes
  functions/
    credit-award/       ← Edge Function: award credits after high rating
    fraud-detect/       ← Edge Function: flag suspicious patterns
    session-validate/   ← Edge Function: validate session via Meet attendance API

src/
  actions/             ← Next.js Server Actions (auth, sessions, ratings, credits, disputes)
  app/                 ← Next.js App Router pages
  lib/
    supabase/          ← Supabase client helpers
    ai/                ← Claude API client (mentor matching)
    calendar/          ← Google Calendar API client
  types/               ← Shared TypeScript types

tests/
  unit/                ← Vitest unit tests
  e2e/                 ← Playwright end-to-end tests
  simulation/          ← Fraud simulation scripts
```

---

## Troubleshooting

**`supabase start` fails immediately**
→ Docker Desktop is not running. Open it and wait for it to fully start, then retry.

**`supabase start` hangs or errors on first run**
→ Docker is pulling ~1 GB of images. Wait a few minutes. If it errors, run `supabase stop` then `supabase start` again.

**`supabase db reset` shows a SQL error**
→ There is a syntax error in `001_init.sql`. Read the error — it shows the exact line. Fix it, then run `supabase db reset` again.

**Google OAuth redirect fails locally**
→ Make sure `http://localhost:54321/auth/v1/callback` is added as an Authorized Redirect URI in Google Cloud Console. It is case-sensitive and must be exact.

**`npm run dev` can't connect to Supabase**
→ Check that `NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321` and the anon key in `.env.local` match the values printed by `supabase start`.
