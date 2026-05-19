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
  // All nodes are tap-to-continue. The reducer drives block mutations
  // at DEMO_SHOW_LOG (add 1/2 log) and DEMO_CHOP (auto-split into 1/4s).

  DEMO_INTRO: {
    text:          "Hey there, Builder! I'm Bucky. I protect this river village by building log gates.",
    buckyState:    'excited',
    tapToContinue: true,
  },

  DEMO_SHOW_LOG: {
    text:          "See this log? It covers exactly half the river. We call it a one-half log.",
    buckyState:    'idle',
    tapToContinue: true,
  },

  DEMO_CHOP: {
    text:          "Watch this!",
    buckyState:    'chop-swing',
    tapToContinue: true,
  },

  DEMO_SHOW_PIECES: {
    text:          "That big log split into two equal sticks! The pieces are smaller now...",
    buckyState:    'excited',
    tapToContinue: true,
  },

  DEMO_COMBINE: {
    text:          "But together, they still cover the exact same river space!",
    buckyState:    'build-stack',
    tapToContinue: true,
  },

  DEMO_EQUATION: {
    text:          "One half-log matches two quarter-logs. Same space. Different pieces!",
    buckyState:    'excited',
    tapToContinue: true,
  },

  DEMO_HANDOFF: {
    text:          "Now YOU try! Grab the logs below and snap them into the river.",
    buckyState:    'encouraging',
    tapToContinue: true,
  },

  // ── EXPLORE ──────────────────────────────────────────────────────────────

  // EXPLORE nodes: tapToContinue is intentionally absent — DIALOGUE_ADVANCE is
  // not handled in the EXPLORE reducer phase. Free play guidance comes from
  // ambient Bucky text only; the "Ready! →" button in the header exits EXPLORE.

  EXPLORE_INTRO: {
    text:       "Now YOU try! Drag a log into the river. Double-tap the half log to chop it — see what happens!",
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
    text:       "Two-quarters and one-half are EQUIVALENT — they look different but fill the SAME space. Remember that word: equivalent!",
    buckyState: 'celebrating',
    tapToContinue: true,
    nextNode:   'CHECK_INTRO',
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
    text:       "Brilliant! One half log or two quarter logs — same river space! Different pieces, same width.",
    buckyState: 'celebrating',
    autoAdvance: true,
    nextNode:   'CHECK_CHALLENGE_START',
  },

  CHECK_CORRECT_C2: {
    text:       "Three-quarters with three small logs — or half plus a quarter! Either way works! You're thinking like an engineer!",
    buckyState: 'celebrating',
    triggerBadge: true,
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
