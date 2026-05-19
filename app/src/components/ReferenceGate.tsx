import type { FractionValue } from '../state/types'
import { RIVER_WIDTH_PX } from '../constants'

interface ReferenceGateProps {
  gate:    FractionValue
  visible: boolean
  label:   string
}

export function ReferenceGate({ gate, visible, label }: ReferenceGateProps) {
  const widthPx = Math.round((gate.numerator / gate.denominator) * RIVER_WIDTH_PX)

  return (
    <div
      data-testid="reference-gate"
      data-numerator={gate.numerator}
      data-denominator={gate.denominator}
      aria-label={`Reference gate: ${label}`}
      style={{
        width:        `${widthPx}px`,
        height:       '8px',
        background:   'var(--ref-gate, #3BADE8)',
        borderRadius: '4px',
        position:     'relative',
        visibility:   visible ? 'visible' : 'hidden',
      }}
    >
      <span
        style={{
          position:   'absolute',
          top:        '-1.5rem',
          left:       0,
          right:      0,
          textAlign:  'center',
          fontSize:   '0.75rem',
          color:      'var(--ref-gate, #3BADE8)',
          fontWeight: 600,
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
    </div>
  )
}
