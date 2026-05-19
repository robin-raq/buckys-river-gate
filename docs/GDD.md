# Bucky's River Gate — Game Design Document
## Clone Synthesis Tutor · WK04-CST · Superbuilders Gauntlet

**Version:** 2.0 (merged canonical spec)
**Date:** 2026-05-18
**Product name:** Bucky's River Gate
**Platform:** iPad Safari (web-based, static bundle — no server)
**Target learner:** 9-year-olds (Grade 3–4); no prior fraction notation required
**Session duration:** 6–10 minutes (one complete demo run)
**Learning objective:** Students demonstrate that 1/2 = 2/4 by physically constructing equivalent-width gates from different log types
**Curriculum alignment:** CCSS.MATH.CONTENT.3.NF.A.3b — Recognize and generate simple equivalent fractions; CCSS.MATH.CONTENT.4.NF.A.1

---

## Part 1 — Design Philosophy & Learning Science Foundation

### Why Logs on a River Grid

The log-and-river metaphor operationalizes the **part-whole area model** — the single most evidence-backed visual entry point for fraction concepts — within a meaningful physical narrative. A river has a fixed total width, making "the whole" (1/1) tangibly concrete. The water gate mechanic requires the student to *fill* the width completely, embedding fraction equivalence as a physical success condition rather than an abstract rule.

The CRA sequence maps directly to the three phases:
- **EXPLORE (Concrete):** Students handle logs with their fingers; touchscreen drag is the digital equivalent of physical manipulatives
- **INSTRUCT (Representational):** The blue Reference Gate introduces a drawn visual standard against which students compare their arrangement
- **CHECK (Abstract):** Students must independently reason about combinations without visual scaffolding — the gateway to symbolic understanding

### Why the 4/4 Musical Layer Works

In 4/4 time, one whole note = 2 half notes = 4 quarter notes. Research by Courey et al. (SFSU — the "Academic Music" curriculum) showed students who learned fractions through this isomorphism scored 50% higher on fraction assessments, with durable gains 3–6 months post-intervention. The spatial width of a log (100% / 50% / 25%) and the duration of its synth tone encode the *same* fraction simultaneously through two independent sensory channels — a dual-coding effect that deepens encoding and retrieval.

| Log | Fraction | River width | Tone duration | Musical analog |
|---|---|---|---|---|
| Whole | 1/1 | 960px (100%) | 1200ms | Whole note = 4 beats |
| Half | 1/2 | 480px (50%) | 600ms | Half note = 2 beats |
| Quarter | 1/4 | 240px (25%) | 300ms | Quarter note = 1 beat |

---

## Part 2 — Visual Design System

### 2.1 Global Layout (iPad Safari, 1024×768 viewport)

```
┌─────────────────────────────────────────────────────────────────┐
│  TOP BAR (64px)                                                  │
│  [Bucky avatar 80×80]  [Speech bubble — 580px wide]            │
│  [Phase dots: ● EXPLORE  ○ INSTRUCT  ○ CHECK]                  │
├─────────────────────────────────────────────────────────────────┤
│  RIVER GRID CANVAS (1024 × 480px)                               │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  REFERENCE GATE ROW (hidden in EXPLORE)                │    │
│  │  ══════════════════════════ (glowing blue target)      │    │
│  │  ACTIVE BUILD ZONE (Row 1 — single log row, 80px tall) │    │
│  │  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ (240px snap grid lines)      │    │
│  └────────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────────┤
│  TOOL TRAY (224px)                                               │
│  [Log Palette — dock]   [Chop mode]   [CHECK / Submit button]  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Color Palette — "Deep River" Dark Mode

| Token | Hex | Usage |
|---|---|---|
| `--bg-deep` | `#0D1B2A` | Full page background |
| `--river-water` | `#1A3A5C` | River grid fill |
| `--grid-line` | `#1F4E72` | Snap guide lines (subtle) |
| `--log-whole` | `#8B5E3C` | Whole log — rich walnut |
| `--log-half` | `#A0784F` | Half log — medium cedar |
| `--log-quarter` | `#C49A6C` | Quarter log — light pine |
| `--log-grain` | `#6B3F1F` | Wood grain stripe overlay |
| `--ref-gate` | `#3BADE8` | Reference Gate glow |
| `--ref-gate-fill` | `#1B6FA8` | Reference Gate fill |
| `--success-glow` | `#34D399` | Win state pulse |
| `--error-glow` | `#F87171` | Mismatch pulse (soft, non-alarming) |
| `--bucky-bubble` | `#FEFCE8` | Chat bubble background |
| `--bucky-text` | `#1C1917` | Bucky dialogue text |
| `--ui-text` | `#E2E8F0` | Phase indicators, labels |

