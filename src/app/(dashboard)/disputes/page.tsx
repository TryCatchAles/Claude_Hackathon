import { getUserDisputes } from '@/actions/disputes'
import Link from 'next/link'

const STATUS_STYLE: Record<string, string> = {
  open:      'bg-amber-50 text-amber-700',
  resolved:  'bg-emerald-50 text-emerald-700',
  escalated: 'bg-purple-50 text-purple-700',
}

const OUTCOME_LABEL: Record<string, string> = {
  favor_mentor: 'Resolved in favor of mentor',
  favor_mentee: 'Resolved in favor of mentee',
}

const OUTCOME_STYLE: Record<string, string> = {
  favor_mentor: 'text-emerald-700',
  favor_mentee: 'text-red-600',
}

export default async function DisputesPage() {
  const { data: disputes, error } = await getUserDisputes()

  return (
    <div className="max-w-lg">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 mb-1">Disputes</h1>
        <p className="text-sm text-zinc-500">
          Filed from a{' '}
          <Link href="/sessions" className="underline underline-offset-2 hover:text-zinc-900 transition-colors">
            session page
          </Link>
          . Open disputes pause credit awards until resolved by an admin.
        </p>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-6">{error}</div>
      )}

      {!disputes || disputes.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-xl p-10 text-center">
          <p className="text-sm text-zinc-500 font-medium">No disputes</p>
          <p className="text-xs text-zinc-400 mt-1">Disputes are filed from individual session pages.</p>
        </div>
      ) : (
        <div className="bg-white border border-zinc-200 rounded-xl divide-y divide-zinc-100">
          {disputes.map(dispute => {
            // sessions join comes back as an object with id, mentor_id, mentee_id
            const sessionJoin = (dispute as unknown as { sessions?: { id?: string } }).sessions
            const sessionId = sessionJoin?.id ?? dispute.session_id

            return (
              <div key={dispute.id} className="px-5 py-4">
                {/* Header row: date + status badge */}
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-zinc-400">
                    {new Date(dispute.created_at).toLocaleDateString('en-US', {
                      month: 'long', day: 'numeric', year: 'numeric',
                    })}
                  </p>
                  <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${STATUS_STYLE[dispute.status] ?? 'bg-zinc-100 text-zinc-500'}`}>
                    {dispute.status}
                  </span>
                </div>

                {/* Reason */}
                <p className="text-sm text-zinc-700 leading-relaxed">{dispute.reason}</p>

                {/* Session link */}
                {sessionId && (
                  <p className="text-xs text-zinc-400 mt-1.5">
                    <Link
                      href={`/sessions/${sessionId}`}
                      className="underline underline-offset-2 hover:text-zinc-700 transition-colors"
                    >
                      View session →
                    </Link>
                  </p>
                )}

                {/* Resolution block — shown only when resolved */}
                {dispute.status === 'resolved' && (
                  <div className="mt-3 pt-3 border-t border-zinc-100 space-y-1.5">
                    {dispute.resolved_in_favor_of && (
                      <p className={`text-xs font-semibold ${OUTCOME_STYLE[dispute.resolved_in_favor_of] ?? 'text-zinc-700'}`}>
                        {OUTCOME_LABEL[dispute.resolved_in_favor_of] ?? dispute.resolved_in_favor_of}
                      </p>
                    )}
                    {dispute.resolved_at && (
                      <p className="text-xs text-zinc-400">
                        Resolved on {new Date(dispute.resolved_at).toLocaleDateString('en-US', {
                          month: 'long', day: 'numeric', year: 'numeric',
                        })}
                      </p>
                    )}
                    {dispute.resolution && (
                      <div className="pt-1">
                        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">Admin note</p>
                        <p className="text-sm text-zinc-600 italic">&ldquo;{dispute.resolution}&rdquo;</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
