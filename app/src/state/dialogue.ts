import type { DialogueNode } from './types'

// ── Dialogue tree ──────────────────────────────────────────────────────────
// All strings Bucky ever says. Validated at module load — any broken
// nextNode reference throws before the first render.
//
// Navigation rules:
//   autoAdvance   — component auto-advances after a short delay (no tap needed)
//   tapToContinue — component waits for the student to tap
//   nextNode      — the next node ID within the same phase chain
//                   (FSM DIALOGUE_ADVANCE fires only when the chain ends)

export const DIALOGUE: Record<string, DialogueNode> = {

  // ── BOOT ─────────────────────────────────────────────────────────────────

  BOOT_SCREEN: {
    text:       "Bucky's River Gate",
    buckyState: 'idle',
  },

  // ── DEMO ──────────────────────────────────────────────────────────────────
  // Bucky demonstrates before the student touches anything.
  // All nodes are tap-to-continue. The reducer drives block mutations at
  // chop moments: DEMO_CHOP_1 (1 whole → 2 halves), DEMO_CHOP_2 (left 1/2 →
  // 2 quarters), DEMO_CHOP_3 (right 1/2 → 2 quarters → 4 quarters total).

  DEMO_INTRO: {
    text:          "Hey there, Builder! I'm Bucky. I protect this river village by building log gates.",
    buckyState:    'excited',
    tapToContinue: true,
  },

  DEMO_SHOW_WHOLE: {
    text:          "See this log? It fills the entire river from bank to bank. We call it a whole log — one out of one.",
    buckyState:    'idle',
    tapToContinue: true,
  },

  DEMO_CHOP_1: {
    text:          "Watch what happens when I chop it right down the middle!",
    buckyState:    'chop-swing',
    tapToContinue: true,
    showChopLine:  true,
  },

  DEMO_SHOW_HALVES: {
    text:          "Two equal halves! Each one covers exactly half the river. Two halves still fill the whole thing.",
    buckyState:    'excited',
    tapToContinue: true,
    equation:      '1/2 + 1/2 = 1 whole',
    flashEquation: true,
  },

  DEMO_CHOP_2: {
    text:          "Now let me chop this left half in two...",
    buckyState:    'chop-swing',
    tapToContinue: true,
    showChopLine:  true,
  },

  DEMO_SHOW_FIRST_QUARTERS: {
    text:                   "Two little quarter-logs! See how two quarters sit right where the half log was? Two quarters equal one half.",
    buckyState:             'excited',
    tapToContinue:          true,
    equation:               '1/4 + 1/4 = 1/2',
    flashEquation:          true,
    highlightFirstQuarters: true,
  },

  DEMO_CHOP_3: {
    text:          "Let me do the same to the right half...",
    buckyState:    'chop-swing',
    tapToContinue: true,
    showChopLine:  true,
  },

  DEMO_SHOW_ALL_QUARTERS: {
    text:                 "Four quarters — and look! They fill the whole river, just like the big log did. Four quarters equal one whole!",
    buckyState:           'celebrating',
    tapToContinue:        true,
    equation:             '1/4 + 1/4 + 1/4 + 1/4 = 1 whole',
    flashEquation:        true,
    highlightAllQuarters: true,
  },

  // Two-beat recap. Each beat is tap-to-continue so the kid sets the
  // pace — the recap visuals (glow + slam-in equation) deserve more than
  // the ~1.5s the typewriter takes, and an auto-timed hold felt rushed.
  // The old single-beat DEMO_EQUATION (just a pink "1/2 = 2/4" badge
  // with no glow) and the redundant DEMO_HANDOFF ("Now YOU try!" with
  // an empty dock) have both been retired — REVIEW_WHOLE's
  // DIALOGUE_ADVANCE handles the phase transition into EXPLORE directly.
  DEMO_REVIEW_HALF: {
    // "Same space" pre-teaches equivalence in kid-friendly terms before
    // INSTRUCT_NAME_EQUIVALENCE formally introduces the word "equivalent."
    // "Space" reads cleaner than "size" once the reference log sits IN
    // the row's empty half — the kid sees two pieces side-by-side
    // taking the same amount of river-space.
    text:           "Look — two quarters take up the SAME SPACE as one half. Different pieces, same space!",
    buckyState:     'excited',
    tapToContinue:  true,
    // Build-up form: shows the addition of two quarters AND the
    // equivalence to one half in one chain. Below the row, flashing.
    equation:       '1/4 + 1/4 = 2/4 = 1/2',
    flashEquation:  true,
    // Faded 1/2 reference log moves into the row's empty right half —
    // side-by-side comparison: two real 1/4s on the left, one faded
    // 1/2 silhouette on the right. The "same space" claim becomes
    // spatially obvious without any extra frames.
    referenceLog:   {
      fraction: { numerator: 1, denominator: 2 },
      position: 'inline-right',
    },
    // Hide the two un-involved 1/4s on the right; the reference 1/2
    // takes their place. Trim derives its target from the reference
    // position now, so no highlight flag is needed.
    trimToHighlight: true,
  },

  // ── EXPLORE ──────────────────────────────────────────────────────────────

  // EXPLORE nodes: tapToContinue is intentionally absent — DIALOGUE_ADVANCE is
  // not handled in the EXPLORE reducer phase. Free play guidance comes from
  // ambient Bucky text only; the "Continue →" button in the header exits EXPLORE.

  EXPLORE_INTRO: {
    text:       "Now YOU try! Drag that whole log into the river. Then double-tap it to chop — see how many pieces you can make!",
    buckyState: 'excited',
  },

  EXPLORE_CHOP_PROMPT: {
    text:       "Hold that log down — keep pressing — and it'll split right in half!",
    buckyState: 'encouraging',
  },

  EXPLORE_DROP_PROMPT: {
    text:       "Now drag it into the river! See how it fits?",
    buckyState: 'excited',
  },

  EXPLORE_BUILD_PROMPT: {
    text:       "Try building a long bridge with all your logs. What's the longest you can make?",
    buckyState: 'excited',
  },

  EXPLORE_COMBINE_HINT: {
    text:       "I wonder... if you line up two small logs, do they fill the same space as one big one?",
    buckyState: 'thinking',
  },

  EXPLORE_END: {
    text:       "Okay Builder, I've got a job for you! There's a gap in the dam — and logs are the only way to fix it!",
    buckyState: 'excited',
    autoAdvance: true,
    nextNode:   'INSTRUCT_GATE_INTRO',
  },

  // ── INSTRUCT ─────────────────────────────────────────────────────────────

  INSTRUCT_GATE_INTRO: {
    text:       "See that blue line? That's how wide the gap is — exactly half the river. I need you to fill it perfectly. Not too much, not too little!",
    buckyState: 'excited',
    tapToContinue: true,
    nextNode:   'INSTRUCT_BUILD_PROMPT',
    highlightGap: true,
  },

  // tapToContinue intentionally absent — DIALOGUE_ADVANCE is not handled in
  // INSTRUCT_BUILD. Student reads this hint then drags logs and hits CHECK.
  INSTRUCT_BUILD_PROMPT: {
    text:       "Drag logs from the tray into Row 1. When it looks right, tap the CHECK button!",
    buckyState: 'encouraging',
  },

  INSTRUCT_CORRECT: {
    text:       "You filled it! Two quarter logs — see how they stick together like one half log? That's the trick!",
    buckyState: 'excited',
    autoAdvance: true,
    nextNode:   'INSTRUCT_NAME_EQUIVALENCE',
  },

  INSTRUCT_NAME_EQUIVALENCE: {
    // "same space" (lowercase) matches the phrase verbatim from
    // DEMO_REVIEW_HALF — the kid hears the same words from earlier and
    // recognizes the callback. The new word "EQUIVALENT" lands on a
    // familiar phrase rather than being parachuted in fresh.
    text:       "Two-quarters and one-half are EQUIVALENT — they look different but take up the same space. Remember that word: equivalent!",
    buckyState: 'celebrating',
    tapToContinue: true,
    nextNode:   'CHECK_INTRO',
    equation:   '1/2 = 2/4',
  },

  // ── INSTRUCT errors ───────────────────────────────────────────────────────

  INSTRUCT_ERROR_SHORT: {
    text:       "Not quite — there's still some blue showing! Look at how much gap is left and find a log that fills it.",
    buckyState: 'encouraging',
    tapToContinue: true,
    nextNode:   'INSTRUCT_BUILD_PROMPT',
    highlightGap: true,
  },

  INSTRUCT_ERROR_LONG: {
    text:       "Whoa — those logs stick out past the blue line! That's a bit too much wood. Try taking one back.",
    buckyState: 'encouraging',
    tapToContinue: true,
    nextNode:   'INSTRUCT_BUILD_PROMPT',
    highlightOverflow: true,
  },

  INSTRUCT_ERROR_WRONG_TYPE: {
    text:       "That half log fills the gap — but this lesson is about using TWO quarter logs. Can you swap it for the small ones?",
    buckyState: 'encouraging',
    tapToContinue: true,
    nextNode:   'INSTRUCT_BUILD_PROMPT',
  },

  INSTRUCT_ERROR_TOO_MANY: {
    text:       "Let's slow down and look at this together one more time.",
    buckyState: 'disappointed',
    autoAdvance: true,
    nextNode:   'INSTRUCT_GATE_INTRO',
  },

  // ── CHECK ─────────────────────────────────────────────────────────────────

  CHECK_INTRO: {
    text:       "Now you try on your own! Three gaps, three chances. I'll be right here if you get stuck!",
    buckyState: 'excited',
    tapToContinue: true,
    nextNode:   'CHECK_CHALLENGE_START',
  },

  // tapToContinue intentionally absent — DIALOGUE_ADVANCE is not handled in
  // CHECK_ACTIVE. Student just reads the hint and starts dragging logs.
  CHECK_CHALLENGE_START: {
    text:       "Ready? Look at the blue gate line. Drag logs to fill the gap — then CHECK!",
    buckyState: 'thinking',
  },

  // ── CHECK success nodes ───────────────────────────────────────────────────

  CHECK_CORRECT_C0: {
    text:       "Perfect seal! One quarter log filled the whole gap. When the leak is this small, you only need one small log.",
    buckyState: 'excited',
    autoAdvance: true,
    nextNode:   'CHECK_CHALLENGE_START',
  },

  CHECK_CORRECT_C1: {
    // "same space" matches the phrase from DEMO_REVIEW_HALF and
    // INSTRUCT_NAME_EQUIVALENCE — third callback so the equivalence
    // vocabulary reinforces across the three pedagogical layers.
    text:       "Brilliant! One half log or two quarter logs — same space, different pieces!",
    buckyState: 'celebrating',
    autoAdvance: true,
    // Lands on the bonus prompt instead of advancing straight to C2 —
    // gives the kid a chance to PHYSICALLY construct the equivalence
    // by filling the same gate with the OTHER set of pieces.
    nextNode:   'CHECK_BONUS_PROMPT_C1',
  },

  // Bonus flow for Challenge 1 — the equivalence-defining beat. The
  // prompt invites the kid to fill the SAME gate with a different
  // combination of pieces. If they take the bait, the second solve
  // routes to CHECK_BONUS_SUCCESS_C1 (the pedagogical payoff). If
  // they skip, the lesson advances to Challenge 2 with no penalty.
  CHECK_BONUS_PROMPT_C1: {
    text:       "Nice job! Can you fill this same gap a DIFFERENT way?",
    buckyState: 'thinking',
    // No autoAdvance, no tapToContinue — the [Try it!] / [Skip →]
    // buttons in LessonScreen drive the transition via BONUS_ACCEPTED
    // / BONUS_DECLINED events.
  },

  CHECK_BONUS_SUCCESS_C1: {
    // The pedagogical payoff: kid built the same gate two different
    // ways. Names the concept ("EQUIVALENT") explicitly while the
    // experience is fresh in their hands.
    text:       "AMAZING! You filled the same gap two different ways — that's what EQUIVALENT means! Same space, different pieces.",
    buckyState: 'celebrating',
    autoAdvance: true,
    nextNode:   'CHECK_CHALLENGE_START',
    equation:   '1/2 = 2/4',
  },

  CHECK_CORRECT_C2: {
    text:       "Three-quarters with three small logs — or half plus a quarter! Either way works! You're thinking like an engineer!",
    buckyState: 'celebrating',
    triggerBadge: true,
    // Matches the 3/4 challenge AND the "half plus a quarter" narration.
    // (Previously hardcoded to "1/2 = 2/4" — a leftover from the badge
    // being a single global string, which made the kid see "= 2/4" right
    // after correctly building 3/4 and think the system disagreed.)
    equation:   '1/2 + 1/4 = 3/4',
    autoAdvance: true,
    nextNode:   'WIN_SEQUENCE',
  },

  // ── CHECK error — too short ────────────────────────────────────────────────

  CHECK_ERROR_SHORT_1_EMPTY: {
    text:       "The gate is empty, Builder! Drag logs from the tray to Row 1. Fill from the left edge all the way to the blue line.",
    buckyState: 'encouraging',
    tapToContinue: true,
    highlightGap: true,
    nextNode:   'CHECK_CHALLENGE_START',
  },

  CHECK_ERROR_SHORT_1_ONE_UNIT: {
    text:       "Almost there! That gap on the right is about the size of one more quarter log. Add one little log to close it!",
    buckyState: 'encouraging',
    tapToContinue: true,
    highlightDockMatch: true,
    nextNode:   'CHECK_CHALLENGE_START',
  },

  CHECK_ERROR_SHORT_1_PARTIAL: {
    text:       "You've got some logs in there — but look how much blue is still showing. That's still open river! Try adding more or swapping for a bigger log.",
    buckyState: 'encouraging',
    tapToContinue: true,
    highlightGap: true,
    nextNode:   'CHECK_CHALLENGE_START',
  },

  // ── CHECK error — too long ─────────────────────────────────────────────────

  CHECK_ERROR_LONG_1_WHOLE: {
    text:       "Oops — that log went way past the blue line! The whole log fills the entire river. Our gap is only half that wide. Can you find something smaller?",
    buckyState: 'encouraging',
    tapToContinue: true,
    highlightOverflow: true,
    nextNode:   'CHECK_CHALLENGE_START',
  },

  CHECK_ERROR_LONG_1_ONE_UNIT: {
    text:       "You've got one too many! Your logs stick out past the line by about one quarter log. Try sliding the last one back to the tray.",
    buckyState: 'encouraging',
    tapToContinue: true,
    highlightOverflow: true,
    nextNode:   'CHECK_CHALLENGE_START',
  },

  CHECK_ERROR_LONG_1_DECOY_C2: {
    text:       "Three of them is too many for a half gap! You know two quarters make a half — try taking one back.",
    buckyState: 'encouraging',
    tapToContinue: true,
    highlightOverflow: true,
    nextNode:   'CHECK_CHALLENGE_START',
  },

  // ── CHECK error — second attempt ──────────────────────────────────────────

  CHECK_ERROR_2_GHOST: {
    text:       "Let me show you a trick — I'm drawing a half log over the gate so you can see the size. How many small ones does it take to match that ghost log?",
    buckyState: 'disappointed',
    showGhostOverlay: true,
    tapToContinue: true,
    nextNode:   'CHECK_ERROR_2_RESTART',
  },

  CHECK_ERROR_2_RESTART: {
    text:       "Let's go back and look at the blocks together one more time.",
    buckyState: 'disappointed',
    autoAdvance: true,
    nextNode:   'INSTRUCT_GATE_INTRO',
  },

  // ── Intervention (5+ total failures) ──────────────────────────────────────

  CHECK_INTERVENTION: {
    text:       "You know what — let's build it together one time so you can feel it. Watch...",
    buckyState: 'encouraging',
    triggerDemoAnim: true,
    autoAdvance: true,
    nextNode:   'CHECK_CHALLENGE_START',
  },

  // ── WIN ───────────────────────────────────────────────────────────────────

  WIN_SEQUENCE: {
    text:       "LEGENDARY BUILDER! You figured out that 1/2 and 2/4 are the SAME thing — just split differently! That's called an equivalent fraction, and mathematicians use that trick their whole lives.",
    buckyState: 'celebrating',
    triggerWin:  true,
  },
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Returns the DialogueNode for the given ID.
 * Throws a descriptive error if the ID doesn't exist — prefer this over
 * direct DIALOGUE[id] access so bad IDs surface immediately.
 */
export function getNode(id: string): DialogueNode {
  const node = DIALOGUE[id]
  if (!node) throw new Error(`[dialogue] Unknown node ID: "${id}"`)
  return node
}

/**
 * Validates the entire dialogue tree at startup.
 * Throws if any nextNode reference points to a missing key.
 * Call once inside a module-level block so tests and the real app both benefit.
 */
export function validateDialogueTree(): void {
  for (const [id, node] of Object.entries(DIALOGUE)) {
    if (node.nextNode !== undefined && !(node.nextNode in DIALOGUE)) {
      throw new Error(
        `[dialogue] Node "${id}" has broken nextNode reference: "${node.nextNode}" — no such key in DIALOGUE`
      )
    }
  }
}

// Run on import — catches broken refs before the first render
validateDialogueTree()
