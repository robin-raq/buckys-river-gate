import type { BuckyState } from '../state/types'
import { buckyStateClass, BUCKY_EMOJI } from '../utils/buckyStateMap'

export interface BuckyAvatarProps {
  buckyState: BuckyState
  className?: string
}

export function BuckyAvatar({ buckyState, className }: BuckyAvatarProps) {
  const stateClass = buckyStateClass(buckyState)
  const classes = ['bucky-avatar', stateClass, className].filter(Boolean).join(' ')

  return (
    <div
      className={classes}
      data-bucky-state={buckyState}
      data-testid="bucky-avatar"
      style={{
        width:          72,
        height:         72,
        borderRadius:   '50%',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        fontSize:       '2.5rem',
        flexShrink:     0,
      }}
      aria-hidden
    >
      {BUCKY_EMOJI[buckyState]}
    </div>
  )
}
