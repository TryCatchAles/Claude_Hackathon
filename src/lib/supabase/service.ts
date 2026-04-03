import { createClient } from '@supabase/supabase-js'

/**
 * Service-role Supabase client.
 * Only use server-side — never expose to the browser.
 * Bypasses RLS and can access auth.admin APIs (e.g. get user email by ID).
 */
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Returns the email address for any user by their auth UUID.
 * Requires service role — not callable from the client.
 */
export async function getUserEmail(userId: string): Promise<string | null> {
  const supabase = createServiceClient()
  const { data, error } = await supabase.auth.admin.getUserById(userId)
  if (error || !data.user) return null
  return data.user.email ?? null
}