### 2.3 Log Visual Specifications

Every log is a rounded rectangle (`border-radius: 12px`) with a subtle horizontal grain stripe via CSS `repeating-linear-gradient`. Width is derived from fraction value against the active river width.

```typescript
RIVER_WIDTH_PX = 960     // 1024px viewport – 2×32px padding
TOTAL_SLOTS    = 4       // 4/4 time signature — 4 quarter-log columns
SLOT_WIDTH_PX  = 240     // 960 / 4 — the snap unit
ROW_HEIGHT_PX  = 80      // 2× WCAG 44px min — sized for 9-year-old motor accuracy

logPixelWidth(n, d) = Math.round((n / d) * RIVER_WIDTH_PX)
// 1/1 → 960px   1/2 → 480px   1/4 → 240px
```

**State-based visual modifiers:**

| Log state | Visual effect |
|---|---|
| `idle` | Standard color, wood-grain texture |
| `touch-active` | `translateY(-6px)`, brighter tint, stronger drop shadow |
| `chop-ready` (long-press held) | Amber pulse, dotted cut-line animates across center |
| `selected` | Gold pulsing outline `2px solid #FBBF24` |
| `locked` | Desaturated, 40% opacity, non-interactive |
| `snapped-to-slot` | Scale bounce `1.0 → 1.08 → 1.0` over 200ms |
| `cant-chop` (1/4 log long-press) | CSS wiggle — `translateX` ±3px, 4 cycles |

**Log drag:** Implemented via `touchstart / touchmove / touchend` — NOT the HTML5 Drag and Drop API (unsupported on iOS Safari). Set `touch-action: none` on the canvas. Use `position: absolute` for dragged elements — `position: fixed` causes iOS viewport jump during drag. Reparent the dragged element to the canvas root during drag so `absolute` positioning is relative to the canvas, not the dock flexbox.

**Snap behavior:** When a dragged log releases within 40px of a valid slot, it snaps via CSS `transition: transform 150ms ease-out`. Snap grid = 240px columns.

### 2.4 Bucky's Avatar

Bucky is a warm beaver in the top-left of each screen, 80×80px with a slow idle bounce. He has 8 sprite states:

| State | Used when |
|---|---|
| `idle` | Default |
| `excited` | Correct answer, discovery moment |
| `thinking` | Student is building |
| `chop-swing` | CHOP animation playing |
| `build-stack` | BUILD animation playing |
| `encouraging` | First wrong attempt — hint |
| `disappointed` | Second wrong attempt — restart |
| `celebrating` | WIN state |

Speech bubbles appear above Bucky. Text renders at **28ms/character** (typewriter). Bubble: 580px wide, auto height, max 3 lines, `--bucky-bubble` background.

### 2.5 Reference Gate

```css
.reference-gate {
  border: 3px solid var(--ref-gate);
  background: rgba(59, 173, 232, 0.15);
  box-shadow: 0 0 12px 4px var(--ref-gate);
  animation: gatePulse 1.8s ease-in-out infinite;
  border-radius: 8px;
}
```

- **INSTRUCT:** label `← 1/2 →` centered, 18px bold, `--ref-gate` color
- **CHECK:** label `← ? →` until solved — target is unknown to student

---

## Part 3 — Core Game State Machine

### 3.1 Phase Enumeration and Transitions

```typescript
type Phase =
  | 'BOOT'             // splash screen + AudioContext unlock
  | 'EXPLORE'          // free sandbox
  | 'EXPLORE_END'      // Bucky wakes up, bridges to INSTRUCT
  | 'INSTRUCT_INTRO'   // Reference Gate slides in
  | 'INSTRUCT_BUILD'   // student places 1/4 logs
  | 'INSTRUCT_SUCCESS' // correct match — equivalence named
  | 'INSTRUCT_ERROR'   // wrong fill — error path
  | 'CHECK_INTRO'      // Bucky hands off to independent work
  | 'CHECK_ACTIVE'     // student solving
  | 'CHECK_SUCCESS'    // correct submission
  | 'CHECK_ERROR_1'    // first wrong attempt — contextual hint
  | 'CHECK_ERROR_2'    // second wrong attempt — restart INSTRUCT
  | 'WIN'              // all 3 challenges passed
```

