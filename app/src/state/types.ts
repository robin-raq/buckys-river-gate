// ── Fractions ──────────────────────────────────────────────────────────────

export interface FractionValue {
  numerator:   number   // always positive integer
  denominator: number   // always positive integer, never 0
}

// ── Blocks (logs) ──────────────────────────────────────────────────────────

export interface BlockState {
  id:          string
  numerator:   number
  denominator: number
  pixelWidth:  number           // Math.round((n/d) * RIVER_WIDTH_PX) — immutable after creation
  zone:        'dock' | 'build'
  slot:        number | null    // 0–3 if zone === 'build', null otherwise
  splittable:  boolean          // false for 1/4 logs
  selected:    boolean
  locked:      boolean
}

// ── FSM ────────────────────────────────────────────────────────────────────

export type Phase =
  | 'BOOT'
  | 'DEMO'
  | 'EXPLORE'
  | 'EXPLORE_END'
  | 'INSTRUCT_INTRO'
  | 'INSTRUCT_BUILD'
  | 'INSTRUCT_SUCCESS'
  | 'INSTRUCT_ERROR'
  | 'CHECK_INTRO'
  | 'CHECK_ACTIVE'
  | 'CHECK_SUCCESS'
  | 'CHECK_ERROR_1'
  | 'CHECK_ERROR_2'
  | 'WIN'

export type ErrorType = 'too_short' | 'too_long' | 'wrong_type' | null

export interface LessonState {
  phase:               Phase
  dialogueNodeId:      string
  attemptCount:        number
  totalAttempts:       number
  blocks:              BlockState[]
  buildZoneLogs:       string[]
  referenceGate:       FractionValue
  challengeIndex:      number
  challengesPassed:    number
  exploreInteractions: string[]
  exploreStartTime:    number
  audioUnlocked:       boolean
  errorType:           ErrorType
  chopCount:           number     // total successful student chops (for display + analytics)
  log:                 LogEntry[]
  // Stack of pre-DIALOGUE_ADVANCE state snapshots. DIALOGUE_REWIND
  // pops + restores. Snapshots omit the history field itself so the
  // structure doesn't recurse / balloon.
  history:             HistorySnapshot[]
  // True after the kid accepts the Challenge-1 bonus prompt ("try the
  // same gate a different way"). While true, the next correct CHECK_SUBMIT
  // routes to CHECK_BONUS_SUCCESS_C1 instead of CHECK_CORRECT_C1, and the
  // challengesPassed counter does NOT re-increment. Reset when the kid
  // advances past CHECK_BONUS_SUCCESS_C1 to the next challenge.
  bonusOffered:        boolean
}

export type HistorySnapshot = Omit<LessonState, 'history'>

// ── Logging ────────────────────────────────────────────────────────────────

export type SolutionType = '2xQUARTER' | '1xHALF' | '1xHALF+1xQUARTER' | null

export interface LogEntry {
  timestamp:  number
  event:      string
  nodeId:     string
  phase:      Phase
  correct:    boolean | null
  attempt:    number
  solution:   SolutionType
}

export interface SessionLog {
  sessionDate:         string
  exploreChopCount:    number
  exploreDropCount:    number
  instructAttempts:    number
  instructErrorTypes:  Exclude<ErrorType, null>[]
  checkAttempts:       [number, number, number]
  checkSolutions:      [SolutionType, SolutionType, SolutionType]
  checkTimeToSolve:    [number, number, number]
  graduationReached:   boolean
}

// ── Dialogue ───────────────────────────────────────────────────────────────

export type BuckyState =
  | 'idle' | 'excited' | 'thinking' | 'chop-swing'
  | 'build-stack' | 'encouraging' | 'disappointed' | 'celebrating'

export interface DialogueNode {
  text:                string
  buckyState:          BuckyState
  autoAdvance?:        boolean
  tapToContinue?:      boolean
  nextNode?:           string
  highlightGap?:       boolean
  highlightOverflow?:  boolean
  highlightDockMatch?: boolean
  showGhostOverlay?:   boolean
  triggerDemoAnim?:    boolean
  triggerBadge?:       boolean
  triggerWin?:         boolean
  // ── DEMO recap (REVIEW_HALF / REVIEW_WHOLE) ──────────────────────────────
  // Per-node equation string for the pink badge. When set, LessonScreen
  // shows the badge with this text (replaces the old EQUATION_NODES set).
  equation?:           string
  // Glow rectangle inside .river-row spanning the LEFT two 1/4 blocks.
  // Used in DEMO_REVIEW_HALF to visually anchor "two quarters = one half".
  highlightFirstQuarters?: boolean
  // Glow rectangle spanning all 4 quarter blocks (the whole river).
  // Used in DEMO_REVIEW_WHOLE to visually anchor "four quarters = one whole".
  highlightAllQuarters?: boolean
  // Vertical red guide drawn through the center of the splittable block
  // in the river — anticipates where Bucky's about to chop ("right
  // down the middle"). Disappears once the chop fires on the next node.
  showChopLine?: boolean
  // When true, the equation badge runs a continuous opacity+scale pulse
  // (in addition to its one-shot slam-in entrance). Used on beats where
  // the equation IS the lesson (e.g. DEMO_SHOW_HALVES showing the chain
  // "1/2 + 1/2 = 2/2 = 1/1 = whole"). Default badges only slam in once.
  flashEquation?: boolean
  // Faded reference log floating above, below, OR inline-right of
  // the river-row, sized to the given fraction's % of the row.
  // Visually proves equivalence: a 1/2 reference taking the empty
  // right half of the row, next to two highlighted 1/4 logs on the
  // left, makes the "same space" claim impossible to miss.
  referenceLog?: {
    fraction: { numerator: number, denominator: number }
    position: 'above' | 'below' | 'inline-right'
  }
  // When true, the equation badge sits ABOVE the river-row instead of
  // below. Used on beats where a reference log sits BELOW the row, so
  // the kid sees: equation → highlighted real logs → faded reference.
  equationAbove?: boolean
  // Hide build-zone blocks that fall outside the highlight region.
  // Pure render-time filter — reducer state is unchanged. Used during
  // recap beats where un-involved blocks compete for attention with
  // the lesson's actual focus.
  trimToHighlight?: boolean
}

// ── Challenges ─────────────────────────────────────────────────────────────

export interface Challenge {
  index:          number
  referenceGate:  FractionValue
  dockInventory:  FractionValue[]
  validSolutions: FractionValue[][]
  buckySentence:  string
}
