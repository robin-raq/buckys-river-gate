import type { Phase } from '../state/types'
import type { LessonPhase } from '../components/PhaseDots'

/** Maps FSM phase to the three lesson progress dots (EXPLORE → INSTRUCT → CHECK). */
export function phaseToLessonPhase(phase: Phase): LessonPhase {
  if (
    phase === 'BOOT'
    || phase === 'DEMO'
    || phase === 'EXPLORE'
    || phase === 'EXPLORE_END'
  ) {
    return 'EXPLORE'
  }
  if (phase.startsWith('INSTRUCT')) return 'INSTRUCT'
  return 'CHECK'
}