```
BOOT             → [tap "Let's Build!"]                  → EXPLORE
EXPLORE          → [90s elapsed]                         → EXPLORE_END
                 → [first chop + 3 distinct block drops] → EXPLORE_END
EXPLORE_END      → [dialogue completes]                  → INSTRUCT_INTRO
INSTRUCT_INTRO   → [dialogue completes]                  → INSTRUCT_BUILD
INSTRUCT_BUILD   → [CHECK tapped — correct]              → INSTRUCT_SUCCESS
                 → [CHECK tapped — wrong width]          → INSTRUCT_ERROR
                 → [CHECK tapped — wrong type]           → INSTRUCT_ERROR (errorType='wrong_type')
INSTRUCT_ERROR   → [attemptCount < 2]                    → INSTRUCT_BUILD
                 → [attemptCount >= 2]                   → INSTRUCT_INTRO (full restart)
INSTRUCT_SUCCESS → [dialogue completes]                  → CHECK_INTRO
CHECK_INTRO      → [dialogue completes]                  → CHECK_ACTIVE (index=0)
CHECK_ACTIVE     → [Submit — correct]                    → CHECK_SUCCESS
                 → [Submit — wrong, attempt===0]         → CHECK_ERROR_1
                 → [Submit — wrong, attempt===1]         → CHECK_ERROR_2 → INSTRUCT_INTRO
CHECK_SUCCESS    → [challengesPassed < 3]                → CHECK_ACTIVE (index++)
                 → [challengesPassed === 3]              → WIN
```

### 3.2 LessonState Shape

```typescript
interface LessonState {
  phase:               Phase
  dialogueNodeId:      string
  attemptCount:        number
  blocks:              BlockState[]
  buildZoneLogs:       string[]            // block IDs in Row 1
  referenceGate:       FractionValue
  challengeIndex:      number              // 0 | 1 | 2
  challengesPassed:    number
  exploreInteractions: Set<string>         // distinct block IDs tapped/dropped
  exploreElapsed:      number             // ms since EXPLORE start
  audioUnlocked:       boolean
  errorType:           'too_short' | 'too_long' | 'wrong_type' | null
  totalAttempts:       number             // across all challenges — triggers intervention at 5
  log:                 LogEntry[]
}

interface BlockState {
  id:          string
  numerator:   number
  denominator: number
  pixelWidth:  number       // Math.round((n/d) * 960) — stored as integer, never read from DOM
  zone:        'dock' | 'build'
  slot:        number | null
  splittable:  boolean      // false for 1/4 logs
  selected:    boolean
  locked:      boolean
}

interface FractionValue {
  numerator:   number
  denominator: number
}

interface LogEntry {
  timestamp:   number       // performance.now() since lesson start
  event:       string       // 'CHOP' | 'BUILD' | 'SNAP' | 'SUBMIT' | 'PHASE_CHANGE'
  nodeId:      string
  phase:       Phase
  correct:     boolean | null
  attempt:     number
  solution:    '2xQUARTER' | '1xHALF' | '1xHALF+1xQUARTER' | null
}
```

### 3.3 Canvas Layout Per Phase

| Property | EXPLORE | INSTRUCT_BUILD | CHECK_ACTIVE |
|---|---|---|---|
| Reference Gate | Hidden | Visible — 480px, `← 1/2 →` | Visible — new target, `← ? →` |
| Log dock | 2× whole, 4× half, 8× quarter | 4× quarter only, others locked | 1× half, 4× quarter, 2× whole |
| Chop enabled | Yes | Yes | Yes |
| Build (fuse) enabled | Yes | No | Yes |
| CHECK / Submit button | Hidden | `CHECK` visible | `Submit` visible |
| Build zone rows | 4 (free stacking) | Row 1 only | Row 1 only |
| Phase dots | ● ○ ○ | ○ ● ○ | ○ ○ ● |
| EXPLORE timer | 90s (hidden) | — | — |

### 3.4 Equivalence Validation

```typescript
// Rational arithmetic — never floating point, never pixel tolerance.
// With 240px snapping active, delta is always exactly 0 or ≥240px —
// pixel tolerance is redundant and dangerous if snapping ever fails.
function validateBuildZone(
  placed: FractionValue[],
  gate:   FractionValue
): 'correct' | 'too_short' | 'too_long' {
  const DENOM = 4   // LCM of all denominators in lesson scope (1, 2, 4)

  const placedSum = placed.reduce((sum, b) => {
    return sum + b.numerator * (DENOM / b.denominator)
  }, 0)

  const gateSum = gate.numerator * (DENOM / gate.denominator)

  if (placedSum === gateSum) return 'correct'
  if (placedSum <  gateSum) return 'too_short'
  return 'too_long'
}

// Wrong-type detection — INSTRUCT phase only
// Fires when width is correct but student used a 1/2 log instead of two 1/4 logs
function detectWrongType(placed: FractionValue[], phase: Phase): boolean {
  if (phase !== 'INSTRUCT_BUILD') return false
  const correctWidth = validateBuildZone(placed, { numerator: 1, denominator: 2 }) === 'correct'
  const hasHalfLog   = placed.some(b => b.numerator === 1 && b.denominator === 2)
  return correctWidth && hasHalfLog
}
```

