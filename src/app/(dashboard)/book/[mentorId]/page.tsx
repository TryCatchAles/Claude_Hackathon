import { getProfile, getOwnProfile } from '@/actions/profile'
import { createBooking } from '@/actions/bookings'
import { getBookedStartTimes } from '@/lib/calendar/client'
import { getUserEmail } from '@/lib/supabase/service'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'

interface Props {
  params: Promise<{ mentorId: string }>
  searchParams: Promise<{ date?: string; error?: string }>
}

const SLOT_HOURS = [9, 10, 11, 13, 14, 15, 16, 17]

function getTomorrow(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

function formatSlot(hour: number): string {
  const suffix = hour < 12 ? 'AM' : 'PM'
  const display = hour <= 12 ? hour : hour - 12
  return `${display}:00 ${suffix}`
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

  const bookedStartTimes = await getBookedStartTimes(mentorId, selectedDate)
  const bookedHours = new Set(bookedStartTimes.map(iso => new Date(iso).getUTCHours()))

  async function handleBook(formData: FormData) {
    'use server'
    const hour = parseInt(formData.get('hour') as string, 10)
    const bookingDate = formData.get('date') as string
    if (isNaN(hour) || !bookingDate) return

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

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-6">
          {error === 'email_missing' ? 'Could not retrieve email addresses. Please try again.' : decodeURIComponent(error)}
        </div>
      )}

      {/* Mentor card */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6 mb-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center text-white font-semibold text-base flex-shrink-0">
            {mentor.display_name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-zinc-900 tracking-tight">
                {mentor.display_name ?? 'Anonymous'}
              </h1>
              {mentor.credits > 0 && (
                <span className="text-xs text-zinc-400 font-medium">{mentor.credits} credits</span>
              )}
            </div>
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
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Booking panel */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6">
        <h2 className="text-base font-semibold text-zinc-900 mb-5">Select a time slot</h2>

        {/* Date picker */}
        <form method="GET" className="mb-6">
          <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">Date</label>
          <div className="flex gap-2">
            <input
              type="date"
              name="date"
              defaultValue={selectedDate}
              min={getTomorrow()}
              className="flex-1 bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 transition"
            />
            <button
              type="submit"
              className="bg-zinc-100 text-zinc-700 rounded-lg px-4 py-2 text-sm font-medium hover:bg-zinc-200 transition-colors"
            >
              Update
            </button>
          </div>
        </form>

        {/* Slots */}
        <div className="mb-6">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-3">{formattedDate}</p>
          <div className="grid grid-cols-4 gap-2">
            {SLOT_HOURS.map(hour => {
              const booked = bookedHours.has(hour)
              return (
                <label
                  key={hour}
                  className={`flex items-center justify-center rounded-lg border py-2.5 text-xs font-medium cursor-pointer select-none transition-all
                    ${booked
                      ? 'border-zinc-100 bg-zinc-50 text-zinc-300 cursor-not-allowed'
                      : 'border-zinc-200 text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50 has-[:checked]:bg-zinc-900 has-[:checked]:border-zinc-900 has-[:checked]:text-white'
                    }`}
                >
                  <input type="radio" name="hour" value={hour} disabled={booked} form="bookingForm" className="sr-only" />
                  {formatSlot(hour)}
                </label>
              )
            })}
          </div>
          <p className="text-xs text-zinc-400 mt-2.5">Times shown in UTC · 60-minute sessions</p>
        </div>

        {/* Submit */}
        <form id="bookingForm" action={handleBook}>
          <input type="hidden" name="date" value={selectedDate} />
          <button
            type="submit"
            className="w-full bg-zinc-900 text-white rounded-lg px-5 py-3 text-sm font-semibold hover:bg-zinc-700 active:scale-[0.98] transition-all"
          >
            Confirm booking
          </button>
          <p className="text-xs text-zinc-400 text-center mt-3">
            A Google Meet link will be emailed to both participants.
          </p>
        </form>
      </div>
    </div>
  )
}
