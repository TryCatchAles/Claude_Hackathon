'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import type { Session } from '@supabase/supabase-js'
import type { ActionResult } from '@/types'

// Redirects the browser to Google OAuth. Must be called from a server action
// triggered by a form/button — not from a GET handler.
export async function signInWithGoogle(): Promise<never> {
  const headersList = await headers()
  // In production (Vercel), the 'origin' header is always present.
  // NEXT_PUBLIC_APP_URL is the production fallback (set in Vercel dashboard).
  // 'http://localhost:3000' is only reached in local dev without the header.
  const origin =
    headersList.get('origin') ??
    process.env.NEXT_PUBLIC_APP_URL ??
    'http://localhost:3000'

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })

  if (error || !data.url) {
    redirect('/login?error=oauth_failed')
  }

  redirect(data.url)
}

// Returns the full Supabase session (includes access_token, user, expires_at, etc.)
export async function getSession(): Promise<ActionResult<Session>> {
  const supabase = await createClient()
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) return { data: null, error: error.message }
  if (!session) return { data: null, error: 'Not authenticated' }
  return { data: session, error: null }
}

// Ensures a profile row exists for the current user.
// The DB trigger (handle_new_user) creates the row on auth.users insert,
// so this is a safety net for edge cases where the trigger may have failed.
// display_name sync is handled by /auth/callback/route.ts — not here.
export async function ensureProfile(): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Not authenticated' }

  const { data: existing, error: selectError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single()

  // PGRST116 = "no rows returned" — not a real error, just means first login
  if (selectError && selectError.code !== 'PGRST116') {
    return { data: null, error: selectError.message }
  }
  if (existing) return { data: null, error: null } // already exists, nothing to do

  const { error } = await supabase
    .from('profiles')
    .insert({ id: user.id })

  if (error) return { data: null, error: error.message }
  return { data: null, error: null }
}

export async function signOut(): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.auth.signOut()
  if (error) return { data: null, error: error.message }
  redirect('/login')
}
