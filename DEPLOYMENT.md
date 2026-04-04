# Deployment Guide — Mentor Match

This guide covers deploying Mentor Match to Vercel with Supabase Cloud and Google OAuth.

---

## Prerequisites

- Vercel account (vercel.com)
- Supabase Cloud project (supabase.com)
- Google Cloud project with OAuth credentials and Calendar API enabled

---

## Step 1 — Supabase Cloud Setup

### 1a. Create a Supabase Cloud project

1. Go to https://supabase.com/dashboard and create a new project.
2. Choose a region close to your users.
3. Note your **Project URL** and **API keys** (Settings → API).

### 1b. Apply database migrations

In the Supabase SQL Editor, run each migration file in order:

```
supabase/migrations/001_init.sql
supabase/migrations/002_session_rls.sql
supabase/migrations/003_fraud_columns.sql
supabase/migrations/004_missing_session_columns.sql
supabase/migrations/005_dispute_resolution.sql
supabase/migrations/006_admin_flag.sql
```

Or use the Supabase CLI against your cloud project:

```bash
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

### 1c. Enable Google OAuth in Supabase Cloud

1. Go to Authentication → Providers → Google.
2. Enable it and enter your `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
3. Copy the **Callback URL** shown — it will look like:
   ```
   https://<your-project-ref>.supabase.co/auth/v1/callback
   ```
   You will add this to Google Cloud Console in Step 2.

### 1d. Set the Site URL and redirect allowlist

1. Authentication → URL Configuration.
2. Set **Site URL** to your Vercel production URL:
   ```
   https://your-app.vercel.app
   ```
3. Add to **Redirect URLs**:
   ```
   https://your-app.vercel.app/auth/callback
   https://your-app.vercel.app/**
   ```

---

## Step 2 — Google Cloud Console Setup

### 2a. Enable APIs

In your Google Cloud project, enable:
- Google Calendar API
- Google Meet API (if using Meet conference record validation)

### 2b. OAuth 2.0 Authorized Redirect URIs

Edit your OAuth 2.0 Client ID and add ALL of these to **Authorized Redirect URIs**:

```
https://<your-project-ref>.supabase.co/auth/v1/callback
```

(This is the Supabase Cloud callback for Google OAuth sign-in.)

### 2c. Authorized JavaScript Origins

Add your Vercel domain to **Authorized JavaScript Origins**:

```
https://your-app.vercel.app
```

---

## Step 3 — Obtain the Central Google Refresh Token

The `APP_CENTRAL_GOOGLE_REFRESH_TOKEN` is a long-lived token for the Google account
that will own the central calendar used to create all Google Meet sessions.

Run the token helper script (requires `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env.local`):

```bash
npx tsx scripts/get-google-token.ts
```

Follow the prompts to sign in with the central Google account, then copy the
`refresh_token` value from the output.

---

## Step 4 — Deploy to Vercel

### 4a. Connect the repository

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Set framework preset to **Next.js** (auto-detected)

### 4b. Set environment variables in Vercel dashboard

Go to your Vercel project → Settings → Environment Variables and add:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | from Supabase dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | from Supabase dashboard → Settings → API |
| `GOOGLE_CLIENT_ID` | from Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | from Google Cloud Console |
| `APP_CENTRAL_GOOGLE_REFRESH_TOKEN` | from `scripts/get-google-token.ts` |
| `GEMINI_API_KEY` | from https://aistudio.google.com/app/apikey |
| `ANTHROPIC_API_KEY` | from https://console.anthropic.com (if used) |

> Set all variables for **Production**, **Preview**, and **Development** environments as appropriate.
> Never put `SUPABASE_SERVICE_ROLE_KEY` or API keys in `NEXT_PUBLIC_*` variables.

### 4c. Deploy

Click **Deploy**. Vercel will run `npm install && next build` automatically.

---

## Step 5 — Post-Deployment Verification

After your first successful deployment:

1. Visit `https://your-app.vercel.app` — the login page should load.
2. Click **Sign in with Google** — you should be redirected to Google OAuth.
3. After sign-in, you should land on `/search`.
4. Check **Supabase Authentication → Users** — your user should appear.
5. Check **Supabase Table Editor → profiles** — a profile row should exist.
6. Perform a search — Gemini AI should return ranked results (falls back to keyword match if quota is reached).

---

## Supabase Auth Callback URL Format

The exact callback URL that must be registered in Google Cloud Console is:

```
https://<your-project-ref>.supabase.co/auth/v1/callback
```

This is different from the app-level callback (`/auth/callback`) which is an internal
Next.js route handler that runs after Supabase completes the OAuth exchange.

---

## Environment Variable Reference

See `.env.local.example` for full descriptions of all required variables.

| Variable | Public? | Required |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Yes | Yes |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | No | Yes |
| `GOOGLE_CLIENT_ID` | No | Yes |
| `GOOGLE_CLIENT_SECRET` | No | Yes |
| `APP_CENTRAL_GOOGLE_REFRESH_TOKEN` | No | Yes |
| `GEMINI_API_KEY` | No | Yes |
| `ANTHROPIC_API_KEY` | No | Optional |

---

## Common Deployment Issues

**OAuth redirect mismatch error after login**
→ The Supabase Cloud callback URL (`https://<ref>.supabase.co/auth/v1/callback`) is not
  registered in Google Cloud Console → Authorized Redirect URIs. Add it exactly.

**Users redirected to `/login?error=auth_failed` after Google sign-in**
→ Check that Google OAuth is enabled in Supabase Cloud (Authentication → Providers → Google)
  and that `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` are set correctly.

**Blank page or 500 error after deployment**
→ Run `vercel logs` and check for missing env vars. Ensure all variables are set
  in the Vercel dashboard for the Production environment.

**Session not persisting between pages (user gets logged out)**
→ The Supabase middleware (`src/middleware.ts`) must be present. It refreshes the
  session cookie on every request. Check that the file exists and is not excluded
  from the build.

**Google Calendar events not being created**
→ Verify `APP_CENTRAL_GOOGLE_REFRESH_TOKEN` is set and the token has not expired.
  Re-run `scripts/get-google-token.ts` to get a fresh token if needed.

**Gemini AI returns empty results**
→ Check `GEMINI_API_KEY` is valid. The app falls back to keyword matching if Gemini
  is unavailable — search will still work, just without AI ranking.
