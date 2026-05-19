import type { LessonState, BlockState, FractionValue } from './types'
import type { LessonEvent } from './lessonEvents'
import { CHECK_CHALLENGES } from './checkChallenges'
import { initLessonState, makeInventory, INSTRUCT_INVENTORY } from './initialState'
import {
  validateBuildZone,
  detectWrongType,
  isSolutionValid,
  computeShortfallBracket,
  computeOverflowBracket,
} from '../utils/fractionMath'
import { RIVER_WIDTH_PX } from '../constants'

// ── Block helpers ──────────────────────────────────────────────────────────

function splitBlock(blocks: BlockState[], blockId: string): BlockState[] {
  const target = blocks.find(b => b.id === blockId)
  if (!target || !target.splittable) return blocks

  const childNum   = target.numerator
  const childDenom = target.denominator * 2
  const childWidth = Math.round((childNum / childDenom) * RIVER_WIDTH_PX)
  const splittable = childDenom < 4   // halves can be chopped, quarters cannot

  const childA: BlockState = {
    id:          `${blockId}-a`,
    numerator:   childNum,
    denominator: childDenom,
    pixelWidth:  childWidth,
    zone:        target.zone,
    slot:        target.slot,
    splittable,
    selected:    false,
    locked:      false,
  }
  const childB: BlockState = { ...childA, id: `${blockId}-b`, slot: null, zone: 'dock' }

  return blocks
    .filter(b => b.id !== blockId)
    .concat([childA, childB])
}

function snapBlock(blocks: BlockState[], blockId: string, slot: number): BlockState[] {
  return blocks.map(b =>
    b.id === blockId ? { ...b, zone: 'build', slot } : b
  )
}

function returnBlock(blocks: BlockState[], blockId: string): BlockState[] {
  return blocks.map(b =>
    b.id === blockId ? { ...b, zone: 'dock', slot: null } : b
  )
}

function placedFractions(state: LessonState): FractionValue[] {
  return state.buildZoneLogs
    .map(id => state.blocks.find(b => b.id === id))
    .filter((b): b is BlockState => b !== undefined)
    .map(b => ({ numerator: b.numerator, denominator: b.denominator }))
}

function makeChallengeBlocks(challengeIndex: number): BlockState[] {
  const challenge = CHECK_CHALLENGES[challengeIndex]
  const templates = challenge.dockInventory.map(f => ({
    numerator:   f.numerator,
    denominator: f.denominator,
    pixelWidth:  Math.round((f.numerator / f.denominator) * RIVER_WIDTH_PX),
    zone:        'dock' as const,
    slot:        null,
    splittable:  f.denominator < 4,
    selected:    false,
    locked:      false,
  }))
  return makeInventory(templates)
}

// ── Dialogue node selectors ────────────────────────────────────────────────

function shortfallNode(
  placed:    FractionValue[],
  gate:      FractionValue,
): string {
  const bracket = computeShortfallBracket(placed, gate)
  if (bracket === 'empty')    return 'CHECK_ERROR_SHORT_1_EMPTY'
  if (bracket === 'one_unit') return 'CHECK_ERROR_SHORT_1_ONE_UNIT'
  return 'CHECK_ERROR_SHORT_1_PARTIAL'
}

function overflowNode(
  placed:         FractionValue[],
  gate:           FractionValue,
  challengeIndex: number,
): string {
  const bracket = computeOverflowBracket(placed, gate, challengeIndex)
  if (bracket === 'whole_log') return 'CHECK_ERROR_LONG_1_WHOLE'
  if (bracket === 'decoy_c2') return 'CHECK_ERROR_LONG_1_DECOY_C2'
  return 'CHECK_ERROR_LONG_1_ONE_UNIT'
}

// ── Log entry helpers ──────────────────────────────────────────────────────

function appendLog(state: LessonState, event: string, correct: boolean): LessonState {
  return {
    ...state,
    log: [
      ...state.log,
      {
        timestamp: Date.now(),
        event,
        nodeId:   state.dialogueNodeId,
        phase:    state.phase,
        correct,
        attempt:  state.attemptCount,
        solution: null,
      },
    ],
  }
}

// ── Main reducer ───────────────────────────────────────────────────────────

