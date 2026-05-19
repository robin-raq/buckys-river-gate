# PRESEARCH.md — Clone Synthesis Tutor
**WK04-CST · Superbuilders Gauntlet · Week 4 · May 18, 2026**
**Answers every question in the Pre-Search Checklist, specific to this project.**

---

## Final Deliverables (Our North Star)

Everything in this document exists to get us to these four things by **Friday May 22, 2026 at noon**:

| # | Deliverable | Definition of Done |
|---|---|---|
| 1 | **Working web app** | Single fraction equivalence lesson, live on a public URL, runs in iPad Safari without errors |
| 2 | **iPad roadmap doc** | Short doc + sketches explaining touch targets, gestures, and what changes from desktop |
| 3 | **1–2 minute demo video** | Shows the beaver smashing blocks, the fraction wall, the equivalence reveal, and all 3 check questions |
| 4 | **README** | How to run it locally + a plain-English description of the technical approach |

---

## Phase 1: Define Your Constraints

---

### 1. Domain Selection

**Domain:** Custom EdTech — K-3 mathematics, fraction equivalence

**PRD Functional Requirements Compliance:**

| PRD Requirement | How We Meet It | Design Decision |
|---|---|---|
| Chat-style tutor interface | Beaver speech bubbles appear directly on the canvas above the character | A traditional split-screen chat panel adds UI overhead and splits the child's attention. Keeping the tutor voice attached to the beaver character means the student's eye never leaves the manipulative. The speech bubble IS the chat interface — same function, better UX for a 9-year-old. |
| Scripted dialogue with branching | Hardcoded TypeScript dialogue tree with `correct_next`, `incorrect_next`, `fallback_next` per node | No LLM — fully deterministic |
| Combining, splitting, smashing | **SMASH** (our term: CHOP) splits a whole block. **COMBINE** (our term: BUILD) fuses smaller blocks. | Terminology note: PRD uses "smash" and "combine." Our implementation names these CHOP and BUILD to match the beaver's physical actions. They are the same interactions. CHOP = SMASH. BUILD = COMBINE. |
| Lesson starts with free exploration | Free play phase precedes all guided instruction | See Use Case 0 below |

---

**Specific use cases we support:**

**Use Case 0 — Free Play Exploration (no guidance, student-led)**
- The lesson opens with the beaver sitting quietly beside the fraction wall
- All blocks are tappable — no instructions, no speech bubble yet
- The student can tap any block, hear a tone, and see it respond
- After the student has interacted with at least 2 blocks, the beaver "wakes up" and begins the guided lesson
- Purpose: lets the student feel agency and curiosity before the teaching starts — the lesson feels like discovery, not instruction
- Duration: 30–60 seconds of free play before the beaver speaks

**Use Case 1 — Beaver Smash / Chop (split direction: whole → parts)**
- A 9-year-old taps a 1/2 fraction block on the fraction wall
- The beaver raises its axe and CHOPS the block — it splits into two 1/4 pieces
- The two 1/4 pieces land side by side in the row below, occupying the exact same horizontal space as the original 1/2 block
- The student sees: two different-looking fractions filling the same space = they must be equal
- The beaver names the discovery: "Two quarters fit perfectly where one half was. That means 1/2 = 2/4!"

**Use Case 2 — Beaver Combine / Build (combine direction: parts → whole)**
- The student taps one 1/4 block to select it, then taps a second 1/4 block
- The beaver stacks the two pieces together — they fuse into a single 1/2 block
- The combined block slides up and aligns with the reference 1/2 row, matching it exactly
- The student sees the equivalence proven from the opposite direction: two pieces rebuilt the original
- The beaver confirms: "You stacked them back! Two 1/4 pieces make one 1/2 — every time."

**Use Case 3 — Check for Understanding (abstract phase)**
- The beaver asks 3 questions using the fraction wall as a visual aid
- Correct answers unlock the next question
- Wrong answer → beaver gives a warm hint → student tries again
- Still wrong after hint → beaver says "Let's go back and look at the blocks again!" → lesson restarts from the INSTRUCT phase (free play is skipped on retry — student goes straight back to the smash/combine demonstrations)
- The lesson only ends when the student answers all 3 questions correctly on their own
- **There is no answer reveal. Completion requires correct answers.**

---

**Full Lesson Arc — Explore → Instruct → Check**

This is the exact sequence the PRD requires. Every node in the dialogue tree maps to one of these three phases:

