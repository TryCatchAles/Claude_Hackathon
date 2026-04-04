import { getSession, validateSession, cancelSession } from '@/actions/sessions'
import { getSessionRating, submitRating } from '@/actions/ratings'
import { fileDispute, getUserDisputes } from '@/actions/disputes'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import type { Dispute } from '@/types'

interface Props {
  params: Promise<{ id: string }>
}

const STATUS_STYLE: Record<string, string> = {
  pending:   'bg-amber-50 text-amber-700',
  active:    'bg-blue-50 text-blue-700',
  completed: 'bg-emerald-50 text-emerald-700',
  disputed:  'bg-red-50 text-red-700',
  cancelled: 'bg-zinc-100 text-zinc-400',
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

  // Fetch the dispute for this specific session (if any).
  const { data: allDisputes } = await getUserDisputes()
  const sessionDispute: Dispute | null =
    allDisputes?.find((d) => d.session_id === id) ?? null

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
    <div className="max-w-lg">
      {/* Back */}
      <Link
        href="/sessions"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-900 mb-8 transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back to sessions
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Session</h1>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLE[session.status] ?? 'bg-zinc-100 text-zinc-500'}`}>
          {session.status}
        </span>
      </div>

      {/* Info card */}
      <div className="bg-white border border-zinc-200 rounded-xl divide-y divide-zinc-100 mb-5">
        {[
          ['Date', new Date(session.scheduled_at).toLocaleString()],
          ['Duration', `${session.duration_minutes} minutes`],
          ['Your role', isMentee ? 'Mentee' : 'Mentor'],
          ...(session.meet_meeting_code
            ? [['Meet code', session.meet_meeting_code]]
            : []),
          ['Validated', session.validated
            ? `Yes · ${new Date(session.validated_at!).toLocaleString()}`
            : 'Not yet confirmed'],
        ].map(([label, value]) => (
          <div key={label} className="flex items-center justify-between px-5 py-3.5">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">{label}</span>
            <span className="text-sm text-zinc-900 font-medium">{value}</span>
          </div>
        ))}
      </div>

      {/* Dispute status banner — shown only when a dispute exists */}
      {sessionDispute && (
        <div className={`rounded-xl border px-5 py-4 mb-5 ${
          sessionDispute.status === 'resolved'
            ? 'bg-emerald-50 border-emerald-200'
            : sessionDispute.status === 'escalated'
            ? 'bg-purple-50 border-purple-200'
            : 'bg-amber-50 border-amber-200'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <p className={`text-xs font-semibold uppercase tracking-wide ${
              sessionDispute.status === 'resolved'
                ? 'text-emerald-700'
                : sessionDispute.status === 'escalated'
                ? 'text-purple-700'
                : 'text-amber-700'
            }`}>
              Dispute — {sessionDispute.status}
            </p>
            {sessionDispute.resolved_at && (
              <span className="text-xs text-zinc-400">
                Resolved {new Date(sessionDispute.resolved_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            )}
          </div>
          <p className="text-sm text-zinc-700 leading-relaxed">{sessionDispute.reason}</p>
          {sessionDispute.status === 'resolved' && (
            <div className="mt-3 pt-3 border-t border-zinc-200">
              {sessionDispute.resolved_in_favor_of && (
                <p className="text-xs font-medium text-zinc-500 mb-1">
                  Outcome:{' '}
                  <span className={`font-semibold ${sessionDispute.resolved_in_favor_of === 'favor_mentor' ? 'text-emerald-700' : 'text-red-600'}`}>
                    {sessionDispute.resolved_in_favor_of === 'favor_mentor' ? 'Resolved in favor of mentor' : 'Resolved in favor of mentee'}
                  </span>
                </p>
              )}
              {sessionDispute.resolution && (
                <p className="text-sm text-zinc-600 italic">&ldquo;{sessionDispute.resolution}&rdquo;</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Meet link */}
      {session.meet_meeting_code && (
        <a
          href={`https://meet.google.com/${session.meet_meeting_code}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 border border-zinc-200 bg-white rounded-xl px-5 py-3 text-sm font-semibold text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50 transition-colors mb-5"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <rect x="1" y="4" width="9" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10 6.5l4-2v7l-4-2V6.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
          Join Google Meet
        </a>
      )}

      {/* Actions */}
      <div className="space-y-4">
        {/* Confirm session */}
        {isMentee && !session.validated && session.status !== 'cancelled' && (
          <div className="bg-white border border-zinc-200 rounded-xl p-5">
            <p className="text-sm font-medium text-zinc-900 mb-1">Did the session happen?</p>
            <p className="text-xs text-zinc-400 mb-4">Confirming enables you to rate your mentor and unlocks credit rewards.</p>
            <form action={handleValidate}>
              <button
                type="submit"
                className="w-full bg-zinc-900 text-white rounded-lg px-5 py-2.5 text-sm font-semibold hover:bg-zinc-700 active:scale-[0.98] transition-all"
              >
                Yes, confirm session
              </button>
            </form>
          </div>
        )}

        {/* Rate mentor */}
        {isMentee && session.validated && !existingRating && (
          <div className="bg-white border border-zinc-200 rounded-xl p-5">
            <p className="text-sm font-semibold text-zinc-900 mb-4">Rate your mentor</p>
            <form action={handleRate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1.5">Score</label>
                <select
                  name="score"
                  required
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 transition"
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
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1.5">Comment <span className="normal-case text-zinc-400">(optional)</span></label>
                <textarea
                  name="comment"
                  rows={2}
                  placeholder="What did you learn? How was the experience?"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 transition resize-none"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-zinc-900 text-white rounded-lg px-5 py-2.5 text-sm font-semibold hover:bg-zinc-700 active:scale-[0.98] transition-all"
              >
                Submit rating
              </button>
            </form>
          </div>
        )}

        {/* Existing rating */}
        {existingRating && (
          <div className="bg-white border border-zinc-200 rounded-xl p-5">
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-2">Rating submitted</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-zinc-900">{existingRating.score}</span>
              <span className="text-sm text-zinc-400">/ 5</span>
            </div>
            {existingRating.comment && (
              <p className="text-sm text-zinc-500 mt-2 italic">&ldquo;{existingRating.comment}&rdquo;</p>
            )}
          </div>
        )}

        {/* Dispute */}
        {(isMentor || isMentee) && session.status !== 'cancelled' && session.status !== 'disputed' && (
          <div className="bg-white border border-zinc-200 rounded-xl p-5">
            <p className="text-sm font-semibold text-zinc-900 mb-1">File a dispute</p>
            <p className="text-xs text-zinc-400 mb-4">Use this if the session didn&apos;t happen as expected. Credits will be paused pending review.</p>
            <form action={handleDispute} className="space-y-3">
              <textarea
                name="reason"
                required
                rows={2}
                placeholder="Describe the issue…"
                className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 transition resize-none"
              />
              <button
                type="submit"
                className="w-full border border-zinc-300 text-zinc-600 rounded-lg px-5 py-2.5 text-sm font-semibold hover:bg-zinc-50 transition-colors"
              >
                Submit dispute
              </button>
            </form>
          </div>
        )}

        {/* Cancel */}
        {session.status !== 'cancelled' && session.status !== 'completed' && (
          <form action={handleCancel}>
            <button
              type="submit"
              className="w-full text-xs text-zinc-400 hover:text-red-600 transition-colors py-2"
            >
              Cancel this session
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
