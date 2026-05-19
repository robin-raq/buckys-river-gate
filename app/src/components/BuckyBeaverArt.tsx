import type { BuckyState } from '../state/types'

interface BuckyBeaverArtProps {
  state: BuckyState
}

/**
 * Illustrated Bucky — friendly builder beaver (SVG).
 * Matches docs/visual-mockups: yellow hard hat, blue overalls, buck teeth.
 */
export function BuckyBeaverArt({ state }: BuckyBeaverArtProps) {
  return (
    <svg
      className={`bucky-art bucky-art--${state}`}
      data-testid="bucky-beaver-art"
      viewBox="0 0 80 80"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {/* Tail */}
      <ellipse className="bucky-art__tail" cx="62" cy="58" rx="10" ry="7" fill="#6B4423" />

      {/* Body / overalls */}
      <path
        d="M22 48 Q40 72 58 48 L54 62 Q40 68 26 62 Z"
        fill="#2563EB"
      />
      <rect x="30" y="52" width="20" height="8" rx="2" fill="#1D4ED8" />
      <text
        x="40"
        y="58"
        textAnchor="middle"
        fill="#FBBF24"
        fontSize="5"
        fontWeight="700"
        fontFamily="Fredoka, system-ui, sans-serif"
      >
        BUCKY
      </text>

      {/* Head fur */}
      <circle cx="40" cy="38" r="22" fill="#A0784F" />
      <ellipse cx="40" cy="42" rx="16" ry="14" fill="#C49A6C" />

      {/* Ears */}
      <circle cx="24" cy="24" r="6" fill="#8B5E3C" />
      <circle cx="56" cy="24" r="6" fill="#8B5E3C" />
      <circle cx="24" cy="24" r="3" fill="#E8C4A0" />
      <circle cx="56" cy="24" r="3" fill="#E8C4A0" />

      {/* Hard hat */}
      <path
        d="M18 28 Q40 12 62 28 L60 22 Q40 8 20 22 Z"
        fill="#FBBF24"
        stroke="#D97706"
        strokeWidth="1.5"
      />
      <rect x="18" y="26" width="44" height="5" rx="2" fill="#F59E0B" />
      <text
        x="40"
        y="24"
        textAnchor="middle"
        fill="#1C1917"
        fontSize="11"
        fontWeight="800"
        fontFamily="Fredoka, system-ui, sans-serif"
      >
        B
      </text>

      {/* Face — eyes vary by state via CSS */}
      <g className="bucky-art__eyes">
        <ellipse className="bucky-art__eye" cx="32" cy="36" rx="4" ry="5" fill="#1C1917" />
        <ellipse className="bucky-art__eye" cx="48" cy="36" rx="4" ry="5" fill="#1C1917" />
        <circle className="bucky-art__eye-shine" cx="33" cy="35" r="1.2" fill="#fff" />
        <circle className="bucky-art__eye-shine" cx="49" cy="35" r="1.2" fill="#fff" />
      </g>

      {/* Nose */}
      <ellipse cx="40" cy="44" rx="5" ry="3.5" fill="#5C3D2E" />

      {/* Mouth — smile / frown toggled by state class */}
      <g className="bucky-art__mouth bucky-art__mouth--smile">
        <path
          d="M32 46 Q40 52 48 46"
          fill="none"
          stroke="#1C1917"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <rect x="34" y="46" width="5" height="6" rx="1" fill="#FEFCE8" />
        <rect x="41" y="46" width="5" height="6" rx="1" fill="#FEFCE8" />
      </g>
      <g className="bucky-art__mouth bucky-art__mouth--frown">
        <path
          d="M33 50 Q40 46 47 50"
          fill="none"
          stroke="#1C1917"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </g>

      {/* Left arm + axe (chop-swing) */}
      <g className="bucky-art__arm-left">
        <ellipse cx="18" cy="44" rx="5" ry="7" fill="#8B5E3C" />
        <g className="bucky-art__axe">
          <rect x="8" y="28" width="3" height="18" rx="1" fill="#8B5E3C" />
          <path d="M4 26 L14 26 L12 20 L6 20 Z" fill="#94A3B8" />
        </g>
      </g>

      {/* Right arm */}
      <g className="bucky-art__arm-right">
        <ellipse cx="62" cy="46" rx="5" ry="7" fill="#8B5E3C" />
        <g className="bucky-art__thumb">
          <circle cx="66" cy="40" r="3" fill="#C49A6C" />
        </g>
      </g>

      {/* Log (build-stack) */}
      <g className="bucky-art__log">
        <rect x="54" y="38" width="14" height="6" rx="2" fill="#A0784F" stroke="#6B4423" strokeWidth="0.8" />
        <text x="61" y="43" textAnchor="middle" fill="#FEFCE8" fontSize="4" fontWeight="700">½</text>
      </g>

      {/* Celebrate sparkles */}
      <g className="bucky-art__sparkles">
        <text x="12" y="18" fontSize="8">✦</text>
        <text x="64" y="14" fontSize="7">✦</text>
        <text x="58" y="8" fontSize="6">✦</text>
      </g>
    </svg>
  )
}
