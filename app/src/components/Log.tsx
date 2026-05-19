import { useRef, type Dispatch } from 'react'
import type { BlockState } from '../state/types'
import type { LessonEvent } from '../state/lessonEvents'
import { playChopSound, playBonkSound, playFractionTone } from '../audio/toneEngine'

const DOUBLE_TAP_MS = 300   // two taps within 300 ms = double-tap

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

const LOG_SIZE_CLASS: Record<number, string> = {
  1: 'log--whole',
  2: 'log--half',
  4: 'log--quarter',
}

function logSizeClass(denominator: number): string {
  return LOG_SIZE_CLASS[denominator] ?? LOG_SIZE_CLASS[4]
}

export function Log({ block, dispatch }: LogProps) {
  const color       = LOG_COLORS[block.denominator] ?? LOG_COLORS[4]
  const lastTapRef  = useRef<number>(0)

  // Fraction label: "1/2", "1/4", "1/1"
  const fractionLabel = `${block.numerator}/${block.denominator}`

  // Double-tap to chop: only splittable build-zone logs respond.
  // Locked logs (demo) and dock logs are silent.
  function handleClick() {
    const now = Date.now()
    const gap = now - lastTapRef.current
    lastTapRef.current = now

    // First tap of a potential double-tap — wait for the second
    if (gap > DOUBLE_TAP_MS) return

    if (block.locked || block.zone !== 'build') return

    if (block.splittable) {
      const childDenom = block.denominator * 2
      playChopSound([
        { numerator: block.numerator, denominator: childDenom },
        { numerator: block.numerator, denominator: childDenom },
      ])
      dispatch({ type: 'CHOP', blockId: block.id })
    } else {
      // Quarter logs can't be chopped — bonk feedback
      playBonkSound()
      playFractionTone({ numerator: block.numerator, denominator: block.denominator })
    }
  }

  return (
    <div
      className={`log ${logSizeClass(block.denominator)}`}
      data-testid={`log-${block.id}`}
      data-numerator={block.numerator}
      data-denominator={block.denominator}
      data-zone={block.zone}
      data-splittable={String(block.splittable)}
      data-locked={String(block.locked)}
      aria-label={`${fractionLabel} log${block.splittable && block.zone === 'build' ? ' — tap to chop' : ''}`}
      onClick={handleClick}
      style={{
        width:          `${block.pixelWidth}px`,
        height:         '72px',
        background:     color,
        borderRadius:   'var(--log-radius, 12px)',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        cursor:         block.locked ? 'default' : block.splittable && block.zone === 'build' ? 'pointer' : 'grab',
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
