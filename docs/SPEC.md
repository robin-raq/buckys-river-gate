# Bucky's River Gate — Technical Specification
## Clone Synthesis Tutor · WK04-CST

**Version:** 1.0
**Date:** 2026-05-18
**Companion doc:** [`docs/GDD.md`](GDD.md) — design intent, dialogue script, audio design
**This doc covers:** component tree, module map, FSM transition table, function contracts, CSS architecture, package dependencies, error boundary contract, test structure

---

## 1. Technology Decisions

| Concern | Choice | Reason |
|---|---|---|
| Framework | React 18 + TypeScript | Component model fits the log/state UI; TS catches state shape bugs at compile time |
| Build tool | Vite 5 | Fast HMR, zero config for React + TS, static bundle output for Vercel |
| Styling | Tailwind CSS + CSS custom properties | Utility classes for layout speed; custom properties for design tokens (colors, sizes) |
| State | `useReducer` in `App.tsx` | Single FSM, ~20 states — no external library needed |
| Animation | CSS keyframes + `transition` | No animation library. All animations are scale/translate/opacity — CSS handles it. |
| Audio | Web Audio API — no library | Full control over scheduling, no bundle weight, no external files |
| Drag | Raw `touchstart / touchmove / touchend` | HTML5 DnD doesn't work on iOS Safari |
| Testing | Vitest | Same config as Vite, fast, no Jest config overhead |
| Deploy | Vercel static | `vite build` → drag `dist/` to Vercel, or push to GitHub + Vercel auto-deploy |

**No additional dependencies.** No XState, no Zustand, no Framer Motion, no Tone.js.

---

## 2. File & Module Structure

```
bucky-river-gate/
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── postcss.config.ts
├── tsconfig.json
├── package.json
│
└── src/
    ├── main.tsx                  — ReactDOM.createRoot, mounts <App />
    ├── App.tsx                   — useReducer(lessonReducer), dispatches, top-level layout
    │
    ├── constants.ts              — RIVER_WIDTH_PX, SLOT_WIDTH_PX, ROW_HEIGHT_PX, TOTAL_SLOTS
    │
    ├── state/
    │   ├── types.ts              — All shared TypeScript types (LessonState, BlockState, etc.)
    │   ├── lessonEvents.ts       — LessonEvent union type
    │   ├── lessonReducer.ts      — FSM reducer: (LessonState, LessonEvent) => LessonState
    │   ├── initialState.ts       — initLessonState() factory function
    │   ├── checkChallenges.ts    — CHECK_CHALLENGES array + Challenge type
    │   └── dialogue.ts           — DIALOGUE keyed object + validation + node selectors
    │
    ├── audio/
    │   ├── toneEngine.ts         — AudioContext singleton + all play* functions
    │   └── toneConfig.ts         — FRACTION_TONES config map
    │
    ├── utils/
    │   ├── fractionMath.ts       — validateBuildZone, detectWrongType, computeShortfall, etc.
    │   ├── snapUtils.ts          — snapToSlot, slotToX, isValidPlacement
    │   └── dragUtils.ts          — createDragHandlers (touch event factory)
    │
    ├── components/
    │   ├── BootScreen.tsx        — Splash + "Let's Build!" button (AudioContext unlock)
    │   ├── LessonScreen.tsx      — Orchestrates TopBar + RiverGrid + ToolTray
    │   │
    │   ├── TopBar/
    │   │   ├── TopBar.tsx        — Layout wrapper for Bucky + bubble + phase dots
    │   │   ├── BuckyAvatar.tsx   — Sprite switcher (8 states)
    │   │   ├── SpeechBubble.tsx  — Typewriter text display
    │   │   └── PhaseDots.tsx     — ● ○ ○ phase progress indicators
    │   │
    │   ├── RiverGrid/
    │   │   ├── RiverGrid.tsx     — River canvas container; owns drag context
    │   │   ├── ReferenceGate.tsx — Glowing blue target bar
    │   │   ├── BuildZone.tsx     — Row 1 drop target area
    │   │   └── SnapGuides.tsx    — 240px column guide lines (faint dashed)
    │   │
    │   ├── ToolTray/
    │   │   ├── ToolTray.tsx      — Bottom tray layout
    │   │   ├── LogDock.tsx       — Available log inventory
    │   │   └── CheckButton.tsx   — CHECK / Submit button + disabled state
    │   │
    │   ├── Log.tsx               — Single draggable/tappable log block (used in dock + build zone)
    │   │
    │   └── overlays/
    │       ├── GhostOverlay.tsx  — Transparent 1/2 log drawn over gate on CHECK_ERROR_2
    │       ├── EquivalenceBadge.tsx — "= badge" slam animation
    │       ├── ChallengeCounter.tsx — "Challenge 1 of 3" badge
    │       └── WinScreen.tsx     — Full-screen graduation overlay
    │
    └── styles/
        ├── tokens.css            — CSS custom properties (--bg-deep, --log-half, etc.)
        └── global.css            — Base reset, touch-action, font, user-select: none
```

