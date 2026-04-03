'use server'

import { createCalendarEvent } from '@/lib/calendar/client'
import { createClient } from '@/lib/supabase/server'

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
 *   2. Prevent self-booking
 *   3. Create the Google Calendar event (generates Meet link automatically)
 *   4. Insert a booking row (status: confirmed)
 *   5. Insert a session row with calendar + meet metadata
 */
export async function createBooking(
  params: CreateBookingParams
): Promise<CreateBookingResult | CreateBookingError> {
  const supabase = await createClient()

  // 1. Verify caller identity
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  if (user.id !== params.menteeId) {
    return { error: 'Unauthorized: you can only book as yourself' }
  }

  // 2. Prevent self-booking
  if (params.mentorId === params.menteeId) {
    return { error: 'You cannot book a session with yourself' }
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

  // 4. Insert booking row
  const { data: booking, error: bookingError } = await supabase
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

  // 5. Insert session row
  const { data: session, error: sessionError } = await supabase
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

  return {
    bookingId: booking.id,
    sessionId: session.id,
    meetLink: calEvent.meetLink,
    meetCode: calEvent.meetCode,
  }
}
