import { signInWithGoogle } from '@/actions/auth'
import { LoginBackground } from '@/components/ui/LoginBackground'
import { BloomkinLogo } from '@/components/BloomkinLogo'

export default function LoginPage() {
  return (
    <>
      <LoginBackground />

      {/* Gradient overlay */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: 1,
          background:
            'linear-gradient(105deg, rgba(13,10,30,0.97) 0%, rgba(13,10,30,0.90) 35%, rgba(13,10,30,0.45) 60%, transparent 80%)',
        }}
      />

      <main
        className="relative min-h-screen flex items-center px-8 md:px-16"
        style={{ zIndex: 10 }}
      >
        <div className="w-full max-w-[420px]">
          {/* Logo */}
          <BloomkinLogo size={80} showText={true} className="items-start mb-10" />

          {/* Headline */}
          <h1 className="text-5xl md:text-6xl font-bold text-white leading-[1.08] tracking-tight mb-5">
            Grow with people who&apos;ve been there.
          </h1>

          {/* Subtitle */}
          <p className="text-white/55 text-base leading-relaxed mb-10 max-w-[320px]">
            Skill-based mentor discovery. Book sessions, build real trust — no vanity metrics.
          </p>

          {/* Google sign-in form */}
          <form action={signInWithGoogle}>
            <button
              type="submit"
              className="group w-full flex items-center justify-center gap-3 bg-white text-zinc-900 rounded-2xl px-7 py-4 text-sm font-bold tracking-wide hover:bg-violet-50 hover:shadow-[0_0_32px_rgba(139,92,246,0.5)] active:scale-[0.97] transition-all duration-200 cursor-pointer"
            >
              <GoogleIcon />
              Continue with Google
            </button>
          </form>

          {/* Divider */}
          <div className="mt-10 mb-8 h-px w-12 bg-white/15" />

          {/* Feature list */}
          <ul className="space-y-4">
            {[
              ['Find by skill', 'Search by what you want to learn — not by name.'],
              ['Book a session', 'Schedule a 1-on-1 Google Meet instantly.'],
              ['Rate & earn', 'Mentors earn credits from high ratings. No gaming.'],
            ].map(([title, desc]) => (
              <li key={title} className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-2 flex-shrink-0" />
                <div>
                  <span className="text-sm font-semibold text-white">{title} </span>
                  <span className="text-sm text-white/45">{desc}</span>
                </div>
              </li>
            ))}
          </ul>

          {/* Footer */}
          <p className="text-xs text-white/25 mt-12">
            Google sign-in only · No passwords · Ratings are permanent
          </p>
        </div>
      </main>
    </>
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