```
EXPLORE (free play, ~60s)          ← runs once, skipped on retry
  Student taps blocks freely, hears tones, sees responses
  No beaver speech yet — pure curiosity and agency
  Trigger to advance: student taps at least 2 different blocks
        ↓
INSTRUCT (guided manipulation, ~3–4 min)     ← repeats on retry
  Beaver wakes up and greets the student
  Phase A — SMASH: beaver guides student to tap the 1/2 block → it smashes into 2x 1/4
  Phase B — REVEAL: beaver names the equivalence → "1/2 = 2/4"
  Phase C — COMBINE: beaver guides student to tap both 1/4 blocks → they fuse back into 1/2
  Phase D — CONFIRM: beaver confirms both directions prove the same truth
        ↓
CHECK (3 questions, ~2 min)
  Q1: "Which fraction equals 1/2?" (multiple choice)
  Q2: "How many 1/4 pieces make 1/2?" (free text)
  Q3: "Is 3/4 the same as 1/2?" (yes/no)

  Wrong answer → warm hint → second attempt still wrong →
        ↓
  RETRY — beaver: "Let's go back and look at the blocks again!"
  Lesson restarts from INSTRUCT phase (free play skipped)
  No answer is ever revealed — student must get it right to advance
        ↓
  All 3 correct → WIN — beaver victory animation + fanfare
  Lesson completion = genuine understanding, not just persistence
```

**Verification requirements:**
- All fraction equality is validated using integer cross-multiplication: `a/b == c/d` ↔ `a × d === b × c`
- This is exact rational arithmetic — no floating point, no rounding, no approximation
- The beaver never states a mathematically incorrect equivalence under any code path
- Wrong answer = the tutor gently redirects, never silently skips

**Data sources we need access to:**
- No external data sources. The dialogue tree is a hardcoded TypeScript `const`
- The fraction math is pure arithmetic — no lookup tables, no APIs
- Audio is synthesized at runtime by the Web Audio API — no `.mp3` or `.wav` files

---

### 2. Scale & Performance

**Expected query volume:** 1 concurrent user (demo device). No multi-tenancy this sprint.

**Acceptable latency for responses:**

| Interaction | Latency ceiling | Why |
|---|---|---|
| Touch → block visual response | < 16ms (1 frame @ 60fps) | Below this the block feels physical. Above it, it feels like software. |
| Block tap → beaver audio tone | ≤ 5.3ms (1 Web Audio render quantum) | Must schedule at `audioCtx.currentTime + 0`. Any offset breaks tactile-audio coupling. |
| Beaver speech bubble appears after correct answer | < 50ms | Reward must feel instant. Delays break the dopamine loop for a 9-year-old. |
| Equivalence math check | < 1ms | Pure integer arithmetic in-browser. No network call. |

**Concurrent user requirements:** 1. Single-session, single-device demo.

**Cost constraints for LLM calls:** $0.00. No LLM is called at runtime. Claude was used offline during authoring to review dialogue warmth — that cost is a one-time dev expense, not per-session.

---

### 3. Reliability Requirements

**Cost of a wrong answer in this domain:**
A 9-year-old who is told "3/4 equals 1/2" by a trusted animated tutor cannot self-correct. They will carry that wrong model into their next classroom test. This is qualitatively worse than an adult app returning a stale result. Wrong math = catastrophic product failure.

**Verification that is non-negotiable:**
- Integer cross-multiplication is the single source of mathematical truth
- The dialogue tree is validated at module load time — every `correct_next`, `incorrect_next`, and `fallback_next` must reference an existing node ID or the app throws before rendering
- No node can advance the lesson to the "equivalence confirmed" state without the math check passing

**Human-in-the-loop requirements:**
None at runtime. All dialogue is human-authored. The beaver never generates text — it only reads from the authored script.

**Audit/compliance needs:**
- COPPA: No PII collected, no accounts, no persistence. Zero compliance surface.
- FERPA: Not applicable — no student records created.
- No server-side logging this sprint. Interaction events are stored in a client-side array for post-session review only.

---

### 4. Team & Skill Constraints

**Stack profile:**

