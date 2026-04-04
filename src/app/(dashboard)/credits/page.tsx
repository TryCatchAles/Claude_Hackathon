import { getUserCredits, getCreditBalance } from '@/actions/credits'
import Link from 'next/link'

export default async function CreditsPage() {
  const { data: balance } = await getCreditBalance()
  const { data: credits, error } = await getUserCredits()

  return (
    <div className="max-w-lg">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 mb-1">Credits</h1>
        <p className="text-sm text-zinc-500">Reputation earned from high-rated sessions. Credits are never spent.</p>
      </div>

      {/* Balance */}
      <div className="bg-zinc-900 text-white rounded-xl p-7 mb-8 flex items-end justify-between">
        <div>
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">Balance</p>
          <p className="text-6xl font-bold tracking-tight leading-none">{balance ?? 0}</p>
          <p className="text-sm text-zinc-400 mt-3 leading-relaxed max-w-xs">
            Earned when mentees rate you 4 or 5 stars after a validated session.
          </p>
        </div>
        <div className="text-zinc-600 text-xs font-medium text-right leading-relaxed">
          <p>Never deducted</p>
          <p>Never bought</p>
        </div>
      </div>

      {/* History */}
      <h2 className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-3">History</h2>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">{error}</div>
      )}

      {!credits || credits.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-xl p-8 text-center">
          <p className="text-sm text-zinc-500">No credits earned yet.</p>
          <p className="text-xs text-zinc-400 mt-1">Conduct sessions and receive ratings to start earning.</p>
        </div>
      ) : (
        <div className="bg-white border border-zinc-200 rounded-xl divide-y divide-zinc-100">
          {credits.map(credit => {
            const sessionDate = credit.sessions?.scheduled_at
              ? new Date(credit.sessions.scheduled_at).toLocaleDateString('en-US', {
                  month: 'long', day: 'numeric', year: 'numeric',
                })
              : null
            const ratingScore = credit.ratings?.score ?? null

            return (
              <div key={credit.id} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="text-sm font-medium text-zinc-900">
                    Credit earned
                    {ratingScore !== null && (
                      <span className="ml-2 text-xs font-normal text-zinc-400">
                        · {ratingScore}-star rating
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {sessionDate ?? new Date(credit.created_at).toLocaleDateString('en-US', {
                      month: 'long', day: 'numeric', year: 'numeric',
                    })}
                    {credit.session_id && (
                      <>
                        {' · '}
                        <Link
                          href={`/sessions/${credit.session_id}`}
                          className="underline underline-offset-2 hover:text-zinc-700 transition-colors"
                        >
                          View session
                        </Link>
                      </>
                    )}
                  </p>
                </div>
                <span className="text-sm font-bold text-emerald-600">+{credit.amount}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