### Module ownership rules
- **`App.tsx`** owns `LessonState` and `dispatch`. It passes slices of state and `dispatch` down as props. No other component calls `useReducer`.
- **`RiverGrid.tsx`** owns drag context — it attaches `touchmove` and `touchend` listeners to itself (not to individual logs) to handle the case where a finger slides off a log during drag.
- **`toneEngine.ts`** owns the `AudioContext` singleton. All audio calls go through it. Components never touch `AudioContext` directly.
- **`dialogue.ts`** validates the full tree at module load. If a `nextNode` references a missing key, it throws synchronously before any component renders.

---

## 3. TypeScript Types

All shared types live in `src/state/types.ts`.

```typescript
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
  attemptCount:        number            // wrong attempts on current challenge/node
  totalAttempts:       number            // cumulative across all challenges — triggers intervention at 5
  blocks:              BlockState[]
  buildZoneLogs:       string[]          // ordered block IDs currently in Row 1
  referenceGate:       FractionValue
  challengeIndex:      number            // 0 | 1 | 2
  challengesPassed:    number
  exploreInteractions: string[]          // distinct block IDs — use Set semantics on write
  exploreStartTime:    number            // performance.now() at EXPLORE entry
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
  text:               string
  buckyState:         BuckyState
  autoAdvance?:       boolean
  tapToContinue?:     boolean
  nextNode?:          string
  // UI hint flags — read by React components, never by the reducer
  highlightGap?:      boolean
  highlightOverflow?: boolean
  highlightDockMatch?: boolean
  showGhostOverlay?:  boolean
  triggerDemoAnim?:   boolean
  triggerBadge?:      boolean
  triggerWin?:        boolean
}

// ── Challenges ─────────────────────────────────────────────────────────────

export interface Challenge {
  index:         number
  referenceGate: FractionValue
  dockInventory: FractionValue[]
  validSolutions: FractionValue[][]
  buckySentence: string
}
```

---

## 4. LessonEvent Union

`src/state/lessonEvents.ts`

```typescript
export type LessonEvent =
  | { type: 'START' }
  | { type: 'EXPLORE_INTERACTION';  blockId: string }
  | { type: 'EXPLORE_TIMEOUT' }
  | { type: 'EXPLORE_COMPLETE' }
  | { type: 'DIALOGUE_ADVANCE' }
  | { type: 'LOG_SNAPPED';   blockId: string; slot: number }
  | { type: 'LOG_RETURNED';  blockId: string }
  | { type: 'CHOP';          blockId: string }
  | { type: 'BUILD';         blockIds: [string, string] }
  | { type: 'CHECK_SUBMIT' }
  | { type: 'PLAY_AGAIN' }
```

---

## 5. FSM Transition Table

Every `Phase × Event` combination is defined. Events not listed for a given phase are **silently ignored** (reducer returns state unchanged — never throws on unexpected events).

