import { getSession, validateSession, cancelSession } from '@/actions/sessions'
import { getSessionRating, submitRating } from '@/actions/ratings'
import { fileDispute } from '@/actions/disputes'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'

interface Props {
  params: Promise<{ id: string }>
}

const STATUS_STYLES: Record<string, string> = {
  pending:   'bg-yellow-50 text-yellow-700',
  active:    'bg-blue-50 text-blue-700',
  completed: 'bg-green-50 text-green-700',
  disputed:  'bg-red-50 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
}

export default async function SessionDetailPage({ params }: Props) {
  const { id } = await params
  const { data: session, error } = await getSession(id)
  if (error || !session) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const isMentee = session.mentee_id === user.id
  const isMentor = session.mentor_id === user.id
  const { data: existingRating } = await getSessionRating(id)

  async function handleValidate() {
    'use server'
    await validateSession(id)
    redirect(`/sessions/${id}`)
  }

  async function handleCancel() {
    'use server'
    await cancelSession(id)
    redirect('/sessions')
  }

  async function handleRate(formData: FormData) {
    'use server'
    const score = parseInt(formData.get('score') as string, 10)
    const comment = formData.get('comment') as string
    await submitRating(id, score, comment || undefined)
    redirect(`/sessions/${id}`)
  }

  async function handleDispute(formData: FormData) {
    'use server'
    const reason = formData.get('reason') as string
    await fileDispute(id, reason)
    redirect(`/sessions/${id}`)
  }

  return (
    <div className="max-w-xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Session Details</h1>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[session.status] ?? 'bg-gray-100 text-gray-600'}`}>
          {session.status}
        </span>
      </div>

      {/* Session info */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4 space-y-2">
        <Row label="Date" value={new Date(session.scheduled_at).toLocaleString()} />
        <Row label="Duration" value={`${session.duration_minutes} minutes`} />
        <Row label="Your role" value={isMentee ? 'Mentee' : 'Mentor'} />
        {session.meet_meeting_code && (
          <Row label="Meet code" value={session.meet_meeting_code} />
        )}
        {session.calendar_event_id && (
          <Row label="Calendar event" value={session.calendar_event_id} />
        )}
        <Row label="Validated" value={session.validated ? `Yes — ${new Date(session.validated_at!).toLocaleString()}` : 'Not yet'} />
      </div>

      {/* Actions */}
      <div className="space-y-3">

        {/* Mentee: confirm session happened */}
        {isMentee && !session.validated && session.status !== 'cancelled' && (
          <form action={handleValidate}>
            <button
              type="submit"
              className="w-full bg-green-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-green-700 transition"
            >
              Confirm session happened
            </button>
            <p className="text-xs text-gray-400 mt-1 text-center">
              This marks the session as completed and enables rating.
            </p>
          </form>
        )}

        {/* Mentee: rate mentor (only after validated, only once) */}
        {isMentee && session.validated && !existingRating && (
          <form action={handleRate} className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <h2 className="font-semibold text-gray-900">Rate your mentor</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Score (1–5)</label>
              <select
                name="score"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select a score</option>
                <option value="5">5 — Excellent</option>
                <option value="4">4 — Good</option>
                <option value="3">3 — Average</option>
                <option value="2">2 — Below average</option>
                <option value="1">1 — Poor</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Comment (optional)</label>
              <textarea
                name="comment"
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-indigo-700 transition"
            >
              Submit rating
            </button>
          </form>
        )}

        {/* Show submitted rating */}
        {existingRating && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-2">Rating submitted</h2>
            <p className="text-sm text-gray-700">Score: {existingRating.score}/5</p>
            {existingRating.comment && (
              <p className="text-sm text-gray-600 mt-1">&ldquo;{existingRating.comment}&rdquo;</p>
            )}
          </div>
        )}

        {/* File dispute */}
        {(isMentor || isMentee) && session.status !== 'cancelled' && session.status !== 'disputed' && (
          <form action={handleDispute} className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <h2 className="font-semibold text-gray-900">File a dispute</h2>
            <textarea
              name="reason"
              required
              rows={2}
              placeholder="Describe the issue..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            />
            <button
              type="submit"
              className="w-full bg-red-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-red-700 transition"
            >
              Submit dispute
            </button>
          </form>
        )}

        {/* Cancel session */}
        {session.status !== 'cancelled' && session.status !== 'completed' && (
          <form action={handleCancel}>
            <button
              type="submit"
              className="w-full border border-gray-300 text-gray-600 rounded-lg px-4 py-2 text-sm hover:bg-gray-50 transition"
            >
              Cancel session
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-900 font-medium">{value}</span>
    </div>
  )
}