---

## Part 4 — CHECK Phase: Three Challenges

```typescript
const CHECK_CHALLENGES: Challenge[] = [
  {
    index: 0,
    referenceGate: { numerator: 1, denominator: 2 },   // 480px
    dockInventory: [
      { n: 1, d: 2 },
      { n: 1, d: 4 },
      { n: 1, d: 4 },
    ],
    validSolutions: [
      [{ n: 1, d: 2 }],
      [{ n: 1, d: 4 }, { n: 1, d: 4 }],
    ],
    buckySentence: "You helped me earlier — can you build a 1/2 gap again? Any way you like!"
  },
  {
    index: 1,
    referenceGate: { numerator: 3, denominator: 4 },   // 720px
    dockInventory: [
      { n: 1, d: 2 },
      { n: 1, d: 4 },
      { n: 1, d: 4 },
      { n: 1, d: 4 },
    ],
    validSolutions: [
      [{ n: 1, d: 2 }, { n: 1, d: 4 }],
      [{ n: 1, d: 4 }, { n: 1, d: 4 }, { n: 1, d: 4 }],
    ],
    buckySentence: "Ooh, this gap is bigger! Three-quarters of the river wide. What fits?"
  },
  {
    index: 2,
    referenceGate: { numerator: 1, denominator: 2 },   // 480px
    dockInventory: [
      { n: 1, d: 4 },
      { n: 1, d: 4 },
      { n: 1, d: 4 },   // decoy — only 2 fit; tests understanding over pattern-matching
    ],
    validSolutions: [
      [{ n: 1, d: 4 }, { n: 1, d: 4 }],
    ],
    buckySentence: "No big logs this time — only quarters. Can you still fill a 1/2 gap?"
  }
]

// Validate against ALL valid solutions — not just the first
function isSolutionValid(placed: FractionValue[], challenge: Challenge): boolean {
  return challenge.validSolutions.some(sol => solutionMatches(placed, sol))
}
```

The decoy in Challenge 3 is intentional. A child who grabs all three gets a too-long error and must reason: "I know two quarters fill a half — three is too many." That moment of self-correction is the deepest proof of understanding in the lesson.

---

## Part 5 — Complete Scripted Dialogue Tree

All nodes are a keyed TypeScript `const` object. Validated at module load — any missing `nextNode` reference throws before first render. FSM holds `dialogueNodeId` as its active position.

```typescript
interface DialogueNode {
  text:               string
  buckyState:         BuckyState
  autoAdvance?:       boolean
  tapToContinue?:     boolean
  nextNode?:          string
  highlightGap?:      boolean      // red dashed line on unfilled remainder
  highlightOverflow?: boolean      // orange pulse on overflow region
  highlightDockMatch?: boolean     // pulses dock log that fits remaining gap
  showGhostOverlay?:  boolean      // transparent 1/2 log drawn over gate
  triggerDemoAnim?:   boolean      // Bucky auto-places correct logs, then resets
  triggerBadge?:      boolean      // equivalence "= badge" slam animation
  triggerWin?:        boolean      // full win sequence
}
```

### 5.0 BOOT Screen

> **Bucky:** *"Hey! I'm Bucky! I'm building a water gate across this river — and I need YOUR help! Tap the logs, chop 'em, and let's see what they sound like first!"*

