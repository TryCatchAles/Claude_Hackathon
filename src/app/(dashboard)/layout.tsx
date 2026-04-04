import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getUnreadCount } from '@/actions/notifications'
import { NotificationBell } from '@/components/NotificationBell'
import { LoginBackground } from '@/components/ui/LoginBackground'

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
      {/* Floral ambient background — same component as login page */}
      <LoginBackground />

      {/* Radial vignette — matches login page's edge darkening */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: 1,
          background:
            'radial-gradient(ellipse 85% 70% at 50% 40%, transparent 25%, rgba(6,18,40,0.42) 62%, rgba(6,18,40,0.80) 100%)',
        }}
      />

      <header
        className="sticky top-0 z-20 backdrop-blur-md border-b border-white/10"
        style={{ background: 'rgba(6,18,40,0.70)' }}
      >
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between h-14">

          {/* Left: logo + nav */}
          <div className="flex items-center gap-7">
            <Link
              href="/search"
              className="bg-gradient-to-r from-pink-400 via-purple-400 to-pink-400 bg-clip-text text-transparent text-sm font-semibold tracking-tight"
              style={{ fontFamily: 'Sterion, sans-serif' }}
            >
              Bloomkin
            </Link>
            <nav className="hidden sm:flex items-center gap-1">
              {[
                ['/search',   'Search'],
                ['/sessions', 'Sessions'],
                ['/credits',  'Credits'],
                ['/disputes', 'Disputes'],
              ].map(([href, label]) => (
                <Link
                  key={href}
                  href={href}
                  className="text-sm text-white/55 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
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
              <span className="hidden sm:block text-xs text-white/45">
                <span className="font-semibold text-white/75">{profile.credits}</span> credits
              </span>
            )}

            <Link href="/profile" className="flex items-center gap-2 group">
              <div className="w-7 h-7 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white text-xs font-semibold">
                {initial}
              </div>
              <span className="hidden sm:block text-sm text-white/60 group-hover:text-white transition-colors">
                {profile?.display_name ?? 'Profile'}
              </span>
            </Link>

            <form action={handleSignOut}>
              <button
                type="submit"
                suppressHydrationWarning
                className="text-xs text-white/45 hover:text-white transition-colors py-1.5"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="relative max-w-5xl mx-auto px-6 py-10" style={{ zIndex: 10 }}>
        {children}
      </main>
    </div>
  )
}
