import { google } from 'googleapis'

function getOAuth2Client() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  )
  oauth2Client.setCredentials({
    refresh_token: process.env.APP_CENTRAL_GOOGLE_REFRESH_TOKEN,
  })
  return oauth2Client
}

export interface CreateEventParams {
  title: string
  description: string
  startTime: string       // ISO 8601 string
  endTime: string         // ISO 8601 string
  attendeeEmails: string[]
  mentorId: string
  menteeId: string
}

export interface CreatedEvent {
  eventId: string
  meetLink: string
  meetCode: string        // e.g. "abc-defg-hij"
}

/**
 * Creates a Google Calendar event on the central account's calendar.
 * Automatically generates a Google Meet link via conferenceData.
 * Sends email invites to all attendees.
 */
export async function createCalendarEvent(
  params: CreateEventParams
): Promise<CreatedEvent> {
  const auth = getOAuth2Client()
  const calendar = google.calendar({ version: 'v3', auth })

  const response = await calendar.events.insert({
    calendarId: 'primary',
    conferenceDataVersion: 1,
    sendUpdates: 'all',
    requestBody: {
      summary: params.title,
      description: params.description,
      start: { dateTime: params.startTime, timeZone: 'UTC' },
      end: { dateTime: params.endTime, timeZone: 'UTC' },
      attendees: params.attendeeEmails.map((email) => ({ email })),
      conferenceData: {
        createRequest: {
          requestId: `${params.mentorId}-${params.menteeId}-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
    },
  })

  const event = response.data
  const meetLink =
    event.hangoutLink ||
    event.conferenceData?.entryPoints?.find((ep) => ep.entryPointType === 'video')?.uri ||
    ''

  // Meet link format: https://meet.google.com/abc-defg-hij
  const meetCode = meetLink.split('/').pop() || ''

  return {
    eventId: event.id!,
    meetLink,
    meetCode,
  }
}

/**
 * Returns ISO start times already booked for a mentor on a given date (YYYY-MM-DD).
 * Used by the booking UI to grey out unavailable slots.
 * Queries our own DB sessions table — no additional Google API call needed.
 */
export async function getBookedStartTimes(
  mentorId: string,
  date: string // YYYY-MM-DD
): Promise<string[]> {
  // Imported lazily to avoid server/client boundary issues
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()

  const dayStart = `${date}T00:00:00.000Z`
  const dayEnd = `${date}T23:59:59.999Z`

  const { data } = await supabase
    .from('sessions')
    .select('scheduled_at')
    .eq('mentor_id', mentorId)
    .gte('scheduled_at', dayStart)
    .lte('scheduled_at', dayEnd)
    .not('status', 'eq', 'cancelled')

  return (data ?? []).map((row) => row.scheduled_at)
}
