import { getUserDisputes } from '@/actions/disputes'

const STATUS_STYLES: Record<string, string> = {
  open:       'bg-yellow-50 text-yellow-700',
  resolved:   'bg-green-50 text-green-700',
  escalated:  'bg-red-50 text-red-700',
}

export default async function DisputesPage() {
  const { data: disputes, error } = await getUserDisputes()

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Disputes</h1>
      <p className="text-sm text-gray-500 mb-6">
        Disputes are filed from a session page. Open disputes pause credit awards for that session.
      </p>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {!disputes || disputes.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <p className="text-gray-500 text-sm">No disputes filed.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {disputes.map(dispute => (
            <div key={dispute.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-400">{new Date(dispute.created_at).toLocaleDateString()}</p>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[dispute.status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {dispute.status}
                </span>
              </div>
              <p className="text-sm text-gray-700">{dispute.reason}</p>
              {dispute.resolution && (
                <p className="text-sm text-gray-500 mt-2 border-t border-gray-100 pt-2">
                  <span className="font-medium">Resolution:</span> {dispute.resolution}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
