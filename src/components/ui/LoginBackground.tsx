export function LoginBackground() {
  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    >
      {/* Base dark background */}
      <div className="absolute inset-0" style={{ background: '#0d0a1e' }} />

      {/* Soft glowing orbs */}
      <div
        className="absolute rounded-full"
        style={{
          width: 600,
          height: 600,
          top: '-10%',
          right: '-5%',
          background: 'radial-gradient(circle, rgba(192,132,252,0.18) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: 500,
          height: 500,
          bottom: '-10%',
          right: '10%',
          background: 'radial-gradient(circle, rgba(255,107,157,0.15) 0%, transparent 70%)',
          filter: 'blur(50px)',
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: 400,
          height: 400,
          top: '30%',
          right: '25%',
          background: 'radial-gradient(circle, rgba(232,121,249,0.12) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
    </div>
  )
}