| Skill | Velocity | Sprint role |
|---|---|---|
| React component architecture | High | Full ownership of BeaverCanvas and App |
| Vite + Tailwind CSS | High | Setup complete in < 30 minutes |
| TypeScript reducer / FSM | Medium-High | Hand-rolled — no XState dependency to learn |
| SVG layout and animation | Medium | Fraction wall is rectangles + CSS transitions. No arc math needed. |
| Web Audio API | Medium — first sprint with it | **Highest technical risk.** Must be proven on real iPad by end of Day 2. |
| CSS animation (chop/build gestures) | Medium | `@keyframes` scale + translate. No animation library needed. |
| Dialogue script authoring | High | Human writing task. Warmth and pedagogical quality matter more than code here. |

**Biggest schedule risk:** Web Audio API on iOS Safari. The `AudioContext` must be constructed inside a user gesture handler — iOS blocks it at module load. This is counterintuitive and under-documented. If this isn't proven working on the physical iPad by Tuesday evening, the audio layer gets cut and replaced with silent visual-only feedback.

---

## Phase 2: Architecture Discovery

---

### 5. Agent Framework Selection

**Framework chosen:** None. Custom hand-rolled React reducer.

**Why not LangChain / LangGraph / CrewAI:**
These frameworks exist for open-ended reasoning over unknown inputs. Our dialogue is the opposite: a closed, authored, finite-state lesson where every student input has been pre-mapped to a specific pedagogical response. Importing an agent framework would add network dependencies, non-deterministic execution paths, and debugging complexity — all for zero benefit.

**Architecture: Deterministic Finite State Machine (FSM)**

The entire lesson state is a single immutable `LessonState` object. All transitions are pure functions:

```
(state: LessonState, event: LessonEvent) => LessonState
```

**LessonState shape:**
```typescript
{
  currentNodeId:       string       // active dialogue node
  phase:               'concrete' | 'representational' | 'abstract' | 'complete'
  attemptCount:        number       // wrong attempts on current node
  blocks:              BlockState[] // all fraction blocks with positions + sizes
  equivalenceProven:   boolean      // true once chop animation confirms match
  completedChecks:     string[]     // node IDs of passed check questions
  audioUnlocked:       boolean      // true after first user gesture
  log:                 LogEntry[]   // append-only interaction record
}
```

**Single agent or multi-agent:** Single. The beaver IS the agent. One character, one FSM, one source of truth.

**State management:** All state lives in React `useReducer`. No Redux, no Zustand, no external state library. The FSM is a `switch` statement on event type. Simple enough to read in one sitting.

---

### 6. LLM Selection Rationale

**LLM used at runtime:** None.

**Why frontier LLM inference is bypassed for lesson delivery:**

| Risk | Impact |
|---|---|
| Non-deterministic output (temperature > 0) | Same question could produce different beaver responses on repeat plays — untestable |
| p50 latency ~800ms | 50× over the 50ms speech bubble budget |
| Mathematical hallucination | `1/2 = 3/4` is a plausible-sounding LLM output. Catastrophic for a 9-year-old. |
| API key exposure | No server in Option B — key would be in the client bundle |
| Cost | ~$0.003–0.01 per session × school deployment = real money |

**How Claude is used (offline, dev-time only):**

| Task | How Claude helped |
|---|---|
| Dialogue warmth review | Pasted full script → "Does this feel warm and age-appropriate? Flag robotic phrases." |
| Fallback phrase generation | "Write 5 ways a friendly beaver might respond when a 9-year-old gets the wrong answer" |
| Adversarial input generation | "List 10 ways a 9-year-old might type 'one half' incorrectly in a text box" |

Claude touches the authoring process, never the runtime.

---

### 7. Tool Design

**The beaver has two tools. The student triggers both. There is no explicit mode toggle.**

> **Terminology mapping — PRD vs. implementation:**
> The PRD uses the terms "smashing" and "combining." Our implementation names these actions
> **SMASH (also called CHOP)** and **COMBINE (also called BUILD)** to reflect the beaver's
> physical behaviour. They are the same interactions — SMASH = CHOP, COMBINE = BUILD.

#### Mode Switching Design: Script-Guided + Context-Sensitive (Option A + B)

The beaver's speech bubble tells the student what to do (Option A — script drives the phase).
The block type determines what happens when tapped (Option B — context-sensitive behaviour).
The student never sees a mode button. The "switch" is invisible — it is the FSM advancing phases.

