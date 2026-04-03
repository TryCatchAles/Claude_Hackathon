import { getUserCredits, getCreditBalance } from '@/actions/credits'

export default async function CreditsPage() {
  const { data: balance } = await getCreditBalance()
  const { data: credits, error } = await getUserCredits()

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Credits</h1>

      <div className="bg-indigo-600 text-white rounded-xl p-6 mb-6">
        <p className="text-sm opacity-80">Your reputation balance</p>
        <p className="text-5xl font-bold mt-1">{balance ?? 0}</p>
        <p className="text-sm opacity-70 mt-2">Credits are earned when mentees rate you 4 or 5 stars.</p>
      </div>

      <h2 className="font-semibold text-gray-900 mb-3">Credit history</h2>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {!credits || credits.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <p className="text-gray-500 text-sm">No credits earned yet. Conduct sessions and get rated to earn credits.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {credits.map(credit => (
            <div key={credit.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">+{credit.amount} credit</p>
                <p className="text-xs text-gray-400">{new Date(credit.created_at).toLocaleDateString()}</p>
              </div>
              <span className="text-green-600 font-bold">+{credit.amount}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
