import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

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

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <Link href="/search" className="font-bold text-gray-900">MentorMatch</Link>
            <Link href="/search" className="text-sm text-gray-600 hover:text-gray-900">Search</Link>
            <Link href="/sessions" className="text-sm text-gray-600 hover:text-gray-900">Sessions</Link>
            <Link href="/credits" className="text-sm text-gray-600 hover:text-gray-900">Credits</Link>
            <Link href="/disputes" className="text-sm text-gray-600 hover:text-gray-900">Disputes</Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/profile" className="text-sm text-gray-600 hover:text-gray-900">Profile</Link>
            <form action={handleSignOut}>
              <button type="submit" className="text-sm text-gray-500 hover:text-gray-900">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </nav>
      <main className="max-w-5xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
