'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResult, Dispute } from '@/types'

// Files a dispute for a session. Either participant can file.
// Disputes pause credit awards for the session (enforced by DB trigger).
export async function fileDispute(
  sessionId: string,
  reason: string,
): Promise<ActionResult<Dispute>> {
  if (!reason.trim()) return { data: null, error: 'Reason is required' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Not authenticated' }

  // Verify the user is a participant in the session.
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('mentor_id, mentee_id, status')
    .eq('id', sessionId)
    .single()

  if (sessionError || !session) return { data: null, error: 'Session not found' }
  if (session.mentor_id !== user.id && session.mentee_id !== user.id) {
    return { data: null, error: 'You are not a participant in this session' }
  }
  if (session.status === 'cancelled') {
    return { data: null, error: 'Cannot dispute a cancelled session' }
  }

  const { data, error } = await supabase
    .from('disputes')
    .insert({
      session_id: sessionId,
      filed_by: user.id,
      reason: reason.trim(),
      status: 'open',
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

// Returns all disputes the logged-in user is involved in.
export async function getUserDisputes(): Promise<ActionResult<Dispute[]>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Not authenticated' }

  // Disputes are linked to sessions; fetch disputes where user is a session participant.
  const { data, error } = await supabase
    .from('disputes')
    .select('*, sessions!inner(mentor_id, mentee_id)')
    .or(`sessions.mentor_id.eq.${user.id},sessions.mentee_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}
