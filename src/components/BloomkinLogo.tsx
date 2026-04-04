interface BloomkinLogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
}

export function BloomkinLogo({ size = 120, showText = true, className = "" }: BloomkinLogoProps) {
  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-lg"
      >
        <defs>
          <linearGradient id="petalGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF6B9D" />
            <stop offset="100%" stopColor="#C084FC" />
          </linearGradient>
          <linearGradient id="petalGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFA9C3" />
            <stop offset="100%" stopColor="#E879F9" />
          </linearGradient>
          <linearGradient id="petalGradient3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FB7185" />
            <stop offset="100%" stopColor="#F472B6" />
          </linearGradient>
          <linearGradient id="centerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FCD34D" />
            <stop offset="100%" stopColor="#FBBF24" />
          </linearGradient>
        </defs>

        {/* Bottom layer - outer petals */}
        <g opacity="0.9">
          <ellipse cx="100" cy="145" rx="28" ry="45" fill="url(#petalGradient1)" transform="rotate(0 100 145)" />
          <ellipse cx="58" cy="130" rx="28" ry="45" fill="url(#petalGradient1)" transform="rotate(-60 58 130)" />
          <ellipse cx="142" cy="130" rx="28" ry="45" fill="url(#petalGradient1)" transform="rotate(60 142 130)" />
          <ellipse cx="58" cy="85" rx="28" ry="45" fill="url(#petalGradient1)" transform="rotate(-120 58 85)" />
          <ellipse cx="142" cy="85" rx="28" ry="45" fill="url(#petalGradient1)" transform="rotate(120 142 85)" />
          <ellipse cx="100" cy="65" rx="28" ry="45" fill="url(#petalGradient1)" transform="rotate(180 100 65)" />
        </g>

        {/* Middle layer - inner petals */}
        <g opacity="0.95">
          <ellipse cx="100" cy="125" rx="24" ry="38" fill="url(#petalGradient2)" transform="rotate(0 100 125)" />
          <ellipse cx="68" cy="110" rx="24" ry="38" fill="url(#petalGradient2)" transform="rotate(-60 68 110)" />
          <ellipse cx="132" cy="110" rx="24" ry="38" fill="url(#petalGradient2)" transform="rotate(60 132 110)" />
          <ellipse cx="68" cy="90" rx="24" ry="38" fill="url(#petalGradient2)" transform="rotate(-120 68 90)" />
          <ellipse cx="132" cy="90" rx="24" ry="38" fill="url(#petalGradient2)" transform="rotate(120 132 90)" />
          <ellipse cx="100" cy="80" rx="24" ry="38" fill="url(#petalGradient2)" transform="rotate(180 100 80)" />
        </g>

        {/* Top layer - innermost petals */}
        <g>
          <ellipse cx="100" cy="110" rx="18" ry="30" fill="url(#petalGradient3)" transform="rotate(0 100 110)" />
          <ellipse cx="78" cy="100" rx="18" ry="30" fill="url(#petalGradient3)" transform="rotate(-60 78 100)" />
          <ellipse cx="122" cy="100" rx="18" ry="30" fill="url(#petalGradient3)" transform="rotate(60 122 100)" />
          <ellipse cx="100" cy="90" rx="18" ry="30" fill="url(#petalGradient3)" transform="rotate(180 100 90)" />
        </g>

        {/* Center */}
        <circle cx="100" cy="100" r="20" fill="url(#centerGradient)" opacity="1" />
        <circle cx="100" cy="100" r="16" fill="#FBBF24" opacity="0.5" />
        <circle cx="95" cy="95" r="3" fill="#FEF3C7" opacity="0.8" />
        <circle cx="105" cy="95" r="3" fill="#FEF3C7" opacity="0.8" />
        <circle cx="95" cy="105" r="3" fill="#FEF3C7" opacity="0.8" />
        <circle cx="105" cy="105" r="3" fill="#FEF3C7" opacity="0.8" />
        <circle cx="100" cy="100" r="3" fill="#FEF3C7" opacity="0.9" />
      </svg>

      {showText && (
        <div className="flex flex-col items-center">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 bg-clip-text text-transparent tracking-tight">
            Bloomkin
          </h1>
          <p className="text-sm text-gray-600 mt-2 tracking-wide">
            To help another bloom is to water your own roots
          </p>
        </div>
      )}
    </div>
  );
}
