import type { BuckyState } from '../state/types'

/** Single illustrated beaver mascot used across all dialogue states.
 *  Per-state animated variants were causing blank renders on some
 *  states — we collapse to one stable SVG file. Bucky's "expression"
 *  per state is communicated by the state class on the wrapper (CSS
 *  animations in kawaii-theme.css apply a nudge/bounce/etc.). */
const MASCOT_SRC = '/beaver-mascot.svg'

export const BEAVER_MASCOT_BY_STATE: Record<BuckyState, string> = {
  idle:          MASCOT_SRC,
  excited:       MASCOT_SRC,
  thinking:      MASCOT_SRC,
  'chop-swing':  MASCOT_SRC,
  'build-stack': MASCOT_SRC,
  encouraging:   MASCOT_SRC,
  disappointed:  MASCOT_SRC,
  celebrating:   MASCOT_SRC,
}

export function beaverMascotSrc(_state: BuckyState): string {
  return MASCOT_SRC
}
