import { getUserDisputes } from '@/actions/disputes'
import Link from 'next/link'

const STATUS_STYLE: Record<string, string> = {
  open:      'bg-amber-400/20 text-amber-300 border border-amber-400/30',
  resolved:  'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30',
  escalated: 'bg-purple-400/20 text-purple-300 border border-purple-400/30',
}

const OUTCOME_LABEL: Record<string, string> = {
  favor_mentor: 'Resolved in favor of mentor',
  favor_mentee: 'Resolved in favor of mentee',
}

const OUTCOME_STYLE: Record<string, string> = {
  favor_mentor: 'text-emerald-400',
  favor_mentee: 'text-red-400',
}

export default async function DisputesPage() {
  const { data: disputes, error } = await getUserDisputes()

  return (
    <div className="max-w-lg">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Disputes</h1>
        <p className="text-sm text-white/50">
          Filed from a{' '}
          <Link href="/sessions" className="underline underline-offset-2 hover:text-white transition-colors">
            session page
          </Link>
          . Open disputes pause credit awards until resolved by an admin.
        </p>
      </div>

      {error && (
        <div className="text-sm text-red-300 bg-red-500/15 border border-red-400/30 rounded-xl px-4 py-3 mb-6">{error}</div>
      )}

      {!disputes || disputes.length === 0 ? (
        <div className="rounded-xl p-10 text-center" style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.12)' }}>
          <p className="text-sm text-white/60 font-medium">No disputes</p>
          <p className="text-xs text-white/35 mt-1">Disputes are filed from individual session pages.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {disputes.map(dispute => {
            const sessionJoin = (dispute as unknown as { sessions?: { id?: string } }).sessions
            const sessionId = sessionJoin?.id ?? dispute.session_id

            return (
              <div
                key={dispute.id}
                className="rounded-xl px-5 py-4"
                style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.12)' }}
              >
                {/* Header row: date + status badge */}
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-white/40">
                    {new Date(dispute.created_at).toLocaleDateString('en-US', {
                      month: 'long', day: 'numeric', year: 'numeric',
                    })}
                  </p>
                  <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${STATUS_STYLE[dispute.status] ?? 'bg-white/10 text-white/50'}`}>
                    {dispute.status}
                  </span>
                </div>

                {/* Reason */}
                <p className="text-sm text-white/80 leading-relaxed">{dispute.reason}</p>

                {/* Session link */}
                {sessionId && (
                  <p className="text-xs text-white/35 mt-1.5">
                    <Link
                      href={`/sessions/${sessionId}`}
                      className="underline underline-offset-2 hover:text-white/70 transition-colors"
                    >
                      View session →
                    </Link>
                  </p>
                )}

                {/* Resolution block */}
                {dispute.status === 'resolved' && (
                  <div className="mt-3 pt-3 border-t border-white/10 space-y-1.5">
                    {dispute.resolved_in_favor_of && (
                      <p className={`text-xs font-semibold ${OUTCOME_STYLE[dispute.resolved_in_favor_of] ?? 'text-white/70'}`}>
                        {OUTCOME_LABEL[dispute.resolved_in_favor_of] ?? dispute.resolved_in_favor_of}
                      </p>
                    )}
                    {dispute.resolved_at && (
                      <p className="text-xs text-white/35">
                        Resolved on {new Date(dispute.resolved_at).toLocaleDateString('en-US', {
                          month: 'long', day: 'numeric', year: 'numeric',
                        })}
                      </p>
                    )}
                    {dispute.resolution && (
                      <div className="pt-1">
                        <p className="text-xs font-medium text-white/30 uppercase tracking-wide mb-1">Admin note</p>
                        <p className="text-sm text-white/60 italic">&ldquo;{dispute.resolution}&rdquo;</p>
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
