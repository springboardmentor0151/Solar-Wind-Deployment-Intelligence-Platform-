export default function HeroIllustration() {
  return (
    <svg
      viewBox="0 0 640 560"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto max-w-xl mx-auto"
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EFF4FE" />
          <stop offset="100%" stopColor="#FFFFFF" />
        </linearGradient>
        <linearGradient id="sun" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFE29A" />
          <stop offset="100%" stopColor="#22C55E" stopOpacity="0.7" />
        </linearGradient>
        <linearGradient id="panel" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1E293B" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>
        <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E2E8F2" />
          <stop offset="100%" stopColor="#F1F4F9" />
        </linearGradient>
        <linearGradient id="turbineBlade" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#DBE7FD" />
        </linearGradient>
      </defs>

      {/* Backdrop */}
      <rect x="0" y="0" width="640" height="560" rx="28" fill="url(#sky)" />

      {/* Sun glow */}
      <circle cx="480" cy="110" r="70" fill="url(#sun)" opacity="0.55" className="animate-pulseSoft" />
      <circle cx="480" cy="110" r="34" fill="#FDE68A" opacity="0.9" />

      {/* Clouds */}
      <g className="animate-drift" opacity="0.9">
        <ellipse cx="120" cy="90" rx="46" ry="20" fill="#FFFFFF" />
        <ellipse cx="155" cy="80" rx="34" ry="18" fill="#FFFFFF" />
        <ellipse cx="90" cy="80" rx="28" ry="16" fill="#FFFFFF" />
      </g>
      <g style={{ animationDelay: '2s' }} className="animate-drift" opacity="0.7">
        <ellipse cx="340" cy="60" rx="34" ry="14" fill="#FFFFFF" />
        <ellipse cx="365" cy="52" rx="22" ry="12" fill="#FFFFFF" />
      </g>

      {/* Satellite */}
      <g transform="translate(60,160)" className="animate-float">
        <rect x="0" y="10" width="34" height="24" rx="3" fill="#0F172A" />
        <rect x="-24" y="4" width="20" height="36" rx="2" fill="#DBE7FD" stroke="#2563EB" strokeWidth="1.5" />
        <rect x="38" y="4" width="20" height="36" rx="2" fill="#DBE7FD" stroke="#2563EB" strokeWidth="1.5" />
        <line x1="17" y1="10" x2="17" y2="-14" stroke="#0F172A" strokeWidth="2" />
        <circle cx="17" cy="-18" r="5" fill="#22C55E" />
        {/* signal pulses */}
        <circle cx="17" cy="34" r="4" fill="none" stroke="#2563EB" strokeWidth="1.2" opacity="0.6">
          <animate attributeName="r" values="4;22;4" dur="3s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.6;0;0.6" dur="3s" repeatCount="indefinite" />
        </circle>
      </g>

      {/* Ground */}
      <path d="M0 460 L640 460 L640 560 L0 560 Z" fill="url(#ground)" />

      {/* Digital map grid */}
      <g opacity="0.35" stroke="#2563EB" strokeWidth="1">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <line key={`v${i}`} x1={i * 100} y1="460" x2={i * 100 + 40} y2="560" />
        ))}
        <line x1="0" y1="500" x2="640" y2="500" />
        <line x1="0" y1="530" x2="640" y2="530" />
      </g>
      {/* map location pins */}
      <circle cx="150" cy="500" r="5" fill="#22C55E" />
      <circle cx="420" cy="515" r="5" fill="#2563EB" />
      <circle cx="300" cy="540" r="5" fill="#22C55E" />

      {/* Wind turbines */}
      <g transform="translate(430,270)">
        <rect x="-4" y="0" width="8" height="150" rx="3" fill="#94A3B8" />
        <g className="animate-spinSlow" style={{ transformOrigin: '0px 0px' }}>
          <path d="M0 0 L6 -70 L14 -62 Z" fill="url(#turbineBlade)" />
          <path d="M0 0 L60 30 L48 40 Z" fill="url(#turbineBlade)" transform="rotate(120 0 0)" />
          <path d="M0 0 L-55 40 L-45 50 Z" fill="url(#turbineBlade)" transform="rotate(240 0 0)" />
        </g>
        <circle cx="0" cy="0" r="6" fill="#0F172A" />
      </g>
      <g transform="translate(510,320)" opacity="0.85">
        <rect x="-3" y="0" width="6" height="105" rx="2" fill="#94A3B8" />
        <g className="animate-spinSlow" style={{ transformOrigin: '0px 0px', animationDuration: '10s' }}>
          <path d="M0 0 L4 -48 L10 -42 Z" fill="url(#turbineBlade)" />
          <path d="M0 0 L42 20 L34 28 Z" fill="url(#turbineBlade)" transform="rotate(120 0 0)" />
          <path d="M0 0 L-38 28 L-30 34 Z" fill="url(#turbineBlade)" transform="rotate(240 0 0)" />
        </g>
        <circle cx="0" cy="0" r="4" fill="#0F172A" />
      </g>

      {/* Solar panel array */}
      <g transform="translate(70,380)">
        {[0, 1, 2].map((i) => (
          <g key={i} transform={`translate(${i * 95},0)`}>
            <path d="M0 40 L80 40 L64 0 L16 0 Z" fill="url(#panel)" />
            <line x1="16" y1="0" x2="0" y2="40" stroke="#2563EB" strokeWidth="1" opacity="0.5" />
            <line x1="40" y1="0" x2="30" y2="40" stroke="#2563EB" strokeWidth="1" opacity="0.5" />
            <line x1="64" y1="0" x2="60" y2="40" stroke="#2563EB" strokeWidth="1" opacity="0.5" />
            <rect x="35" y="40" width="8" height="20" fill="#475569" />
          </g>
        ))}
      </g>

      {/* AI analytics dashboard card */}
      <g transform="translate(230,190)" className="animate-float" style={{ animationDelay: '0.6s' }}>
        <rect x="0" y="0" width="180" height="120" rx="14" fill="#0F172A" />
        <rect x="14" y="16" width="60" height="8" rx="4" fill="#22C55E" />
        <rect x="14" y="32" width="90" height="6" rx="3" fill="#94A3B8" opacity="0.6" />
        <polyline
          points="14,95 44,70 70,85 100,55 130,68 160,40"
          fill="none"
          stroke="#22C55E"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="160" cy="40" r="4" fill="#22C55E" />
        <rect x="14" y="102" width="30" height="6" rx="3" fill="#2563EB" />
        <rect x="50" y="102" width="20" height="6" rx="3" fill="#475569" />
      </g>
    </svg>
  )
}
