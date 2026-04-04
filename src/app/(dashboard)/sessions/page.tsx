import { getUserSessions } from '@/actions/sessions'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

const STATUS_LABEL: Record<string, string> = {
  pending:   'Pending',
  active:    'Active',
  completed: 'Completed',
  disputed:  'Disputed',
  cancelled: 'Cancelled',
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

export default async function SessionsPage() {
  const { data: sessions, error } = await getUserSessions()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div>
      <div className="mb-10">
        <p
          className="text-xs font-light tracking-widest uppercase mb-3 opacity-60"
          style={{ color: 'rgba(210,180,255,0.9)', fontFamily: 'Sterion, sans-serif' }}
        >
          Your Activity
        </p>
        <h1
          className="font-light tracking-tight leading-none mb-3 bg-gradient-to-r from-pink-300 via-purple-300 to-pink-300 bg-clip-text text-transparent"
          style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)' }}
        >
          Sessions
        </h1>
        <p className="text-white/45 font-light text-sm leading-relaxed">
          All your booked and past mentoring sessions.
        </p>
      </div>

      {error && (
        <div
          className="text-sm text-red-300 rounded-xl px-4 py-3 mb-6 border border-red-400/25"
          style={{ background: 'rgba(248,113,113,0.10)' }}
        >
          {error}
        </div>
      )}

      {!sessions || sessions.length === 0 ? (
        <div
          className="rounded-2xl p-12 text-center"
          style={{
            background: 'rgba(13,20,17,0.82)',
            border: '1px solid rgba(255,255,255,0.10)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 4px 32px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
        >
          <p className="text-white/60 text-sm font-medium">No sessions yet</p>
          <p className="text-white/35 text-xs mt-1 mb-6">Find a mentor and book your first session.</p>
          <Link
            href="/search"
            className="inline-block bg-white text-zinc-900 rounded-xl px-5 py-2 text-sm font-semibold hover:bg-violet-50 hover:shadow-[0_0_24px_rgba(160,100,220,0.45)] active:scale-[0.97] transition-all"
          >
            Find a mentor
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map(session => {
            const isMentor = session.mentor_id === user?.id
            const date = new Date(session.scheduled_at)

            return (
              <Link
                key={session.id}
                href={`/sessions/${session.id}`}
                className="mentor-card rounded-2xl px-5 py-4 flex items-center justify-between gap-4 group block"
              >
                <div className="flex items-center gap-4 min-w-0">
                  {/* Date block */}
                  <div className="flex-shrink-0 w-10 text-center">
                    <p className="text-xs text-white/45 font-medium uppercase leading-none">
                      {date.toLocaleDateString('en-US', { month: 'short' })}
                    </p>
                    <p className="text-lg font-bold text-white leading-tight">
                      {date.getDate()}
                    </p>
                  </div>

                  <div className="w-px h-8 bg-white/10 flex-shrink-0" />

                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white">
                      {isMentor
                        ? ((session as any).mentee_profile?.display_name ?? 'Unknown mentee')
                        : ((session as any).mentor_profile?.display_name ?? 'Unknown mentor')
                      }
                    </p>
                    <p className="text-xs text-white/40 mt-0.5">
                      {date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      <span className="mx-1">·</span>
                      {session.duration_minutes} min
                      <span className="mx-1">·</span>
                      <span className="font-medium text-white/55">{isMentor ? 'you are mentor' : 'you are mentee'}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLE[session.status] ?? 'text-white/35 border border-white/15'}`}
                    style={{ background: STATUS_BG[session.status] ?? 'rgba(255,255,255,0.05)' }}
                  >
                    {STATUS_LABEL[session.status] ?? session.status}
                  </span>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-white/25 group-hover:text-white/55 transition-colors flex-shrink-0" aria-hidden="true">
                    <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
