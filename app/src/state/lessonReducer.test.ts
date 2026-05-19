import { describe, it, expect, beforeEach } from 'vitest'
import { lessonReducer }  from './lessonReducer'
import { initLessonState, makeInventory } from './initialState'
import { CHECK_CHALLENGES } from './checkChallenges'
import type { LessonState } from './types'
import type { LessonEvent } from './lessonEvents'

// ── Helpers ────────────────────────────────────────────────────────────────

function dispatch(state: LessonState, event: LessonEvent): LessonState {
  return lessonReducer(state, event)
}

/** Fast-forward state to a target phase by chaining real events. */
function stateAt(phase: LessonState['phase']): LessonState {
  let s = initLessonState()

  if (phase === 'BOOT') return s

  // BOOT → DEMO
  s = dispatch(s, { type: 'START' })
  if (phase === 'DEMO') return s

  // DEMO → EXPLORE (10 DIALOGUE_ADVANCE events, one per demo slide)
  for (let i = 0; i < 10; i++) s = dispatch(s, { type: 'DIALOGUE_ADVANCE' })
  if (phase === 'EXPLORE') return s

  // EXPLORE → EXPLORE_END
  s = dispatch(s, { type: 'EXPLORE_TIMEOUT' })
  if (phase === 'EXPLORE_END') return s

  // EXPLORE_END → INSTRUCT_INTRO
  s = dispatch(s, { type: 'DIALOGUE_ADVANCE' })
  if (phase === 'INSTRUCT_INTRO') return s

  // INSTRUCT_INTRO → INSTRUCT_BUILD
  s = dispatch(s, { type: 'DIALOGUE_ADVANCE' })
  if (phase === 'INSTRUCT_BUILD') return s

  throw new Error(`stateAt: unsupported phase shortcut "${phase}". Build it manually.`)
}

/** Place a half-log (1/2) into the INSTRUCT build zone so CHECK_SUBMIT fires. */
function withHalfInBuildZone(s: LessonState): LessonState {
  const halfBlock = s.blocks.find(b => b.numerator === 1 && b.denominator === 2)!
  let next = dispatch(s, { type: 'LOG_SNAPPED', blockId: halfBlock.id, slot: 0 })
  return next
}

/** Place two quarter logs into the INSTRUCT build zone so CHECK_SUBMIT is correct. */
function withTwoQuartersInBuildZone(s: LessonState): LessonState {
  const quarters = s.blocks.filter(b => b.denominator === 4)
  let next = dispatch(s, { type: 'LOG_SNAPPED', blockId: quarters[0].id, slot: 0 })
  next     = dispatch(next, { type: 'LOG_SNAPPED', blockId: quarters[1].id, slot: 1 })
  return next
}

// ── BOOT ───────────────────────────────────────────────────────────────────

describe('BOOT phase', () => {
  it('START → DEMO, audioUnlocked = true', () => {
    const s = dispatch(initLessonState(), { type: 'START' })
    expect(s.phase).toBe('DEMO')
    expect(s.audioUnlocked).toBe(true)
  })

  it('START sets dialogueNodeId to DEMO_INTRO', () => {
    const s = dispatch(initLessonState(), { type: 'START' })
    expect(s.dialogueNodeId).toBe('DEMO_INTRO')
  })

  it('START begins with empty river (no blocks in build zone)', () => {
    const s = dispatch(initLessonState(), { type: 'START' })
    expect(s.blocks.filter(b => b.zone === 'build')).toHaveLength(0)
  })

  it('unknown event in BOOT → state unchanged', () => {
    const init = initLessonState()
    const s    = dispatch(init, { type: 'DIALOGUE_ADVANCE' })
    expect(s.phase).toBe('BOOT')
  })
})

// ── DEMO ────────────────────────────────────────────────────────────────────

