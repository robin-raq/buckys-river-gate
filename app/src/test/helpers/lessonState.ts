import type { LessonState } from '../../state/types'

/** Minimal valid LessonState for component / integration tests. */
export function makeLessonState(overrides: Partial<LessonState> = {}): LessonState {
  return {
    phase:               'INSTRUCT_BUILD',
    dialogueNodeId:      'INSTRUCT_BUILD_PROMPT',
    attemptCount:        0,
    totalAttempts:       0,
    blocks:              [],
    buildZoneLogs:       [],
    referenceGate:       { numerator: 1, denominator: 2 },
    challengeIndex:      0,
    challengesPassed:    0,
    exploreInteractions: [],
    exploreStartTime:    0,
    audioUnlocked:       true,
    errorType:           null,
    log:                 [],
    ...overrides,
  }
}