```
FSM phase: 'concrete_chop'
  → whole blocks (1/2):  tappable, glow on hover, single tap triggers CHOP
  → small blocks (1/4):  visually dimmed, not interactive
  → beaver speech:       "Tap the big block!"

FSM phase: 'concrete_build'
  → whole blocks (1/2):  dimmed (already chopped, not interactive)
  → small blocks (1/4):  tappable, first tap SELECTS (gold outline), second tap triggers BUILD
  → beaver speech:       "Now tap both little pieces!"
```

The student doesn't switch modes — **the beaver switches modes for them by talking.**
No UI chrome needed. No explanation overhead. The lesson teaches the switching by doing it.

#### Tool 1: SMASH / CHOP (split a block)
*PRD term: "smash" — implementation term: "chop"*

Active only during `concrete_chop` FSM phase. The student taps a whole block. The beaver raises its axe. The block splits.

```
Trigger:      touchend on a splittable block during 'concrete_chop' phase
Precondition: block.splittable === true AND FSM phase === 'concrete_chop'
Animation:    block CSS transform: scaleX(1) → scaleX(0) in 200ms
              two child blocks CSS transform: scaleX(0) → scaleX(1) in 200ms
              beaver sprite: idle → chop → idle
Audio:        sharp crack tone (sawtooth wave, 80ms, 220Hz)
Math check:   combined child block widths === parent block width (integer equality)
FSM event:    { type: 'CHOP', blockId, resultBlocks }
```

#### Tool 2: COMBINE / BUILD (combine blocks)
*PRD term: "combine" — implementation term: "build"*

Active only during `concrete_build` FSM phase. First tap selects. Second tap fuses.

```
Trigger:      touchend on second block during 'concrete_build' phase
              (first tap sets block.selected = true and adds gold outline)
              (second tap on a different block triggers the BUILD)
Precondition: two blocks selected AND FSM phase === 'concrete_build'
              combined value === reference block value
              validated by: a.numerator * b.denominator + b.numerator * a.denominator
              === reference.numerator * a.denominator (when denominators equal)
Animation:    two blocks slide together (CSS translateX) → merge into one block
              merged block slides up to align with reference row
              beaver sprite: idle → build → idle
Audio:        warm wooden thud (triangle wave, 150ms, 130Hz)
FSM event:    { type: 'BUILD', blockIds, resultBlock }
```

#### Fraction Block API contract:

```typescript
BlockState {
  id:           string
  numerator:    number     // always integer
  denominator:  number     // always integer, never 0
  pixelWidth:   number     // Math.round((numerator / denominator) * GRID_WIDTH_PX)
  row:          number     // 0 = reference row, 1 = working row
  slot:         number     // column index (0–3 for a 4-column grid)
  splittable:   boolean    // true if this block can be chopped
  selected:     boolean    // true if student has tapped to select for BUILD
}

GRID_WIDTH_PX = 600        // fixed — matches iPad landscape canvas width
TOTAL_SLOTS   = 4          // grid is always 4 columns (maps to 4/4 music measure)
```

---

### 8. Observability Strategy

**No backend analytics this sprint.** All observation is client-side.

**Client-side interaction log** stored at `window.__lessonLog` — an append-only array written by the FSM on every state transition:

```typescript
LogEntry {
  timestamp:      number   // performance.now() from lesson start
  event_type:     string   // 'CHOP' | 'BUILD' | 'ANSWER' | 'ADVANCE' | 'RESET'
  node_id:        string   // active dialogue node at event time
  phase:          string   // CRA phase
  correct:        boolean | null
  attempt_number: number
  latency_ms:     number   // ms since current node first displayed
}
```

**Key metrics derivable from the log:**

| Metric | Formula | What it signals |
|---|---|---|
| Time to first chop | `log[CHOP_1].timestamp` | How fast the concrete phase lands |
| Check Q attempt rates | `attempts per check node` | Which abstract concepts need better scaffolding |
| Total lesson time | `log[WIN].timestamp` | Target: 5–10 minutes |
| Audio unlock delay | `log[AUDIO_UNLOCKED].timestamp` | How long before first gesture — if high, opening screen needs a clearer call to action |

**Touch failure detection:** If `touchend` fires without an FSM transition within 500ms of `touchstart`, a `TOUCH_MISS` log entry is written. More than 3 consecutive misses = performance regression flag.

---

### 9. Eval Approach

**How we measure correctness before shipping:**

