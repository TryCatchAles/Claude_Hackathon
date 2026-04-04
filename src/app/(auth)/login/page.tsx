import { signInWithGoogle } from '@/actions/auth'
import { LoginBackground } from '@/components/ui/LoginBackground'
import { BloomkinLogo } from '@/components/BloomkinLogo'
import { WaveTitle } from '@/components/WaveTitle'

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
            'radial-gradient(ellipse 70% 60% at 50% 50%, transparent 20%, rgba(6,18,40,0.52) 70%, rgba(6,18,40,0.92) 100%)',
        }}
      />

      {/* Top bar */}
      <div
        className="fixed top-0 left-0 right-0 flex items-center px-8 py-5 pointer-events-none"
        style={{ zIndex: 20 }}
      >
        <BloomkinLogo size={52} showText={false} className="flex-row gap-2 pointer-events-none" />
        <span className="ml-3 bg-gradient-to-r from-pink-400 via-purple-400 to-pink-400 bg-clip-text text-transparent" style={{ fontFamily: 'Sterion, sans-serif', fontSize: '1.4rem' }}>Bloomkin</span>
      </div>

      {/* Main content — centered */}
      <main
        className="relative min-h-screen flex flex-col items-center justify-center text-center px-6"
        style={{ zIndex: 10 }}
      >
        {/* Big hero title */}
        <WaveTitle />

        {/* Subtitle */}
        <p
          className="whitespace-nowrap mb-10 bg-gradient-to-r from-pink-300 via-purple-300 to-pink-300 bg-clip-text text-transparent opacity-80"
          style={{ fontSize: 'clamp(0.85rem, 1.4vw, 1.05rem)', fontFamily: 'Sterion, sans-serif' }}
        >
          To help another bloom is to water your own roots.
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
