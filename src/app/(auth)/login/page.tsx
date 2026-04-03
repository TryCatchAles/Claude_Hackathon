import { signInWithGoogle } from '@/actions/auth'

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-md">

        {/* Wordmark */}
        <div className="mb-12 text-center">
          <span className="text-2xl font-semibold tracking-tight text-zinc-900">MentorMatch</span>
        </div>

        {/* Hero copy */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 leading-tight mb-3">
            Learn from people<br />who&apos;ve done it.
          </h1>
          <p className="text-zinc-500 text-base leading-relaxed">
            Skill-based mentor discovery. Book sessions, earn reputation,
            build trust — no vanity metrics.
          </p>
        </div>

        {/* CTA */}
        <form action={signInWithGoogle}>
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-3 bg-zinc-900 text-white rounded-lg px-6 py-3.5 text-sm font-semibold hover:bg-zinc-700 active:scale-[0.98] transition-all duration-150"
          >
            <GoogleIcon />
            Continue with Google
          </button>
        </form>

        {/* Divider */}
        <div className="my-8 flex items-center gap-4">
          <div className="flex-1 h-px bg-zinc-100" />
          <span className="text-xs text-zinc-400 font-medium">How it works</span>
          <div className="flex-1 h-px bg-zinc-100" />
        </div>

        {/* Feature list */}
        <ul className="space-y-3.5">
          {[
            ['Find by skill', 'Search by what you want to learn, not by name.'],
            ['Book a session', 'Schedule a 1-on-1 Google Meet call instantly.'],
            ['Rate & earn', 'Mentors earn credits from high ratings. No gaming.'],
          ].map(([title, desc]) => (
            <li key={title} className="flex items-start gap-3">
              <div className="mt-0.5 w-5 h-5 rounded-full bg-zinc-900 flex items-center justify-center flex-shrink-0">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                  <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <span className="text-sm font-medium text-zinc-900">{title} </span>
                <span className="text-sm text-zinc-500">{desc}</span>
              </div>
            </li>
          ))}
        </ul>

        {/* Footer note */}
        <p className="text-xs text-zinc-400 text-center mt-10">
          Google sign-in only · No passwords · Ratings are permanent
        </p>
      </div>
    </main>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#fff" fillOpacity=".9" d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
      <path fill="#fff" fillOpacity=".75" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
      <path fill="#fff" fillOpacity=".6" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" />
      <path fill="#fff" fillOpacity=".85" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
    </svg>
  )
}
