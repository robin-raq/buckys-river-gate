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

  it('CHECK_CORRECT_C1 — autoAdvance, leads to the bonus prompt (not directly to next challenge)', () => {
    const node = getNode('CHECK_CORRECT_C1')
    expect(node.autoAdvance).toBe(true)
    // Auto-advance now lands on the bonus prompt where the kid is invited
    // to try the SAME gate with a different combination of pieces.
    expect(node.nextNode).toBe('CHECK_BONUS_PROMPT_C1')
    expect(node.buckyState).toBe('celebrating')
  })

  // Bonus prompt for Challenge 1 — the equivalence-defining moment.
  // The prompt invites the kid to fill the SAME gap a different way,
  // turning the lesson from "I solved it" into "I built equivalence."
  it('CHECK_BONUS_PROMPT_C1 — tap-to-continue is absent (buttons drive it)', () => {
    const node = getNode('CHECK_BONUS_PROMPT_C1')
    expect(node.tapToContinue).toBeUndefined()
    expect(node.autoAdvance).toBeUndefined()
    expect(node.text).toMatch(/different way/i)
  })

  it('CHECK_BONUS_SUCCESS_C1 — autoAdvance, names equivalence, leads to next challenge', () => {
    const node = getNode('CHECK_BONUS_SUCCESS_C1')
    expect(node.autoAdvance).toBe(true)
    expect(node.nextNode).toBe('CHECK_CHALLENGE_START')
    // The bonus-success speech is THE pedagogical payoff for the lesson —
    // it MUST callback to the formal vocabulary "equivalent" so the kid
    // hears the word arrive on top of the concept they just performed.
    expect(node.text).toMatch(/equivalent/i)
  })

  it('CHECK_CORRECT_C2 — triggerBadge=true, autoAdvance, leads to WIN_SEQUENCE', () => {
    const node = getNode('CHECK_CORRECT_C2')
    expect(node.triggerBadge).toBe(true)
    expect(node.autoAdvance).toBe(true)
    expect(node.nextNode).toBe('WIN_SEQUENCE')
    expect(node.buckyState).toBe('celebrating')
  })

  // ── DEMO recap (two-beat replacement for DEMO_EQUATION + DEMO_HANDOFF) ────
  // The recap collapses two old "talking head" beats (DEMO_EQUATION with the
  // pink badge, then DEMO_HANDOFF saying "Now YOU try!" with an empty dock)
  // into a richer two-beat review. Both beats are tap-to-continue so the
  // kid sets the pace — the glow/equation visuals need more than the
  // typewriter duration to land, and auto-timing felt rushed in playtest.
  it('DEMO_REVIEW_HALF — tapToContinue, build-up equation, no pink highlight frames', () => {
    const node = getNode('DEMO_REVIEW_HALF')
    expect(node.tapToContinue).toBe(true)
    expect(node.equation).toBe('1/4 + 1/4 = 2/4 = 1/2')
    // Highlight box removed — the side-by-side comparison (real 1/4s
    // next to faded 1/2) is the proof, no extra frame needed.
    expect(node.highlightFirstQuarters).toBeUndefined()
    expect(node.text.length).toBeGreaterThan(0)
  })

  // The faded 1/2 log moves into the row's empty right half, sitting
  // side-by-side with the trimmed 1/4 pair on the left. Equation
  // sits in its default position (below the row).
  it('DEMO_REVIEW_HALF — referenceLog is a faded 1/2 INLINE-RIGHT of the row', () => {
    const node = getNode('DEMO_REVIEW_HALF')
    expect(node.referenceLog).toEqual({
      fraction: { numerator: 1, denominator: 2 },
      position: 'inline-right',
    })
    expect(node.equationAbove).toBeUndefined()
  })

  // Trim view: during the recap beat, only the highlighted blocks are
  // rendered — the un-involved right 1/4s would compete for attention
  // and dilute the "two quarters = one half" message. Reducer state
  // still holds all four blocks; this is a render-time filter only.
  it('DEMO_REVIEW_HALF — trimToHighlight=true (un-involved blocks hidden)', () => {
    expect(getNode('DEMO_REVIEW_HALF').trimToHighlight).toBe(true)
  })

  // The equation flashes on this beat too — it IS the lesson statement
  // tying the highlighted logs and the faded reference together.
  it('DEMO_REVIEW_HALF — flashEquation=true', () => {
    expect(getNode('DEMO_REVIEW_HALF').flashEquation).toBe(true)
  })


  it('DEMO_EQUATION and DEMO_HANDOFF are gone — replaced by the two REVIEW beats', () => {
    expect(() => getNode('DEMO_EQUATION')).toThrowError(/DEMO_EQUATION/)
    expect(() => getNode('DEMO_HANDOFF')).toThrowError(/DEMO_HANDOFF/)
  })

  // DEMO_REVIEW_WHOLE was a second recap beat ("1/1 = 4/4") that
  // restated what DEMO_SHOW_ALL_QUARTERS had already established.
  // Cut to streamline the DEMO tail — one focused recap is stronger
  // than two redundant ones.
  it('DEMO_REVIEW_WHOLE is gone — DEMO_REVIEW_HALF now exits straight to EXPLORE', () => {
    expect(() => getNode('DEMO_REVIEW_WHOLE')).toThrowError(/DEMO_REVIEW_WHOLE/)
  })

  // Vocabulary consistency: the phrase "same space" appears verbatim
  // across three beats — DEMO_REVIEW_HALF (exposure), then
  // INSTRUCT_NAME_EQUIVALENCE (naming), then CHECK_CORRECT_C1 (test).
  // The repeated phrase is what makes the formal word "equivalent"
  // land — the kid hears the same words and recognizes the callback.
  it('DEMO_REVIEW_HALF speech contains the verbatim phrase "same space"', () => {
    expect(getNode('DEMO_REVIEW_HALF').text).toMatch(/same space/)
  })
  it('INSTRUCT_NAME_EQUIVALENCE speech contains the verbatim phrase "same space"', () => {
    expect(getNode('INSTRUCT_NAME_EQUIVALENCE').text).toMatch(/same space/)
  })
  it('CHECK_CORRECT_C1 speech contains the verbatim phrase "same space"', () => {
    expect(getNode('CHECK_CORRECT_C1').text).toMatch(/same space/)
  })

  // The chop line is a vertical red guide on the splittable block in the
  // river, telegraphing where Bucky's about to chop. It anticipates the
  // chop visual on the very next beat. Every DEMO_CHOP_* node sets the
  // flag so the kid sees the cut point before it happens, regardless of
  // which sub-log is being split.
  it('DEMO_CHOP_1 — showChopLine=true (telegraphs the center cut on the 1/1)', () => {
    expect(getNode('DEMO_CHOP_1').showChopLine).toBe(true)
  })
  it('DEMO_CHOP_2 — showChopLine=true (telegraphs the cut on the left 1/2)', () => {
    expect(getNode('DEMO_CHOP_2').showChopLine).toBe(true)
  })
  it('DEMO_CHOP_3 — showChopLine=true (telegraphs the cut on the right 1/2)', () => {
    expect(getNode('DEMO_CHOP_3').showChopLine).toBe(true)
  })

  // DEMO_SHOW_HALVES is the "two equal halves" beat — after the first chop.
  // Pairs the visual (two halves in the river) with a flashing equation
  // that names the result. Earlier draft used a four-segment chain
  // ("1/2 + 1/2 = 2/2 = 1/1 = whole"); compressed to a single addition
  // because the intermediate equivalences distracted from the headline.
  it('DEMO_SHOW_HALVES — equation 1/2 + 1/2 = 1 whole, flashing', () => {
    const node = getNode('DEMO_SHOW_HALVES')
    expect(node.equation).toBe('1/2 + 1/2 = 1 whole')
    expect(node.flashEquation).toBe(true)
  })

  // DEMO_SHOW_FIRST_QUARTERS is the symmetric beat — after the left half
  // is chopped. Row layout is [1/4, 1/4, 1/2]; we flash the addition
  // equation AND glow-box the two new quarters so the kid sees "these
  // two pieces equal the half that was here." `highlightFirstQuarters`
  // covers 50% of the row, which at this layout = the left two 1/4s.
  it('DEMO_SHOW_FIRST_QUARTERS — equation 1/4 + 1/4 = 1/2, flashing, glow on first 2 quarters', () => {
    const node = getNode('DEMO_SHOW_FIRST_QUARTERS')
    expect(node.equation).toBe('1/4 + 1/4 = 1/2')
    expect(node.flashEquation).toBe(true)
    expect(node.highlightFirstQuarters).toBe(true)
  })

  // DEMO_SHOW_ALL_QUARTERS closes the DEMO chop loop — all 4 quarters
  // are in the river. The flashing equation spells out the full
  // addition (1/4 + 1/4 + 1/4 + 1/4 = 1 whole) and the full-width
  // pink box wraps all four quarters as "these four equal one whole."
  it('DEMO_SHOW_ALL_QUARTERS — equation 1/4 + 1/4 + 1/4 + 1/4 = 1 whole, flashing, glow on all 4', () => {
    const node = getNode('DEMO_SHOW_ALL_QUARTERS')
    expect(node.equation).toBe('1/4 + 1/4 + 1/4 + 1/4 = 1 whole')
    expect(node.flashEquation).toBe(true)
    expect(node.highlightAllQuarters).toBe(true)
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

  it('CHECK_ERROR_LONG_1_DECOY_C2 — highlightOverflow=true, Challenge 1 (1/2 gate) specific', () => {
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
