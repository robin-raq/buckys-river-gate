import type { LessonState, BlockState } from './types'
import { RIVER_WIDTH_PX } from '../constants'

// ── EXPLORE inventory ──────────────────────────────────────────────────────
// Two whole logs + one half log available in free-play mode.

export const EXPLORE_INVENTORY: Omit<BlockState, 'id'>[] = [
  { numerator: 1, denominator: 1, pixelWidth: RIVER_WIDTH_PX,       zone: 'dock', slot: null, splittable: true,  selected: false, locked: false },
  { numerator: 1, denominator: 1, pixelWidth: RIVER_WIDTH_PX,       zone: 'dock', slot: null, splittable: true,  selected: false, locked: false },
  { numerator: 1, denominator: 2, pixelWidth: RIVER_WIDTH_PX / 2,   zone: 'dock', slot: null, splittable: true,  selected: false, locked: false },
]

// ── INSTRUCT inventory ─────────────────────────────────────────────────────
// One half log + two quarter logs — enough to demonstrate decomposition.

export const INSTRUCT_INVENTORY: Omit<BlockState, 'id'>[] = [
  { numerator: 1, denominator: 2, pixelWidth: RIVER_WIDTH_PX / 2,   zone: 'dock', slot: null, splittable: true,  selected: false, locked: false },
  { numerator: 1, denominator: 4, pixelWidth: RIVER_WIDTH_PX / 4,   zone: 'dock', slot: null, splittable: false, selected: false, locked: false },
  { numerator: 1, denominator: 4, pixelWidth: RIVER_WIDTH_PX / 4,   zone: 'dock', slot: null, splittable: false, selected: false, locked: false },
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
    log:                 [],
  }
}