describe('DEMO phase', () => {
  let demo: LessonState
  beforeEach(() => { demo = stateAt('DEMO') })

  function adv(s: LessonState, n = 1): LessonState {
    for (let i = 0; i < n; i++) s = dispatch(s, { type: 'DIALOGUE_ADVANCE' })
    return s
  }

  it('non-DIALOGUE_ADVANCE event is ignored', () => {
    const s = dispatch(demo, { type: 'EXPLORE_TIMEOUT' })
    expect(s.phase).toBe('DEMO')
    expect(s.dialogueNodeId).toBe('DEMO_INTRO')
  })

  // ── Slide 1: DEMO_INTRO → DEMO_SHOW_WHOLE ───────────────────────────────
  it('slide 1: DEMO_INTRO → DEMO_SHOW_WHOLE adds a 1/1 whole log to build zone', () => {
    const s = adv(demo)
    expect(s.dialogueNodeId).toBe('DEMO_SHOW_WHOLE')
    const build = s.blocks.filter(b => b.zone === 'build')
    expect(build).toHaveLength(1)
    expect(build[0].denominator).toBe(1)
    expect(build[0].locked).toBe(true)
  })

  // ── Slide 2: DEMO_SHOW_WHOLE → DEMO_CHOP_1 ──────────────────────────────
  it('slide 2: DEMO_SHOW_WHOLE → DEMO_CHOP_1 — no block change yet', () => {
    const s = adv(demo, 2)
    expect(s.dialogueNodeId).toBe('DEMO_CHOP_1')
    expect(s.blocks.filter(b => b.zone === 'build')).toHaveLength(1)
  })

  // ── Slide 3: DEMO_CHOP_1 → DEMO_SHOW_HALVES (1 whole → 2 halves) ────────
  it('slide 3: DEMO_CHOP_1 → DEMO_SHOW_HALVES splits whole into two 1/2 logs', () => {
    const s = adv(demo, 3)
    expect(s.dialogueNodeId).toBe('DEMO_SHOW_HALVES')
    const build = s.blocks.filter(b => b.zone === 'build')
    expect(build).toHaveLength(2)
    expect(build.every(b => b.denominator === 2)).toBe(true)
    expect(build.every(b => b.locked)).toBe(true)
  })

  // ── Slide 4: DEMO_SHOW_HALVES → DEMO_CHOP_2 ─────────────────────────────
  it('slide 4: DEMO_SHOW_HALVES → DEMO_CHOP_2 — blocks unchanged', () => {
    const s = adv(demo, 4)
    expect(s.dialogueNodeId).toBe('DEMO_CHOP_2')
    expect(s.blocks.filter(b => b.zone === 'build')).toHaveLength(2)
  })

  // ── Slide 5: DEMO_CHOP_2 → DEMO_SHOW_FIRST_QUARTERS (left 1/2 → 2×1/4) ─
  it('slide 5: DEMO_CHOP_2 → DEMO_SHOW_FIRST_QUARTERS — left half split into 2 quarters, right half kept', () => {
    const s = adv(demo, 5)
    expect(s.dialogueNodeId).toBe('DEMO_SHOW_FIRST_QUARTERS')
    const build = s.blocks.filter(b => b.zone === 'build')
    expect(build).toHaveLength(3)  // 2 quarters + 1 half
    const quarters = build.filter(b => b.denominator === 4)
    const halves   = build.filter(b => b.denominator === 2)
    expect(quarters).toHaveLength(2)
    expect(halves).toHaveLength(1)
  })

  // ── Slide 6: DEMO_SHOW_FIRST_QUARTERS → DEMO_CHOP_3 ────────────────────
  it('slide 6: DEMO_SHOW_FIRST_QUARTERS → DEMO_CHOP_3 — blocks unchanged', () => {
    const s = adv(demo, 6)
    expect(s.dialogueNodeId).toBe('DEMO_CHOP_3')
    expect(s.blocks.filter(b => b.zone === 'build')).toHaveLength(3)
  })

  // ── Slide 7: DEMO_CHOP_3 → DEMO_SHOW_ALL_QUARTERS (right 1/2 → 2×1/4) ─
  it('slide 7: DEMO_CHOP_3 → DEMO_SHOW_ALL_QUARTERS — right half split, all 4 quarters in build zone', () => {
    const s = adv(demo, 7)
    expect(s.dialogueNodeId).toBe('DEMO_SHOW_ALL_QUARTERS')
    const build = s.blocks.filter(b => b.zone === 'build')
    expect(build).toHaveLength(4)
    expect(build.every(b => b.denominator === 4)).toBe(true)
  })

  // ── Slides 8–9: DEMO_EQUATION → DEMO_HANDOFF — dialogue only ─────────────
  it('slides 8–9: DEMO_EQUATION → DEMO_HANDOFF — no block changes', () => {
    const s7 = adv(demo, 7)
    const blockCount = s7.blocks.length
    const s8 = adv(s7)
    const s9 = adv(s8)
    expect(s8.dialogueNodeId).toBe('DEMO_EQUATION')
    expect(s9.dialogueNodeId).toBe('DEMO_HANDOFF')
    expect(s9.blocks).toHaveLength(blockCount)
  })

  // ── Slide 10: DEMO_HANDOFF → EXPLORE ─────────────────────────────────────
  it('slide 10: DEMO_HANDOFF → EXPLORE with a whole log in the dock', () => {
    const s = stateAt('EXPLORE')
    expect(s.phase).toBe('EXPLORE')
    expect(s.dialogueNodeId).toBe('EXPLORE_INTRO')
    const dock = s.blocks.filter(b => b.zone === 'dock')
    expect(dock.some(b => b.denominator === 1)).toBe(true)  // 1/1 whole log present
    expect(s.blocks.filter(b => b.zone === 'build')).toHaveLength(0)
  })
})