| Current Phase | Event | Condition | Next Phase | Side effects in reducer |
|---|---|---|---|---|
| `BOOT` | `START` | — | `EXPLORE` | `audioUnlocked = true`, `exploreStartTime = now` |
| `EXPLORE` | `EXPLORE_INTERACTION` | — | `EXPLORE` | Append `blockId` to `exploreInteractions` if not present |
| `EXPLORE` | `EXPLORE_TIMEOUT` | — | `EXPLORE_END` | `dialogueNodeId = 'EXPLORE_END'` |
| `EXPLORE` | `EXPLORE_COMPLETE` | — | `EXPLORE_END` | `dialogueNodeId = 'EXPLORE_END'` |
| `EXPLORE` | `CHOP` | `block.splittable === true` | `EXPLORE` | Replace block with two child blocks |
| `EXPLORE` | `CHOP` | `block.splittable === false` | `EXPLORE` | No state change — audio/wiggle handled by component |
| `EXPLORE` | `BUILD` | Combined value is valid fraction | `EXPLORE` | Replace two blocks with fused block |
| `EXPLORE` | `LOG_SNAPPED` | — | `EXPLORE` | Move block to `zone: 'build'`, set `slot` |
| `EXPLORE` | `LOG_RETURNED` | — | `EXPLORE` | Move block to `zone: 'dock'`, `slot: null` |
| `EXPLORE_END` | `DIALOGUE_ADVANCE` | — | `INSTRUCT_INTRO` | `dialogueNodeId = 'INSTRUCT_GATE_INTRO'`, reset blocks to INSTRUCT inventory |
| `INSTRUCT_INTRO` | `DIALOGUE_ADVANCE` | — | `INSTRUCT_BUILD` | `dialogueNodeId = 'INSTRUCT_BUILD_PROMPT'` |
| `INSTRUCT_BUILD` | `LOG_SNAPPED` | — | `INSTRUCT_BUILD` | Append to `buildZoneLogs` |
| `INSTRUCT_BUILD` | `LOG_RETURNED` | — | `INSTRUCT_BUILD` | Remove from `buildZoneLogs` |
| `INSTRUCT_BUILD` | `CHOP` | `block.splittable === true` | `INSTRUCT_BUILD` | Split block |
| `INSTRUCT_BUILD` | `CHECK_SUBMIT` | `detectWrongType === true` | `INSTRUCT_ERROR` | `errorType = 'wrong_type'`, `attemptCount++`, `dialogueNodeId = 'INSTRUCT_ERROR_WRONG_TYPE'` |
| `INSTRUCT_BUILD` | `CHECK_SUBMIT` | result `=== 'too_short'` | `INSTRUCT_ERROR` | `errorType = 'too_short'`, `attemptCount++`, `dialogueNodeId = 'INSTRUCT_ERROR_SHORT'` |
| `INSTRUCT_BUILD` | `CHECK_SUBMIT` | result `=== 'too_long'` | `INSTRUCT_ERROR` | `errorType = 'too_long'`, `attemptCount++`, `dialogueNodeId = 'INSTRUCT_ERROR_LONG'` |
| `INSTRUCT_BUILD` | `CHECK_SUBMIT` | result `=== 'correct'` | `INSTRUCT_SUCCESS` | `dialogueNodeId = 'INSTRUCT_CORRECT'`, append log |
| `INSTRUCT_ERROR` | `DIALOGUE_ADVANCE` | `attemptCount < 2` | `INSTRUCT_BUILD` | `dialogueNodeId = 'INSTRUCT_BUILD_PROMPT'`, clear `buildZoneLogs` |
| `INSTRUCT_ERROR` | `DIALOGUE_ADVANCE` | `attemptCount >= 2` | `INSTRUCT_INTRO` | `attemptCount = 0`, `dialogueNodeId = 'INSTRUCT_GATE_INTRO'`, reset inventory |
| `INSTRUCT_SUCCESS` | `DIALOGUE_ADVANCE` | — | `CHECK_INTRO` | `dialogueNodeId = 'CHECK_INTRO'` |
| `CHECK_INTRO` | `DIALOGUE_ADVANCE` | — | `CHECK_ACTIVE` | `challengeIndex = 0`, `dialogueNodeId = 'CHECK_CHALLENGE_START'`, set `referenceGate` from challenge |
| `CHECK_ACTIVE` | `LOG_SNAPPED` | — | `CHECK_ACTIVE` | Append to `buildZoneLogs` |
| `CHECK_ACTIVE` | `LOG_RETURNED` | — | `CHECK_ACTIVE` | Remove from `buildZoneLogs` |
| `CHECK_ACTIVE` | `CHOP` | `block.splittable === true` | `CHECK_ACTIVE` | Split block |
| `CHECK_ACTIVE` | `BUILD` | — | `CHECK_ACTIVE` | Fuse blocks |
| `CHECK_ACTIVE` | `CHECK_SUBMIT` | `isSolutionValid === true` | `CHECK_SUCCESS` | `challengesPassed++`, `attemptCount = 0`, append log with `solution` type |
| `CHECK_ACTIVE` | `CHECK_SUBMIT` | invalid, `attemptCount === 0`, `totalAttempts < 5` | `CHECK_ERROR_1` | `attemptCount = 1`, `totalAttempts++`, select shortfall/overflow node |
| `CHECK_ACTIVE` | `CHECK_SUBMIT` | invalid, `totalAttempts >= 5` | `CHECK_ERROR_1` | `dialogueNodeId = 'CHECK_INTERVENTION'` |
| `CHECK_ACTIVE` | `CHECK_SUBMIT` | invalid, `attemptCount === 1` | `CHECK_ERROR_2` | `dialogueNodeId = 'CHECK_ERROR_2_GHOST'` |
| `CHECK_ERROR_1` | `DIALOGUE_ADVANCE` | — | `CHECK_ACTIVE` | `dialogueNodeId = 'CHECK_CHALLENGE_START'`, clear `buildZoneLogs` |
| `CHECK_ERROR_2` | `DIALOGUE_ADVANCE` | — | `INSTRUCT_INTRO` | `attemptCount = 0`, `dialogueNodeId = 'INSTRUCT_GATE_INTRO'`, reset inventory |
| `CHECK_SUCCESS` | `DIALOGUE_ADVANCE` | `challengesPassed < 3` | `CHECK_ACTIVE` | `challengeIndex++`, set new `referenceGate`, reset dock inventory |
| `CHECK_SUCCESS` | `DIALOGUE_ADVANCE` | `challengesPassed === 3` | `WIN` | `dialogueNodeId = 'WIN_SEQUENCE'`, write `localStorage` |
| `WIN` | `PLAY_AGAIN` | — | `BOOT` | Full state reset via `initLessonState()` |

