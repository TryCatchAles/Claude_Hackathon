import { signInWithGoogle } from '@/actions/auth'
import { LoginBackground } from '@/components/ui/LoginBackground'
import { BloomkinLogo } from '@/components/BloomkinLogo'

export default function LoginPage() {
  return (
    <>
      <LoginBackground />

      {/* Subtle radial overlay so text reads over the 3D */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: 1,
          background:
            'radial-gradient(ellipse 70% 60% at 50% 50%, transparent 20%, rgba(8,12,28,0.52) 70%, rgba(8,12,28,0.92) 100%)',
        }}
      />

      {/* Top bar */}
      <div
        className="fixed top-0 left-0 right-0 flex items-center justify-between px-8 py-6 pointer-events-none"
        style={{ zIndex: 20 }}
      >
        <span className="text-xs font-semibold tracking-[0.22em] uppercase text-white/50">
          MentorMatch
        </span>
        <span className="text-xs text-white/30">
          Google sign-in only · No passwords
        </span>
      </div>

      {/* Main content — centered */}
      <main
        className="relative min-h-screen flex flex-col items-center justify-center text-center px-6"
        style={{ zIndex: 10 }}
      >
        {/* Big hero title */}
        <h1
          className="font-light text-white tracking-tight leading-none mb-6 select-none"
          style={{
            fontSize: 'clamp(4.5rem, 11vw, 9.5rem)',
            textShadow: '0 0 80px rgba(0,0,0,0.6)',
          }}
        >
          MentorMatch
        </h1>

        {/* Subtitle */}
        <p
          className="text-white/50 font-light mb-10 max-w-xs leading-relaxed"
          style={{ fontSize: 'clamp(0.95rem, 1.5vw, 1.1rem)' }}
        >
          Skill-based mentor discovery. Book sessions,
          build real trust — no vanity metrics.
        </p>

        {/* CTA */}
        <form action={signInWithGoogle}>
          <button
            type="submit"
            className="flex items-center gap-3 bg-white text-zinc-900 rounded-2xl px-8 py-4 text-sm font-semibold tracking-wide hover:bg-violet-50 hover:shadow-[0_0_36px_rgba(160,100,220,0.5)] active:scale-[0.97] transition-all duration-200 cursor-pointer"
          >
            <GoogleIcon />
            Continue with Google
          </button>
        </form>

        {/* Feature pills */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-12">
          {['Find by skill', 'Book a session', 'Rate & earn'].map((label) => (
            <span
              key={label}
              className="text-xs text-white/35 font-light px-4 py-1.5 rounded-full border border-white/10"
            >
              {label}
            </span>
          ))}
        </div>
      </main>
    </>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285f4" d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
      <path fill="#34a853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
      <path fill="#fbbc05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" />
      <path fill="#ea4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
    </svg>
  )
}
