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
  pending:   'bg-amber-50 text-amber-700',
  active:    'bg-blue-50 text-blue-700',
  completed: 'bg-emerald-50 text-emerald-700',
  disputed:  'bg-red-50 text-red-700',
  cancelled: 'bg-zinc-100 text-zinc-400',
}

export default async function SessionsPage() {
  const { data: sessions, error } = await getUserSessions()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 mb-1">Sessions</h1>
        <p className="text-sm text-zinc-500">All your booked and past mentoring sessions.</p>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-6">{error}</div>
      )}

      {!sessions || sessions.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-xl p-12 text-center">
          <p className="text-zinc-500 text-sm font-medium">No sessions yet</p>
          <p className="text-zinc-400 text-xs mt-1 mb-5">Find a mentor and book your first session.</p>
          <Link
            href="/search"
            className="inline-block bg-zinc-900 text-white rounded-lg px-5 py-2 text-sm font-semibold hover:bg-zinc-700 transition-colors"
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
                className="bg-white border border-zinc-200 rounded-xl px-5 py-4 flex items-center justify-between gap-4 hover:border-zinc-300 transition-colors group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  {/* Date block */}
                  <div className="flex-shrink-0 w-10 text-center">
                    <p className="text-xs text-zinc-400 font-medium uppercase leading-none">
                      {date.toLocaleDateString('en-US', { month: 'short' })}
                    </p>
                    <p className="text-lg font-bold text-zinc-900 leading-tight">
                      {date.getDate()}
                    </p>
                  </div>

                  <div className="w-px h-8 bg-zinc-100 flex-shrink-0" />

                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-900">
                      {date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      <span className="text-zinc-400 font-normal ml-2">·</span>
                      <span className="text-zinc-500 font-normal ml-2">{session.duration_minutes} min</span>
                    </p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      You are the <span className="font-medium text-zinc-600">{isMentor ? 'mentor' : 'mentee'}</span>
                      {session.meet_meeting_code && (
                        <span className="ml-2">· Meet: {session.meet_meeting_code}</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLE[session.status] ?? 'bg-zinc-100 text-zinc-500'}`}>
                    {STATUS_LABEL[session.status] ?? session.status}
                  </span>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-zinc-300 group-hover:text-zinc-500 transition-colors" aria-hidden="true">
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
