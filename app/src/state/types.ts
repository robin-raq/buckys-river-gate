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
  log:                 LogEntry[]
}

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
}

// ── Challenges ─────────────────────────────────────────────────────────────

export interface Challenge {
  index:          number
  referenceGate:  FractionValue
  dockInventory:  FractionValue[]
  validSolutions: FractionValue[][]
  buckySentence:  string
}
