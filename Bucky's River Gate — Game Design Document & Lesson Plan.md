# Bucky's River Gate — Game Design Document & Lesson Plan

> **Canonical spec (mockup-aligned):** See [`docs/GDD.md`](docs/GDD.md) v2.1 (2026-05-19) for art direction, GOAL sidebar, simplified EXPLORE dock, cylindrical logs, and chop storyboard. This file retains the full lesson-plan narrative; visual/interaction details below may lag the canonical doc.

**Product:** Bucky's River Gate
**Platform:** iPad Safari (web-based, single HTML file)
**Target Learner:** 9-year-olds (Grade 3–4); no prior fraction notation required
**Learning Objective:** Students will demonstrate that 1/2 = 2/4 by physically constructing equivalent-width gates from different log types
**Session Duration:** 20–25 minutes (one sitting); designed as a 5-day prototype week
**Curriculum Alignment:** CCSS.MATH.CONTENT.3.NF.A.3b — Recognize and generate simple equivalent fractions; CCSS.MATH.CONTENT.4.NF.A.1[^1][^2]
**Pedagogical Framework:** Concrete → Representational → Abstract (CRA) instructional sequence; Academic Music / MusiMath rhythm-fraction analogy[^3][^4][^2][^1]

***

## Part 1 — Design Philosophy & Learning Science Foundation

### Why Logs on a River Grid

The log-and-river metaphor operationalizes the **part-whole area model** — the single most evidence-backed visual entry point for fraction concepts — within a meaningful, physical narrative. A river has a fixed total width, making the "whole" (1/1) tangibly concrete. The water gate mechanic requires the student to *fill* the width completely, embedding fraction equivalence as a physical success condition rather than an abstract rule.[^5]

The CRA sequence maps directly to the three phases:[^6][^1]
- **EXPLORE (Concrete):** Students handle logs with their fingers; the touchscreen drag-and-drop is the digital equivalent of physical manipulatives
- **INSTRUCT (Representational):** The blue Reference Gate introduces a drawn/visual standard against which students compare their arrangement
- **CHECK (Abstract):** Students must independently reason about combinations without visual scaffolding — the gateway to symbolic understanding

### Why the 4/4 Musical Layer Works

In 4/4 time, one whole note = 2 half notes = 4 quarter notes. The Academic Music research by Courey et al. (SFSU) showed students who learned fractions through this isomorphism scored 50% higher on fraction assessments. MusiMath further demonstrated durable gains 3–6 months post-intervention. The spatial width of a log (100% / 50% / 25%) and the duration of its synth tone encode the *same* fraction simultaneously through two independent sensory channels — a dual-coding effect that deepens encoding and retrieval.[^4][^7][^8][^9][^3]

***

## Part 2 — Visual Design System

### 2.1 Global Layout (iPad Safari, 1024×768 viewport)

```
┌─────────────────────────────────────────────────────────┐
│  TOP BAR (64px)                                         │
│  [Bucky Avatar 80×80]  [Chat Bubble 580px wide]        │
│  [Phase Indicator: ●EXPLORE  ○INSTRUCT  ○CHECK]        │
├─────────────────────────────────────────────────────────┤
│  RIVER GRID CANVAS (1024 × 480px)                       │
│  ┌──────────────────────────────────────────────────┐  │
│  │  REFERENCE GATE ROW (hidden in EXPLORE)          │  │
│  │  ══════════════════════════════════════════════  │  │
│  │  ACTIVE BUILD ZONE (4 log rows, 96px each)       │  │
│  │  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ (snap grid lines)  │  │
│  └──────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────┤
│  TOOL TRAY (224px)                                      │
│  [Log Palette]  [Chop Button]  [Submit Button]         │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Color Palette (Dark Mode "Deep River")

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-deep` | `#0D1B2A` | Full page background |
| `--river-water` | `#1A3A5C` | River grid fill |
| `--grid-line` | `#1F4E72` | Snap guide lines (subtle) |
| `--log-whole` | `#8B5E3C` | Whole log (1/1) — rich walnut |
| `--log-half` | `#A0784F` | Half log (1/2) — medium cedar |
| `--log-quarter` | `#C49A6C` | Quarter log (1/4) — light pine |
| `--log-grain` | `#6B3F1F` | Wood grain stripe overlay |
| `--ref-gate` | `#3BADE8` | Reference Gate glow (blue) |
| `--ref-gate-fill` | `#1B6FA8` | Reference Gate fill |
| `--success-glow` | `#34D399` | Win state pulse |
| `--error-glow` | `#F87171` | Mismatch pulse (soft, non-alarming) |
| `--bucky-bubble` | `#FEFCE8` | Chat bubble background |
| `--bucky-text` | `#1C1917` | Bucky dialogue text |
| `--ui-text` | `#E2E8F0` | Phase indicators, labels |

