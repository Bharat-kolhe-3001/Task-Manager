// Empty state illustrations — space-themed SVG
export function EmptyPlanet({ title = 'Nothing here', subtitle = 'Launch something new.' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 animate-fade-in">
      {/* Rocket SVG */}
      <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="animate-float opacity-60">
        <ellipse cx="40" cy="72" rx="12" ry="4" fill="rgba(59,130,246,0.15)" />
        <path d="M40 8 C40 8 55 24 55 44 L40 52 L25 44 C25 24 40 8 40 8Z" fill="url(#rocketBody)" />
        <circle cx="40" cy="34" r="6" fill="rgba(14,165,233,0.4)" stroke="rgba(14,165,233,0.6)" strokeWidth="1.5" />
        <path d="M25 44 L18 56 L28 50Z" fill="url(#wingLeft)" />
        <path d="M55 44 L62 56 L52 50Z" fill="url(#wingRight)" />
        <path d="M36 52 L38 64 L40 68 L42 64 L44 52" fill="url(#flame)" opacity="0.8" />
        <defs>
          <linearGradient id="rocketBody" x1="25" y1="8" x2="55" y2="52" gradientUnits="userSpaceOnUse">
            <stop stopColor="#6366f1" />
            <stop offset="1" stopColor="#3b82f6" />
          </linearGradient>
          <linearGradient id="wingLeft" x1="18" y1="44" x2="28" y2="56" gradientUnits="userSpaceOnUse">
            <stop stopColor="#7c3aed" />
            <stop offset="1" stopColor="#4f46e5" />
          </linearGradient>
          <linearGradient id="wingRight" x1="52" y1="44" x2="62" y2="56" gradientUnits="userSpaceOnUse">
            <stop stopColor="#7c3aed" />
            <stop offset="1" stopColor="#4f46e5" />
          </linearGradient>
          <linearGradient id="flame" x1="40" y1="52" x2="40" y2="68" gradientUnits="userSpaceOnUse">
            <stop stopColor="#f59e0b" />
            <stop offset="1" stopColor="#ef4444" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
      <div className="text-center">
        <p className="text-gray-300 font-heading font-semibold text-lg">{title}</p>
        <p className="text-gray-500 text-sm mt-1">{subtitle}</p>
      </div>
    </div>
  );
}

export function EmptyOrbit({ title = 'No projects yet', subtitle = 'Create your first planet to orbit.' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-5 animate-fade-in">
      {/* Planet SVG */}
      <svg width="90" height="90" viewBox="0 0 90 90" fill="none" xmlns="http://www.w3.org/2000/svg" className="animate-float opacity-70">
        <ellipse cx="45" cy="45" rx="40" ry="18" stroke="url(#orbitRing)" strokeWidth="2" fill="none" />
        <circle cx="45" cy="45" r="22" fill="url(#emptyPlanet)" />
        <circle cx="38" cy="38" r="6" fill="rgba(255,255,255,0.12)" />
        <defs>
          <linearGradient id="orbitRing" x1="5" y1="45" x2="85" y2="45" gradientUnits="userSpaceOnUse">
            <stop stopColor="#3b82f6" stopOpacity="0.2" />
            <stop offset="0.5" stopColor="#7c3aed" />
            <stop offset="1" stopColor="#3b82f6" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="emptyPlanet" x1="23" y1="23" x2="67" y2="67" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1a1f3a" />
            <stop offset="1" stopColor="#0a0f1e" />
          </linearGradient>
        </defs>
      </svg>
      <div className="text-center">
        <p className="text-gray-300 font-heading font-semibold text-lg">{title}</p>
        <p className="text-gray-500 text-sm mt-1">{subtitle}</p>
      </div>
    </div>
  );
}
