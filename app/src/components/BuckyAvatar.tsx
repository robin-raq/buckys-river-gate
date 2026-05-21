import type { BuckyState } from '../state/types'
import { buckyStateClass } from '../utils/buckyStateMap'
import { BuckyBeaverArt } from './BuckyBeaverArt'

export interface BuckyAvatarProps {
  buckyState: BuckyState
  className?: string
  /** Portrait width in px. Height scales to match SVG aspect (160:180). */
  size?: number
}

const PORTRAIT_ASPECT = 180 / 160

export function BuckyAvatar({ buckyState, className, size = 160 }: BuckyAvatarProps) {
  const stateClass = buckyStateClass(buckyState)
  const classes = ['bucky-avatar', stateClass, className].filter(Boolean).join(' ')
  const height = Math.round(size * PORTRAIT_ASPECT)

  return (
    <div
      className={classes}
      data-bucky-state={buckyState}
      data-testid="bucky-avatar"
      role="img"
      aria-label={`Bucky the Builder, ${buckyState}`}
      style={{ width: size, height, flexShrink: 0 }}
    >
      <BuckyBeaverArt state={buckyState} />
    </div>
  )
}