| Test | Tool | Pass condition |
|---|---|---|
| All dialogue node IDs referenced exist | Vitest | No missing `correct_next` / `incorrect_next` / `fallback_next` references |
| All paths reach a terminal node | Vitest (BFS traversal) | Every path from `intro` reaches `win` or `error_sink` |
| Integer math: 1/4 + 1/4 = 1/2 | Vitest | `1*4 + 1*4 === 2 * (4*4/4)` — passes |
| Integer math: 1/4 + 1/4 ≠ 3/4 | Vitest | Assertion returns false |
| Canvas pixel widths sum correctly | Vitest | Two 150px blocks === one 300px reference block |
| Touch targets ≥ 44px | Vitest snapshot | All block SVG elements have `width >= 44` and `height >= 44` |
| Audio context lazy init | Vitest | `getAudioContext()` called outside gesture → returns null without throwing |
| FSM never enters undefined state | Vitest | All 10 event types against all 20 nodes resolve to a known next node |

**Ground truth data sources:**
- Integer arithmetic: self-proving (`1 × 4 === 4 × 1` needs no external oracle)
- Dialogue warmth: human review + offline Claude critique pass
- Touch latency: Chrome DevTools Performance panel on the physical iPad

**Automated vs. human:**
- Math correctness: fully automated (Vitest)
- Interaction quality: human — demoed to at least one non-engineer before Friday

---

### 10. Verification Gate Design

**The lesson cannot advance to abstract phase until spatial equivalence is physically proven.**

This is a structural guarantee — not a conditional check, not a flag. The FSM node for the equivalence confirmation (`chop_confirm`) only routes to the representational phase nodes if the math check passes. If it fails, `chop_confirm` routes back to `chop_retry`. The abstract check questions are unreachable without passing through `chop_confirm`.

**The two-layer verification gate:**

```
Layer 1 — Pixel width check (client, synchronous, < 1ms):
  combinedWidth = leftBlock.pixelWidth + rightBlock.pixelWidth
  referenceWidth = referenceBlock.pixelWidth
  assert combinedWidth === referenceWidth   ← integer equality, no tolerance

Layer 2 — Rational math check (client, synchronous, < 1ms):
  equivalent = (a.numerator * b.denominator + b.numerator * a.denominator)
               === reference.numerator * a.denominator * 2
  (valid when a.denominator === b.denominator, which is always true for our lesson blocks)
```

Both layers must pass before the beaver says "They match!" and the `SHOW_EQUIVALENCE_BADGE` animation fires.

**Confidence thresholds:**

| Gate | Threshold | Failure behaviour |
|---|---|---|
| Pixel width equality | Exact integer match | Canvas resets; dissonant buzz tone; beaver says "Hmm, not quite!" |
| Rational math equality | Exact integer equality | Same as above |
| Check Q answer | Exact string match (case-insensitive, trimmed) | First fail → hint; second fail → restart INSTRUCT phase. No answer ever revealed. |
| All 3 checks passed | `completedChecks.length === 3` AND all answered correctly without reveal | Win fanfare fires; beaver victory animation plays |

---

## Phase 3: Post-Stack Refinement

---

### 11. Failure Mode Analysis

| Failure | Trigger | Recovery |
|---|---|---|
| **Undefined FSM node** | `correct_next` references a deleted node | Caught at module load — app throws before first render |
| **AudioContext blocked** | iOS Safari, no prior gesture | ToneEngine returns silently; visual feedback still works; audio unlocks on next tap |
| **Touch miss on small block** | Finger lands between blocks | `TOUCH_MISS` logged; no FSM transition; blocks stay in place |
| **Chop animation stutters** | Main thread jank > 16ms | CSS `will-change: transform` on all blocks pre-promotes to GPU layer |
| **Student stuck in wrong-answer loop** | 2 wrong attempts on same check | Lesson restarts from INSTRUCT phase — beaver re-demonstrates smash and combine. No answer revealed. Student must answer correctly to complete. |
| **Screen rotation mid-lesson** | iPad rotated between portrait and landscape | Canvas re-renders declaratively from state — no layout breaks because blocks use percentage widths |

---

### 12. Security Considerations

**Prompt injection prevention:** Not applicable — no LLM at runtime.

**Data leakage risks:** None. No PII collected. No network calls after initial page load. `window.__lessonLog` contains only interaction events — no student identity data.

**API key management:** No API keys in the client bundle. No backend.

**Audit logging:** Client-side only. `window.__lessonLog` is available for manual export after a session. Not transmitted anywhere.

---

### 13. Testing Strategy