### 2.3 Log Visual Specifications

Logs are **CSS cylindrical approximations** (pill-shaped ends, inset shading, horizontal grain) — not flat `border-radius: 12px` boxes. See `docs/GDD.md` §2.4 for the full `.log-cylinder` recipe. Width is computed as a percentage of the River Grid's total width (1024px usable area minus 2×32px padding = 960px active width).

| Log Type | Fraction | Active Width | Height | Snap Unit | Note Label |
|----------|----------|-------------|--------|-----------|------------|
| Whole Log | 1/1 | 960px (100%) | 80px | 960px | ♩ (whole) |
| Half Log | 1/2 | 480px (50%) | 80px | 480px | 𝅗𝅥 (half) |
| Quarter Log | 1/4 | 240px (25%) | 80px | 240px | ♩ (quarter) |

**Snap Behavior:** During drag, logs snap to a 240px grid (the smallest unit — 1/4 width). A subtle `#1F4E72` guide line pulses at each snap point. On iOS Safari, the dragging interaction is implemented via `touchstart` / `touchmove` / `touchend` events attached directly to each log element; `pointer-events: none` is set on all non-interactive layers during drag to prevent scroll interference.

**Chop Interaction:** 6-frame sequence per `docs/visual-mockups/CHOP_STORYBOARD.md`: IDLE → HOLD (500ms progress ring) → READY (dashed cut line) → SWING → SPLIT → DONE. Chopping a 1/2 log produces two 1/4 logs; chopping a 1/1 produces two 1/2 logs. Chopping a 1/4 log is blocked with **"BONK!" text + ✕ badge** plus wiggle and low bonk audio — Bucky explains it is already the smallest piece.

### 2.4 Reference Gate (INSTRUCT and CHECK phases)

The Reference Gate is a fixed horizontal bar rendered 32px above Row 1 of the Build Zone. It is **non-draggable**, rendered with a glowing `box-shadow: 0 0 12px 4px var(--ref-gate)` animation (pulse, 1.8s ease-in-out, infinite). A dimension label `← 1/2 →` floats in the center in 18px bold font using `--ref-gate` color.

In the CHECK phase, the Reference Gate changes to an **unknown gap** — the blue bar is replaced by a dark gap with a `?` label, and the target width changes to a new puzzle value. The gate label reads `← ? →` until solved.

***

## Part 3 — Core Game State Machine

### 3.1 Phase Enumeration

```
STATES:
  BOOT          → Initial load, audio unlock screen
  EXPLORE       → Sandbox; no reference gate; no submit
  EXPLORE_END   → Triggered after 90 seconds OR first chop event + 3 drops
  INSTRUCT      → Reference gate shown (1/2 width); guided task
  INSTRUCT_WIN  → Student placed exactly 2× 1/4 logs to match gate
  CHECK_INTRO   → Bucky introduces independent challenge
  CHECK_ACTIVE  → New target gate; mixed log tray; submit enabled
  CHECK_WIN     → Student solved puzzle correctly
  LESSON_END    → Graduation celebration

TRANSITIONS:
  BOOT          → [tap "Let's Build!"]    → EXPLORE
  EXPLORE       → [auto after 90s OR early completion trigger] → EXPLORE_END
  EXPLORE_END   → [Bucky dialogue completes] → INSTRUCT
  INSTRUCT      → [CHECK button: gate width matched exactly] → INSTRUCT_WIN
  INSTRUCT_WIN  → [Bucky dialogue completes] → CHECK_INTRO
  CHECK_INTRO   → [Bucky dialogue completes] → CHECK_ACTIVE
  CHECK_ACTIVE  → [Submit button tapped]
                    IF correct → CHECK_WIN
                    IF too short → INSTRUCT_ERROR_SHORT (return CHECK_ACTIVE)
                    IF too long  → INSTRUCT_ERROR_LONG  (return CHECK_ACTIVE)
  CHECK_WIN     → [Bucky graduation dialogue] → LESSON_END
```

