import { useRef, type Dispatch } from 'react'
import type { BlockState } from '../state/types'
import type { LessonEvent } from '../state/lessonEvents'
import { playChopSound, playBonkSound, playFractionTone } from '../audio/toneEngine'

const DOUBLE_TAP_MS = 300

interface LogProps {
  block:    BlockState
  dispatch: Dispatch<LessonEvent>
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
  const lastTapRef = useRef<number>(0)
  const fractionLabel = `${block.numerator}/${block.denominator}`

  function handleClick() {
    const now = Date.now()
    const gap = now - lastTapRef.current
    lastTapRef.current = now

    if (gap > DOUBLE_TAP_MS) return

    if (block.locked || block.zone !== 'build') return

    if (block.splittable) {
      const childDenom = block.denominator * 2
      playChopSound([
        { numerator: block.numerator, denominator: childDenom },
        { numerator: block.numerator, denominator: childDenom },
      ])
      // The reducer replaces this parent log with two children. The chop
      // visual feedback rides on the children's mount-pop animation
      // (`.log` has a `log-mount` keyframe applied universally).
      dispatch({ type: 'CHOP', blockId: block.id })
    } else {
      playBonkSound()
      playFractionTone({ numerator: block.numerator, denominator: block.denominator })
    }
  }

  // Logs always fill 100% of their wrapper. The wrapper (in LessonScreen.tsx,
  // for both river-row and dock-tray) carries the flex-basis = (num/denom)*100%,
  // so a 1/4 log is the same pixel width in either zone (since both zones
  // span the same `--zone-lane-inset` band horizontally). The kid never has
  // to relearn what "1/4" looks like.
  const widthStyle = { width: '100%' }

  const className = [
    'log',
    logSizeClass(block.denominator),
    block.selected ? 'log--selected' : '',
  ].filter(Boolean).join(' ')

  return (
    <div
      className={className}
      data-testid={`log-${block.id}`}
      data-numerator={block.numerator}
      data-denominator={block.denominator}
      data-zone={block.zone}
      data-splittable={String(block.splittable)}
      data-locked={String(block.locked)}
      aria-label={`${fractionLabel} log${block.splittable && block.zone === 'build' ? ' — double-tap to chop' : ''}`}
      onClick={handleClick}
      style={widthStyle}
    >
      <span className="log__label">{fractionLabel}</span>
    </div>
  )
}
