import type { BuckyState } from '../state/types'
import BuckySvg from '../assets/bucky.svg?react'

interface BuckyBeaverArtProps {
  state: BuckyState
}

/**
 * Illustrated Bucky — renders app/src/assets/bucky.svg (SVG source of truth).
 * State layers (axe, frown, sparkles) toggled via bucky.css on the root class.
 */
export function BuckyBeaverArt({ state }: BuckyBeaverArtProps) {
  return (
    <BuckySvg
      className={`bucky-art bucky-art--${state}`}
      data-testid="bucky-beaver-art"
      aria-hidden
    />
  )
}
