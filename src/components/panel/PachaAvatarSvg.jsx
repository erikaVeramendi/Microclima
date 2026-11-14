// PachaAvatarSvg.jsx — Pacha, asistente de LlajtaLab (Cochabamba)

export default function PachaAvatarSvg({ mood = 'curious', size = 56 }) {
  // Moods: 'hot' (D9 / calor extremo), 'fresh' (D12 / Tunari verde), 'smoky' (Red MÓNICA / contaminación), 'curious' (normal)

  const bodyGradientId = `pacha-body-${mood}`
  const chulloGradientId = `pacha-chullo-${mood}`

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`pacha-svg mood-${mood}`}
      aria-label="Pacha, asistente de LlajtaLab"
    >
      <defs>
        {/* Gradiente del cuerpito según el clima */}
        <linearGradient id={bodyGradientId} x1="20" y1="20" x2="80" y2="90" gradientUnits="userSpaceOnUse">
          {mood === 'hot' ? (
            <>
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="60%" stopColor="#FED7AA" />
              <stop offset="100%" stopColor="#FCA5A5" />
            </>
          ) : mood === 'fresh' ? (
            <>
              <stop offset="0%" stopColor="#ECFDF5" />
              <stop offset="60%" stopColor="#A7F3D0" />
              <stop offset="100%" stopColor="#6EE7B7" />
            </>
          ) : mood === 'smoky' ? (
            <>
              <stop offset="0%" stopColor="#F1F5F9" />
              <stop offset="60%" stopColor="#CBD5E1" />
              <stop offset="100%" stopColor="#94A3B8" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#F0F9FF" />
              <stop offset="60%" stopColor="#BAE6FD" />
              <stop offset="100%" stopColor="#7DD3FC" />
            </>
          )}
        </linearGradient>

        {/* Gradiente del Chullito */}
        <linearGradient id={chulloGradientId} x1="30" y1="10" x2="70" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E11D48" />
          <stop offset="50%" stopColor="#EA580C" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>

        {/* Sombra suave */}
        <filter id="pacha-shadow" x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="0" dy="3" stdDeviation="2.5" floodColor="#0F172A" floodOpacity="0.4" />
        </filter>
      </defs>

      {/* Sombra de apoyo */}
      <ellipse cx="50" cy="94" rx="22" ry="4" fill="rgba(15, 23, 42, 0.35)" />

      {/* --- Cuerpito de Nubecilla / Espíritu Elemental --- */}
      <g filter="url(#pacha-shadow)">
        <path
          d="M32 78C22 78 15 70 16 60C12 56 12 47 17 41C16 35 20 27 28 26C32 20 42 16 52 18C60 16 70 20 73 27C80 28 85 36 83 43C88 48 88 57 84 62C85 71 78 78 68 78C62 82 56 83 50 82C44 83 38 82 32 78Z"
          fill={`url(#${bodyGradientId})`}
        />
        <ellipse cx="30" cy="74" rx="5" ry="4" fill="#38BDF8" opacity="0.3" />
        <ellipse cx="70" cy="74" rx="5" ry="4" fill="#38BDF8" opacity="0.3" />
      </g>

      {/* --- Manitos Tiernas --- */}
      {mood === 'hot' ? (
        <g>
          <ellipse cx="20" cy="58" rx="4" ry="5" fill="#FED7AA" />
          <ellipse cx="80" cy="54" rx="4.5" ry="5.5" fill="#FED7AA" transform="rotate(-15 80 54)" />
        </g>
      ) : (
        <g>
          <ellipse cx="22" cy="56" rx="4.5" ry="4" fill="#BAE6FD" />
          <ellipse cx="78" cy="56" rx="4.5" ry="4" fill="#BAE6FD" />
        </g>
      )}

      {/* --- CHULLITO COCHABAMBINO --- */}
      <g id="chullito">
        <path
          d="M32 30C32 30 36 12 50 11C64 12 68 30 68 30C68 34 65 37 60 38C54 39 46 39 40 38C35 37 32 34 32 30Z"
          fill={`url(#${chulloGradientId})`}
        />
        {/* Orejeras */}
        <path d="M33 32L29 44C28 47 31 49 33 47L37 34Z" fill="#BE123C" />
        <path d="M67 32L71 44C72 47 69 49 67 47L63 34Z" fill="#BE123C" />

        {/* Trencitas con pompones */}
        <path d="M31 47Q30 54 28 58" stroke="#FBBF24" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="28" cy="58" r="1.6" fill="#FBBF24" />
        <path d="M69 47Q70 54 72 58" stroke="#FBBF24" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="72" cy="58" r="1.6" fill="#FBBF24" />

        {/* Guarda geométrica */}
        <path
          d="M36 29L39 25L42 29L45 25L48 29L51 25L54 29L57 25L60 29L63 25"
          stroke="#FDE047"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Pom-pom superior */}
        <circle cx="50" cy="10" r="4.5" fill="#FEF08A" />
        <circle cx="50" cy="10" r="3" fill="#FACC15" />

        {/* Hojita de Molle con semilla roja */}
        <g transform="translate(56, 7) rotate(25)">
          <path d="M0 6C-2 3 -1 0 4 -3C7 2 5 6 0 6Z" fill="#22C55E" />
          <path d="M-1 4C-2 1 0 -2 5 -4C7 0 5 4 -1 4Z" fill="#4ADE80" opacity="0.7" />
          <path d="M0 6L3 -1" stroke="#15803D" strokeWidth="0.8" />
          <circle cx="5" cy="1" r="1.3" fill="#DC2626" />
        </g>
      </g>

      {/* --- CARITA Y OJITOS EXPRESIVOS --- */}
      {mood === 'hot' ? (
        <g id="face-hot">
          <path d="M36 50Q41 44 46 50" stroke="#78350F" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M54 50Q59 44 64 50" stroke="#78350F" strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="33" cy="54" r="5" fill="#F87171" opacity="0.75" />
          <circle cx="67" cy="54" r="5" fill="#F87171" opacity="0.75" />
          <ellipse cx="50" cy="56" rx="3.5" ry="4.5" fill="#B91C1C" />
          <path d="M48 57Q50 59 52 57" stroke="#FEF2F2" strokeWidth="1" strokeLinecap="round" />
          <path
            d="M66 40C66 40 68 43 68 45C68 46.5 66.8 47.5 65.5 47.5C64.2 47.5 63 46.5 63 45C63 43 66 40 66 40Z"
            fill="#38BDF8"
          />
        </g>
      ) : mood === 'fresh' ? (
        <g id="face-fresh">
          <ellipse cx="40" cy="48" rx="4.5" ry="6" fill="#064E3B" />
          <circle cx="41.5" cy="46" r="2" fill="#FFFFFF" />
          <circle cx="39" cy="51" r="1" fill="#FFFFFF" />

          <ellipse cx="60" cy="48" rx="4.5" ry="6" fill="#064E3B" />
          <circle cx="61.5" cy="46" r="2" fill="#FFFFFF" />
          <circle cx="59" cy="51" r="1" fill="#FFFFFF" />

          <circle cx="32" cy="54" r="4.5" fill="#F472B6" opacity="0.5" />
          <circle cx="68" cy="54" r="4.5" fill="#F472B6" opacity="0.5" />
          <path d="M45 54Q50 60 55 54" stroke="#064E3B" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M72 38L74 42L78 44L74 46L72 50L70 46L66 44L70 42Z" fill="#34D399" opacity="0.8" />
        </g>
      ) : mood === 'smoky' ? (
        <g id="face-smoky">
          <path d="M36 48L44 50" stroke="#334155" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M56 50L64 48" stroke="#334155" strokeWidth="2.4" strokeLinecap="round" />
          <path
            d="M40 52C40 52 45 50 50 50C55 50 60 52 60 52C61 55 59 62 50 62C41 62 39 55 40 52Z"
            fill="#CBD5E1"
            stroke="#94A3B8"
            strokeWidth="1.2"
          />
          <circle cx="26" cy="46" r="1.2" fill="#64748B" />
          <circle cx="74" cy="42" r="1.5" fill="#64748B" />
          <circle cx="76" cy="52" r="1" fill="#64748B" />
        </g>
      ) : (
        <g id="face-curious">
          <ellipse cx="40" cy="48" rx="4.5" ry="6" fill="#0C4A6E" />
          <circle cx="41.5" cy="46" r="2.2" fill="#FFFFFF" />
          <circle cx="39" cy="51" r="1.1" fill="#FFFFFF" />

          <ellipse cx="60" cy="48" rx="4.5" ry="6" fill="#0C4A6E" />
          <circle cx="61.5" cy="46" r="2.2" fill="#FFFFFF" />
          <circle cx="59" cy="51" r="1.1" fill="#FFFFFF" />

          <circle cx="32" cy="54" r="4.5" fill="#FB7185" opacity="0.5" />
          <circle cx="68" cy="54" r="4.5" fill="#FB7185" opacity="0.5" />
          <path d="M46 54Q50 58 54 54" stroke="#0C4A6E" strokeWidth="2" strokeLinecap="round" />
        </g>
      )}
    </svg>
  )
}