// ── EXPLORE ────────────────────────────────────────────────────────────────

describe('EXPLORE phase', () => {
  let explore: LessonState
  beforeEach(() => { explore = stateAt('EXPLORE') })

  it('EXPLORE_TIMEOUT → EXPLORE_END', () => {
    const s = dispatch(explore, { type: 'EXPLORE_TIMEOUT' })
    expect(s.phase).toBe('EXPLORE_END')
    expect(s.dialogueNodeId).toBe('EXPLORE_END')
  })

  it('EXPLORE_COMPLETE → EXPLORE_END', () => {
    const s = dispatch(explore, { type: 'EXPLORE_COMPLETE' })
    expect(s.phase).toBe('EXPLORE_END')
  })

  it('EXPLORE_INTERACTION appends unique blockId', () => {
    const s = dispatch(explore, { type: 'EXPLORE_INTERACTION', blockId: 'block-1' })
    expect(s.exploreInteractions).toContain('block-1')
    // duplicate ignored
    const s2 = dispatch(s, { type: 'EXPLORE_INTERACTION', blockId: 'block-1' })
    expect(s2.exploreInteractions.filter(id => id === 'block-1')).toHaveLength(1)
  })

  it('CHOP on splittable block → stays EXPLORE, block count increases', () => {
    const splittable = explore.blocks.find(b => b.splittable)!
    const s = dispatch(explore, { type: 'CHOP', blockId: splittable.id })
    expect(s.phase).toBe('EXPLORE')
    expect(s.blocks.length).toBeGreaterThan(explore.blocks.length)
  })

  it('CHOP on non-splittable (1/4) block → state unchanged', () => {
    // New EXPLORE inventory: [1/2 (splittable), 1/4, 1/4 (not splittable)]
    // Quarters are directly in inventory — no need to chop down to them
    const quarter = explore.blocks.find(b => b.denominator === 4)!
    const afterChop = dispatch(explore, { type: 'CHOP', blockId: quarter.id })
    // Quarter log can't be chopped — block count stays the same
    expect(afterChop.blocks.length).toBe(explore.blocks.length)
  })

  it('CHOP on splittable block → increments chopCount', () => {
    expect(explore.chopCount).toBe(0)
    const splittable = explore.blocks.find(b => b.splittable)!
    const s = dispatch(explore, { type: 'CHOP', blockId: splittable.id })
    expect(s.chopCount).toBe(1)
  })

  it('chopCount accumulates across multiple chops', () => {
    const splittable = explore.blocks.find(b => b.splittable)!
    let s = dispatch(explore, { type: 'CHOP', blockId: splittable.id })
    // After chop, we have two 1/2 halves — chop one of those
    const nextSplittable = s.blocks.find(b => b.splittable)
    if (nextSplittable) {
      s = dispatch(s, { type: 'CHOP', blockId: nextSplittable.id })
      expect(s.chopCount).toBe(2)
    }
  })

  it('LOG_SNAPPED moves block to build zone', () => {
    const block = explore.blocks[0]
    const s = dispatch(explore, { type: 'LOG_SNAPPED', blockId: block.id, slot: 0 })
    const moved = s.blocks.find(b => b.id === block.id)!
    expect(moved.zone).toBe('build')
    expect(moved.slot).toBe(0)
  })

  it('LOG_RETURNED moves block back to dock', () => {
    const block = explore.blocks[0]
    let s = dispatch(explore, { type: 'LOG_SNAPPED', blockId: block.id, slot: 0 })
    s = dispatch(s, { type: 'LOG_RETURNED', blockId: block.id })
    const returned = s.blocks.find(b => b.id === block.id)!
    expect(returned.zone).toBe('dock')
    expect(returned.slot).toBeNull()
  })
})

