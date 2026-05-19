import { describe, it, expect } from 'vitest'
import { DIALOGUE, getNode, validateDialogueTree } from './dialogue'

// ── Every node ID the FSM reducer references ───────────────────────────────
// If any of these are missing, the game silently breaks at runtime.
// Having them listed here makes that failure a test failure instead.

const REQUIRED_NODE_IDS = [
  // ── BOOT / EXPLORE ───────────────────────────────────────────────────────
  'BOOT_SCREEN',
  'EXPLORE_END',

  // ── INSTRUCT flow ────────────────────────────────────────────────────────
  'INSTRUCT_GATE_INTRO',
  'INSTRUCT_BUILD_PROMPT',
  'INSTRUCT_CORRECT',
  'INSTRUCT_NAME_EQUIVALENCE',   // nextNode of INSTRUCT_CORRECT

  // ── INSTRUCT errors ──────────────────────────────────────────────────────
  'INSTRUCT_ERROR_SHORT',
  'INSTRUCT_ERROR_LONG',
  'INSTRUCT_ERROR_WRONG_TYPE',

  // ── CHECK flow ────────────────────────────────────────────────────────────
  'CHECK_INTRO',
  'CHECK_CHALLENGE_START',

  // ── CHECK success (one node per challenge) ────────────────────────────────
  'CHECK_CORRECT_C0',
  'CHECK_CORRECT_C1',
  'CHECK_CORRECT_C2',

  // ── CHECK error — too short ───────────────────────────────────────────────
  'CHECK_ERROR_SHORT_1_EMPTY',
  'CHECK_ERROR_SHORT_1_ONE_UNIT',
  'CHECK_ERROR_SHORT_1_PARTIAL',

  // ── CHECK error — too long ────────────────────────────────────────────────
  'CHECK_ERROR_LONG_1_WHOLE',
  'CHECK_ERROR_LONG_1_ONE_UNIT',
  'CHECK_ERROR_LONG_1_DECOY_C2',

  // ── CHECK error — second attempt + intervention ───────────────────────────
  'CHECK_ERROR_2_GHOST',
  'CHECK_ERROR_2_RESTART',
  'CHECK_INTERVENTION',

  // ── WIN ───────────────────────────────────────────────────────────────────
  'WIN_SEQUENCE',
] as const

// ── Required node IDs exist ────────────────────────────────────────────────

describe('DIALOGUE tree — required node IDs', () => {
  for (const id of REQUIRED_NODE_IDS) {
    it(`node "${id}" exists`, () => {
      expect(DIALOGUE).toHaveProperty(id)
    })
  }
})

// ── getNode ────────────────────────────────────────────────────────────────

describe('getNode', () => {
  it('returns the correct DialogueNode for a known ID', () => {
    const node = getNode('WIN_SEQUENCE')
    expect(node).toBeDefined()
    expect(typeof node.text).toBe('string')
    expect(node.text.length).toBeGreaterThan(0)
  })

  it('throws a descriptive error for an unknown ID', () => {
    expect(() => getNode('DOES_NOT_EXIST')).toThrowError(/DOES_NOT_EXIST/)
  })
})

// ── validateDialogueTree ───────────────────────────────────────────────────

describe('validateDialogueTree', () => {
  it('does not throw when all nextNode references are valid', () => {
    expect(() => validateDialogueTree()).not.toThrow()
  })
})

// ── Node property contracts ────────────────────────────────────────────────