---

## 6. Function Contracts

### `src/utils/fractionMath.ts`

```typescript
// Sum placed fractions against gate using rational arithmetic (DENOM = 4)
export function validateBuildZone(
  placed: FractionValue[],
  gate:   FractionValue
): 'correct' | 'too_short' | 'too_long'

// Maps shortfall size to dialogue bracket
// Precondition: validateBuildZone returned 'too_short'
export function computeShortfallBracket(
  placed: FractionValue[],
  gate:   FractionValue
): 'empty' | 'one_unit' | 'partial'
// 'empty'    → placedSum === 0
// 'one_unit' → shortfall === 1 quarter-unit (240px)
// 'partial'  → shortfall > 0 but not empty, not one unit

// Maps overflow size to dialogue bracket
// Precondition: validateBuildZone returned 'too_long'
export function computeOverflowBracket(
  placed:         FractionValue[],
  gate:           FractionValue,
  challengeIndex: number
): 'whole_log' | 'one_unit' | 'decoy_c2'
// 'whole_log' → placed contains a 1/1 log
// 'decoy_c2'  → challengeIndex === 2 AND overflow === 1 quarter-unit
// 'one_unit'  → overflow === exactly 1 quarter-unit (all other cases)

// INSTRUCT phase only — correct width but used 1/2 log instead of 2× 1/4
export function detectWrongType(
  placed: FractionValue[],
  phase:  Phase
): boolean

// Check placed set against ALL valid solution arrays for the challenge
export function isSolutionValid(
  placed:    FractionValue[],
  challenge: Challenge
): boolean

// Classify the solution type for logging
export function classifySolution(placed: FractionValue[]): SolutionType

// Exact rational equality — integer cross-multiply, no float
export function fractionsEqual(a: FractionValue, b: FractionValue): boolean
// a/b === c/d  ↔  a.numerator * b.denominator === b.numerator * a.denominator
```

### `src/utils/snapUtils.ts`

```typescript
// Given a touch x-coordinate (relative to river canvas left edge),
// return the slot index (0–3) that the left edge of a block of blockWidth
// should snap to. Clamps so block never overflows the river.
export function snapToSlot(touchX: number, blockWidth: number): number

// Convert slot index to pixel x of the slot's left edge
export function slotToX(slot: number): number
// return slot * SLOT_WIDTH_PX

// True if placing a block of blockWidth at slot does not overlap any existing block
export function isValidPlacement(
  slot:           number,
  blockWidth:     number,
  existingBlocks: BlockState[]
): boolean
```

### `src/utils/dragUtils.ts`

