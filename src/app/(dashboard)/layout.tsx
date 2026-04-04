import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getUnreadCount } from '@/actions/notifications'
import { NotificationBell } from '@/components/NotificationBell'

async function handleSignOut() {
  'use server'
  const { createClient: makeClient } = await import('@/lib/supabase/server')
  const supabase = await makeClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, unreadCount] = await Promise.all([
    supabase.from('profiles').select('display_name, credits').eq('id', user.id).single(),
    getUnreadCount(),
  ])

  const initial = profile?.display_name?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? '?'

  return (
    <div className="min-h-screen">
      <header className="bg-white/70 backdrop-blur-md border-b border-white/30 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between h-14">

          {/* Left: logo + nav */}
          <div className="flex items-center gap-7">
            <Link href="/search" className="text-sm font-semibold text-zinc-900 tracking-tight">
              Bloomkin
            </Link>
            <nav className="hidden sm:flex items-center gap-1">
              {[
                ['/search',        'Search'],
                ['/sessions',      'Sessions'],
                ['/credits',       'Credits'],
                ['/disputes',      'Disputes'],
              ].map(([href, label]) => (
                <Link
                  key={href}
                  href={href}
                  className="text-sm text-zinc-500 hover:text-zinc-900 px-3 py-1.5 rounded-md hover:bg-zinc-100 transition-colors"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right: bell + credits + avatar + signout */}
          <div className="flex items-center gap-4">
            <NotificationBell initialCount={unreadCount} />

            {profile && (
              <span className="hidden sm:block text-xs text-zinc-400">
                <span className="font-semibold text-zinc-900">{profile.credits}</span> credits
              </span>
            )}

            <Link href="/profile" className="flex items-center gap-2 group">
              <div className="w-7 h-7 rounded-full bg-zinc-900 flex items-center justify-center text-white text-xs font-semibold">
                {initial}
              </div>
              <span className="hidden sm:block text-sm text-zinc-600 group-hover:text-zinc-900 transition-colors">
                {profile?.display_name ?? 'Profile'}
              </span>
            </Link>

            <form action={handleSignOut}>
              <button
                type="submit"
                className="text-xs text-zinc-400 hover:text-zinc-900 transition-colors py-1.5"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {children}
      </main>
    </div>
  )
}