// ── EXPLORE_END → INSTRUCT_INTRO ───────────────────────────────────────────

describe('EXPLORE_END phase', () => {
  it('DIALOGUE_ADVANCE → INSTRUCT_INTRO, resets blocks to INSTRUCT inventory', () => {
    const s = dispatch(stateAt('EXPLORE_END'), { type: 'DIALOGUE_ADVANCE' })
    expect(s.phase).toBe('INSTRUCT_INTRO')
    expect(s.dialogueNodeId).toBe('INSTRUCT_GATE_INTRO')
    // INSTRUCT inventory: [1/2, 1/4, 1/4]
    const denoms = s.blocks.map(b => b.denominator).sort()
    expect(denoms).toEqual([2, 4, 4])
  })
})

// ── INSTRUCT_INTRO ─────────────────────────────────────────────────────────

describe('INSTRUCT_INTRO phase', () => {
  it('DIALOGUE_ADVANCE → INSTRUCT_BUILD', () => {
    const s = dispatch(stateAt('INSTRUCT_INTRO'), { type: 'DIALOGUE_ADVANCE' })
    expect(s.phase).toBe('INSTRUCT_BUILD')
    expect(s.dialogueNodeId).toBe('INSTRUCT_BUILD_PROMPT')
  })
})

// ── INSTRUCT_BUILD ─────────────────────────────────────────────────────────

describe('INSTRUCT_BUILD phase', () => {
  let build: LessonState
  beforeEach(() => { build = stateAt('INSTRUCT_BUILD') })

  it('LOG_SNAPPED appends to buildZoneLogs', () => {
    const block = build.blocks.find(b => b.zone === 'dock')!
    const s = dispatch(build, { type: 'LOG_SNAPPED', blockId: block.id, slot: 0 })
    expect(s.buildZoneLogs).toContain(block.id)
  })

  it('LOG_RETURNED removes from buildZoneLogs', () => {
    const block = build.blocks.find(b => b.zone === 'dock')!
    let s = dispatch(build, { type: 'LOG_SNAPPED', blockId: block.id, slot: 0 })
    s = dispatch(s, { type: 'LOG_RETURNED', blockId: block.id })
    expect(s.buildZoneLogs).not.toContain(block.id)
  })

  it('CHECK_SUBMIT correct (2×1/4) → INSTRUCT_SUCCESS', () => {
    const s = dispatch(withTwoQuartersInBuildZone(build), { type: 'CHECK_SUBMIT' })
    expect(s.phase).toBe('INSTRUCT_SUCCESS')
    expect(s.dialogueNodeId).toBe('INSTRUCT_CORRECT')
  })

  it('CHECK_SUBMIT wrong_type (1/2 log fills gap but is wrong piece) → INSTRUCT_ERROR', () => {
    const s = dispatch(withHalfInBuildZone(build), { type: 'CHECK_SUBMIT' })
    expect(s.phase).toBe('INSTRUCT_ERROR')
    expect(s.errorType).toBe('wrong_type')
    expect(s.dialogueNodeId).toBe('INSTRUCT_ERROR_WRONG_TYPE')
    expect(s.attemptCount).toBe(1)
  })

  it('CHECK_SUBMIT too_short → INSTRUCT_ERROR with errorType too_short', () => {
    // Only one quarter placed — not enough to fill the 1/2 gate
    const quarter = build.blocks.find(b => b.denominator === 4)!
    let s = dispatch(build, { type: 'LOG_SNAPPED', blockId: quarter.id, slot: 0 })
    s = dispatch(s, { type: 'CHECK_SUBMIT' })
    expect(s.phase).toBe('INSTRUCT_ERROR')
    expect(s.errorType).toBe('too_short')
    expect(s.dialogueNodeId).toBe('INSTRUCT_ERROR_SHORT')
  })

  it('CHECK_SUBMIT too_long (1/2 + 1/4 = 3/4 > 1/2 gate) → INSTRUCT_ERROR with errorType too_long', () => {
    // INSTRUCT gate = 1/2. Place 1/2 + 1/4 = 3/4, which exceeds the gate.
    // detectWrongType only fires when total === gate (1/2). Since 3/4 ≠ 1/2,
    // wrong_type does NOT apply — the reducer returns too_long correctly.
    const quarters = build.blocks.filter(b => b.denominator === 4)
    const half = build.blocks.find(b => b.denominator === 2)!
    let s = dispatch(build, { type: 'LOG_SNAPPED', blockId: half.id, slot: 0 })
    s = dispatch(s, { type: 'LOG_SNAPPED', blockId: quarters[0].id, slot: 1 })
    s = dispatch(s, { type: 'CHECK_SUBMIT' })
    expect(s.phase).toBe('INSTRUCT_ERROR')
    expect(s.errorType).toBe('too_long')
  })

  it('CHOP on splittable block stays INSTRUCT_BUILD and splits', () => {
    const half = build.blocks.find(b => b.denominator === 2 && b.splittable)!
    const s = dispatch(build, { type: 'CHOP', blockId: half.id })
    expect(s.phase).toBe('INSTRUCT_BUILD')
    expect(s.blocks.length).toBeGreaterThan(build.blocks.length)
  })
})

