import type React from 'react'
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
  pending:   'text-amber-300 border border-amber-400/30',
  active:    'text-blue-300 border border-blue-400/30',
  completed: 'text-emerald-300 border border-emerald-400/30',
  disputed:  'text-red-300 border border-red-400/30',
  cancelled: 'text-white/35 border border-white/15',
}

const STATUS_BG: Record<string, string> = {
  pending:   'rgba(251,191,36,0.10)',
  active:    'rgba(96,165,250,0.10)',
  completed: 'rgba(52,211,153,0.10)',
  disputed:  'rgba(248,113,113,0.10)',
  cancelled: 'rgba(255,255,255,0.05)',
}

// Shared dark glass surface style — matches mentor-card recipe
const glassSurface: React.CSSProperties = {
  background:      'rgba(13,20,17,0.88)',
  border:          '1px solid rgba(255,255,255,0.13)',
  backdropFilter:  'blur(20px)',
  boxShadow:       '0 4px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.07)',
}

// Dark glass input/textarea/select style
const glassInput: React.CSSProperties = {
  background:     'rgba(255,255,255,0.07)',
  border:         '1px solid rgba(255,255,255,0.14)',
  backdropFilter: 'blur(8px)',
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
        className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white mb-8 transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back to sessions
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-pink-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
          Session
        </h1>
        <span
          className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLE[session.status] ?? 'text-white/35 border border-white/15'}`}
          style={{ background: STATUS_BG[session.status] ?? 'rgba(255,255,255,0.05)' }}
        >
          {session.status}
        </span>
      </div>

      {/* Info card */}
      <div className="rounded-2xl divide-y mb-5" style={{ ...glassSurface, borderColor: 'rgba(255,255,255,0.13)' }}>
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
          <div key={label} className="flex items-center justify-between px-5 py-3.5" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            <span className="text-xs font-medium text-white/40 uppercase tracking-wide">{label}</span>
            <span className="text-sm text-white font-medium">{value}</span>
          </div>
        ))}
      </div>

      {/* Dispute status banner — shown only when a dispute exists */}
      {sessionDispute && (
        <div
          className="rounded-2xl px-5 py-4 mb-5"
          style={{
            background: sessionDispute.status === 'resolved'
              ? 'rgba(52,211,153,0.10)'
              : sessionDispute.status === 'escalated'
              ? 'rgba(167,139,250,0.10)'
              : 'rgba(251,191,36,0.10)',
            border: `1px solid ${
              sessionDispute.status === 'resolved'
                ? 'rgba(52,211,153,0.25)'
                : sessionDispute.status === 'escalated'
                ? 'rgba(167,139,250,0.25)'
                : 'rgba(251,191,36,0.25)'
            }`,
            backdropFilter: 'blur(20px)',
          }}
        >
          <div className="flex items-center justify-between mb-1">
            <p className={`text-xs font-semibold uppercase tracking-wide ${
              sessionDispute.status === 'resolved'
                ? 'text-emerald-300'
                : sessionDispute.status === 'escalated'
                ? 'text-purple-300'
                : 'text-amber-300'
            }`}>
              Dispute — {sessionDispute.status}
            </p>
            {sessionDispute.resolved_at && (
              <span className="text-xs text-white/35">
                Resolved {new Date(sessionDispute.resolved_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            )}
          </div>
          <p className="text-sm text-white/70 leading-relaxed">{sessionDispute.reason}</p>
          {sessionDispute.status === 'resolved' && (
            <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.10)' }}>
              {sessionDispute.resolved_in_favor_of && (
                <p className="text-xs font-medium text-white/45 mb-1">
                  Outcome:{' '}
                  <span className={`font-semibold ${sessionDispute.resolved_in_favor_of === 'favor_mentor' ? 'text-emerald-300' : 'text-red-300'}`}>
                    {sessionDispute.resolved_in_favor_of === 'favor_mentor' ? 'Resolved in favor of mentor' : 'Resolved in favor of mentee'}
                  </span>
                </p>
              )}
              {sessionDispute.resolution && (
                <p className="text-sm text-white/55 italic">&ldquo;{sessionDispute.resolution}&rdquo;</p>
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
          className="w-full flex items-center justify-center gap-2 bg-white text-zinc-900 rounded-2xl px-5 py-3 text-sm font-semibold hover:bg-violet-50 hover:shadow-[0_0_24px_rgba(160,100,220,0.45)] active:scale-[0.98] transition-all mb-5"
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
          <div className="rounded-2xl p-5" style={glassSurface}>
            <p className="text-sm font-medium text-white mb-1">Did the session happen?</p>
            <p className="text-xs text-white/40 mb-4">Confirming enables you to rate your mentor and unlocks credit rewards.</p>
            <form action={handleValidate}>
              <button
                type="submit"
                className="w-full bg-white text-zinc-900 rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-violet-50 hover:shadow-[0_0_24px_rgba(160,100,220,0.45)] active:scale-[0.98] transition-all"
              >
                Yes, confirm session
              </button>
            </form>
          </div>
        )}

        {/* Rate mentor */}
        {isMentee && session.validated && !existingRating && (
          <div className="rounded-2xl p-5" style={glassSurface}>
            <p className="text-sm font-semibold text-white mb-4">Rate your mentor</p>
            <form action={handleRate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-white/40 uppercase tracking-wide mb-1.5">Score</label>
                <select
                  name="score"
                  required
                  className="w-full rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-400/30 transition"
                  style={glassInput}
                >
                  <option value="" style={{ background: '#0d1411' }}>Select a score</option>
                  <option value="5" style={{ background: '#0d1411' }}>5 — Excellent</option>
                  <option value="4" style={{ background: '#0d1411' }}>4 — Good</option>
                  <option value="3" style={{ background: '#0d1411' }}>3 — Average</option>
                  <option value="2" style={{ background: '#0d1411' }}>2 — Below average</option>
                  <option value="1" style={{ background: '#0d1411' }}>1 — Poor</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-white/40 uppercase tracking-wide mb-1.5">
                  Comment <span className="normal-case text-white/25">(optional)</span>
                </label>
                <textarea
                  name="comment"
                  rows={2}
                  placeholder="What did you learn? How was the experience?"
                  className="w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-purple-400/30 transition resize-none"
                  style={glassInput}
                />
              </div>
              <button
                type="submit"
                className="w-full bg-white text-zinc-900 rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-violet-50 hover:shadow-[0_0_24px_rgba(160,100,220,0.45)] active:scale-[0.98] transition-all"
              >
                Submit rating
              </button>
            </form>
          </div>
        )}

        {/* Existing rating */}
        {existingRating && (
          <div className="rounded-2xl p-5" style={glassSurface}>
            <p className="text-xs font-medium text-white/35 uppercase tracking-wide mb-2">Rating submitted</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-white">{existingRating.score}</span>
              <span className="text-sm text-white/35">/ 5</span>
            </div>
            {existingRating.comment && (
              <p className="text-sm text-white/50 mt-2 italic">&ldquo;{existingRating.comment}&rdquo;</p>
            )}
          </div>
        )}

        {/* Dispute */}
        {(isMentor || isMentee) && session.status !== 'cancelled' && session.status !== 'disputed' && (
          <div className="rounded-2xl p-5" style={glassSurface}>
            <p className="text-sm font-semibold text-white mb-1">File a dispute</p>
            <p className="text-xs text-white/40 mb-4">Use this if the session didn&apos;t happen as expected. Credits will be paused pending review.</p>
            <form action={handleDispute} className="space-y-3">
              <textarea
                name="reason"
                required
                rows={2}
                placeholder="Describe the issue…"
                className="w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-purple-400/30 transition resize-none"
                style={glassInput}
              />
              <button
                type="submit"
                className="w-full rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors"
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.18)',
                  color: 'rgba(255,255,255,0.60)',
                }}
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
              className="w-full text-xs text-white/30 hover:text-red-400 transition-colors py-2"
            >
              Cancel this session
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
