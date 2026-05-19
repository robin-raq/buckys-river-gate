import type { BuckyState } from '../state/types'
import { buckyStateClass } from '../utils/buckyStateMap'
import { BuckyBeaverArt } from './BuckyBeaverArt'

export interface BuckyAvatarProps {
  buckyState: BuckyState
  className?: string
  /** Diameter of the avatar circle in px. Defaults to 72. */
  size?: number
}

export function BuckyAvatar({ buckyState, className, size = 72 }: BuckyAvatarProps) {
  const stateClass = buckyStateClass(buckyState)
  const classes = ['bucky-avatar', stateClass, className].filter(Boolean).join(' ')

  return (
    <div
      className={classes}
      data-bucky-state={buckyState}
      data-testid="bucky-avatar"
      role="img"
      aria-label={`Bucky the Builder, ${buckyState}`}
      style={{
        width:        size,
        height:       size,
        borderRadius: '50%',
        flexShrink:   0,
        overflow:     'visible',
      }}
    >
      <BuckyBeaverArt state={buckyState} />
    </div>
  )
}
