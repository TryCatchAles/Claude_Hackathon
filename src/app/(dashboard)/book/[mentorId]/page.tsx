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

const glassCard = {
  background: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(255,255,255,0.13)',
  backdropFilter: 'blur(20px)',
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
    const bookingDate = formData.get('date') as string
    if (!bookingDate) return
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
        className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white mb-8 transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back to search
      </Link>

      {/* Unrated session blocker */}
      {unratedSessionId && (
        <div className="rounded-xl p-5 mb-6" style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)' }}>
          <p className="text-sm font-semibold text-amber-300 mb-1">Rate your last session first</p>
          <p className="text-xs text-amber-300/70 mb-3">
            You have a completed session that hasn&apos;t been rated yet. Please rate it before booking a new one.
          </p>
          <Link
            href={`/sessions/${unratedSessionId}`}
            className="inline-block bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-lg px-4 py-2 text-xs font-semibold hover:bg-amber-400/30 transition-colors"
          >
            Rate that session →
          </Link>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl px-4 py-3 mb-6 text-sm text-red-300" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
          {error === 'email_missing'
            ? 'Could not retrieve email addresses. Please try again.'
            : decodeURIComponent(error)}
        </div>
      )}

      {/* Mentor card */}
      <div className="rounded-2xl p-6 mb-4" style={glassCard}>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-base flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.22)' }}>
            {mentor.display_name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-white tracking-tight">
              {mentor.display_name ?? 'Anonymous'}
            </h1>
            {mentor.school && (
              <p className="text-sm text-white/50 mt-0.5">
                {mentor.school}{mentor.degree ? ` · ${mentor.degree}` : ''}
              </p>
            )}
            {mentor.bio && (
              <p className="text-sm text-white/70 mt-2 leading-relaxed line-clamp-3">{mentor.bio}</p>
            )}
            {mentor.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {mentor.hashtags.map(tag => (
                  <span key={tag} className="text-xs text-white/70 px-2 py-0.5 rounded-md font-medium"
                    style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.14)' }}>
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Booking form */}
      <div className={`rounded-2xl p-6 ${unratedSessionId ? 'opacity-50 pointer-events-none' : ''}`} style={glassCard}>
        <h2 className="text-base font-semibold text-white mb-5">Select a time slot</h2>
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
