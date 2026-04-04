import { getProfile, getOwnProfile } from '@/actions/profile'
import { createBooking } from '@/actions/bookings'
import { getBookedStartTimes } from '@/lib/calendar/client'
import { getUserEmail, createServiceClient } from '@/lib/supabase/service'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import BookingForm from './BookingForm'

interface Props {
  params: Promise<{ mentorId: string }>
  searchParams: Promise<{ date?: string; error?: string }>
}

function getTomorrow(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}


export default async function BookPage({ params, searchParams }: Props) {
  const { mentorId } = await params
  const { date, error } = await searchParams
  const selectedDate = date ?? getTomorrow()

  const [{ data: mentor }, { data: self }] = await Promise.all([
    getProfile(mentorId),
    getOwnProfile(),
  ])

  if (!mentor) notFound()
  if (!self) redirect('/login')
  if (mentor.id === self.id) redirect('/search')

  // Check if the mentee has any completed+validated sessions they haven't rated yet
  const service = createServiceClient()
  const { data: completedSessions } = await service
    .from('sessions')
    .select('id')
    .eq('mentee_id', self.id)
    .eq('validated', true)
    .eq('status', 'completed')

  let unratedSessionId: string | null = null
  if (completedSessions && completedSessions.length > 0) {
    const completedIds = completedSessions.map(s => s.id)
    const { data: existingRatings } = await service
      .from('ratings')
      .select('session_id')
      .in('session_id', completedIds)
    const ratedIds = new Set((existingRatings ?? []).map(r => r.session_id))
    unratedSessionId = completedIds.find(id => !ratedIds.has(id)) ?? null
  }

  const bookedStartTimes = await getBookedStartTimes(mentorId, selectedDate)
  const bookedHours = new Set(bookedStartTimes.map(iso => new Date(iso).getUTCHours()))

  async function handleBook(formData: FormData) {
    'use server'
    const hour = parseInt(formData.get('hour') as string, 10)
    // Date comes directly from the form input — no hidden field needed
    const bookingDate = formData.get('date') as string

    if (!bookingDate) return

    // If no slot selected, treat as a date-change refresh
    if (isNaN(hour)) {
      redirect(`/book/${mentorId}?date=${bookingDate}`)
    }

    const [mentorEmail, selfEmail] = await Promise.all([
      getUserEmail(mentorId),
      getUserEmail(self!.id),
    ])

    if (!mentorEmail || !selfEmail) {
      redirect(`/book/${mentorId}?date=${bookingDate}&error=email_missing`)
    }

    const startTime = new Date(
      `${bookingDate}T${String(hour).padStart(2, '0')}:00:00Z`
    ).toISOString()

    const result = await createBooking({
      mentorId,
      menteeId: self!.id,
      startTime,
      durationMinutes: 60,
      mentorEmail,
      menteeEmail: selfEmail,
      mentorName: mentor!.display_name ?? 'Mentor',
      menteeName: self!.display_name ?? 'Mentee',
      skill: mentor!.hashtags[0] ?? 'general',
    })

    if ('error' in result) {
      redirect(`/book/${mentorId}?date=${bookingDate}&error=${encodeURIComponent(result.error ?? 'unknown')}`)
    }

    redirect(`/sessions/${result.sessionId}`)
  }

  const formattedDate = new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })

  return (
    <div className="max-w-xl">
      {/* Back */}
      <Link
        href="/search"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-900 mb-8 transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back to search
      </Link>

      {/* Unrated session blocker */}
      {unratedSessionId && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
          <p className="text-sm font-semibold text-amber-800 mb-1">Rate your last session first</p>
          <p className="text-xs text-amber-700 mb-3">
            You have a completed session that hasn&apos;t been rated yet. Please rate it before booking a new one.
          </p>
          <Link
            href={`/sessions/${unratedSessionId}`}
            className="inline-block bg-amber-800 text-white rounded-lg px-4 py-2 text-xs font-semibold hover:bg-amber-900 transition-colors"
          >
            Rate that session →
          </Link>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-6">
          {error === 'email_missing'
            ? 'Could not retrieve email addresses. Please try again.'
            : decodeURIComponent(error)}
        </div>
      )}

      {/* Mentor card */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6 mb-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center text-white font-semibold text-base flex-shrink-0">
            {mentor.display_name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-zinc-900 tracking-tight">
              {mentor.display_name ?? 'Anonymous'}
            </h1>
            {mentor.school && (
              <p className="text-sm text-zinc-400 mt-0.5">
                {mentor.school}{mentor.degree ? ` · ${mentor.degree}` : ''}
              </p>
            )}
            {mentor.bio && (
              <p className="text-sm text-zinc-500 mt-2 leading-relaxed line-clamp-3">{mentor.bio}</p>
            )}
            {mentor.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {mentor.hashtags.map(tag => (
                  <span key={tag} className="text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-md font-medium">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Booking form */}
      <div className={`bg-white border border-zinc-200 rounded-xl p-6 ${unratedSessionId ? 'opacity-50 pointer-events-none' : ''}`}>
        <h2 className="text-base font-semibold text-zinc-900 mb-5">Select a time slot</h2>
        <BookingForm
          selectedDate={selectedDate}
          minDate={getTomorrow()}
          bookedHours={[...bookedHours]}
          action={handleBook}
          formattedDate={formattedDate}
        />
      </div>
    </div>
  )
}
