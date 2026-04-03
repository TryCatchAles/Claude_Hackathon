import { getUserDisputes } from '@/actions/disputes'
import Link from 'next/link'

const STATUS_STYLE: Record<string, string> = {
  open:      'bg-amber-50 text-amber-700',
  resolved:  'bg-emerald-50 text-emerald-700',
  escalated: 'bg-red-50 text-red-700',
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
          . Open disputes pause credit awards until resolved.
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
          {disputes.map(dispute => (
            <div key={dispute.id} className="px-5 py-4">
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
              <p className="text-sm text-zinc-700 leading-relaxed">{dispute.reason}</p>
              {dispute.resolution && (
                <div className="mt-3 pt-3 border-t border-zinc-100">
                  <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">Resolution</p>
                  <p className="text-sm text-zinc-600">{dispute.resolution}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