### 3.2 State Properties Table

| Property | EXPLORE | INSTRUCT | CHECK_ACTIVE |
|----------|---------|----------|--------------|
| Reference Gate visible | No | Yes — 1/2 fixed | Yes — new target |
| Gate label | — | `← 1/2 →` | `← ? →` |
| Log tray contents | **1× whole, 1× half, 2× quarter** (4 logs) | 4× quarter only | 1× half, 4× quarter, 2× whole (mixed) |
| Chop enabled | Yes | Yes | Yes |
| Submit button | Hidden | Hidden (replaced by `CHECK` button) | Visible + green |
| Bucky visible | Yes (idle bounce) | Yes (active) | Yes (waiting pose) |
| Snap grid | 240px | 240px | 240px |
| Build zone rows | 4 (unlimited stack) | 1 (Row 1 only, locked) | 1 (Row 1 only) |
| Timer | 90s countdown (hidden) | None | None |
| Audio | Full sandbox | Confirmatory tones | Confirmatory tones |

### 3.3 Equivalence Evaluation Logic

On `CHECK` or `Submit` event:

```
function evaluateBuildZone(buildZone, targetWidth):
  totalWidth = sum(log.width for log in buildZone.row1)
  delta = totalWidth - targetWidth

  if abs(delta) <= 4px:       // 4px tolerance for touch imprecision
    return "CORRECT"
  elif delta < -4px:
    return "TOO_SHORT"
  elif delta > 4px:
    return "TOO_LONG"
```

The 4px tolerance accounts for sub-pixel touch drift on iPad Safari without allowing genuine errors. Log widths are stored as integers (960, 480, 240) so with snapping active, in practice `delta` will always be either 0 or ≥240 — the tolerance mainly guards against edge cases from rapid multi-touch.

***

## Part 4 — Complete Scripted Dialogue Tree

All Bucky dialogue is displayed in a rounded-rectangle chat bubble (580px wide, auto height, max 3 lines, `--bucky-bubble` background). Text renders with a **typewriter effect** at 28ms/character using `setInterval`. A small beaver avatar (80×80px, animated idle bounce) sits left of each bubble. Bucky's emoji expressions shift: 🦫 (neutral), 😄 (excited), 🤔 (thinking), 🎉 (celebrate).

***

### 4.0 BOOT Screen

**Visual:** Full dark screen, large Bucky illustration centered, title text "Bucky's River Gate" in warm amber, large CTA button.

> 🦫 **Bucky:** *"Hey! I'm Bucky! I'm building a water gate across this river — and I need YOUR help! Tap the logs, chop 'em, and let's see what they sound like first!"*

**[Button: "Let's Build! 🪵"]** — tap unlocks AudioContext, transitions to EXPLORE.

*iOS Safari note: The AudioContext is created in suspended state. On this first tap, `audioCtx.resume()` is called inside the `touchend` handler, permanently unlocking audio for the session.*[^10]

***

### 4.1 EXPLORE PHASE Dialogue

**On first log drag (any log):**
> 🦫 **Bucky:** *"Ooh yeah! Feel how big that one is! Try dropping it on the river!"*

**On first successful drop (log snaps to Build Zone):**
> 🦫 **Bucky:** *"Nice drop! Each log makes its own sound. Try chopping one — hold it down for a second!"*

