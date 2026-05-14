// Orbit Logo — planet + ring SVG
export default function OrbitLogo({ size = 40, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer orbit ring */}
      <ellipse
        cx="20"
        cy="20"
        rx="18"
        ry="8"
        stroke="url(#orbitGrad)"
        strokeWidth="1.5"
        fill="none"
        opacity="0.7"
      />
      {/* Planet body */}
      <circle cx="20" cy="20" r="8" fill="url(#planetGrad)" />
      {/* Planet highlight */}
      <circle cx="17" cy="17" r="2.5" fill="rgba(255,255,255,0.2)" />
      {/* Orbiting moon */}
      <circle cx="36" cy="20" r="3" fill="url(#moonGrad)" />

      <defs>
        <linearGradient id="orbitGrad" x1="2" y1="20" x2="38" y2="20" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3b82f6" />
          <stop offset="1" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id="planetGrad" x1="12" y1="12" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3b82f6" />
          <stop offset="1" stopColor="#6d28d9" />
        </linearGradient>
        <linearGradient id="moonGrad" x1="33" y1="17" x2="39" y2="23" gradientUnits="userSpaceOnUse">
          <stop stopColor="#10b981" />
          <stop offset="1" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
    </svg>
  );
}