```typescript
// Returns touch event handlers for a log element.
// Internally tracks the drag offset (finger position within the log)
// and dispatches LOG_SNAPPED or LOG_RETURNED on touchend.
export function createDragHandlers(
  blockId:  string,
  dispatch: Dispatch<LessonEvent>
): {
  onTouchStart: (e: React.TouchEvent) => void
  onTouchMove:  (e: React.TouchEvent) => void
  onTouchEnd:   (e: React.TouchEvent) => void
}
```

### `src/audio/toneEngine.ts`

```typescript
// Must be called inside a touchend handler. Constructs AudioContext if needed,
// calls resume(), sets audioCtx state to 'running'.
export function unlockAudio(): void

// Returns true if AudioContext exists and state === 'running'
export function isAudioReady(): boolean

// Plays the tone mapped to the given fraction (C4/G4/C5)
export function playFractionTone(fraction: FractionValue): void

// Plays the axe-crack + two child tones (50ms stagger)
export function playChopSound(children: [FractionValue, FractionValue]): void

// Plays the soft thunk snap sound
export function playSnapSound(): void

// Plays the low bonk (can't-chop-1/4)
export function playBonkSound(): void

// Plays the gate-matched C major triad
export function playGateMatchSound(): void

// Plays the CHECK correct fanfare
export function playCheckCorrectSound(): void

// Plays the descending G4→E4 drop
export function playCheckTooShortSound(): void

// Plays the 160Hz low wobble
export function playCheckTooLongSound(): void

// Plays the 4-beat fanfare + C major chord
export function playWinFanfare(): void

// Starts white noise rustle (call on touchstart of drag)
export function startDragRustle(): void

// Stops drag rustle (call on touchend)
export function stopDragRustle(): void

// Starts 300→600Hz tension sweep (call when long-press begins)
export function startChopTension(): void

// Stops tension sweep (call on chop confirm or finger lift)
export function stopChopTension(): void

// Plays one idle creak. Call on a random 8–14s interval when no interaction.
export function playIdleCreak(): void
```

### `src/state/dialogue.ts`

```typescript
// The full keyed dialogue tree — validated at module load
export const DIALOGUE: Record<string, DialogueNode>

// Throws synchronously if any nextNode in DIALOGUE references a missing key.
// Called once at module load — catches all broken refs before first render.
export function validateDialogueTree(): void

// Returns the node for the given ID. Throws if ID is not in DIALOGUE.
// Use this instead of DIALOGUE[id] directly — surfaces missing keys at the call site.
export function getDialogueNode(id: string): DialogueNode

// Given the shortfall bracket from computeShortfallBracket, returns the
// correct dialogue node ID for the current CHECK challenge
export function selectShortfallNodeId(
  bracket:        'empty' | 'one_unit' | 'partial',
  challengeIndex: number
): string

// Given the overflow bracket, returns the correct dialogue node ID
export function selectOverflowNodeId(
  bracket:        'whole_log' | 'one_unit' | 'decoy_c2'
): string
```

### `src/state/lessonReducer.ts`

```typescript
// Pure FSM reducer. No side effects — audio and animation are
// triggered by useEffect in components watching state.phase / state.dialogueNodeId.
export function lessonReducer(
  state: LessonState,
  event: LessonEvent
): LessonState

// Returns the default initial state for a new session
export function initLessonState(): LessonState
```

---

## 7. Component Props

### `<App />`
No props. Owns `[state, dispatch] = useReducer(lessonReducer, initLessonState())`.

### `<BootScreen />`
```typescript
interface BootScreenProps {
  onStart: () => void   // dispatches { type: 'START' }, calls unlockAudio()
}
```

### `<LessonScreen />`
```typescript
interface LessonScreenProps {
  state:    LessonState
  dispatch: Dispatch<LessonEvent>
}
```

### `<BuckyAvatar />`
```typescript
interface BuckyAvatarProps {
  buckyState: BuckyState
}
```

### `<SpeechBubble />`
```typescript
interface SpeechBubbleProps {
  text:         string
  onComplete?:  () => void   // fires when typewriter finishes — used for autoAdvance nodes
}
```

### `<ReferenceGate />`
```typescript
interface ReferenceGateProps {
  gate:    FractionValue
  visible: boolean
  label:   string            // "← 1/2 →" or "← ? →"
}
```

### `<Log />`
```typescript
interface LogProps {
  block:    BlockState
  dispatch: Dispatch<LessonEvent>
  // Drag handlers are created inside Log via createDragHandlers(block.id, dispatch)
  // Long-press timer is managed inside Log via useRef
}
```

