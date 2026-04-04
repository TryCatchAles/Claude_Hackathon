import { getUserCredits, getCreditBalance } from '@/actions/credits'
import Link from 'next/link'

export default async function CreditsPage() {
  const { data: balance } = await getCreditBalance()
  const { data: credits, error } = await getUserCredits()

  return (
    <div className="max-w-lg">
      <div className="mb-10">
        <p
          className="text-xs font-light tracking-widest uppercase mb-3 opacity-60"
          style={{ color: 'rgba(210,180,255,0.9)', fontFamily: 'Sterion, sans-serif' }}
        >
          Reputation
        </p>
        <h1
          className="font-light tracking-tight leading-none mb-3 bg-gradient-to-r from-pink-300 via-purple-300 to-pink-300 bg-clip-text text-transparent"
          style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)' }}
        >
          Credits
        </h1>
        <p className="text-white/45 font-light text-sm leading-relaxed">
          Reputation earned from high-rated sessions. Credits are never spent.
        </p>
      </div>

      {/* Balance */}
      <div
        className="rounded-2xl p-7 mb-8 flex items-end justify-between"
        style={{
          background: 'rgba(13,20,17,0.88)',
          border: '1px solid rgba(255,255,255,0.13)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 4px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.07)',
        }}
      >
        <div>
          <p className="text-xs font-medium text-white/40 uppercase tracking-wide mb-1">Balance</p>
          <p className="text-6xl font-bold tracking-tight leading-none text-white">{balance ?? 0}</p>
          <p className="text-sm text-white/40 mt-3 leading-relaxed max-w-xs">
            Earned when mentees rate you 4 or 5 stars after a validated session.
          </p>
        </div>
        <div className="text-white/25 text-xs font-medium text-right leading-relaxed">
          <p>Never deducted</p>
          <p>Never bought</p>
        </div>
      </div>

      {/* History */}
      <h2 className="text-xs font-medium text-white/35 uppercase tracking-widest mb-3">History</h2>

      {error && (
        <div
          className="text-sm text-red-300 rounded-xl px-4 py-3 mb-4 border border-red-400/25"
          style={{ background: 'rgba(248,113,113,0.10)' }}
        >
          {error}
        </div>
      )}

      {!credits || credits.length === 0 ? (
        <div
          className="rounded-2xl p-8 text-center"
          style={{
            background: 'rgba(13,20,17,0.82)',
            border: '1px solid rgba(255,255,255,0.10)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 4px 32px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
        >
          <p className="text-sm text-white/55">No credits earned yet.</p>
          <p className="text-xs text-white/30 mt-1">Conduct sessions and receive ratings to start earning.</p>
        </div>
      ) : (
        <div
          className="rounded-2xl divide-y"
          style={{
            background: 'rgba(13,20,17,0.88)',
            border: '1px solid rgba(255,255,255,0.13)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 4px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.07)',
            borderColor: 'rgba(255,255,255,0.13)',
          }}
        >
          {credits.map(credit => {
            const sessionDate = credit.sessions?.scheduled_at
              ? new Date(credit.sessions.scheduled_at).toLocaleDateString('en-US', {
                  month: 'long', day: 'numeric', year: 'numeric',
                })
              : null
            const ratingScore = credit.ratings?.score ?? null

            return (
              <div key={credit.id} className="flex items-center justify-between px-5 py-4" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                <div>
                  <p className="text-sm font-medium text-white">
                    Credit earned
                    {ratingScore !== null && (
                      <span className="ml-2 text-xs font-normal text-white/40">
                        · {ratingScore}-star rating
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-white/35 mt-0.5">
                    {sessionDate ?? new Date(credit.created_at).toLocaleDateString('en-US', {
                      month: 'long', day: 'numeric', year: 'numeric',
                    })}
                    {credit.session_id && (
                      <>
                        {' · '}
                        <Link
                          href={`/sessions/${credit.session_id}`}
                          className="underline underline-offset-2 hover:text-white transition-colors"
                        >
                          View session
                        </Link>
                      </>
                    )}
                  </p>
                </div>
                <span className="text-sm font-bold text-emerald-300">+{credit.amount}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