**Unit tests (Vitest):**
- FSM reducer: every event type × every node combination
- Math validation: all equivalence pairs we teach (1/4+1/4=1/2, 1/4+1/4≠3/4)
- Dialogue tree: structural integrity (all node references exist, all paths terminate)
- Canvas block math: pixel width calculations for all supported denominator values

**Integration tests (manual, on physical iPad):**
- Full lesson run from intro to win — no dead ends
- Wrong answer on each check question — confirm hint appears
- Two wrong answers on same check — confirm answer is revealed
- Rotate iPad mid-lesson — confirm no layout breaks
- Mute iPad before lesson — confirm app still functions visually
- Kill and reload page mid-lesson — confirm clean restart from intro

**Adversarial tests:**
- Tap very fast on multiple blocks simultaneously — confirm no state corruption
- Tap the beaver when no interaction is expected — confirm no crash
- Type gibberish into a free-text answer — confirm graceful fallback

---

### 14. Open Source Planning

Not in scope for this sprint. The deliverable is a working demo, not an open-source library.

Post-demo decision: if Superbuilders chooses to open-source the fraction wall component or the audio synthesis engine, those two modules are already isolated (`BeaverCanvas.jsx` and `toneEngine.js`) and could be extracted independently.

---

### 15. Deployment & Operations

**Hosting:** Vercel or Netlify — static bundle deploy. Free tier. No server to manage.

**Deploy command:**
```bash
cd frontend && npm run build
# Outputs to frontend/dist/
# Drag dist/ folder to Netlify drop UI, or push to Vercel via GitHub integration
```

**CI/CD:** Not configured this sprint. Pre-commit: run `npm run test` and `npm run typecheck` manually before each push.

**Monitoring and alerting:** None this sprint. Post-demo: add Vercel Analytics for page load time and bounce rate.

**Rollback strategy:** Every Vercel/Netlify deploy is versioned. One click to roll back to any prior deploy.

**Offline behaviour:** The app is a static bundle — it works fully offline after first load. No network requests after the HTML/JS/CSS are cached. This is the entire reason we chose Option B (client-only).

---

### 16. Iteration Planning

**How we collect feedback after the demo:**
- Watch a non-engineer interact with the app before Friday — note where they pause, hesitate, or look confused
- Record the demo session (screen + audio) — review for UX friction moments
- `window.__lessonLog` export from the demo device — review check question attempt rates

**Priority order for post-demo improvements:**

| Priority | Improvement | Why deferred |
|---|---|---|
| 1 | Add 3/6 and 4/8 equivalences to the lesson | Needs more dialogue nodes + more blocks. Scope risk for this sprint. |
| 2 | Beaver sprite animation (real character art) | CSS stand-in works for demo. Real art takes design time. |
| 3 | Music layer — block pitches mapped to fraction sizes | Pedagogically valuable (RESEARCH.md §4.2) but high Web Audio API complexity. |
| 4 | FastAPI backend for session logging | Needed at school deployment scale. Not needed for 1-device demo. |
| 5 | Non-power-of-2 fractions (1/3 = 2/6) | Requires dynamic grid that subdivides into 3 columns. Architecture supports it — just needs more nodes. |

**Eval-driven improvement cycle (post-sprint):**
After each demo or user test, extract `window.__lessonLog`, compute `check_attempt_rates`, and identify which check question has the highest wrong-answer rate. That question gets a better hint or a new canvas scaffold added first.

---

## Final Architecture Lock — Decisions from GDD Session (2026-05-18)

These decisions supersede any earlier notes in this document. The full specification lives in [`docs/GDD.md`](docs/GDD.md).

---

### Decision 1: Game Mechanic Direction — COMBINE-first (Reference Gate)

**Chosen:** COMBINE-first (fill the gap). The INSTRUCT phase opens with a locked Reference Gate at 1/2 width. Student fills it with two 1/4 logs. Discovery happens through construction, not destruction.

**Replaces:** Earlier SMASH-first design (CHOP then BUILD). The EXPLORE phase retains free CHOP/BUILD play, but the *pedagogically loaded* moment — when equivalence is proved — is now the BUILD-to-fill-gate sequence.

**Why COMBINE-first wins:**
- The Reference Gate gives the lesson a concrete *goal* from the start: a visible gap the child must fill
- "Filling" a gap is a stronger spatial metaphor for equality than "splitting" — a filled gate looks like a completed thing
- The gate stays visible as a benchmark throughout CHECK, carrying meaning across all three phases