### `<CheckButton />`
```typescript
interface CheckButtonProps {
  label:    'CHECK' | 'Submit'
  disabled: boolean             // true when buildZoneLogs is empty
  onPress:  () => void          // dispatches { type: 'CHECK_SUBMIT' }
}
```

### `<ChallengeCounter />`
```typescript
interface ChallengeCounterProps {
  current: number   // 1-indexed for display (challengeIndex + 1)
  total:   number   // always 3
}
```

### `<GhostOverlay />`
```typescript
interface GhostOverlayProps {
  visible:  boolean
  gate:     FractionValue
}
// Renders a semi-transparent 1/2-width log over the reference gate row.
// Auto-fades after 4000ms via CSS animation.
```

---

## 8. CSS Architecture

### Token file — `src/styles/tokens.css`

```css
:root {
  /* Colors */
  --bg-deep:        #0D1B2A;
  --river-water:    #1A3A5C;
  --grid-line:      #1F4E72;
  --log-whole:      #8B5E3C;
  --log-half:       #A0784F;
  --log-quarter:    #C49A6C;
  --log-grain:      #6B3F1F;
  --ref-gate:       #3BADE8;
  --ref-gate-fill:  #1B6FA8;
  --success-glow:   #34D399;
  --error-glow:     #F87171;
  --bucky-bubble:   #FEFCE8;
  --bucky-text:     #1C1917;
  --ui-text:        #E2E8F0;

  /* Layout */
  --river-width:    960px;
  --slot-width:     240px;
  --row-height:     80px;
  --log-radius:     12px;
  --top-bar-height: 64px;
  --tool-tray-height: 224px;
}
```

### Global file — `src/styles/global.css`

```css
@import './tokens.css';
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Prevent iOS callout and text selection on interactive elements */
.log, .log * {
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
}

/* Disable default touch scroll behavior on the river canvas */
.river-canvas {
  touch-action: none;
}

/* Dragged log must be position: absolute to avoid viewport jump on iOS */
.log--dragging {
  position: absolute;
  pointer-events: none;
  z-index: 50;
}
```

### Convention
- Layout and spacing: Tailwind utility classes
- Colors: CSS custom properties via `var(--token)` (not Tailwind color classes — tokens are already defined above)
- Animations: named `@keyframes` in component CSS modules or in `global.css`
- No inline styles except for dynamically computed values (`width: ${block.pixelWidth}px`)

---

## 9. Package Configuration

### `package.json`

```json
{
  "name": "buckys-river-gate",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev":       "vite",
    "build":     "tsc && vite build",
    "preview":   "vite preview",
    "test":      "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "react":     "^18.3.0",
    "react-dom": "^18.3.0"
  },
  "devDependencies": {
    "@types/react":        "^18.3.0",
    "@types/react-dom":    "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "autoprefixer":        "^10.4.0",
    "postcss":             "^8.4.0",
    "tailwindcss":         "^3.4.0",
    "typescript":          "^5.5.0",
    "vite":                "^5.4.0",
    "vitest":              "^2.1.0"
  }
}
```

### `vite.config.ts`

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
```

---

## 10. Error Boundary Contract

### Boot-time validation (synchronous, before first render)

`dialogue.ts` calls `validateDialogueTree()` at module load. This does a single pass over every node in `DIALOGUE` and throws immediately if any `nextNode` value references a key that does not exist in the object.

```typescript
// In dialogue.ts, outside any function — runs at import time
validateDialogueTree()
// If this throws, the app never renders. The error is visible in the
// browser console with the missing node ID. Fix the reference before retrying.
```

### Runtime FSM defense

The reducer never throws on unexpected events. Unknown event types return state unchanged. This prevents a stray touch event from crashing the lesson.

```typescript
// lessonReducer.ts
export function lessonReducer(state: LessonState, event: LessonEvent): LessonState {
  // Each phase is a switch case. Default case at the bottom:
  default:
    console.warn(`[FSM] Unhandled event ${event.type} in phase ${state.phase}`)
    return state
}
```

### React ErrorBoundary

`<LessonScreen />` is wrapped in an `ErrorBoundary` component. On uncaught render error:
- Shows a simple "Something went wrong — tap to restart" screen
- Calls `dispatch({ type: 'PLAY_AGAIN' })` on tap → resets to `BOOT` via `initLessonState()`
- Logs the error to `console.error` for the demo session

---

## 11. Test Structure

All test files live adjacent to the module they test.

```
src/utils/fractionMath.test.ts
src/utils/snapUtils.test.ts
src/state/lessonReducer.test.ts
src/state/dialogue.test.ts
src/audio/toneEngine.test.ts
```

### Key test cases per module

**`fractionMath.test.ts`**
```
validateBuildZone
  ✓ 1/4 + 1/4 against 1/2 gate → 'correct'
  ✓ 1/2 against 1/2 gate → 'correct'
  ✓ 1/2 + 1/4 against 3/4 gate → 'correct'
  ✓ 1/4 + 1/4 + 1/4 against 3/4 gate → 'correct'
  ✓ 1/4 against 1/2 gate → 'too_short'
  ✓ empty array against 1/2 gate → 'too_short'
  ✓ 1/1 against 1/2 gate → 'too_long'
  ✓ 1/4 + 1/4 + 1/4 against 1/2 gate → 'too_long'

