'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/types'

export interface Notification {
  id: string
  user_id: string
  message: string
  read: boolean
  created_at: string
}

export async function getNotifications(): Promise<ActionResult<Notification[]>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function getUnreadCount(): Promise<number> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('read', false)

  return count ?? 0
}

export async function markAllRead(): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Not authenticated' }

  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', user.id)
    .eq('read', false)

  if (error) return { data: null, error: error.message }
  return { data: null, error: null }
}