// ── INSTRUCT_ERROR ─────────────────────────────────────────────────────────

describe('INSTRUCT_ERROR phase', () => {
  it('DIALOGUE_ADVANCE with attemptCount=1 → back to INSTRUCT_BUILD, clears buildZoneLogs', () => {
    let s = stateAt('INSTRUCT_BUILD')
    s = dispatch(withHalfInBuildZone(s), { type: 'CHECK_SUBMIT' })
    expect(s.phase).toBe('INSTRUCT_ERROR')
    expect(s.attemptCount).toBe(1)

    const next = dispatch(s, { type: 'DIALOGUE_ADVANCE' })
    expect(next.phase).toBe('INSTRUCT_BUILD')
    expect(next.dialogueNodeId).toBe('INSTRUCT_BUILD_PROMPT')
    expect(next.buildZoneLogs).toHaveLength(0)
  })

  it('DIALOGUE_ADVANCE with attemptCount >= 2 → INSTRUCT_INTRO, resets attemptCount', () => {
    // Reach INSTRUCT_ERROR at attemptCount=2
    let s = stateAt('INSTRUCT_BUILD')
    // First error
    s = dispatch(withHalfInBuildZone(s), { type: 'CHECK_SUBMIT' })
    expect(s.attemptCount).toBe(1)
    // Return to build
    s = dispatch(s, { type: 'DIALOGUE_ADVANCE' })
    expect(s.phase).toBe('INSTRUCT_BUILD')
    // Second error
    s = dispatch(withHalfInBuildZone(s), { type: 'CHECK_SUBMIT' })
    expect(s.attemptCount).toBe(2)
    // Now attemptCount >= 2 → should reset
    const next = dispatch(s, { type: 'DIALOGUE_ADVANCE' })
    expect(next.phase).toBe('INSTRUCT_INTRO')
    expect(next.attemptCount).toBe(0)
    expect(next.dialogueNodeId).toBe('INSTRUCT_GATE_INTRO')
  })
})

// ── INSTRUCT_SUCCESS → CHECK_INTRO ─────────────────────────────────────────

describe('INSTRUCT_SUCCESS phase', () => {
  it('1st DIALOGUE_ADVANCE (from INSTRUCT_CORRECT) → shows INSTRUCT_NAME_EQUIVALENCE, stays in INSTRUCT_SUCCESS', () => {
    let s = stateAt('INSTRUCT_BUILD')
    s = dispatch(withTwoQuartersInBuildZone(s), { type: 'CHECK_SUBMIT' })
    expect(s.phase).toBe('INSTRUCT_SUCCESS')
    expect(s.dialogueNodeId).toBe('INSTRUCT_CORRECT')

    const mid = dispatch(s, { type: 'DIALOGUE_ADVANCE' })
    expect(mid.phase).toBe('INSTRUCT_SUCCESS')
    expect(mid.dialogueNodeId).toBe('INSTRUCT_NAME_EQUIVALENCE')
  })

  it('2nd DIALOGUE_ADVANCE (from INSTRUCT_NAME_EQUIVALENCE) → CHECK_INTRO', () => {
    let s = stateAt('INSTRUCT_BUILD')
    s = dispatch(withTwoQuartersInBuildZone(s), { type: 'CHECK_SUBMIT' })
    s = dispatch(s, { type: 'DIALOGUE_ADVANCE' })  // → INSTRUCT_NAME_EQUIVALENCE
    expect(s.dialogueNodeId).toBe('INSTRUCT_NAME_EQUIVALENCE')

    const next = dispatch(s, { type: 'DIALOGUE_ADVANCE' })
    expect(next.phase).toBe('CHECK_INTRO')
    expect(next.dialogueNodeId).toBe('CHECK_INTRO')
  })
})