describe('node property contracts', () => {
  it('EXPLORE_END — autoAdvance=true, nextNode=INSTRUCT_GATE_INTRO', () => {
    const node = getNode('EXPLORE_END')
    expect(node.autoAdvance).toBe(true)
    expect(node.nextNode).toBe('INSTRUCT_GATE_INTRO')
    expect(node.buckyState).toBe('excited')
  })

  it('INSTRUCT_GATE_INTRO — tapToContinue=true', () => {
    const node = getNode('INSTRUCT_GATE_INTRO')
    expect(node.tapToContinue).toBe(true)
    expect(node.nextNode).toBe('INSTRUCT_BUILD_PROMPT')
  })

  it('INSTRUCT_CORRECT — autoAdvance=true, chains to INSTRUCT_NAME_EQUIVALENCE', () => {
    const node = getNode('INSTRUCT_CORRECT')
    expect(node.autoAdvance).toBe(true)
    expect(node.nextNode).toBe('INSTRUCT_NAME_EQUIVALENCE')
    expect(node.buckyState).toBe('excited')
  })

  it('INSTRUCT_NAME_EQUIVALENCE — tapToContinue=true, chains to CHECK_INTRO', () => {
    const node = getNode('INSTRUCT_NAME_EQUIVALENCE')
    expect(node.tapToContinue).toBe(true)
    expect(node.nextNode).toBe('CHECK_INTRO')
    expect(node.buckyState).toBe('celebrating')
  })

  it('INSTRUCT_ERROR_SHORT — tapToContinue, returns to INSTRUCT_BUILD_PROMPT', () => {
    const node = getNode('INSTRUCT_ERROR_SHORT')
    expect(node.tapToContinue).toBe(true)
    expect(node.nextNode).toBe('INSTRUCT_BUILD_PROMPT')
    expect(node.buckyState).toBe('encouraging')
  })

  it('INSTRUCT_ERROR_WRONG_TYPE — tapToContinue, returns to INSTRUCT_BUILD_PROMPT', () => {
    const node = getNode('INSTRUCT_ERROR_WRONG_TYPE')
    expect(node.tapToContinue).toBe(true)
    expect(node.nextNode).toBe('INSTRUCT_BUILD_PROMPT')
  })

  it('CHECK_INTRO — tapToContinue, leads to CHECK_CHALLENGE_START', () => {
    const node = getNode('CHECK_INTRO')
    expect(node.tapToContinue).toBe(true)
    expect(node.nextNode).toBe('CHECK_CHALLENGE_START')
    expect(node.buckyState).toBe('excited')
  })

  it('CHECK_CORRECT_C0 — autoAdvance, leads to CHECK_CHALLENGE_START', () => {
    const node = getNode('CHECK_CORRECT_C0')
    expect(node.autoAdvance).toBe(true)
    expect(node.nextNode).toBe('CHECK_CHALLENGE_START')
    expect(node.buckyState).toBe('excited')
  })

  it('CHECK_CORRECT_C1 — autoAdvance, leads to CHECK_CHALLENGE_START', () => {
    const node = getNode('CHECK_CORRECT_C1')
    expect(node.autoAdvance).toBe(true)
    expect(node.nextNode).toBe('CHECK_CHALLENGE_START')
    expect(node.buckyState).toBe('celebrating')
  })

  it('CHECK_CORRECT_C2 — triggerBadge=true, autoAdvance, leads to WIN_SEQUENCE', () => {
    const node = getNode('CHECK_CORRECT_C2')
    expect(node.triggerBadge).toBe(true)
    expect(node.autoAdvance).toBe(true)
    expect(node.nextNode).toBe('WIN_SEQUENCE')
    expect(node.buckyState).toBe('celebrating')
  })

  it('CHECK_ERROR_SHORT_1_EMPTY — highlightGap=true, loops back to challenge', () => {
    const node = getNode('CHECK_ERROR_SHORT_1_EMPTY')
    expect(node.highlightGap).toBe(true)
    expect(node.nextNode).toBe('CHECK_CHALLENGE_START')
    expect(node.buckyState).toBe('encouraging')
  })

  it('CHECK_ERROR_SHORT_1_ONE_UNIT — highlightDockMatch=true', () => {
    const node = getNode('CHECK_ERROR_SHORT_1_ONE_UNIT')
    expect(node.highlightDockMatch).toBe(true)
    expect(node.nextNode).toBe('CHECK_CHALLENGE_START')
  })

  it('CHECK_ERROR_LONG_1_WHOLE — highlightOverflow=true', () => {
    const node = getNode('CHECK_ERROR_LONG_1_WHOLE')
    expect(node.highlightOverflow).toBe(true)
    expect(node.nextNode).toBe('CHECK_CHALLENGE_START')
  })

  it('CHECK_ERROR_LONG_1_DECOY_C2 — highlightOverflow=true, Challenge 2 specific', () => {
    const node = getNode('CHECK_ERROR_LONG_1_DECOY_C2')
    expect(node.highlightOverflow).toBe(true)
    expect(node.nextNode).toBe('CHECK_CHALLENGE_START')
    // The text should specifically address "three quarters"
    expect(node.text).toMatch(/three|quarter|too many/i)
  })

  it('CHECK_ERROR_2_GHOST — showGhostOverlay=true, tapToContinue', () => {
    const node = getNode('CHECK_ERROR_2_GHOST')
    expect(node.showGhostOverlay).toBe(true)
    expect(node.tapToContinue).toBe(true)
    expect(node.nextNode).toBe('CHECK_ERROR_2_RESTART')
    expect(node.buckyState).toBe('disappointed')
  })

  it('CHECK_ERROR_2_RESTART — autoAdvance, leads to INSTRUCT_GATE_INTRO', () => {
    const node = getNode('CHECK_ERROR_2_RESTART')
    expect(node.autoAdvance).toBe(true)
    expect(node.nextNode).toBe('INSTRUCT_GATE_INTRO')
    expect(node.buckyState).toBe('disappointed')
  })

  it('CHECK_INTERVENTION — triggerDemoAnim=true, autoAdvance, loops to challenge', () => {
    const node = getNode('CHECK_INTERVENTION')
    expect(node.triggerDemoAnim).toBe(true)
    expect(node.autoAdvance).toBe(true)
    expect(node.nextNode).toBe('CHECK_CHALLENGE_START')
    expect(node.buckyState).toBe('encouraging')
  })

  it('WIN_SEQUENCE — triggerWin=true, no nextNode (terminal node)', () => {
    const node = getNode('WIN_SEQUENCE')
    expect(node.triggerWin).toBe(true)
    expect(node.nextNode).toBeUndefined()
    expect(node.buckyState).toBe('celebrating')
  })

  it('every node has a non-empty text string', () => {
    for (const [id, node] of Object.entries(DIALOGUE)) {
      expect(node.text, `node "${id}" has empty text`).toBeTruthy()
    }
  })

  it('every node has a valid buckyState', () => {
    const validStates = new Set([
      'idle', 'excited', 'thinking', 'chop-swing',
      'build-stack', 'encouraging', 'disappointed', 'celebrating',
    ])
    for (const [id, node] of Object.entries(DIALOGUE)) {
      expect(validStates.has(node.buckyState), `node "${id}" has invalid buckyState: ${node.buckyState}`).toBe(true)
    }
  })
})