export function lessonReducer(state: LessonState, event: LessonEvent): LessonState {
  switch (state.phase) {

    // ────────────────────────────────────────────────────────────────────
    case 'BOOT': {
      if (event.type !== 'START') return state
      return {
        ...state,
        phase:            'EXPLORE',
        dialogueNodeId:   'EXPLORE_INTRO',
        audioUnlocked:    true,
        exploreStartTime: Date.now(),
      }
    }

    // ────────────────────────────────────────────────────────────────────
    case 'EXPLORE': {
      switch (event.type) {
        case 'EXPLORE_TIMEOUT':
        case 'EXPLORE_COMPLETE':
          return { ...state, phase: 'EXPLORE_END', dialogueNodeId: 'EXPLORE_END' }

        case 'EXPLORE_INTERACTION': {
          if (state.exploreInteractions.includes(event.blockId)) return state
          return {
            ...state,
            exploreInteractions: [...state.exploreInteractions, event.blockId],
          }
        }

        case 'CHOP':
          return { ...state, blocks: splitBlock(state.blocks, event.blockId) }

        case 'LOG_SNAPPED':
          return { ...state, blocks: snapBlock(state.blocks, event.blockId, event.slot) }

        case 'LOG_RETURNED':
          return { ...state, blocks: returnBlock(state.blocks, event.blockId) }

        default: return state
      }
    }

    // ────────────────────────────────────────────────────────────────────
    case 'EXPLORE_END': {
      if (event.type !== 'DIALOGUE_ADVANCE') return state
      return {
        ...state,
        phase:          'INSTRUCT_INTRO',
        dialogueNodeId: 'INSTRUCT_GATE_INTRO',
        blocks:         makeInventory(INSTRUCT_INVENTORY),
        buildZoneLogs:  [],
      }
    }

    // ────────────────────────────────────────────────────────────────────
    case 'INSTRUCT_INTRO': {
      if (event.type !== 'DIALOGUE_ADVANCE') return state
      return {
        ...state,
        phase:          'INSTRUCT_BUILD',
        dialogueNodeId: 'INSTRUCT_BUILD_PROMPT',
      }
    }

    // ────────────────────────────────────────────────────────────────────
    case 'INSTRUCT_BUILD': {
      switch (event.type) {
        case 'LOG_SNAPPED':
          return {
            ...state,
            blocks:        snapBlock(state.blocks, event.blockId, event.slot),
            buildZoneLogs: [...state.buildZoneLogs, event.blockId],
          }

        case 'LOG_RETURNED':
          return {
            ...state,
            blocks:        returnBlock(state.blocks, event.blockId),
            buildZoneLogs: state.buildZoneLogs.filter(id => id !== event.blockId),
          }

        case 'CHOP':
          return { ...state, blocks: splitBlock(state.blocks, event.blockId) }

        case 'CHECK_SUBMIT': {
          const placed = placedFractions(state)

          // Wrong-type is checked first — takes priority over too_short/too_long
          if (detectWrongType(placed, state.phase)) {
            return {
              ...state,
              phase:          'INSTRUCT_ERROR',
              errorType:      'wrong_type',
              attemptCount:   state.attemptCount + 1,
              dialogueNodeId: 'INSTRUCT_ERROR_WRONG_TYPE',
            }
          }

          const result = validateBuildZone(placed, state.referenceGate)

          if (result === 'correct') {
            return appendLog({
              ...state,
              phase:          'INSTRUCT_SUCCESS',
              dialogueNodeId: 'INSTRUCT_CORRECT',
            }, 'instruct_correct', true)
          }

          if (result === 'too_short') {
            return {
              ...state,
              phase:          'INSTRUCT_ERROR',
              errorType:      'too_short',
              attemptCount:   state.attemptCount + 1,
              dialogueNodeId: 'INSTRUCT_ERROR_SHORT',
            }
          }

          // too_long
          return {
            ...state,
            phase:          'INSTRUCT_ERROR',
            errorType:      'too_long',
            attemptCount:   state.attemptCount + 1,
            dialogueNodeId: 'INSTRUCT_ERROR_LONG',
          }
        }

        default: return state
      }
    }

    // ────────────────────────────────────────────────────────────────────
    case 'INSTRUCT_ERROR': {
      if (event.type !== 'DIALOGUE_ADVANCE') return state

      if (state.attemptCount >= 2) {
        // Too many misses — replay the whole instruction
        return {
          ...state,
          phase:          'INSTRUCT_INTRO',
          dialogueNodeId: 'INSTRUCT_GATE_INTRO',
          attemptCount:   0,
          blocks:         makeInventory(INSTRUCT_INVENTORY),
          buildZoneLogs:  [],
          errorType:      null,
        }
      }

      // Still within attempts — return to build zone
      return {
        ...state,
        phase:          'INSTRUCT_BUILD',
        dialogueNodeId: 'INSTRUCT_BUILD_PROMPT',
        buildZoneLogs:  [],
        errorType:      null,
        // Move all build-zone blocks back to dock
        blocks: state.blocks.map(b =>
          b.zone === 'build' ? { ...b, zone: 'dock', slot: null } : b
        ),
      }
    }

    // ────────────────────────────────────────────────────────────────────
    case 'INSTRUCT_SUCCESS': {
      if (event.type !== 'DIALOGUE_ADVANCE') return state
      return {
        ...state,
        phase:          'CHECK_INTRO',
        dialogueNodeId: 'CHECK_INTRO',
      }
    }

    // ────────────────────────────────────────────────────────────────────
    case 'CHECK_INTRO': {
      if (event.type !== 'DIALOGUE_ADVANCE') return state
      const firstChallenge = CHECK_CHALLENGES[0]
      return {
        ...state,
        phase:          'CHECK_ACTIVE',
        dialogueNodeId: 'CHECK_CHALLENGE_START',
        challengeIndex: 0,
        referenceGate:  firstChallenge.referenceGate,
        blocks:         makeChallengeBlocks(0),
        buildZoneLogs:  [],
        attemptCount:   0,
      }
    }

    // ────────────────────────────────────────────────────────────────────
    case 'CHECK_ACTIVE': {
      switch (event.type) {
        case 'LOG_SNAPPED':
          return {
            ...state,
            blocks:        snapBlock(state.blocks, event.blockId, event.slot),
            buildZoneLogs: [...state.buildZoneLogs, event.blockId],
          }

        case 'LOG_RETURNED':
          return {
            ...state,
            blocks:        returnBlock(state.blocks, event.blockId),
            buildZoneLogs: state.buildZoneLogs.filter(id => id !== event.blockId),
          }

        case 'CHOP':
          return { ...state, blocks: splitBlock(state.blocks, event.blockId) }

        case 'CHECK_SUBMIT': {
          const placed    = placedFractions(state)
          const challenge = CHECK_CHALLENGES[state.challengeIndex]

          if (isSolutionValid(placed, challenge)) {
            const successNode = `CHECK_CORRECT_C${state.challengeIndex}`
            return appendLog({
              ...state,
              phase:          'CHECK_SUCCESS',
              challengesPassed: state.challengesPassed + 1,
              attemptCount:   0,
              dialogueNodeId: successNode,
            }, 'check_correct', true)
          }

          // Invalid — determine error phase and dialogue
          const newTotalAttempts = state.totalAttempts + 1

          if (state.totalAttempts >= 5) {
            // Intervention: too many total attempts across all challenges
            return {
              ...state,
              phase:         'CHECK_ERROR_1',
              attemptCount:  state.attemptCount + 1,
              totalAttempts: newTotalAttempts,
              dialogueNodeId: 'CHECK_INTERVENTION',
            }
          }

          if (state.attemptCount === 0) {
            // First error on this challenge — give a specific hint
            const result = validateBuildZone(placed, state.referenceGate)
            const node = result === 'too_short'
              ? shortfallNode(placed, state.referenceGate)
              : overflowNode(placed, state.referenceGate, state.challengeIndex)

            return {
              ...state,
              phase:         'CHECK_ERROR_1',
              attemptCount:  1,
              totalAttempts: newTotalAttempts,
              dialogueNodeId: node,
            }
          }

          // Second error — ghost overlay hint, then back to INSTRUCT
          return {
            ...state,
            phase:         'CHECK_ERROR_2',
            attemptCount:  state.attemptCount + 1,
            totalAttempts: newTotalAttempts,
            dialogueNodeId: 'CHECK_ERROR_2_GHOST',
          }
        }

        default: return state
      }
    }

    // ────────────────────────────────────────────────────────────────────
    case 'CHECK_ERROR_1': {
      if (event.type !== 'DIALOGUE_ADVANCE') return state
      return {
        ...state,
        phase:          'CHECK_ACTIVE',
        dialogueNodeId: 'CHECK_CHALLENGE_START',
        buildZoneLogs:  [],
        blocks: state.blocks.map(b =>
          b.zone === 'build' ? { ...b, zone: 'dock', slot: null } : b
        ),
      }
    }

    // ────────────────────────────────────────────────────────────────────
    case 'CHECK_ERROR_2': {
      if (event.type !== 'DIALOGUE_ADVANCE') return state
      return {
        ...state,
        phase:          'INSTRUCT_INTRO',
        dialogueNodeId: 'INSTRUCT_GATE_INTRO',
        attemptCount:   0,
        blocks:         makeInventory(INSTRUCT_INVENTORY),
        buildZoneLogs:  [],
        errorType:      null,
      }
    }

    // ────────────────────────────────────────────────────────────────────
    case 'CHECK_SUCCESS': {
      if (event.type !== 'DIALOGUE_ADVANCE') return state

      if (state.challengesPassed >= 3) {
        return {
          ...state,
          phase:          'WIN',
          dialogueNodeId: 'WIN_SEQUENCE',
        }
      }

      // Advance to next challenge
      const nextIndex = state.challengeIndex + 1
      const nextChallenge = CHECK_CHALLENGES[nextIndex]
      return {
        ...state,
        phase:          'CHECK_ACTIVE',
        challengeIndex: nextIndex,
        referenceGate:  nextChallenge.referenceGate,
        blocks:         makeChallengeBlocks(nextIndex),
        buildZoneLogs:  [],
        attemptCount:   0,
        dialogueNodeId: 'CHECK_CHALLENGE_START',
      }
    }

    // ────────────────────────────────────────────────────────────────────
    case 'WIN': {
      if (event.type !== 'PLAY_AGAIN') return state
      return initLessonState()
    }

    // ── Catch-all: silently ignore unexpected events ──────────────────
    default:
      return state
  }
}
