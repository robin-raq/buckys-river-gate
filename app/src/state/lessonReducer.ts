import type { LessonState, BlockState, FractionValue } from './types'
import type { LessonEvent } from './lessonEvents'
import { CHECK_CHALLENGES } from './checkChallenges'
import { initLessonState, makeBlock, makeInventory, INSTRUCT_INVENTORY, EXPLORE_INVENTORY } from './initialState'
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
    // Inherit lock state — DEMO blocks are locked (Bucky narrates, no user
    // interaction); user-placed blocks are unlocked (kid can re-chop).
    locked:      target.locked,
  }
  // BOTH children inherit the parent's zone — chopping a log in the river
  // produces two pieces in the river (so the kid sees "1/1 → 1/2 + 1/2"
  // happen in place). Earlier this forced childB to 'dock', which made
  // the second half disappear from the river visually.
  const childB: BlockState = { ...childA, id: `${blockId}-b` }

  // Splice the children into the parent's slot so the visual left→right
  // order is preserved. LessonScreen renders `blocks.filter(zone==='build')`
  // in array order via flex, so appending children to the end would push
  // un-split siblings into earlier visual positions — chopping the LEFT
  // half would visually appear as the RIGHT side splitting.
  const idx = blocks.findIndex(b => b.id === blockId)
  return [
    ...blocks.slice(0, idx),
    childA,
    childB,
    ...blocks.slice(idx + 1),
  ]
}

/** When a block in the river is chopped, the buildZoneLogs array (which
 *  tracks order of placed pieces) needs both new child IDs in the same
 *  slot the parent occupied — otherwise CHECK validation undercounts. */