**On first chop:**
> 🦫 **Bucky:** *"Did you hear that?! One BIG log… became two smaller ones. And together, they still fit the same space! Wild, right? 🪵🪵"*

**On first 1/4 log tap (chime sounds):**
> 🦫 **Bucky:** *"That tiny one makes the highest sound — like a little ding! The big ones go low and rumbly. It's like music! 🎵"*

**At 60-second mark (if student hasn't chopped yet):**
> 🦫 **Bucky (thinking pose):** *"Psst — try holding down one of the logs for a second. Something cool happens..."*

**At 90 seconds OR after 1st chop + 3 drops (EXPLORE_END trigger):**
> 🦫 **Bucky:** *"Great exploring! Now — I have a real building challenge for you. Are you ready?"*
> *(2-second pause, then auto-advance to INSTRUCT)*

***

### 4.2 INSTRUCT PHASE Dialogue

**Phase entry — gate appears:**
> 😄 **Bucky:** *"See that glowing blue beam up there? That's the gap I need to fill — it's EXACTLY half the river wide. Can you fill it up perfectly using QUARTER logs?"*

**On first 1/4 log dropped (1 of 2 needed):**
> 🦫 **Bucky:** *"That's one! Listen to that ping 🎵 — now find its twin. It needs a partner to reach the blue line!"*

**On second 1/4 log dropped (gap filled — CORRECT):**
> 😄 **Bucky:** *"YES! Two quarter logs... clicked right up to the blue line! Together, those two quarters are the SAME size as one half. That's the secret! TWO FOURTHS equals ONE HALF!"*
> *(Brief 1-second pause, then:)*
> 🎉 **Bucky:** *"1/2 = 2/4. Say it out loud — make it stick! You just built an equivalent fraction with MUSIC and WOOD. Pretty cool, Builder!"*

***

#### 4.2a INSTRUCT — Error Isolation Paths

**Error Type 1 — TOO SHORT (only 1× quarter log placed, student taps CHECK):**
> 🤔 **Bucky:** *"Hmm — look at where your log ends. See that gap between the end of your wood and the blue line? Your gate has a hole in it — the river would leak right through! How many more quarter logs would it take to close that gap?"*

*(The gap between the log's right edge and the Reference Gate's right edge is highlighted with an animated red dashed line for 3 seconds.)*

**Error Type 2 — TOO LONG (3× or 4× quarter logs placed, overflowing):**
> 🤔 **Bucky:** *"Whoa — your logs are sticking out past the blue line on the other side! That's too wide for the gate opening. Try taking one off from the right end and see if it lines up then."*

*(The overflow section — pixels beyond the gate width — pulses red for 3 seconds.)*

**Error Type 3 — Wrong log type (1/2 log placed instead of 1/4, correct width but wrong task):**
> 🤔 **Bucky:** *"That IS the right width — great eye! But in this challenge, I need you to use the QUARTER logs specifically. Try swapping that half log for two of the smaller ones. Can you find them in the tray?"*

***

### 4.3 CHECK_INTRO Dialogue

> 🦫 **Bucky:** *"You're a natural Builder! Now it's your turn — I won't give you clues this time. I'll give you a pile of mixed logs and a new gap. You figure out which ones fit!"*
> *(1-second pause)*
> 😄 **Bucky:** *"Remember: you can chop logs to make them smaller. And you can always listen to the sounds — they'll remind you how big each piece is. Ready? Go!"*

***

### 4.4 CHECK PHASE (Independent Evaluation)

**CHECK puzzle configuration (Week 1 default):**
- Target gap: 1/2 river width (480px) — same as INSTRUCT, but now mixed log tray with distractors
- Log tray: 1× whole (1/1), 2× half (1/2), 4× quarter (1/4)
- Valid solutions: [1× half] OR [2× quarter] OR [4× quarter are TOO LONG — wrong]
- The presence of the whole log is a distractor (too large by itself)

**On submit — CORRECT (any valid solution):**
> 🎉 **Bucky:** *"YOU DID IT! Your gate fits perfectly — not too wide, not too short. The river is blocked! Look at what you built..."*
> *(Grid animates: water flow stops, sparkle particles emit from gate, logs pulse green)*
> 🎉 **Bucky:** *"Whether you used ONE half log or TWO quarter logs... the gap is identical. That. Is. Equivalent. Fractions. I am SO proud of you, Builder!"*

***

#### 4.4a CHECK — Error Isolation Paths

**Path A — TOO SHORT (total < 480px), e.g., only 1× quarter placed:**

*The system calculates `shortfall = targetWidth - totalWidth` and maps it to log units:*
- If shortfall ≈ 240px (1 quarter short):
> 🤔 **Bucky:** *"Almost there — feel that gap on the right side? It's about the size of one more quarter log. Can you hear how quiet the river sounds through that gap? Add one more little log to close it!"*
- If shortfall ≈ 480px (2 quarters short / nothing placed):
> 🤔 **Bucky:** *"The gate is empty, Builder! Drag some logs from the tray up to Row 1. Remember — you need to fill from the left edge ALL the way to the right edge of the blue target."*
- If shortfall ≈ 720px (only 1/4 of gap filled):
> 🤔 **Bucky:** *"You've got one small piece in there — but look how much blue is still showing. That's still open river! Try adding more — or try one of those bigger logs."*

**Path B — TOO LONG (total > 480px), e.g., 1× whole log placed:**
> 🤔 **Bucky:** *"Oops — that log went WAY past the blue line! The whole log is the biggest one we have — it fills the ENTIRE river. But our gap is only half that wide. Can you find something smaller in the tray?"*

- If total > 480px by exactly 240px (3× quarter placed):
> 🤔 **Bucky:** *"You've got one too many! Your logs stick out past the line by about... one quarter log. Try sliding the last one back to the tray. Almost perfectly right!"*

**Path C — Repeated error (same error on 2nd attempt):**

Bucky shifts to a direct comparison hint, animating a 1/2 log "ghost" overlaid transparently on the Reference Gate:

> 🤔 **Bucky:** *"Let me show you a trick — I'm drawing a half log over the gate so you can see the size. Now look at the quarter logs. How many of those small ones does it take to be the same length as that ghost log?"*

*(Ghost overlay fades after 4 seconds. Student must still solve independently.)*

**Path D — 5+ failed attempts (intervention mode):**
> 🦫 **Bucky:** *"You know what — let's build it TOGETHER one time so you can feel it. Watch..."*
> *(Automated demo: 2× quarter logs animate from tray into Row 1 with sound, gate turns green for 2 seconds, then reset)*
> 🦫 **Bucky:** *"Now you try it exactly like that! You've got this."*

***

### 4.5 LESSON_END Graduation

**Visual:** Full-screen celebration: beaver does a happy dance (CSS keyframe), logs rain down as confetti particles, river sparkles, "GATE SEALED 🎉" text in amber.

> 🎉 **Bucky:** *"LEGENDARY BUILDER! You figured out that 1/2 and 2/4 are the SAME thing — just split differently! That's called an equivalent fraction, and mathematicians use that trick their whole lives."*
> *(2-second pause)*
> 🎉 **Bucky:** *"Take a bow. You just did real Grade 4 math... with music AND wood. See you next time, Builder! 🪵🎵"*

**[Button: "Play Again" | "I'm Done"]**

***

## Part 5 — Audio Sound Design Mapping

All audio is generated client-side using the **Web Audio API** (`OscillatorNode` + `GainNode` + `DynamicsCompressorNode`). No external audio files are required. The AudioContext is unlocked on the first user gesture (the "Let's Build!" tap) via `audioCtx.resume()` inside a `touchend` handler.[^11][^10]

### 5.1 Tone Architecture

```javascript
// Master signal chain (initialized once)
AudioContext → OscillatorNode → GainNode (per-note envelope) 
            → DynamicsCompressorNode → AudioContext.destination

// All oscillators use waveType: "triangle" for warm, non-harsh tone
// suitable for children; "sine" is too thin; "square" too harsh
```

### 5.2 Log Pitch-Frequency Mapping

The pitch hierarchy maps directly to the Academic Music note-value analogy:[^4]

| Log Type | Fraction | Musical Note | Frequency | Waveform | Duration | Analogy |
|----------|----------|-------------|-----------|----------|----------|---------|
| Whole Log | 1/1 | C4 (Middle C) | 261.63 Hz | triangle | 1200ms | Whole note = 4 beats |
| Half Log | 1/2 | G4 | 392.00 Hz | triangle | 600ms | Half note = 2 beats |
| Quarter Log | 1/4 | C5 (High C) | 523.25 Hz | triangle | 300ms | Quarter note = 1 beat |

**Chord at gate completion (octave stack):** C4 + G4 + C5 played simultaneously at 100ms stagger — a perfect C major triad, duration 800ms, gain 0.4 each.

### 5.3 Event → Sound Mapping (Complete)

| Event | Sound | Frequency | Duration | Gain Envelope | Notes |
|-------|-------|-----------|----------|---------------|-------|
| **Log tap (any)** | Single tone (see 5.2) | Per log type | Per log type | Attack 10ms, Decay 30ms, Release 200ms | Plays on `touchstart` |
| **Log drag (continuous)** | Soft rustle | White noise burst, gain 0.05 | Active during drag | Constant | Generated via `createOscillator` + `BiquadFilterNode` highpass @ 800Hz |
| **Log snap to grid** | Soft "thunk" | 180 Hz triangle | 150ms | Attack 5ms, sharp decay | Pitch drop: start 200Hz, end 160Hz using `freq.linearRampToValueAtTime` |
| **Log placed in Build Zone** | Tone (log type) + thunk | See table above + 180Hz | See above + 150ms | Both simultaneously | |
| **Chop — long press begins** | Rising tension tone | 300→600Hz sine sweep | 500ms (matches long-press duration) | Linear gain increase | `freq.exponentialRampToValueAtTime` |
| **Chop — confirmed** | Sharp crack + two tones | 600Hz "crack" burst + both child log tones | 80ms crack + 300ms tones | Crack: fast attack/decay; Tones: stagger 50ms | Simulates wood splitting |
| **Chop — 1/4 log (disabled)** | Low "bonk" + wiggle | 120Hz sine | 200ms | Gain 0.2, single pulse | Accompanies the CSS wiggle animation |
| **Reference Gate appears** | Ascending arpeggio | C4→G4→C5 (100ms each) | 300ms total | Smooth gain 0.35 | Played once on INSTRUCT entry |
| **Row 1 fills (partial — not yet matching)** | Neutral "plop" | 300Hz triangle | 100ms | Gain 0.15 | Low-key acknowledgment |
| **Gate MATCHED — INSTRUCT win** | C major triad | C4 + G4 + C5 staggered 80ms | 1000ms | Swell: attack 50ms, sustain, decay 500ms | Gain 0.5 each |
| **CHECK submitted — CORRECT** | Full graduation fanfare | C4-E4-G4-C5 arpeggio + sustained chord | 500ms arpeggio + 1500ms hold | Gain 0.6 + reverb via `ConvolverNode` | The single most impactful sound |
| **CHECK submitted — TOO SHORT** | Descending two-tone drop | G4 → E4 | 200ms each | Gain 0.3, soft | Non-alarming; indicates "not quite" |
| **CHECK submitted — TOO LONG** | Low wobble | 160Hz sine, ±10Hz LFO at 4Hz | 400ms | Gain 0.25 | Signals "too much" without being harsh |
| **Repeated error (Path C ghost shown)** | Slow C4 tone | 261.63Hz, very soft | 800ms | Gain 0.15, slow fade in | Bucky's "thinking" sound |
| **LESSON_END graduation** | Full 4-beat rhythm + chord | C5-C5-C5-C5 (quarter notes at 120bpm) then C major chord | 2000ms | Percussive + harmonic blend | Embodies the 4/4 rhythm lesson payoff |
| **Bucky dialogue begins** | Soft notification chime | E5 + G5 interval | 200ms | Gain 0.2 | Signals new text burst |
| **Idle (>10s no interaction)** | Gentle log creak | 200Hz triangle, slow tremolo | 600ms, random interval 8–14s | Gain 0.08 | Atmospheric; maintains engagement |

### 5.4 iOS Safari Audio Implementation Notes

```javascript
// Step 1: Create context immediately at script load
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// Step 2: Unlock on first user gesture (required on all iOS Safari versions)
// Must use touchend, NOT touchstart — touchstart does NOT grant user activation
function unlockAudio() {
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().then(() => {
      document.body.removeEventListener('touchend', unlockAudio);
    });
  }
}
document.body.addEventListener('touchend', unlockAudio);

// Step 3: Oscillator pattern (create new per note; do NOT reuse)
function playTone(freq, duration, waveType = 'triangle', gain = 0.4) {
  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  const compressor = audioCtx.createDynamicsCompressor();
  
  osc.type = waveType;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
  gainNode.gain.linearRampToValueAtTime(gain, audioCtx.currentTime + 0.01);
  gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + duration/1000);
  
  osc.connect(gainNode);
  gainNode.connect(compressor);
  compressor.connect(audioCtx.destination);
  
  osc.start();
  osc.stop(audioCtx.currentTime + duration/1000 + 0.05);
}

// IMPORTANT: Safari allows max 4 simultaneous AudioContext instances
// Use a single shared AudioContext for all sounds in the app
```

***

## Part 6 — Week-Long Lesson Progression (5-Day Plan)

### Session Structure Overview

Each session runs 20–25 minutes. The game auto-saves phase completion in `localStorage` keyed to a student ID. On return, students re-enter at their highest unlocked phase.

| Day | Phase Entry Point | Core Focus | New Mechanic Introduced | Exit Condition |
|-----|------------------|-----------|------------------------|----------------|
| 1 | BOOT → EXPLORE | Free play, sound discovery | Tap, drag, chop | 90s sandbox + first chop |
| 2 | EXPLORE → INSTRUCT | 1/2 = 2/4 guided build | Reference Gate, CHECK button | INSTRUCT_WIN |
| 3 | INSTRUCT → CHECK | Independent equivalence solve | Submit button, mixed tray | CHECK_WIN (Solution A or B) |
| 4 | CHECK (reset) | Fluency with mixed logs | Same puzzle, faster solve goal | CHECK_WIN in < 60 seconds |
| 5 | CHECK (new target: 3/4) | Extending to non-1/2 targets | New gate width: 720px = 3/4 | CHECK_WIN on 3/4 puzzle |

### Day 5 Extension — Targeting 3/4

On Day 5, the Reference Gate changes to 720px (3/4 river width). Bucky introduces it:

> 😄 **Bucky:** *"New challenge! This gap is bigger — three quarter-logs wide. Can you figure out how many pieces it takes? Listen carefully to the sounds..."*

Valid solutions: [3× quarter logs] OR [1× half + 1× quarter log]. Both are accepted. This extends the lesson to CCSS 4.NF.A.1's "generate equivalent fractions" standard.

***

## Part 7 — Teacher & Implementation Notes

### Accessibility

- **Touch target minimum:** All draggable logs are at least 80px tall (44px WCAG minimum × 2 for young children's motor accuracy)
- **Color independence:** Log size differences are always distinguishable by width alone; no information is conveyed by color only
- **Audio alternatives:** Each tone event has a visible animation counterpart (log glow, pulse) for students using devices in silent mode
- **Text size:** Bucky's chat bubbles use minimum 18px font; phase indicators use 16px

### Known iOS Safari Constraints

- AudioContext must be initialized on user gesture — the BOOT screen serves this purpose[^12][^10]
- Maximum 4 AudioContext instances per page — the app uses exactly one, shared globally[^10]
- `touchstart` does NOT grant audio activation — `touchend` must be used[^13]
- Avoid `position: fixed` for draggable elements on Safari iOS — use `position: absolute` within a scrolling container to prevent viewport jump bugs during drag

### Assessment Data to Log

Each session should write the following to `localStorage` (or POST to a teacher dashboard endpoint):

```json
{
  "studentId": "string",
  "sessionDate": "ISO8601",
  "exploreChopCount": 0,
  "exploreDropCount": 0,
  "instructAttempts": 0,
  "instructErrorTypes": ["TOO_SHORT", "TOO_LONG"],
  "checkAttempts": 0,
  "checkSolution": "2xQUARTER | 1xHALF | null",
  "checkTimeToSolve": 0,
  "graduationReached": true
}
```

The `instructAttempts` and `checkAttempts` counters are the primary formative data points. Three or more attempts on INSTRUCT suggests the student may benefit from a physical manipulative session before returning to the digital tool.[^1][^5]

---

## References

1. [EJ1253853 - Teaching Fraction Concepts Using the ...](https://eric.ed.gov/?id=EJ1253853) - Understanding related to fraction concepts is a critical prerequisite for advanced study in mathemat...

2. [EJ1268499 - A Comparison of Concrete-Representational-Abstract ...](https://eric.ed.gov/?id=EJ1268499) - This study compares the effects of a concrete-representational-abstract (CRA) intervention against a...

3. [‘MusiMath’ and ‘Academic Music’ – Two music‐based intervention programs for fractions learning in fourth grade students](https://onlinelibrary.wiley.com/doi/abs/10.1111/desc.12882) - ## Abstract

Music and mathematics require abstract thinking and using symbolic notations. Controver...

4. ['MusiMath' and 'Academic Music' – Two music‐based intervention ...](https://pmc.ncbi.nlm.nih.gov/articles/PMC7378943/) - For example, in the duple meter of 4/4 time, a whole note represents four beats, a half note equals ...

5. [Using virtual manipulatives as a tool to support students in learning ...](https://ies.ed.gov/learn/blog/using-virtual-manipulatives-tool-support-students-learning-fractions) - Below, we highlight the benefits of using virtual manipulatives for teaching fractions and share how...

6. [Using The CRA Approach To Teach Fractions](https://www.therecoveringtraditionalist.com/concrete-representational-abstract-approach-for-fractions/) - How to use the concrete representational abstract approach for fractions so that your students actua...

7. [Implications for educational practice of the science of learning and ...](https://www.tandfonline.com/doi/full/10.1080/10888691.2018.1537791) - This article draws out the implications for school and classroom practices of an emerging consensus ...

8. [Rhythm-Based Curriculum Boosts Children's Fraction Skills - Innovations Report](https://www.innovations-report.com/education/studies-and-analyses/rhythm-helps-children-grasp-fractions-study-finds-192734/) - An innovative curriculum uses rhythm to teach fractions at a California school where students in a m...

9. [Getting in rhythm helps children grasp fractions, study finds](https://news.sfsu.edu/archive/getting-rhythm-helps-children-grasp-fractions-study-finds.html) - SAN FRANCISCO, March 22, 2012 -- Tapping out a beat may help children learn difficult fraction conce...

10. [Unlock JavaScript Web Audio in Safari and Chrome](https://www.mattmontag.com/web/unlock-web-audio-in-safari-for-ios-and-macos) - Update: This is now necessary for Chrome, too. You might see this message in the console: The AudioC...

11. [Web Audio API demo doesn't work on iOS - Stack Overflow](https://stackoverflow.com/questions/46010483/web-audio-api-demo-doesnt-work-on-ios) - Safari on iOS 6 effectively starts with the Web Audio API muted. It will not unmute until you attemp...

12. [Web Audio API do not play after us… | Apple Developer Forums](https://developer.apple.com/forums/thread/23499) - I know that there is a limitation in iOS Safari where the audio is not playing until user triggers a...

13. [iOS9 Safari Web Audio starts in suspended mode](https://medium.com/@laziel/ios9-safari-web-audio-starts-in-suspended-mode-9c810848b142) - AudioContext removes user-gesture restriction during resume(). resume() changes context state to ‘ru...

