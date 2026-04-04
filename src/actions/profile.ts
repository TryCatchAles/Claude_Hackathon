'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResult, Profile } from '@/types'

// Returns the logged-in user's own profile.
export async function getOwnProfile(): Promise<ActionResult<Profile>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

// Returns any user's public profile by ID.
export async function getProfile(userId: string): Promise<ActionResult<Profile>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

// Returns all active profiles that have a display name — used by the search page.
export async function getAllProfiles(): Promise<ActionResult<Profile[]>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('status', 'active')
    .not('display_name', 'is', null)
    .order('credits', { ascending: false })

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

// Updates the logged-in user's own profile fields.
export async function updateProfile(fields: {
  display_name?: string
  bio?: string
  school?: string
  degree?: string
  hashtags?: string[]
}): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Not authenticated' }

  const { error } = await supabase
    .from('profiles')
    .update(fields)
    .eq('id', user.id)

  if (error) return { data: null, error: error.message }
  return { data: null, error: null }
}
