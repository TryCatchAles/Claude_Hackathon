'use server'

import { createCalendarEvent } from '@/lib/calendar/client'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export interface CreateBookingParams {
  mentorId: string
  menteeId: string
  startTime: string       // ISO 8601
  durationMinutes: number
  mentorEmail: string
  menteeEmail: string
  mentorName: string
  menteeName: string
  skill: string           // what the mentee wants to learn
}

export interface CreateBookingResult {
  bookingId: string
  sessionId: string
  meetLink: string
  meetCode: string
  error?: never
}

export interface CreateBookingError {
  error: string
  bookingId?: never
  sessionId?: never
  meetLink?: never
  meetCode?: never
}

/**
 * Creates a booking + session, generates a Google Calendar event with Meet link.
 *
 * Steps:
 *   1. Verify the caller is the mentee
 *   2. Prevent self-booking + check credits (no deduction yet)
 *   3. Create the Google Calendar event (generates Meet link)
 *   4. Insert booking row via service client (bypasses RLS)
 *   5. Insert session row via service client (bypasses RLS)
 *   6. Deduct 1 credit only after everything succeeds
 */
export async function createBooking(
  params: CreateBookingParams
): Promise<CreateBookingResult | CreateBookingError> {
  const supabase = await createClient()
  const service = createServiceClient()

  // 1. Verify caller identity
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Not authenticated' }
  if (user.id !== params.menteeId) return { error: 'Unauthorized: you can only book as yourself' }

  // 2. Prevent self-booking
  if (params.mentorId === params.menteeId) return { error: 'You cannot book a session with yourself' }

  // 2a. Block booking if mentee has any unrated completed sessions
  const { data: completedSessions } = await service
    .from('sessions')
    .select('id')
    .eq('mentee_id', user.id)
    .eq('validated', true)

  if (completedSessions && completedSessions.length > 0) {
    const completedIds = completedSessions.map(s => s.id)
    const { data: existingRatings } = await service
      .from('ratings')
      .select('session_id')
      .in('session_id', completedIds)
    const ratedIds = new Set((existingRatings ?? []).map(r => r.session_id))
    const hasUnrated = completedIds.some(id => !ratedIds.has(id))
    if (hasUnrated) {
      return { error: 'Please rate your last session before booking a new one.' }
    }
  }

  // 2b. Prevent duplicate bookings with the same mentor
  const { data: existing } = await service
    .from('bookings')
    .select('id')
    .eq('mentor_id', params.mentorId)
    .eq('mentee_id', params.menteeId)
    .not('status', 'eq', 'cancelled')
    .maybeSingle()

  if (existing) return { error: 'You already have an active booking with this mentor.' }

  // 2b. Check credits — do NOT deduct yet
  const { data: menteeProfile } = await supabase
    .from('profiles')
    .select('credits')
    .eq('id', user.id)
    .single()

  if (!menteeProfile || menteeProfile.credits <= 0) {
    return { error: 'You need at least 1 credit to book a session. Earn credits by completing sessions and receiving high ratings.' }
  }

  // 3. Create Google Calendar event + Meet link
  const endTime = new Date(
    new Date(params.startTime).getTime() + params.durationMinutes * 60_000
  ).toISOString()

  let calEvent: { eventId: string; meetLink: string; meetCode: string }
  try {
    calEvent = await createCalendarEvent({
      title: `Mentoring: ${params.skill} — ${params.mentorName} & ${params.menteeName}`,
      description: `Mentor: ${params.mentorName}\nMentee: ${params.menteeName}\nSkill: ${params.skill}`,
      startTime: params.startTime,
      endTime,
      attendeeEmails: [params.mentorEmail, params.menteeEmail],
      mentorId: params.mentorId,
      menteeId: params.menteeId,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { error: `Failed to create calendar event: ${message}` }
  }

  // 4. Insert booking row (service role bypasses RLS)
  const { data: booking, error: bookingError } = await service
    .from('bookings')
    .insert({
      mentor_id: params.mentorId,
      mentee_id: params.menteeId,
      scheduled_at: params.startTime,
      duration_minutes: params.durationMinutes,
      status: 'confirmed',
    })
    .select('id')
    .single()

  if (bookingError || !booking) {
    return { error: `Failed to create booking: ${bookingError?.message}` }
  }

  // 5. Insert session row (service role bypasses RLS)
  const { data: session, error: sessionError } = await service
    .from('sessions')
    .insert({
      booking_id: booking.id,
      mentor_id: params.mentorId,
      mentee_id: params.menteeId,
      calendar_event_id: calEvent.eventId,
      meet_meeting_code: calEvent.meetCode,
      scheduled_at: params.startTime,
      duration_minutes: params.durationMinutes,
      status: 'pending',
      validated: false,
    })
    .select('id')
    .single()

  if (sessionError || !session) {
    return { error: `Failed to create session: ${sessionError?.message}` }
  }

  // 6. Everything succeeded — now deduct the credit
  await service
    .from('profiles')
    .update({ credits: menteeProfile.credits - 1 })
    .eq('id', user.id)

  return {
    bookingId: booking.id,
    sessionId: session.id,
    meetLink: calEvent.meetLink,
    meetCode: calEvent.meetCode,
  }
}
