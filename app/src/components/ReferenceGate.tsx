import type { FractionValue } from '../state/types'
import { RIVER_WIDTH_PX } from '../constants'
import '../styles/animations.css'

interface ReferenceGateProps {
  gate:               FractionValue
  visible:            boolean
  label:              string
  highlightGap?:      boolean
  highlightOverflow?: boolean
}

function gateModifierClass(
  visible: boolean,
  highlightGap?: boolean,
  highlightOverflow?: boolean,
): string {
  const classes = ['reference-gate']
  if (visible) classes.push('reference-gate--pulse')
  if (highlightGap) classes.push('reference-gate--gap')
  if (highlightOverflow) classes.push('reference-gate--overflow')
  return classes.join(' ')
}

export function ReferenceGate({
  gate,
  visible,
  label,
  highlightGap = false,
  highlightOverflow = false,
}: ReferenceGateProps) {
  const widthPx = Math.round((gate.numerator / gate.denominator) * RIVER_WIDTH_PX)

  return (
    <div
      data-testid="reference-gate"
      data-numerator={gate.numerator}
      data-denominator={gate.denominator}
      data-highlight-gap={String(highlightGap)}
      data-highlight-overflow={String(highlightOverflow)}
      className={gateModifierClass(visible, highlightGap, highlightOverflow)}
      aria-label={`Reference gate: ${label}`}
      style={{
        width:      `${widthPx}px`,
        visibility: visible ? 'visible' : 'hidden',
      }}
    >
      <span className="reference-gate__label">{label}</span>
    </div>
  )
}
