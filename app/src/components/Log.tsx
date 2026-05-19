import type { Dispatch } from 'react'
import type { BlockState } from '../state/types'
import type { LessonEvent } from '../state/lessonEvents'

interface LogProps {
  block:    BlockState
  dispatch: Dispatch<LessonEvent>
}

// Colour by denominator: whole=darkest, quarter=lightest
const LOG_COLORS: Record<number, string> = {
  1: 'var(--log-whole,   #8B5E3C)',
  2: 'var(--log-half,    #A0784F)',
  4: 'var(--log-quarter, #C49A6C)',
}

export function Log({ block, dispatch: _dispatch }: LogProps) {
  const color = LOG_COLORS[block.denominator] ?? LOG_COLORS[4]

  // Fraction label: "1/2", "1/4", "1/1"
  const fractionLabel = `${block.numerator}/${block.denominator}`

  return (
    <div
      data-testid={`log-${block.id}`}
      data-numerator={block.numerator}
      data-denominator={block.denominator}
      data-zone={block.zone}
      data-splittable={String(block.splittable)}
      data-locked={String(block.locked)}
      aria-label={`${fractionLabel} log`}
      style={{
        width:          `${block.pixelWidth}px`,
        height:         '72px',
        background:     color,
        borderRadius:   'var(--log-radius, 12px)',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        cursor:         block.locked ? 'default' : 'grab',
        userSelect:     'none',
        touchAction:    'none',
        border:         block.selected ? '3px solid var(--success-glow, #34D399)' : '3px solid transparent',
        boxSizing:      'border-box',
        flexShrink:     0,
      }}
    >
      <span
        style={{
          color:      'var(--bucky-bubble, #FEFCE8)',
          fontSize:   '1rem',
          fontWeight: 700,
          textShadow: '0 1px 2px rgba(0,0,0,0.5)',
        }}
      >
        {fractionLabel}
      </span>
    </div>
  )
}
