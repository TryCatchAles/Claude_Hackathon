import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Supabase redirects here after Google OAuth.
// Exchanges the one-time code for a session, syncs display name, then
// sends the user into the app.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  // Populate display_name from Google metadata on first login.
  // The DB trigger created the profile row; we just fill in the name.
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const displayName: string | null = user.user_metadata?.full_name ?? user.email ?? null
    if (displayName) {
      await supabase
        .from('profiles')
        .update({ display_name: displayName })
        .eq('id', user.id)
        .is('display_name', null)
    }
  }

  return NextResponse.redirect(`${origin}/search`)
}
