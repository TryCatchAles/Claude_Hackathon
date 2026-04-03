'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResult, Credit } from '@/types'

// Returns the logged-in user's credit history (append-only ledger).
export async function getUserCredits(): Promise<ActionResult<Credit[]>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('credits')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

// Returns the logged-in user's cached credit balance from their profile.
export async function getCreditBalance(): Promise<ActionResult<number>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('profiles')
    .select('credits')
    .eq('id', user.id)
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data.credits, error: null }
}
