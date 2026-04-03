import { createClient } from '@supabase/supabase-js'

// Service-role client — bypasses RLS entirely.
// Use ONLY in server actions for privileged writes (e.g. createSession).
// Never expose this to the browser or return its key to the client.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}