---

### Decision 2: CHECK Phase — Dynamic Gap Construction (replaces fixed 3 Q&A nodes)

**Chosen:** Three "fill the gap" construction challenges with multiple valid solutions.

| Challenge | Reference Gate | Dock Inventory | Valid Solutions |
|---|---|---|---|
| C1 | 1/2 | 1x (1/2), 2x (1/4) | [1/2] or [1/4 + 1/4] |
| C2 | 3/4 | 1x (1/2), 3x (1/4) | [1/2 + 1/4] or [1/4 + 1/4 + 1/4] |
| C3 | 1/2 | 3x (1/4) only | [1/4 + 1/4] — only valid, tests equivalence understanding |

**Why this beats fixed Q&A:** Tests *generation* of equivalent fractions, not just recognition. The target changes each challenge — memorisation is impossible on retry. Multiple valid solutions prove the child understands the principle, not just the specific pair 1/2 = 2/4.

**Validation logic:** Common-denominator integer sum — never floating point. See `validateBuildZone()` in GDD §4.2.

---

### Decision 3: Dialogue Storage — Directed Graph (Option B confirmed)

**Chosen:** Keyed object (`dialogue[nodeId]`), each node has `text`, `buckyState`, `correctNext`, `incorrectNext`, `fallbackNext`, and UI hint flags.

**Rejected:** Flat array with index offsets. Branching at the wrong-answer paths (error type discrimination: `too_short` vs. `too_long`) requires named destinations — indices make this unreadable and untestable.

**Full dialogue tree:** See GDD §5.

---

### Decision 4: Touch-Canvas Collision — Hybrid (CSS layout + integer state validation)

**Chosen:** CSS flexbox renders the fraction wall (free, browser-managed layout). `BlockState.pixelWidth` integers are the source of truth for all math checks. `getBoundingClientRect()` is used ONLY for slot snapping geometry — never for equivalence math.

**Why:** CSS layout gives pixel-accurate rendering for free. Integer `pixelWidth` in state gives synchronous, dependency-free validation without DOM reads. The two concerns are decoupled.

**iPad-specific:** `touch-action: none` on canvas. `touchend` (not `touchstart`) for all interactions. HTML5 Drag and Drop API NOT used — must implement `touchstart/touchmove/touchend` drag manually.

---

### Decision 5: Audio System — Web Audio API, Pentatonic C major, Synthesized tones only

**Final tone map:**
```
1/1 log → C4 (261.63 Hz) — sine wave, 0.8s decay
1/2 log → G4 (392.00 Hz) — sine wave, 0.4s decay
1/4 log → C5 (523.25 Hz) — triangle wave, 0.15s decay
```

**Full sound design (all events):** See GDD §6.

**iOS constraint:** `AudioContext` constructed inside first user gesture handler. Silent buffer played immediately to unlock context. All tones scheduled at `audioCtx.currentTime + 0` — never `setTimeout`.

---

### Decision 6: Visual Identity — River Grid, Dark Mode, Wooden Logs

**Theme:** "Bucky the Builder" river construction site. Dark navy `#0F172A` background. Wooden logs as manipulatives (warm amber/honey/pine color family). Blue glowing Reference Gate as the target anchor.

**Grid constants (locked):**
```typescript
RIVER_WIDTH_PX  = 600
TOTAL_SLOTS     = 4
SLOT_WIDTH_PX   = 150
ROW_HEIGHT_PX   = 72
```

**Responsive:** If `window.innerWidth < 500`, `RIVER_WIDTH_PX = 480`, all block widths scale proportionally.

---

### What changed from the earlier SMASH-first design:

| Aspect | Earlier design | Final design |
|---|---|---|
| INSTRUCT opening move | Beaver guides CHOP of a 1/2 block | Reference Gate appears — student fills it |
| CHECK questions | 3 fixed Q&A nodes | 3 "fill the gap" construction challenges |
| Multiple valid answers | No — single correct path | Yes — C1 and C2 accept 2+ valid log combinations |
| Visual model name | "Fraction Wall" | "River Grid" |
| Character frame | Beaver with axe (CHOP focus) | Bucky the Builder (construction focus) |
| Block naming | Fraction blocks | Wooden logs |
| Audio pitch mapping | Not yet specified | C4/G4/C5 pentatonic, fully synthesized |
