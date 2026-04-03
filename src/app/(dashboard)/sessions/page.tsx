import { getUserSessions } from '@/actions/sessions'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

const STATUS_STYLES: Record<string, string> = {
  pending:   'bg-yellow-50 text-yellow-700',
  active:    'bg-blue-50 text-blue-700',
  completed: 'bg-green-50 text-green-700',
  disputed:  'bg-red-50 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
}

export default async function SessionsPage() {
  const { data: sessions, error } = await getUserSessions()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Your Sessions</h1>

      {error && (
        <p className="text-red-600 text-sm mb-4">{error}</p>
      )}

      {!sessions || sessions.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-gray-500 text-sm">No sessions yet.</p>
          <Link href="/search" className="mt-3 inline-block text-indigo-600 text-sm hover:underline">
            Find a mentor to book one
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {sessions.map(session => {
            const isMentor = session.mentor_id === user?.id
            const role = isMentor ? 'Mentor' : 'Mentee'
            const date = new Date(session.scheduled_at).toLocaleString()

            return (
              <Link
                key={session.id}
                href={`/sessions/${session.id}`}
                className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between hover:border-indigo-300 transition"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">{date}</span>
                    <span className="text-xs text-gray-400">· {session.duration_minutes} min</span>
                    <span className="text-xs text-gray-400">· You are the {role}</span>
                  </div>
                  {session.meet_meeting_code && (
                    <p className="text-xs text-gray-400">Meet: {session.meet_meeting_code}</p>
                  )}
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_STYLES[session.status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {session.status}
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