// ── CHECK_INTRO ────────────────────────────────────────────────────────────

describe('CHECK_INTRO phase', () => {
  function getCheckIntro(): LessonState {
    let s = stateAt('INSTRUCT_BUILD')
    s = dispatch(withTwoQuartersInBuildZone(s), { type: 'CHECK_SUBMIT' })
    s = dispatch(s, { type: 'DIALOGUE_ADVANCE' })  // INSTRUCT_CORRECT → INSTRUCT_NAME_EQUIVALENCE
    return dispatch(s, { type: 'DIALOGUE_ADVANCE' }) // INSTRUCT_NAME_EQUIVALENCE → CHECK_INTRO
  }

  it('DIALOGUE_ADVANCE → CHECK_ACTIVE, challengeIndex=0, referenceGate from C0', () => {
    const s = dispatch(getCheckIntro(), { type: 'DIALOGUE_ADVANCE' })
    expect(s.phase).toBe('CHECK_ACTIVE')
    expect(s.challengeIndex).toBe(0)
    expect(s.dialogueNodeId).toBe('CHECK_CHALLENGE_START')
    expect(s.referenceGate).toEqual(CHECK_CHALLENGES[0].referenceGate)
  })

  it('CHECK_ACTIVE blocks match challenge 0 dock inventory', () => {
    const s = dispatch(getCheckIntro(), { type: 'DIALOGUE_ADVANCE' })
    const denoms = s.blocks.map(b => b.denominator).sort((a, b) => a - b)
    const expectedDenoms = CHECK_CHALLENGES[0].dockInventory
      .map(f => f.denominator)
      .sort((a, b) => a - b)
    expect(denoms).toEqual(expectedDenoms)
  })
})

// ── CHECK_ACTIVE ───────────────────────────────────────────────────────────