computeShortfallBracket
  ✓ nothing placed → 'empty'
  ✓ 1/4 placed, gate 1/2 → 'one_unit'
  ✓ nothing placed, gate 3/4 → 'empty'

detectWrongType
  ✓ 1/2 placed, gate 1/2, phase INSTRUCT_BUILD → true
  ✓ 1/4 + 1/4 placed, gate 1/2, phase INSTRUCT_BUILD → false
  ✓ 1/2 placed, gate 1/2, phase CHECK_ACTIVE → false

isSolutionValid
  ✓ C0: [1/2] → true
  ✓ C0: [1/4, 1/4] → true
  ✓ C0: [1/4] → false
  ✓ C1: [1/2, 1/4] → true
  ✓ C1: [1/4, 1/4, 1/4] → true
  ✓ C1: [1/2, 1/2] → false
  ✓ C2: [1/4, 1/4] → true
  ✓ C2: [1/4, 1/4, 1/4] → false  ← decoy
```

**`lessonReducer.test.ts`**
```
  ✓ BOOT + START → EXPLORE
  ✓ EXPLORE + EXPLORE_TIMEOUT → EXPLORE_END
  ✓ EXPLORE + CHOP on 1/4 log → EXPLORE (no phase change)
  ✓ INSTRUCT_BUILD + correct CHECK_SUBMIT → INSTRUCT_SUCCESS
  ✓ INSTRUCT_BUILD + wrong_type CHECK_SUBMIT → INSTRUCT_ERROR, errorType='wrong_type'
  ✓ INSTRUCT_ERROR + DIALOGUE_ADVANCE, attemptCount=1 → INSTRUCT_BUILD
  ✓ INSTRUCT_ERROR + DIALOGUE_ADVANCE, attemptCount=2 → INSTRUCT_INTRO, attemptCount=0
  ✓ CHECK_ACTIVE + valid CHECK_SUBMIT, challengesPassed=2 → CHECK_SUCCESS
  ✓ CHECK_SUCCESS + DIALOGUE_ADVANCE, challengesPassed=3 → WIN
  ✓ WIN + PLAY_AGAIN → BOOT (full state reset)
  ✓ Unknown event in any phase → state unchanged (no throw)
```

**`dialogue.test.ts`**
```
  ✓ validateDialogueTree passes with current DIALOGUE object
  ✓ validateDialogueTree throws when a nextNode references a missing key
  ✓ getDialogueNode returns node for valid ID
  ✓ getDialogueNode throws for invalid ID
```

**`toneEngine.test.ts`** (AudioContext mocked via `vi.mock`)
```
  ✓ playFractionTone called before unlockAudio → does not throw
  ✓ unlockAudio constructs AudioContext and calls resume()
  ✓ playFractionTone(1/2) schedules oscillator at G4 (392Hz)
  ✓ playFractionTone(1/4) schedules oscillator at C5 (523.25Hz)
```

---

## 12. Pre-Coding Checklist

Before writing the first component, confirm these are true:

- [ ] Physical iPad available for audio testing on Day 1
- [ ] Vercel or Netlify account ready for deploy on Day 5
- [ ] `npm create vite@latest buckys-river-gate -- --template react-ts` runs cleanly
- [ ] Tailwind configured and `tokens.css` imported in `global.css`
- [ ] `validateDialogueTree()` runs and passes before any component is written
- [ ] `vitest run` exits 0 on a blank test file (confirms test harness works)
