import type { FractionValue } from '../../state/types'
import '../../styles/overlays.css'

export interface GhostOverlayProps {
  visible:       boolean
  gate:          FractionValue
  riverWidthPx:  number
}

export function GhostOverlay({ visible, gate, riverWidthPx }: GhostOverlayProps) {
  if (!visible) return null

  const widthPx = Math.round((gate.numerator / gate.denominator) * riverWidthPx)

  return (
    <div
      className="ghost-overlay"
      data-testid="ghost-overlay"
      style={{ width: `${widthPx}px` }}
    >
      <span className="ghost-overlay__label">
        {gate.numerator}/{gate.denominator}
      </span>
    </div>
  )
}