describe('CHECK_ACTIVE phase', () => {
  /** Build CHECK_ACTIVE state with a specific challengeIndex already set. */
  function checkActiveAt(challengeIndex: number): LessonState {
    const challenge = CHECK_CHALLENGES[challengeIndex]
    const base = initLessonState()
    return {
      ...base,
      phase:          'CHECK_ACTIVE',
      dialogueNodeId: 'CHECK_CHALLENGE_START',
      challengeIndex,
      challengesPassed: challengeIndex,     // simulates previous passes
      referenceGate:  challenge.referenceGate,
      blocks:         makeInventory(
        challenge.dockInventory.map(f => ({
          numerator:   f.numerator,
          denominator: f.denominator,
          pixelWidth:  Math.round((f.numerator / f.denominator) * 960),
          zone:        'dock' as const,
          slot:        null,
          splittable:  f.denominator < 4,
          selected:    false,
          locked:      false,
        }))
      ),
      buildZoneLogs:  [],
      attemptCount:   0,
    }
  }

  /** Snap all blocks matching denominators into build zone. */
  function snapBlocks(s: LessonState, denominators: number[]): LessonState {
    let next = s
    const toSnap = [...denominators]
    for (const denom of toSnap) {
      const block = next.blocks.find(b => b.denominator === denom && b.zone === 'dock')!
      next = dispatch(next, { type: 'LOG_SNAPPED', blockId: block.id, slot: 0 })
    }
    return next
  }

  describe('Challenge 0 — gate 1/4', () => {
    it('valid [1/4] → CHECK_SUCCESS, challengesPassed increments', () => {
      let s = snapBlocks(checkActiveAt(0), [4])
      s = dispatch(s, { type: 'CHECK_SUBMIT' })
      expect(s.phase).toBe('CHECK_SUCCESS')
      expect(s.challengesPassed).toBe(1)
      expect(s.attemptCount).toBe(0)
    })

    it('too_short (empty) → CHECK_ERROR_1, attemptCount=1', () => {
      let s = checkActiveAt(0)
      s = dispatch(s, { type: 'CHECK_SUBMIT' })
      expect(s.phase).toBe('CHECK_ERROR_1')
      expect(s.attemptCount).toBe(1)
    })

    it('too_long [1/4, 1/4] → CHECK_ERROR_1', () => {
      let s = snapBlocks(checkActiveAt(0), [4, 4])
      s = dispatch(s, { type: 'CHECK_SUBMIT' })
      expect(s.phase).toBe('CHECK_ERROR_1')
    })

    it('too_long [1/2] → CHECK_ERROR_1', () => {
      let s = snapBlocks(checkActiveAt(0), [2])
      s = dispatch(s, { type: 'CHECK_SUBMIT' })
      expect(s.phase).toBe('CHECK_ERROR_1')
    })
  })

  describe('Challenge 1 — gate 1/2', () => {
    it('valid [1/2] → CHECK_SUCCESS', () => {
      let s = snapBlocks(checkActiveAt(1), [2])
      s = dispatch(s, { type: 'CHECK_SUBMIT' })
      expect(s.phase).toBe('CHECK_SUCCESS')
      expect(s.challengesPassed).toBe(2)
    })

    it('valid [1/4, 1/4] → CHECK_SUCCESS', () => {
      let s = snapBlocks(checkActiveAt(1), [4, 4])
      s = dispatch(s, { type: 'CHECK_SUBMIT' })
      expect(s.phase).toBe('CHECK_SUCCESS')
    })

    it('too_short [1/4 only] → CHECK_ERROR_1', () => {
      let s = snapBlocks(checkActiveAt(1), [4])
      s = dispatch(s, { type: 'CHECK_SUBMIT' })
      expect(s.phase).toBe('CHECK_ERROR_1')
    })

    it('decoy [1/4, 1/4, 1/4] → CHECK_ERROR_1 with DECOY_C2 dialogue', () => {
      let s = snapBlocks(checkActiveAt(1), [4, 4, 4])
      s = dispatch(s, { type: 'CHECK_SUBMIT' })
      expect(s.phase).toBe('CHECK_ERROR_1')
      expect(s.dialogueNodeId).toBe('CHECK_ERROR_LONG_1_DECOY_C2')
    })
  })

  describe('Challenge 2 — gate 3/4', () => {
    it('valid [1/2, 1/4] → CHECK_SUCCESS, challengesPassed becomes 3', () => {
      let s = snapBlocks(checkActiveAt(2), [2, 4])
      s = dispatch(s, { type: 'CHECK_SUBMIT' })
      expect(s.phase).toBe('CHECK_SUCCESS')
      expect(s.challengesPassed).toBe(3)
    })

    it('valid [1/4, 1/4, 1/4] → CHECK_SUCCESS', () => {
      let s = snapBlocks(checkActiveAt(2), [4, 4, 4])
      s = dispatch(s, { type: 'CHECK_SUBMIT' })
      expect(s.phase).toBe('CHECK_SUCCESS')
    })
  })

  describe('Error escalation', () => {
    it('second error in same challenge → CHECK_ERROR_2', () => {
      let s = checkActiveAt(0)
      // First wrong attempt — empty build zone
      s = dispatch(s, { type: 'CHECK_SUBMIT' })
      expect(s.phase).toBe('CHECK_ERROR_1')
      expect(s.attemptCount).toBe(1)

      // Return to CHECK_ACTIVE
      s = dispatch(s, { type: 'DIALOGUE_ADVANCE' })
      expect(s.phase).toBe('CHECK_ACTIVE')

      // Second wrong attempt
      s = dispatch(s, { type: 'CHECK_SUBMIT' })
      expect(s.phase).toBe('CHECK_ERROR_2')
    })

    it('totalAttempts >= 5 → CHECK_ERROR_1 with CHECK_INTERVENTION node', () => {
      let s = { ...checkActiveAt(0), totalAttempts: 5 }
      s = dispatch(s, { type: 'CHECK_SUBMIT' })
      expect(s.phase).toBe('CHECK_ERROR_1')
      expect(s.dialogueNodeId).toBe('CHECK_INTERVENTION')
    })
  })

  describe('CHECK_ERROR_1', () => {
    it('DIALOGUE_ADVANCE → CHECK_ACTIVE, clears buildZoneLogs', () => {
      let s = checkActiveAt(0)
      s = dispatch(s, { type: 'CHECK_SUBMIT' })
      expect(s.phase).toBe('CHECK_ERROR_1')
      const next = dispatch(s, { type: 'DIALOGUE_ADVANCE' })
      expect(next.phase).toBe('CHECK_ACTIVE')
      expect(next.buildZoneLogs).toHaveLength(0)
    })
  })

  describe('CHECK_ERROR_2', () => {
    function atCheckError2(): LessonState {
      let s = checkActiveAt(0)
      s = dispatch(s, { type: 'CHECK_SUBMIT' })           // CHECK_ERROR_1
      s = dispatch(s, { type: 'DIALOGUE_ADVANCE' })        // → CHECK_ACTIVE
      s = dispatch(s, { type: 'CHECK_SUBMIT' })           // → CHECK_ERROR_2 (GHOST)
      expect(s.phase).toBe('CHECK_ERROR_2')
      expect(s.dialogueNodeId).toBe('CHECK_ERROR_2_GHOST')
      return s
    }

    it('1st DIALOGUE_ADVANCE (tap on GHOST) → CHECK_ERROR_2_RESTART, stays in CHECK_ERROR_2', () => {
      const next = dispatch(atCheckError2(), { type: 'DIALOGUE_ADVANCE' })
      expect(next.phase).toBe('CHECK_ERROR_2')
      expect(next.dialogueNodeId).toBe('CHECK_ERROR_2_RESTART')
    })

    it('2nd DIALOGUE_ADVANCE (autoAdvance on RESTART) → INSTRUCT_INTRO, resets attemptCount', () => {
      let s = atCheckError2()
      s = dispatch(s, { type: 'DIALOGUE_ADVANCE' })        // → CHECK_ERROR_2_RESTART
      const next = dispatch(s, { type: 'DIALOGUE_ADVANCE' })  // → INSTRUCT_INTRO
      expect(next.phase).toBe('INSTRUCT_INTRO')
      expect(next.attemptCount).toBe(0)
      expect(next.dialogueNodeId).toBe('INSTRUCT_GATE_INTRO')
    })
  })
})

