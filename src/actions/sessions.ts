'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server-admin'
import type { ActionResult, Session } from '@/types'

// ─────────────────────────────────────────────────────────────────────────────
// createSession
//
// Called by Person 2's booking action after the Google Calendar event is made.
// Uses the service-role client (bypasses RLS) because there is no user-facing
// insert policy on sessions — writes must come from a trusted server path.
//
// Hardens against bad inputs by verifying the booking exists and that the
// supplied mentor_id/mentee_id match the booking before inserting.
// ─────────────────────────────────────────────────────────────────────────────
export async function createSession(params: {
  booking_id: string
  mentor_id: string
  mentee_id: string
  scheduled_at: string
  duration_minutes: number
  calendar_event_id?: string
  meet_meeting_code?: string
  conference_record_id?: string
}): Promise<ActionResult<Session>> {
  const admin = createAdminClient()

  // Verify the booking exists and that the supplied participants match it.
  const { data: booking, error: bookingError } = await admin
    .from('bookings')
    .select('id, mentor_id, mentee_id, scheduled_at, duration_minutes, status')
    .eq('id', params.booking_id)
    .single()

  if (bookingError || !booking) {
    return { data: null, error: 'Booking not found' }
  }
  if (booking.mentor_id !== params.mentor_id || booking.mentee_id !== params.mentee_id) {
    return { data: null, error: 'Session participants do not match booking' }
  }
  if (booking.status === 'cancelled') {
    return { data: null, error: 'Cannot create a session for a cancelled booking' }
  }
  // Verify schedule and duration match the booking exactly.
  // Compare as numeric timestamps to avoid ISO string formatting differences
  // (e.g. "Z" vs "+00:00", or missing milliseconds) causing false mismatches.
  const bookingTime = new Date(booking.scheduled_at).getTime()
  const paramTime = new Date(params.scheduled_at).getTime()
  if (isNaN(bookingTime)) return { data: null, error: 'Booking has an invalid scheduled_at value' }
  if (isNaN(paramTime)) return { data: null, error: 'Invalid scheduled_at value supplied' }
  if (bookingTime !== paramTime) {
    return { data: null, error: 'Session scheduled_at does not match booking' }
  }
  if (booking.duration_minutes !== params.duration_minutes) {
    return { data: null, error: 'Session duration_minutes does not match booking' }
  }

  // Guard against a duplicate session for the same booking (DB has a unique
  // constraint on booking_id, but checking here gives a cleaner error message).
  // PGRST116 = "no rows found" — expected when no duplicate exists.
  const { data: existing, error: dupError } = await admin
    .from('sessions')
    .select('id')
    .eq('booking_id', params.booking_id)
    .single()

  if (dupError && dupError.code !== 'PGRST116') {
    return { data: null, error: dupError.message }
  }
  if (existing) {
    return { data: null, error: 'A session already exists for this booking' }
  }

  const { data, error } = await admin
    .from('sessions')
    .insert({
      booking_id: params.booking_id,
      mentor_id: params.mentor_id,
      mentee_id: params.mentee_id,
      scheduled_at: params.scheduled_at,
      duration_minutes: params.duration_minutes,
      calendar_event_id: params.calendar_event_id ?? null,
      meet_meeting_code: params.meet_meeting_code ?? null,
      conference_record_id: params.conference_record_id ?? null,
      status: 'pending',
      validated: false,
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

// Returns all sessions for the currently logged-in user (as mentor or mentee).
export async function getUserSessions(): Promise<ActionResult<Session[]>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .or(`mentor_id.eq.${user.id},mentee_id.eq.${user.id}`)
    .order('scheduled_at', { ascending: false })

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

// Returns a single session by ID. RLS ensures only participants can read it.
export async function getSession(sessionId: string): Promise<ActionResult<Session>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .single()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

// ─────────────────────────────────────────────────────────────────────────────
// validateSession
//
// Honor system: the mentee confirms the session took place.
// This is the product rule (CLAUDE.md §2, §10): mentee-only validation.
// Sets validated = true and status = 'completed', gating rating and credits.
//
// Uses the user-scoped client — the "sessions: participants can update" RLS
// policy (migration 002) allows this update.
// ─────────────────────────────────────────────────────────────────────────────
export async function validateSession(sessionId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Not authenticated' }

  const { data: session, error: fetchError } = await supabase
    .from('sessions')
    .select('mentee_id, status, validated')
    .eq('id', sessionId)
    .single()

  if (fetchError) return { data: null, error: fetchError.message }
  if (session.mentee_id !== user.id) return { data: null, error: 'Only the mentee can validate a session' }
  if (session.validated) return { data: null, error: 'Session already validated' }
  if (session.status === 'cancelled') return { data: null, error: 'Cannot validate a cancelled session' }

  const { error } = await supabase
    .from('sessions')
    .update({
      validated: true,
      validated_at: new Date().toISOString(),
      status: 'completed',
    })
    .eq('id', sessionId)

  if (error) return { data: null, error: error.message }
  return { data: null, error: null }
}

// ─────────────────────────────────────────────────────────────────────────────
// cancelSession
//
// Either participant can cancel, unless the session is already completed.
// Uses the user-scoped client — covered by the same update RLS policy.
// ─────────────────────────────────────────────────────────────────────────────
export async function cancelSession(sessionId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Not authenticated' }

  const { data: session, error: fetchError } = await supabase
    .from('sessions')
    .select('mentor_id, mentee_id, status')
    .eq('id', sessionId)
    .single()

  if (fetchError) return { data: null, error: fetchError.message }
  if (session.mentor_id !== user.id && session.mentee_id !== user.id) {
    return { data: null, error: 'Access denied' }
  }
  if (session.status === 'completed') {
    return { data: null, error: 'Cannot cancel a completed session' }
  }

  const { error } = await supabase
    .from('sessions')
    .update({ status: 'cancelled' })
    .eq('id', sessionId)

  if (error) return { data: null, error: error.message }
  return { data: null, error: null }
}
