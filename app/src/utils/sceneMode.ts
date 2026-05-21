import type { Phase } from '../state/types'

/** Phases that use the chop mockup PNG + overlay canvas. */
export function useMockupScene(phase: Phase): boolean {
  return phase === 'DEMO' || phase === 'EXPLORE' || phase === 'EXPLORE_END'
}