**[ Let's Build! 🪵 ]** — `touchend` handler: `audioCtx.resume()` → dispatch `{ type: 'START' }` → phase = `EXPLORE`.

---

### 5.1 EXPLORE Phase

No active dialogue node at start. Bucky is in `idle` state. Nodes below fire reactively on first occurrence of each event.

```
EXPLORE_FIRST_DRAG:
  text:       "Ooh yeah! Feel how big that one is! Try dropping it on the river!"
  buckyState: excited

EXPLORE_FIRST_DROP:
  text:       "Nice drop! Each log makes its own sound. Try chopping one — hold it down for a second!"
  buckyState: encouraging

EXPLORE_FIRST_CHOP:
  text:       "Did you hear that?! One big log became two smaller ones. And together, they still fit the same space!"
  buckyState: excited

EXPLORE_FIRST_QUARTER_TAP:
  text:       "That tiny one makes the highest sound — like a little ding! The big ones go low and rumbly. It's like music!"
  buckyState: excited

EXPLORE_NUDGE_60S:
  text:       "Psst — try holding down one of the logs for a second. Something cool happens..."
  buckyState: thinking
  // fires at 60s if student has not yet chopped

EXPLORE_END:
  text:       "Great exploring! Now — I have a real building challenge for you. Are you ready?"
  buckyState: excited
  autoAdvance: true
  nextNode:   INSTRUCT_GATE_INTRO
```

EXPLORE exit: **90s elapsed** OR **first chop occurred AND `exploreInteractions.size >= 3`** (3 distinct block IDs dropped — not tap count).

---

### 5.2 INSTRUCT Phase

```
INSTRUCT_GATE_INTRO:
  text:          "See that glowing blue beam up there? That's the gap I need to fill — it's EXACTLY half the river wide. Can you fill it using the QUARTER logs?"
  buckyState:    excited
  tapToContinue: true
  nextNode:      INSTRUCT_BUILD_PROMPT

INSTRUCT_BUILD_PROMPT:
  text:          "Tap the quarter logs and drop them into the blue gap. Let's find out!"
  buckyState:    encouraging

INSTRUCT_FIRST_LOG_PLACED:
  text:          "That's one! Now find its twin — it needs a partner to reach the blue line!"
  buckyState:    thinking
```

**SUCCESS PATH:**
```
INSTRUCT_CORRECT:
  text:          "LOOK AT THAT! Two quarters filled the half gap perfectly! They're the same size!"
  buckyState:    excited
  triggerBadge:  true
  autoAdvance:   true
  nextNode:      INSTRUCT_NAME_EQUIVALENCE

INSTRUCT_NAME_EQUIVALENCE:
  text:          "That means one-half and two-quarters are equal. We write it: 1/2 = 2/4. Say it out loud — make it stick!"
  buckyState:    celebrating
  tapToContinue: true
  nextNode:      CHECK_INTRO
```

**ERROR — Too Short:**
```
INSTRUCT_ERROR_SHORT:
  text:          "Hmm! Look at where your log ends. See that gap between the wood and the blue line? Your gate has a hole — the river would leak right through! How many more quarter logs would close that gap?"
  buckyState:    encouraging
  highlightGap:  true
  tapToContinue: true
  nextNode:      INSTRUCT_BUILD_PROMPT
```

**ERROR — Too Long:**
```
INSTRUCT_ERROR_LONG:
  text:          "Whoa — the logs are sticking out past the blue line! The gate won't fit if it's too wide. Try taking one log back and see where it lands."
  buckyState:    encouraging
  highlightOverflow: true
  tapToContinue: true
  nextNode:      INSTRUCT_BUILD_PROMPT
```

**ERROR — Wrong Log Type (correct width, wrong pieces — INSTRUCT only):**
```
INSTRUCT_ERROR_WRONG_TYPE:
  text:          "That IS the right width — great eye! But this challenge needs QUARTER logs specifically. Try swapping that half log for two of the smaller ones."
  buckyState:    encouraging
  tapToContinue: true
  nextNode:      INSTRUCT_BUILD_PROMPT
```

**ERROR — Second Failure (restart):**
```
INSTRUCT_RETRY:
  text:          "That's okay! Let me show you one more time. Watch where the two quarter logs land — right at the edge!"
  buckyState:    disappointed
  triggerDemoAnim: true
  autoAdvance:   true
  nextNode:      INSTRUCT_GATE_INTRO
```

---

### 5.3 CHECK Phase

```
CHECK_INTRO:
  text:          "You're a natural Builder! Now it's your turn — I won't give you clues this time. I'll give you mixed logs and a new gap. You figure out which ones fit!"
  buckyState:    excited
  tapToContinue: true
  nextNode:      CHECK_CHALLENGE_START

CHECK_CHALLENGE_START:
  text:          "{challenge.buckySentence}"   // dynamic — reads from CHECK_CHALLENGES[index]
  buckyState:    thinking
```

**SUCCESS — per challenge:**
```
CHECK_CORRECT_C0:
  text:          "Perfect fit! The gate is sealed — right to the edge!"
  buckyState:    excited
  triggerBadge:  true
  autoAdvance:   true
  nextNode:      CHECK_CHALLENGE_START   // FSM increments challengeIndex

CHECK_CORRECT_C1:
  text:          "Three-quarters! You mixed a half and a quarter — that's smart building!"
  buckyState:    celebrating
  triggerBadge:  true
  autoAdvance:   true
  nextNode:      CHECK_CHALLENGE_START

CHECK_CORRECT_C2:
  text:          "You did it with only quarter logs! Two quarters, one half — same thing. Every time!"
  buckyState:    celebrating
  triggerBadge:  true
  autoAdvance:   true
  nextNode:      WIN_SEQUENCE
```

**ERROR — Too Short (first attempt, shortfall-specific):**

FSM computes `shortfall = gate.pixelWidth - totalPlacedPx` and selects node by bracket:

```
CHECK_ERROR_SHORT_1_EMPTY:          // shortfall ≈ 480px — nothing placed
  text:          "The gate is empty, Builder! Drag logs from the tray to Row 1. Fill from the left edge all the way to the blue line."
  buckyState:    encouraging
  highlightGap:  true
  tapToContinue: true
  nextNode:      CHECK_CHALLENGE_START

CHECK_ERROR_SHORT_1_ONE_UNIT:       // shortfall ≈ 240px — one quarter short
  text:          "Almost there! That gap on the right is about the size of one more quarter log. Add one little log to close it!"
  buckyState:    encouraging
  highlightDockMatch: true          // pulses the dock log that fits the gap
  tapToContinue: true
  nextNode:      CHECK_CHALLENGE_START

CHECK_ERROR_SHORT_1_PARTIAL:        // shortfall > 240px but < 480px
  text:          "You've got some logs in there — but look how much blue is still showing. That's still open river! Try adding more or swapping for a bigger log."
  buckyState:    encouraging
  highlightGap:  true
  tapToContinue: true
  nextNode:      CHECK_CHALLENGE_START
```

**ERROR — Too Long (first attempt):**
```
CHECK_ERROR_LONG_1_WHOLE:           // whole log placed (960px)
  text:          "Oops — that log went way past the blue line! The whole log fills the entire river. Our gap is only half that wide. Can you find something smaller?"
  buckyState:    encouraging
  highlightOverflow: true
  tapToContinue: true
  nextNode:      CHECK_CHALLENGE_START

CHECK_ERROR_LONG_1_ONE_UNIT:        // overflow ≈ 240px — one too many
  text:          "You've got one too many! Your logs stick out past the line by about one quarter log. Try sliding the last one back to the tray."
  buckyState:    encouraging
  highlightOverflow: true
  tapToContinue: true
  nextNode:      CHECK_CHALLENGE_START

CHECK_ERROR_LONG_1_DECOY_C2:        // Challenge 2 only — all 3 quarters placed
  text:          "Three of them is too many for a half gap! You know two quarters make a half — try taking one back."
  buckyState:    encouraging
  highlightOverflow: true
  tapToContinue: true
  nextNode:      CHECK_CHALLENGE_START
```

**ERROR — Second Failure:**
```
CHECK_ERROR_2_GHOST:
  text:          "Let me show you a trick — I'm drawing a half log over the gate so you can see the size. How many small ones does it take to match that ghost log?"
  buckyState:    disappointed
  showGhostOverlay: true            // transparent 1/2 log fades after 4s
  tapToContinue: true
  nextNode:      CHECK_ERROR_2_RESTART

CHECK_ERROR_2_RESTART:
  text:          "Let's go back and look at the blocks together one more time."
  buckyState:    disappointed
  autoAdvance:   true
  nextNode:      INSTRUCT_GATE_INTRO
```

**INTERVENTION — 5+ total failures across any challenge:**
```
CHECK_INTERVENTION:
  text:          "You know what — let's build it together one time so you can feel it. Watch..."
  buckyState:    encouraging
  triggerDemoAnim: true             // auto-places correct logs, flashes green 2s, resets
  autoAdvance:   true
  nextNode:      CHECK_CHALLENGE_START   // student must still solve independently
```

**WIN:**
```
WIN_SEQUENCE:
  text:          "LEGENDARY BUILDER! You figured out that 1/2 and 2/4 are the SAME thing — just split differently! That's called an equivalent fraction, and mathematicians use that trick their whole lives."
  buckyState:    celebrating
  triggerWin:    true
  // WIN animation: dam fills with water, confetti logs rain, fanfare plays
  // Buttons: [ Play Again ] [ I'm Done ]
  // localStorage.setItem('buckysRiverGate_completed', JSON.stringify(sessionLog))
```

---

## Part 6 — Audio Sound Design

All audio synthesized client-side via Web Audio API. No external audio files. Single shared `AudioContext` per session — Safari allows max 4 per page.

### 6.1 Signal Chain

```javascript
OscillatorNode → GainNode (ADSR envelope) → DynamicsCompressorNode → destination
// Compressor normalizes loudness across log types — without it, C4 and C5 have
// very different perceptual volumes when a child taps rapidly through all log types
```

### 6.2 Tone Mapping

All tones use **triangle waveform** — warmer than sine, less harsh than square; right for children.

| Log | Frequency | Duration | Musical analog |
|---|---|---|---|
| 1/1 | C4 — 261.63 Hz | 1200ms | Whole note |
| 1/2 | G4 — 392.00 Hz | 600ms | Half note |
| 1/4 | C5 — 523.25 Hz | 300ms | Quarter note |

Gate completion chord: C4 + G4 + C5, 100ms stagger, 800ms sustain, gain 0.4 each.

### 6.3 Event → Sound Map

| Event | Sound | Details |
|---|---|---|
| Log tap | Tone per log type | `triangle`, ADSR 10/30/sustain/200ms |
| Log drag (continuous) | Soft wood rustle | White noise → `BiquadFilterNode` highpass @ 800Hz, gain 0.05 |
| Long-press begins | Rising tension sweep | 300→600Hz `sine`, 500ms (matches hold duration) |
| CHOP confirmed | Sharp crack + 2 child tones | 600Hz burst 80ms + child tones staggered 50ms |
| 1/4 log long-press (disabled) | Low bonk | 120Hz `triangle`, 200ms, gain 0.2 — plays with CSS wiggle |
| Log snap to slot | Soft thunk | 200Hz→160Hz pitch drop, `triangle`, 150ms |
| Reference Gate appears | Ascending arpeggio | C4→G4→C5 at 100ms each |
| INSTRUCT gate matched | C major triad | C4+G4+C5 staggered 80ms, 1000ms, gain 0.5 |
| CHECK correct | Fanfare | C4-E4-G4-C5 arpeggio + sustained chord |
| CHECK too short | Descending drop | G4→E4, 200ms each, gain 0.3 |
| CHECK too long | Low wobble | 160Hz ±10Hz LFO @ 4Hz, 400ms, gain 0.25 |
| Ghost overlay shown | Slow C4 tone | 261.63Hz, gain 0.15, 800ms slow fade-in |
| WIN | 4-beat fanfare | C5×4 at 120bpm → C major chord sustained |
| Bucky dialogue starts | Notification chime | E5+G5, 200ms, gain 0.2 |
| Idle >10s no interaction | Gentle log creak | 200Hz `triangle`, slow tremolo, 600ms, random 8–14s interval |

### 6.4 iOS Safari AudioContext Implementation

```javascript
// Construct at module load — starts suspended on iOS
const audioCtx = new (window.AudioContext || window.webkitAudioContext)()

// Unlock on BOOT screen "Let's Build!" touchend
// touchend — NOT touchstart — is required for iOS user activation
function unlockAudio() {
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().then(() => {
      document.body.removeEventListener('touchend', unlockAudio)
    })
  }
}
document.body.addEventListener('touchend', unlockAudio)

// Create new oscillator node per note — never reuse
function playTone(freq, durationMs, waveType = 'triangle', gainVal = 0.4) {
  const osc        = audioCtx.createOscillator()
  const gain       = audioCtx.createGain()
  const compressor = audioCtx.createDynamicsCompressor()
  const now        = audioCtx.currentTime

  osc.type = waveType
  osc.frequency.setValueAtTime(freq, now)
  gain.gain.setValueAtTime(0, now)
  gain.gain.linearRampToValueAtTime(gainVal, now + 0.01)
  gain.gain.linearRampToValueAtTime(0, now + durationMs / 1000)

  osc.connect(gain)
  gain.connect(compressor)
  compressor.connect(audioCtx.destination)
  osc.start(now)
  osc.stop(now + durationMs / 1000 + 0.05)
}
```

---

## Part 7 — Assessment & Session Logging

No backend. Data lives in `localStorage` and `window.__lessonLog`.

```typescript
interface SessionLog {
  sessionDate:         string     // ISO8601
  exploreChopCount:    number
  exploreDropCount:    number
  instructAttempts:    number
  instructErrorTypes:  ('too_short' | 'too_long' | 'wrong_type')[]
  checkAttempts:       number[]   // per challenge [c0, c1, c2]
  checkSolutions:      ('2xQUARTER' | '1xHALF' | '1xHALF+1xQUARTER' | null)[]
  checkTimeToSolve:    number[]   // ms per challenge
  graduationReached:   boolean
}

// Written on WIN or "I'm Done"
localStorage.setItem('buckysRiverGate_session', JSON.stringify(sessionLog))
```

`checkSolutions` is the primary formative data point. A child who solves C0 with `1xHALF` understood width but may not have internalized decomposition. A child who uses `2xQUARTER` proved equivalence through construction.

`instructAttempts >= 3` suggests the student would benefit from physical manipulatives before returning to the digital tool (threshold from Courey et al. research).

---

## Part 8 — iPad Implementation Notes

- All log drag via `touchstart / touchmove / touchend` — HTML5 DnD not used on iOS
- `touch-action: none` on the river canvas
- `position: absolute` for all draggable elements — `position: fixed` causes iOS viewport jump during drag
- Reparent dragged element to canvas root so `absolute` is relative to canvas, not dock flexbox
- `user-select: none` and `-webkit-touch-callout: none` on all log elements — prevents iOS long-press text selection from conflicting with chop gesture
- `touchend` (not `touchstart`) for all interaction triggers and AudioContext unlock
- Log height 80px — 2× WCAG 44px minimum, sized for 9-year-old motor accuracy
- If `window.innerWidth < 600px`: `RIVER_WIDTH_PX = window.innerWidth - 64`, all `pixelWidth` values scale proportionally via `logPixelWidth()`
- Color independence: log size differences distinguishable by width alone. Every tone event has a visual animation counterpart for silent-mode devices.

---

## Part 9 — Day-by-Day Build Order

```
Day 1 — Prove the riskiest thing first
  [ ] Vite + React + TypeScript scaffold
  [ ] BOOT screen + AudioContext unlock via touchend
  [ ] River Grid canvas, logs rendering at correct pixel widths
  [ ] Web Audio API: C4/G4/C5 tones working on physical iPad
  [ ] LessonState + useReducer FSM skeleton

Day 2 — Core manipulation
  [ ] Long-press CHOP (500ms hold → confirm tap → split animation)
  [ ] "Can't chop 1/4" wiggle + bonk audio
  [ ] BUILD: select two logs → fuse animation
  [ ] touchstart/touchmove/touchend drag with 240px snap

Day 3 — INSTRUCT phase
  [ ] Reference Gate component (CSS glow, label, slide-in animation)
  [ ] Full INSTRUCT dialogue tree (all nodes)
  [ ] Bucky avatar + speech bubble (8 sprite states, typewriter text)
  [ ] Wrong-type error detection + dialogue
  [ ] Equivalence badge "slam" animation

Day 4 — CHECK phase
  [ ] CHECK_CHALLENGES array + FSM routing
  [ ] validateBuildZone() + shortfall bracket calculation for dialogue selection
  [ ] isSolutionValid() checking all validSolutions arrays
  [ ] Ghost overlay on second failure
  [ ] Challenge counter badge ("Challenge 1 of 3")
  [ ] Intervention path (5+ total failures)

Day 5 — Polish + Ship
  [ ] WIN sequence: fanfare, confetti, dam fills
  [ ] Drag rustle, idle creak, chop tension sweep audio
  [ ] DynamicsCompressorNode wired into audio chain
  [ ] SessionLog + localStorage.setItem on completion
  [ ] iPad responsive pass (innerWidth < 600 scale)
  [ ] Vercel / Netlify static deploy → public URL
  [ ] README + 1–2 min demo video
```

---

## Part 10 — Known Weaknesses and Edge Cases

- **C2 decoy dialogue must be specific.** A child placing all three quarters on Challenge 2 must hear "Three of them is too many for a half gap!" — not the generic overflow message. The FSM must detect `challengeIndex === 2 && overflow === 240` and route to `CHECK_ERROR_LONG_1_DECOY_C2`.
- **EXPLORE triple-tap loophole.** `exploreInteractions` is a `Set<string>` of block IDs — not a tap counter. Tapping the same block ten times contributes 1 to the set, not 10.
- **Long-press vs. iOS text selection.** A 500ms hold on a log element can trigger iOS native long-press behavior (text callout, element selection). Suppress with `user-select: none` and `-webkit-touch-callout: none` on all log elements.
- **AudioContext on page reload.** `audioCtx.state` may be `'suspended'` after a force-quit and reopen. Check state before every `playTone()` call and call `resume()` if needed.
- **`position: absolute` drag scope.** Dragged element must be reparented to the canvas root during drag. If it remains inside the dock flexbox, `absolute` positioning is relative to the dock — causing jumps when the element is moved outside its parent.
- **Multi-solution validation.** `isSolutionValid()` must call `challenge.validSolutions.some(...)` — not just check `validSolutions[0]`. Easy to forget during CHECK wiring.
- **Safari max 4 AudioContext instances.** A single module-level `audioCtx` singleton. Never construct more than one instance per page.

---

## References

1. Courey, S.J. et al. (2012). "Academic Music: Music Instruction to Engage Third-Grade Students in Learning Basic Fraction Concepts." *Educational Studies in Mathematics*, 81(2), 251–278.
2. Courey, S.J. et al. (2020). "MusiMath and Academic Music — Two music-based intervention programs for fractions learning in fourth grade students." *Developmental Science*, 23(4).
3. CCSS.MATH.CONTENT.3.NF.A.3b — Recognize and generate simple equivalent fractions.
4. CCSS.MATH.CONTENT.4.NF.A.1 — Explain why a/b is equivalent to (n×a)/(n×b).
