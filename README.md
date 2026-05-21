# Bucky's River Gate

> An interactive iPad lesson that teaches fraction equivalence (1/2 = 2/4)
> to 9-year-olds through a chop-and-place log-building game.

**Live demo:** https://superbuilders-phi.vercel.app
**Target platform:** iPad Safari (landscape)
**Target learner:** Grade 3–4 students; no prior fraction notation required
**Lesson length:** 20–25 minutes, single session

---

## The Problem

Most digital fraction lessons present fractions as **abstract symbols** (`1/2`,
`2/4`) before the student has built a physical intuition for what those
symbols *mean*. Worse, equivalence is usually introduced as a memorised
rule (`multiply top and bottom by 2`) instead of as a geometric truth.

**Bucky's River Gate** flips this:

1. **Concrete:** the student physically chops one log into halves, then into
   quarters, using a double-tap gesture.
2. **Representational:** a glowing cyan "gate" appears on the river — the
   student fills that gate's width with any combination of logs.
3. **Abstract:** once the student succeeds, the symbolic equation
   (`1/2 = 2/4`) appears as a labelled overlay on top of the geometry
   they just built. The math comes *after* the proof, not before.

This is the **Concrete → Representational → Abstract (CRA)** sequence from
math education research, embedded into a single 20-minute interaction.

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│  React UI Tree                                                    │
│  ├─ BootScreen (initial title/start)                              │
│  └─ LessonScreen                                                  │
│     ├─ TopBar  (title, phase chips, chops counter, Undo)          │
│     ├─ SnapGuides  (dashed lane dividers, build-phase only)       │
│     ├─ ReferenceGate (cyan glowing target, INSTRUCT/CHECK)        │
│     ├─ river-row     (placed logs, percentage-anchored slots)     │
│     ├─ SpeechBubble  (Bucky's dialogue, typewriter effect)        │
│     ├─ BuckyAvatar   (animated mascot, tap-to-continue affordance)│
│     ├─ CheckButton   (primary action during BUILD phases)         │
│     ├─ dock-tray     (drag source for logs)                       │
│     └─ overlays/     (GhostOverlay, EquivalenceBadge, WinScreen)  │
│                                                                   │
│  State Machine (useReducer)                                       │
│  ├─ state:    LessonState  (phase, blocks, buildZoneLogs, etc.)   │
│  ├─ events:   LessonEvent  (DIALOGUE_ADVANCE, CHOP, LOG_SNAPPED…) │
│  └─ reducer:  lessonReducer.ts  — pure (state, event) → state     │
│                                                                   │
│  Side Effects (outside the reducer)                               │
│  ├─ Audio:    toneEngine — Web Audio API, synthesized tones       │
│  ├─ Dialogue: hardcoded tree in dialogue.ts (no LLM at runtime)   │
│  └─ Drag:     pointer-event handlers in LessonScreen.tsx          │
└──────────────────────────────────────────────────────────────────┘
```

### Data flow per interaction

1. **User action** (tap Bucky, drag a log, double-tap to chop) fires a
   `LessonEvent` from the component that detected it.
2. **`lessonReducer(state, event)`** computes the next `LessonState`. The
   reducer is pure: no DOM access, no audio, no timers.
3. **React re-renders** the tree against the new state. Side effects (sound,
   focus management) are triggered by `useEffect` hooks watching the state
   diff.
4. **Dialogue progression** runs through a hand-built finite-state machine:
   every dialogue node has a `nextNode`, a `tapToContinue` flag, and a
   `buckyState` (which mascot animation to play). No runtime LLM means no
   chance of hallucinating wrong math.

### The scene as the game board

The kawaii river illustration (`app/public/bucky-background.png`) is a single
high-resolution PNG. It is **not just a backdrop** — the dock, banks, and
visual depth of the river ARE the layout grid. Every interactive React
element is positioned in percentage coordinates against zones encoded in the
image:

```css
:root {
  --zone-lane-inset:   13%;   /* where bank stones live in the PNG */
  --zone-river-top:    40%;   /* placed-log row vertical position  */
  --zone-gate-top:     27%;   /* reference gate sits above the row */
  --zone-dock-bottom:  5%;    /* dock tray on the wooden plank     */
  --zone-bucky-bottom: 14%;
  --zone-bucky-left:   4%;
  --zone-bucky-width:  19%;
}
```

Swapping the background image requires re-tuning these six numbers but no
React or component changes. The art and the layout are loosely coupled
through CSS variables.

---

## Tech Stack & Rationale

| Layer | Choice | Why |
|---|---|---|
| **Framework** | React 19 + TypeScript | Component model for the game UI tree. TS catches state-shape errors at build time. React 19's automatic batching simplifies rapid state updates during chop animations. |
| **Build / dev** | Vite 8 | Sub-second HMR is critical when tuning visual percentages by eye. Production output is a static SPA that any CDN can serve. |
| **State** | `useReducer` (hand-rolled FSM) | The lesson has ~20 finite phases with deterministic transitions. Redux/XState would be overkill for a single-session, no-persistence app. The whole reducer is ~700 lines and readable in one sitting. |
| **Styling** | CSS Modules + custom properties + a small Tailwind sprinkle | The kawaii theme has a tightly-curated palette best expressed as CSS variables in `tokens.css`. Tailwind is included but used sparingly — most styling is in `kawaii-theme.css` to keep the design system colocated. |
| **Audio** | Web Audio API (oscillators + gain nodes) | Synthesised tones are zero-bytes-to-load, latency-free, and perfectly tunable. Whole/half/quarter logs map to C4/G4/C5 — a 4/4 pentatonic that pairs spatial fraction width with musical pitch (dual-coding effect from Academic Music research). |
| **Background art** | Single PNG via CSS `background-image: cover` | The illustration is the most visually-loaded asset. Pre-rendering it as a PNG offloads ~30 seconds of CSS gradient work and gives an artist final pixel control. |
| **Mascot** | `<object data="…svg+xml">` (not `<img>`) | Embedded `<style>` blocks with `@media` queries are stripped from SVGs loaded via `<img>`. Mascot animations live inside those style blocks, so `<object>` (which loads the SVG as a real document) is required. |
| **Testing** | Vitest + Testing Library (jsdom) | Vitest shares Vite's transform pipeline, so tests run against the same code the browser runs. Pool set to `forks` because the threaded pool intermittently fails to initialise jsdom when `vite-plugin-svgr` is active. |
| **Deploy** | Vercel (GitHub-integrated) | Zero-config static deploy; PR previews give us a real iPad-testable URL per branch. `vercel.json` overrides the build to run from `app/` since the repo is a monorepo. |

---

## Key Design Decisions & Trade-offs

### 1. Hardcoded dialogue tree (no LLM at runtime)

- **Chosen:** TypeScript object with `text`, `buckyState`, `nextNode`,
  `tapToContinue`, `autoAdvance` per node.
- **Alternative considered:** GPT-4 or LangChain agent for dynamic dialogue.
- **Why this:** A maths tutor that hallucinates `1/2 = 3/4` is catastrophic
  for a 9-year-old. Zero runtime LLM = zero math-correctness risk. Also: no
  API-key exposure in a browser bundle, no per-session latency, no offline
  failure mode.
- **Trade-off:** Dialogue is rigid. Adding a new question = code change +
  redeploy. For a 20-minute single-session app this is fine; for a
  semester-long product it would not be.

### 2. Pure-functional reducer FSM (no XState, no Redux)

- **Chosen:** `(state, event) => state`, hand-written, ~700 lines.
- **Alternative considered:** XState for visual diagrams, Redux Toolkit for
  selectors and middleware.
- **Why this:** Closed state space of ~20 nodes. Test surface is enormous
  but cleanly enumerated (one test per slide transition). XState's runtime
  + learning curve isn't justified by the size; Redux's middleware ecosystem
  isn't needed since side effects (audio, focus) are colocated with the
  components that trigger them.
- **Trade-off:** No visual state diagram out of the box. Mitigated by
  comments in the reducer that name every phase transition.

### 3. Integer cross-multiplication for fraction equivalence

- **Chosen:** `a/b ≡ c/d` ↔ `a × d === b × c`. Never float-point.
- **Why:** `0.1 + 0.2 !== 0.3` in JavaScript. For a maths tutor, a
  rounding error that makes `1/4 + 1/4 ≠ 1/2` is a category-A bug.
- **Trade-off:** Only works cleanly for the same-denominator family the
  lesson uses (halves and quarters share LCM 4). Generalising would need
  a proper rational-number library.

### 4. Web Audio synthesis (no audio files)

- **Chosen:** `OscillatorNode` + `GainNode` per tap; pitches mapped to
  fraction value.
- **Why:** Zero loading time, zero CDN traffic, full ms-precision over
  scheduling, instant testability.
- **iOS constraint:** `AudioContext` MUST be constructed inside a user
  gesture handler. We construct it during the BOOT screen's "Let's Build!"
  tap and play a silent buffer immediately to unlock the context. Mishandle
  this and iOS Safari blocks audio for the entire session with no error.
- **Trade-off:** Synth fidelity is limited compared to sampled instruments.
  For a fraction lesson the simplicity is a feature.

### 5. Scene-as-game-board (PNG backdrop = layout grid)

- **Chosen:** A single illustrated PNG (`bucky-background.png`) is the
  layout reference. React overlays interactive elements at percentage
  coordinates calibrated to zones in the image.
- **Alternative considered:** Build the entire scene in CSS gradients
  (we did this first, then scrapped it).
- **Why this:** The illustrator can spend time crafting cherry-blossom
  detail and water shimmer while we spend time on game logic. The image
  encodes the lane grid, dock, and banks — React doesn't have to draw
  them. Side benefit: swapping artwork only retunes CSS variables.
- **Trade-off:** Swapping to a new background requires re-eyeballing the
  six `--zone-*` values. We don't have automated alignment.

### 6. Tap Bucky to continue (no separate continue button)

- **Chosen:** Bucky's avatar becomes the "tap to advance" affordance when
  dialogue is waiting — a pulse animation cues it, and `onPointerDown`
  fires immediately (not `onClick`).
- **Alternative considered:** Floating green ▶ button (we had this first).
- **Why this:** Tapping the character feels like "talking to Bucky" — the
  character is alive, listening. A separate UI button reads as game chrome.
  For a 9-year-old, the embodied interaction lands more strongly.
- **Trade-off:** Lower discoverability than a labelled button. We mitigate
  with a "✦ tap me" pill that fades in/out above Bucky when he's waiting.

### 7. Proportional logs across both zones

- **Chosen:** A 1/4 log on the dock is the same pixel width as a 1/4 in
  the river — both 25% of the lane band. Wrappers carry `flex-basis`,
  logs fill 100% of their wrapper.
- **Why:** A 9-year-old shouldn't have to mentally rescale "what 1/4 looks
  like" when moving a piece from tray to workspace. Visual consistency =
  one less cognitive load.
- **Trade-off:** Dock-tray now spans the full lane band (~80% of viewport)
  which extends slightly past the wooden dock graphic on the edges. We
  accept that for the proportional fidelity win.

---

## Constraints & Edge Cases

### Constraints we deliberately accepted

- **iPad Safari only.** Phone-width or desktop-mouse experiences are
  out of scope. The `touch-action: none` on `.lesson-screen` blocks
  default scroll/zoom, which is wrong for any non-tablet form factor.
- **Landscape orientation.** Portrait mode would crop the dock + speech
  bubble badly. No orientation-lock prompt yet (future work).
- **Single session, no persistence.** State lives in React only.
  Refresh = restart. Saving progress would require a backend.
- **Audio gated to user gesture.** First chop sound after BOOT screen
  may be silent on iOS if the context didn't unlock cleanly. We play
  a silent buffer to defend against this but rare cases slip.
- **Hardcoded 4-slot lane grid.** The whole lesson assumes denominators
  ≤ 4. Adding thirds or fifths would require a new background image
  with different lane dividers and a generalised slot computation.

### Edge cases handled

- **Double-tap discrimination:** Logs accept a chop only when two taps
  arrive within `DOUBLE_TAP_MS = 300`. Single taps play a "bonk" sound
  instead so the kid gets feedback that the gesture registered.
- **Quarters can't be chopped further:** `splittable = denominator < 4`.
  Taps fall through to the bonk sound, not silent.
- **Drag-tap distinction:** A drag is registered only after the pointer
  moves > 8px. Below that threshold, the gesture is treated as a tap
  and the log snaps directly into the next free slot.
- **Idempotent CHOP:** if a chop is somehow fired on a non-splittable
  block, `splitBlock` returns the original array by reference (not a
  clone). The reducer checks reference equality to decide whether the
  `chopCount` should increment, avoiding stuck-state issues.
- **Empty dock during chop:** if a chop happens on a log that's the
  parent of nothing in `buildZoneLogs`, the ID-insertion helper is a
  no-op rather than crashing.

### Known weaknesses

- **Drag detection edge cases on multi-touch.** If two fingers touch
  simultaneously, the pointer system may track the wrong one.
- **No undo for chops.** Once chopped, you can't merge halves back into
  a whole — the kid has to drag them off the river and rely on the
  inventory to start over. A "regrow" gesture would close this loop.
- **No reduced-motion fallback for all animations.** `prefers-reduced-motion`
  is respected for the Bucky pulse, but not yet for the log mount-pop or
  the SVG mascot's internal `@media` animations.
- **Lane numbers were removed.** Without them, a kid describing their
  work verbally has no shared vocabulary ("put my piece in lane 2").
  Considered for re-add as voice-over labels rather than visible chrome.
- **Tests against jsdom are flaky in some CI environments.** Vitest
  pool is pinned to `forks` to mitigate, but `vite-plugin-svgr` × Vitest
  threading is the underlying issue. A long-term fix would migrate the
  SVG import strategy.

---

## Future Improvements

### Lesson content

- **More fraction families.** Thirds, fifths, sixths — requires new
  background image and a generalised `slotCount` system.
- **Adaptive difficulty.** Track which CHECK challenges the kid struggles
  with and offer remediation paths through the dialogue tree.
- **Multi-session progression.** Persist progress to localStorage or a
  backend so a kid can return mid-lesson. Requires a save/load layer
  the current FSM doesn't need.

### Engineering

- **Replace `<object>` mascot with inline SVG via `vite-plugin-svgr`.**
  Eliminates the SVG-document loading layer and gives full control over
  the mascot's per-state animations from React.
- **Generate `--zone-*` variables from image annotations.** Right now
  we eyeball the lane-inset etc.; a small Python script could read an
  annotated PSD and emit a CSS variable file.
- **Migrate test environment off vite-plugin-svgr's worker init.** Or
  move SVG imports into Vite asset URL imports to sidestep the
  threading conflict.
- **Add a regression-suite of phase screenshots.** A Playwright job
  that drives the app through each phase and saves a screenshot would
  catch visual regressions that unit tests miss.

### UX

- **Voice-over Bucky.** Pre-recorded mascot lines instead of typewriter
  text — makes the lesson accessible to pre-readers.
- **Achievement / star rating after WIN.** A small reward at the end of
  the 20-min session that the kid can show a parent.
- **Multi-language support.** Dialogue tree is in TypeScript; pulling
  the strings into a translation file is straightforward.

---

## Local Development

### Prerequisites

- Node.js ≥ 20
- npm

### Setup

```bash
git clone https://github.com/robin-raq/buckys-river-gate.git
cd buckys-river-gate/app
npm install
```

### Common commands

```bash
npm run dev          # Vite dev server at http://localhost:5173
npm run build        # tsc -b && vite build → static dist/
npm run preview      # Serve the production build locally
npm run test         # Run the Vitest suite (forks pool, ~10s)
npm run lint         # ESLint over src/
```

### Pre-commit checklist

The CI pipeline (Vercel) runs `npm run build` which is `tsc -b` plus
the Vite build. To avoid build-time surprises:

```bash
cd app && npm run build && npm run test
```

A clean exit from both means the PR will pass Vercel's checks.

---

## Project Structure

```
superbuilders/
├── README.md                            # ← you are here
├── vercel.json                          # Build override (install + build from app/)
├── app/                                 # Vite app root
│   ├── public/
│   │   ├── bucky-background.png         # The scene plate (3:2 illustration)
│   │   ├── beaver-mascot.svg            # The animated Bucky mascot
│   │   └── …                            # Older per-state mascots (deprecated)
│   ├── src/
│   │   ├── components/                  # UI components (one file each)
│   │   ├── components/overlays/         # GhostOverlay, EquivalenceBadge, etc.
│   │   ├── state/
│   │   │   ├── lessonReducer.ts         # The FSM core (~700 lines)
│   │   │   ├── dialogue.ts              # Hardcoded dialogue tree
│   │   │   ├── checkChallenges.ts       # CHECK-phase challenge bank
│   │   │   ├── types.ts                 # LessonState, BlockState, BuckyState, …
│   │   │   ├── lessonEvents.ts          # LessonEvent discriminated union
│   │   │   └── initialState.ts          # Bootstraps state from scratch
│   │   ├── hooks/                       # useDialogueEffects, useReducedMotion
│   │   ├── utils/                       # fractionMath, lessonPhase, mascot maps
│   │   ├── audio/toneEngine.ts          # Web Audio synthesis
│   │   ├── styles/                      # Token CSS + theme + animations
│   │   ├── constants/                   # RIVER_WIDTH_PX, etc.
│   │   └── test/helpers/                # Shared test fixtures
│   ├── vite.config.ts                   # Vite + Vitest config (pool: forks)
│   └── package.json
└── docs/                                # Game design + visual mockups
```

---

## Acknowledgements

The pedagogical design draws on:

- **Concrete → Representational → Abstract (CRA)** instructional sequence
  from math education research.
- **Academic Music / MusiMath** (Courey et al., SFSU) — the 4/4 time
  signature ↔ fraction isomorphism.
- **CCSS.MATH.CONTENT.3.NF.A.3b** — Recognise and generate simple
  equivalent fractions.

Full lesson plan and learning-science citations are in
`Bucky's River Gate — Game Design Document & Lesson Plan.md`.