// ── CHECK_SUCCESS → WIN ────────────────────────────────────────────────────

describe('CHECK_SUCCESS phase', () => {
  function successAt(challengesPassed: number): LessonState {
    return {
      ...initLessonState(),
      phase:           'CHECK_SUCCESS',
      dialogueNodeId:  'CHECK_CORRECT',
      challengesPassed,
      challengeIndex:  challengesPassed - 1,
    }
  }

  it('challengesPassed < 3 → CHECK_ACTIVE, challengeIndex advances', () => {
    const s = dispatch(successAt(1), { type: 'DIALOGUE_ADVANCE' })
    expect(s.phase).toBe('CHECK_ACTIVE')
    expect(s.challengeIndex).toBe(1)
    expect(s.referenceGate).toEqual(CHECK_CHALLENGES[1].referenceGate)
  })

  it('challengesPassed === 3 → WIN', () => {
    const s = dispatch(successAt(3), { type: 'DIALOGUE_ADVANCE' })
    expect(s.phase).toBe('WIN')
    expect(s.dialogueNodeId).toBe('WIN_SEQUENCE')
  })
})

// ── WIN ────────────────────────────────────────────────────────────────────

describe('WIN phase', () => {
  it('PLAY_AGAIN → BOOT, full state reset', () => {
    const win: LessonState = {
      ...initLessonState(),
      phase:           'WIN',
      challengesPassed: 3,
      totalAttempts:   7,
      log:             [{ timestamp: 1, event: 'x', nodeId: 'x', phase: 'WIN', correct: true, attempt: 1, solution: '2xQUARTER' }],
    }
    const s = dispatch(win, { type: 'PLAY_AGAIN' })
    expect(s.phase).toBe('BOOT')
    expect(s.challengesPassed).toBe(0)
    expect(s.totalAttempts).toBe(0)
    expect(s.log).toHaveLength(0)
    expect(s.audioUnlocked).toBe(false)
  })
})

// ── Unknown event defense ──────────────────────────────────────────────────

describe('Unknown event in any phase → state unchanged, no throw', () => {
  const phases: LessonState['phase'][] = [
    'EXPLORE', 'EXPLORE_END', 'INSTRUCT_INTRO',
  ]

  for (const phase of phases) {
    it(`${phase} + PLAY_AGAIN → unchanged`, () => {
      const s = stateAt(phase)
      const next = dispatch(s, { type: 'PLAY_AGAIN' })
      expect(next.phase).toBe(phase)
    })
  }

  it('does not throw on any unrecognized event shape', () => {
    const s = stateAt('EXPLORE')
    expect(() => dispatch(s, { type: 'CHECK_SUBMIT' })).not.toThrow()
  })
})
