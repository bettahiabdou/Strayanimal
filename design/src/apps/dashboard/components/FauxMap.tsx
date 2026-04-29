/* Stylised topographic placeholder map of Ouarzazate.
 * Reused by Carte and Heatmap. Replace with real Mapbox layer in Phase 1. */
export function FauxMap() {
  return (
    <svg
      className="absolute inset-0 size-full"
      viewBox="0 0 1000 750"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <pattern id="map-grid" width="60" height="60" patternUnits="userSpaceOnUse">
          <path
            d="M 60 0 L 0 0 0 60"
            fill="none"
            stroke="#E5DCC2"
            strokeWidth="0.5"
            opacity="0.6"
          />
        </pattern>
        <pattern id="dot-grid" width="14" height="14" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.5" fill="#C9BD9A" opacity="0.4" />
        </pattern>
      </defs>

      <rect width="1000" height="750" fill="#F4EEDF" />
      <rect width="1000" height="750" fill="url(#dot-grid)" />
      <rect width="1000" height="750" fill="url(#map-grid)" />

      <rect x="100" y="100" width="280" height="220" fill="#EBE2C9" opacity="0.5" />
      <rect x="420" y="80" width="240" height="180" fill="#EBE2C9" opacity="0.5" />
      <rect x="700" y="140" width="220" height="280" fill="#EBE2C9" opacity="0.5" />
      <rect x="60" y="380" width="320" height="240" fill="#EBE2C9" opacity="0.5" />
      <rect x="450" y="320" width="200" height="320" fill="#EBE2C9" opacity="0.5" />
      <rect x="700" y="480" width="240" height="200" fill="#EBE2C9" opacity="0.5" />

      <path
        d="M 0 380 Q 250 350 500 360 T 1000 380"
        stroke="#D5C797"
        strokeWidth="8"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M 380 0 Q 400 200 420 380 T 460 750"
        stroke="#D5C797"
        strokeWidth="7"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M 700 0 Q 680 200 720 400 T 740 750"
        stroke="#D5C797"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
      />

      <path d="M 0 200 L 1000 220" stroke="#E2D6B1" strokeWidth="2.5" fill="none" />
      <path d="M 0 580 L 1000 560" stroke="#E2D6B1" strokeWidth="2.5" fill="none" />
      <path d="M 200 0 L 230 750" stroke="#E2D6B1" strokeWidth="2.5" fill="none" />
      <path d="M 580 0 L 560 750" stroke="#E2D6B1" strokeWidth="2.5" fill="none" />
      <path d="M 850 0 L 880 750" stroke="#E2D6B1" strokeWidth="2.5" fill="none" />

      <path
        d="M 0 540 Q 150 510 350 530 Q 550 550 750 510 T 1000 520"
        stroke="#9FB8C5"
        strokeWidth="14"
        fill="none"
        opacity="0.55"
        strokeLinecap="round"
      />
      <path
        d="M 0 540 Q 150 510 350 530 Q 550 550 750 510 T 1000 520"
        stroke="#7FA0B0"
        strokeWidth="2"
        fill="none"
        opacity="0.4"
        strokeDasharray="6 4"
      />

      <circle cx="380" cy="450" r="6" fill="#A88A4A" />
      <circle cx="640" cy="290" r="5" fill="#A88A4A" />

      <g
        fill="#9C8C5E"
        fontFamily="Public Sans, sans-serif"
        fontSize="11"
        fontWeight="600"
        opacity="0.7"
        letterSpacing="2"
      >
        <text x="160" y="200">
          HAY AL WAHDA
        </text>
        <text x="490" y="170">
          SIDI DAOUD
        </text>
        <text x="730" y="240">
          TINZOULINE
        </text>
        <text x="100" y="490">
          TABOUNTE
        </text>
        <text x="470" y="470">
          CENTRE
        </text>
        <text x="730" y="580">
          TARMIGT
        </text>
      </g>
    </svg>
  )
}
