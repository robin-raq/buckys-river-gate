import type { LessonState, BlockState } from './types'
import { RIVER_WIDTH_PX } from '../constants'

// ── EXPLORE inventory ──────────────────────────────────────────────────────
// Just the whole log. EXPLORE_INTRO says "see how many pieces you can
// make!" — pre-shipping pieces would short-circuit that discovery.
// The kid earns halves and quarters by chopping; that IS the lesson.

export const EXPLORE_INVENTORY: Omit<BlockState, 'id'>[] = [
  { numerator: 1, denominator: 1, pixelWidth: RIVER_WIDTH_PX, zone: 'dock', slot: null, splittable: true, selected: false, locked: false },
]

// ── INSTRUCT inventory ─────────────────────────────────────────────────────
// Just two 1/4 logs. The INSTRUCT phase's pedagogical job is to make the
// kid PHYSICALLY CONSTRUCT the equivalence "2 × 1/4 = 1/2" — if we shipped
// a 1/2 log, kids would take the trivial path and never enact the concept.
// (Other error paths like wrong_type / too_long are unreachable here as a
// result; they're still exercised in the CHECK phase where inventories
// include multiple piece sizes.)

export const INSTRUCT_INVENTORY: Omit<BlockState, 'id'>[] = [
  { numerator: 1, denominator: 4, pixelWidth: RIVER_WIDTH_PX / 4, zone: 'dock', slot: null, splittable: false, selected: false, locked: false },
  { numerator: 1, denominator: 4, pixelWidth: RIVER_WIDTH_PX / 4, zone: 'dock', slot: null, splittable: false, selected: false, locked: false },
]

// ── Block factory ──────────────────────────────────────────────────────────

let _idCounter = 0
export function makeBlock(template: Omit<BlockState, 'id'>): BlockState {
  return { id: `block-${++_idCounter}`, ...template }
}

export function makeInventory(templates: Omit<BlockState, 'id'>[]): BlockState[] {
  return templates.map(makeBlock)
}

// ── Initial state ──────────────────────────────────────────────────────────

export function initLessonState(): LessonState {
  return {
    phase:               'BOOT',
    dialogueNodeId:      'BOOT_SCREEN',
    attemptCount:        0,
    totalAttempts:       0,
    blocks:              makeInventory(EXPLORE_INVENTORY),
    buildZoneLogs:       [],
    referenceGate:       { numerator: 1, denominator: 2 },
    challengeIndex:      0,
    challengesPassed:    0,
    exploreInteractions: [],
    exploreStartTime:    0,
    audioUnlocked:       false,
    errorType:           null,
    chopCount:           0,
    log:                 [],
    history:             [],
    bonusOffered:        false,
  }
}