function chopBuildZoneLogs(
  buildZoneLogs: string[],
  parentId: string,
): string[] {
  const idx = buildZoneLogs.indexOf(parentId)
  if (idx === -1) return buildZoneLogs
  return [
    ...buildZoneLogs.slice(0, idx),
    `${parentId}-a`,
    `${parentId}-b`,
    ...buildZoneLogs.slice(idx + 1),
  ]
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

/**
 * Advance from CHECK_SUCCESS to the next challenge — loads its inventory,
 * resets attempt counters, and lands on CHECK_CHALLENGE_START. Shared
 * between the default DIALOGUE_ADVANCE path and the BONUS_DECLINED path.
 */
function advanceToNextChallenge(state: LessonState): LessonState {
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

/**
 * Strip the `history` field from a snapshot so the history stack never
 * recurses into itself (which would blow up state size geometrically).
 */
function snapshotOf(state: LessonState): import('./types').HistorySnapshot {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { history: _h, ...rest } = state
  return rest
}

export function lessonReducer(state: LessonState, event: LessonEvent): LessonState {
  // History-rewind is handled at the outermost layer so individual phase
  // cases never need to know about it. Pops the most recent snapshot and
  // restores it, preserving the rest of the (now-shorter) history stack.
  if (event.type === 'DIALOGUE_REWIND') {
    if (state.history.length === 0) return state
    const prev = state.history[state.history.length - 1]
    return { ...prev, history: state.history.slice(0, -1) }
  }

  const next = innerReducer(state, event)

  // History-push: only when DIALOGUE_ADVANCE actually moved us. Wrapping
  // ADVANCE here keeps the inner reducer free of history bookkeeping.
  if (event.type === 'DIALOGUE_ADVANCE' && next !== state) {
    return {
      ...next,
      history: [...state.history, snapshotOf(state)],
    }
  }
  return next
}

function innerReducer(state: LessonState, event: LessonEvent): LessonState {
  switch (state.phase) {

    // ────────────────────────────────────────────────────────────────────
    case 'BOOT': {
      if (event.type !== 'START') return state
      return {
        ...state,
        phase:          'DEMO',
        dialogueNodeId: 'DEMO_INTRO',
        audioUnlocked:  true,
        blocks:         [],   // river is empty until Bucky places the demo log
      }
    }

    // ────────────────────────────────────────────────────────────────────
    // DEMO: passive slideshow — Bucky demonstrates the fraction hierarchy.
    // Three chop moments mutate blocks:
    //   DEMO_CHOP_1: 1×(1/1) → 2×(1/2)
    //   DEMO_CHOP_2: left 1/2 → 2×(1/4)  [right 1/2 stays]
    //   DEMO_CHOP_3: right 1/2 → 2×(1/4) [4 quarters total]
    // All demo blocks are locked (student cannot interact).
    // ────────────────────────────────────────────────────────────────────
    case 'DEMO': {
      if (event.type !== 'DIALOGUE_ADVANCE') return state

      const W = RIVER_WIDTH_PX
      // splittable mirrors splitBlock's own rule: denominator < 4 means
      // it can still be chopped (whole → halves; halves → quarters; but
      // quarters are the smallest piece, not chop-able further). DEMO
      // blocks need splittable=true so the reducer's DEMO_CHOP_N cases
      // can call splitBlock and produce `-a` / `-b` child IDs.
      const lockedBlock = (n: number, d: number, slot: number) =>
        makeBlock({ numerator: n, denominator: d, pixelWidth: Math.round((n / d) * W),
                    zone: 'build', slot, splittable: d < 4, selected: false, locked: true })

      switch (state.dialogueNodeId) {

        case 'DEMO_INTRO': {
          // Place a locked 1/1 whole log into the build zone
          return { ...state, dialogueNodeId: 'DEMO_SHOW_WHOLE', blocks: [lockedBlock(1, 1, 0)] }
        }

        case 'DEMO_SHOW_WHOLE':
          return { ...state, dialogueNodeId: 'DEMO_CHOP_1' }

        case 'DEMO_CHOP_1': {
          // Split the whole log via splitBlock so the resulting children
          // get `<id>-a` / `<id>-b` suffixes — the axe-swing animation
          // detector keys off these IDs, so the chop visual fires here too.
          const whole = state.blocks.find(b => b.denominator === 1)!
          return {
            ...state,
            dialogueNodeId: 'DEMO_SHOW_HALVES',
            blocks: splitBlock(state.blocks, whole.id),
          }
        }

        case 'DEMO_SHOW_HALVES':
          return { ...state, dialogueNodeId: 'DEMO_CHOP_2' }

        case 'DEMO_CHOP_2': {
          // Split the LEFT half → 2 quarters; right half stays. splitBlock
          // filters the parent and concats the two children — the right
          // half is preserved untouched.
          const halves = state.blocks.filter(b => b.denominator === 2)
          const leftHalf = halves[0]!
          return {
            ...state,
            dialogueNodeId: 'DEMO_SHOW_FIRST_QUARTERS',
            blocks: splitBlock(state.blocks, leftHalf.id),
          }
        }

        case 'DEMO_SHOW_FIRST_QUARTERS':
          return { ...state, dialogueNodeId: 'DEMO_CHOP_3' }

        case 'DEMO_CHOP_3': {
          // Split the remaining (right) half → 2 quarters. Now 4 quarters
          // total in the river. splitBlock again gives child IDs with the
          // `-a` / `-b` suffix that the axe-swing detector recognises.
          const remainingHalf = state.blocks.find(b => b.denominator === 2)
          if (!remainingHalf) return state
          return {
            ...state,
            dialogueNodeId: 'DEMO_SHOW_ALL_QUARTERS',
            blocks: splitBlock(state.blocks, remainingHalf.id),
          }
        }

        case 'DEMO_SHOW_ALL_QUARTERS':
          return { ...state, dialogueNodeId: 'DEMO_REVIEW_HALF' }

        // Recap beat — "two quarters fit where one half was" with the
        // side-by-side reference proof. This is now the FINAL DEMO node:
        // its DIALOGUE_ADVANCE flips the phase to EXPLORE, swaps in the
        // dock whole-log inventory, and stamps exploreStartTime. Earlier
        // a second recap (DEMO_REVIEW_WHOLE) sat between this beat and
        // EXPLORE — it was cut as redundant with DEMO_SHOW_ALL_QUARTERS.
        case 'DEMO_REVIEW_HALF':
          return {
            ...state,
            phase:            'EXPLORE',
            dialogueNodeId:   'EXPLORE_INTRO',
            blocks:           makeInventory(EXPLORE_INVENTORY),
            exploreStartTime: Date.now(),
          }

        default: return state
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

        case 'CHOP': {
          const newBlocks = splitBlock(state.blocks, event.blockId)
          const didChop   = newBlocks !== state.blocks
          return {
            ...state,
            blocks:        newBlocks,
            buildZoneLogs: didChop ? chopBuildZoneLogs(state.buildZoneLogs, event.blockId) : state.buildZoneLogs,
            chopCount:     didChop ? state.chopCount + 1 : state.chopCount,
          }
        }

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

        case 'CHOP': {
          const newBlocks = splitBlock(state.blocks, event.blockId)
          const didChop   = newBlocks !== state.blocks
          return {
            ...state,
            blocks:        newBlocks,
            buildZoneLogs: didChop ? chopBuildZoneLogs(state.buildZoneLogs, event.blockId) : state.buildZoneLogs,
            chopCount:     didChop ? state.chopCount + 1 : state.chopCount,
          }
        }

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
      // Two dialogue nodes in this phase:
      // 1. INSTRUCT_CORRECT (autoAdvance) → INSTRUCT_NAME_EQUIVALENCE (the vocabulary moment)
      // 2. INSTRUCT_NAME_EQUIVALENCE (tap to continue) → CHECK_INTRO (phase transition)
      if (state.dialogueNodeId === 'INSTRUCT_CORRECT') {
        return { ...state, dialogueNodeId: 'INSTRUCT_NAME_EQUIVALENCE' }
      }
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

        case 'CHOP': {
          const newBlocks = splitBlock(state.blocks, event.blockId)
          const didChop   = newBlocks !== state.blocks
          return {
            ...state,
            blocks:        newBlocks,
            buildZoneLogs: didChop ? chopBuildZoneLogs(state.buildZoneLogs, event.blockId) : state.buildZoneLogs,
            chopCount:     didChop ? state.chopCount + 1 : state.chopCount,
          }
        }

        case 'CHECK_SUBMIT': {
          const placed    = placedFractions(state)
          const challenge = CHECK_CHALLENGES[state.challengeIndex]

          if (isSolutionValid(placed, challenge)) {
            // Bonus retry: the kid already passed this challenge once
            // and accepted the "try a different way" prompt. Route to
            // the bonus-success beat — do NOT double-count the pass.
            if (state.bonusOffered) {
              return appendLog({
                ...state,
                phase:          'CHECK_SUCCESS',
                attemptCount:   0,
                dialogueNodeId: 'CHECK_BONUS_SUCCESS_C1',
              }, 'check_correct', true)
            }
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
              errorType:     result === 'too_short' ? 'too_short' : 'too_long',
              dialogueNodeId: node,
            }
          }

          // Second error — ghost overlay hint, then back to INSTRUCT
          const result2 = validateBuildZone(placed, state.referenceGate)
          return {
            ...state,
            phase:         'CHECK_ERROR_2',
            attemptCount:  state.attemptCount + 1,
            totalAttempts: newTotalAttempts,
            errorType:     result2 === 'too_short' ? 'too_short' : 'too_long',
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
      // Two dialogue nodes in this phase:
      // 1. CHECK_ERROR_2_GHOST (tap) → CHECK_ERROR_2_RESTART (auto) — shows the ghost hint
      // 2. CHECK_ERROR_2_RESTART (autoAdvance) → INSTRUCT_INTRO — transitional message
      if (state.dialogueNodeId === 'CHECK_ERROR_2_GHOST') {
        return { ...state, dialogueNodeId: 'CHECK_ERROR_2_RESTART' }
      }
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
      // Bonus prompt buttons — kid chooses retry vs skip.
      if (event.type === 'BONUS_ACCEPTED') {
        // Reset the build zone to the challenge's starting inventory
        // so the kid can try a different combination of pieces.
        // dialogueNodeId stays CHECK_BONUS_PROMPT_C1 so the speech
        // bubble keeps the "different way?" framing visible while
        // they build. UI suppresses the buttons during CHECK_ACTIVE.
        return {
          ...state,
          phase:         'CHECK_ACTIVE',
          blocks:        makeChallengeBlocks(state.challengeIndex),
          buildZoneLogs: [],
          attemptCount:  0,
          bonusOffered:  true,
        }
      }
      if (event.type === 'BONUS_DECLINED') {
        return advanceToNextChallenge(state)
      }

      if (event.type !== 'DIALOGUE_ADVANCE') return state

      // Win condition takes precedence at any node.
      if (state.challengesPassed >= 3) {
        return {
          ...state,
          phase:          'WIN',
          dialogueNodeId: 'WIN_SEQUENCE',
        }
      }

      // CHECK_CORRECT_C1 → bonus prompt (only for challenge 1 — the
      // equivalence-defining beat). Other challenges advance directly
      // to the next via the default branch below.
      if (
        state.dialogueNodeId === 'CHECK_CORRECT_C1'
        && state.challengeIndex === 1
      ) {
        return { ...state, dialogueNodeId: 'CHECK_BONUS_PROMPT_C1' }
      }

      // CHECK_BONUS_PROMPT_C1 — buttons drive transitions; ignore
      // any stray DIALOGUE_ADVANCE that might fire here.
      if (state.dialogueNodeId === 'CHECK_BONUS_PROMPT_C1') {
        return state
      }

      // CHECK_BONUS_SUCCESS_C1 auto-advances to the next challenge
      // and resets the bonusOffered flag.
      if (state.dialogueNodeId === 'CHECK_BONUS_SUCCESS_C1') {
        return { ...advanceToNextChallenge(state), bonusOffered: false }
      }

      // Default: any other CHECK_CORRECT_C* node advances to next challenge.
      return advanceToNextChallenge(state)
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
