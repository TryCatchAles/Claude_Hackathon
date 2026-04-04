import { getNotifications, markAllRead } from '@/actions/notifications'
import { redirect } from 'next/navigation'

export default async function NotificationsPage() {
  const { data: notifications, error } = await getNotifications()

  // Mark all as read on page visit
  await markAllRead()

  return (
    <div className="max-w-xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 mb-1">Notifications</h1>
        <p className="text-sm text-zinc-500">Credit rewards and activity updates.</p>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-6">{error}</div>
      )}

      {!notifications || notifications.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-xl p-12 text-center">
          <p className="text-zinc-500 text-sm font-medium">No notifications yet</p>
          <p className="text-zinc-400 text-xs mt-1">You&apos;ll be notified here when you earn credits.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <div
              key={n.id}
              className={`bg-white border rounded-xl px-5 py-4 flex items-start gap-3 ${n.read ? 'border-zinc-200' : 'border-amber-200 bg-amber-50'}`}
            >
              <div className="flex-shrink-0 mt-0.5 text-base">
                {n.message.includes('credit') ? '⭐' : '🔔'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-800">{n.message}</p>
                <p className="text-xs text-zinc-400 mt-1">
                  {new Date(n.created_at).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
