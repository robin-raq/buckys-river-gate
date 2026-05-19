import type { BuckyState } from '../state/types'
import { buckyStateClass, BUCKY_EMOJI } from '../utils/buckyStateMap'

export interface BuckyAvatarProps {
  buckyState: BuckyState
  className?: string
  /** Diameter of the avatar circle in px. Defaults to 72. Emoji scales proportionally. */
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
      style={{
        width:          size,
        height:         size,
        borderRadius:   '50%',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        fontSize:       `${Math.round(size * 0.55)}px`,
        flexShrink:     0,
      }}
      aria-hidden
    >
      {BUCKY_EMOJI[buckyState]}
    </div>
  )
}
