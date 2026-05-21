import '../../styles/overlays.css'

interface ChopLineProps {
  /** Horizontal position as a % of the parent (.river-row) width.
   *  null hides the line. The percentage is the center of the
   *  splittable block — for DEMO_CHOP_1 that's 50%, for chops on
   *  partial blocks it'd be 25% or 75%, computed by the caller. */
  positionPct: number | null
}

/**
 * Vertical red guide rendered inside .river-row to telegraph where
 * Bucky is about to chop. Anticipatory cue paired with the
 * "right down the middle" speech beat. Disappears the moment the
 * next dialogue node mounts (the chop fires there).
 *
 * Position is an inline `left:` so the line can sit at any %
 * (not just preset CSS variants). Animation lives in overlays.css.
 */
export function ChopLine({ positionPct }: ChopLineProps) {
  if (positionPct === null) return null

  return (
    <div
      data-testid="chop-line"
      aria-hidden="true"
      className="chop-line"
      style={{ left: `${positionPct}%` }}
    />
  )
}
