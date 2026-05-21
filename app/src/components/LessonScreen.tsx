import { useEffect, useRef, useState, type Dispatch } from 'react'
import type { LessonState } from '../state/types'
import type { LessonEvent } from '../state/lessonEvents'
import { getNode }              from '../state/dialogue'
import { useDialogueEffects }   from '../hooks/useDialogueEffects'
import { phaseToLessonPhase }   from '../utils/lessonPhase'
import { TopBar }               from './TopBar'
import { BuckyAvatar }          from './BuckyAvatar'
import { PhaseDots }            from './PhaseDots'
import { SpeechBubble }         from './SpeechBubble'
import { ReferenceGate }        from './ReferenceGate'
import { SnapGuides }           from './SnapGuides'
import { GoalSidebar }          from './GoalSidebar'
import { CheckButton }          from './CheckButton'
import { ChallengeCounter }     from './ChallengeCounter'
import { Log }                  from './Log'
import { GhostOverlay }         from './overlays/GhostOverlay'
import { EquivalenceBadge }     from './overlays/EquivalenceBadge'
import { QuartersHighlight }    from './overlays/QuartersHighlight'
import type { QuartersHighlightKind } from './overlays/QuartersHighlight'
import { ChopLine }              from './overlays/ChopLine'
import { ReferenceLog }          from './overlays/ReferenceLog'
import { BackButton }            from './BackButton'
import { BonusPrompt }           from './BonusPrompt'
import { RIVER_WIDTH_PX }       from '../constants'
import {
  playSnapSound,
  playFractionTone,
  playCheckCorrectSound,
  playCheckTooShortSound,
  playCheckTooLongSound,
  playWinFanfare,
  unlockAudio,
} from '../audio/toneEngine'

interface Props {
  state:    LessonState
  dispatch: Dispatch<LessonEvent>
}

// Phases where the build zone + check button are active
const BUILD_PHASES = new Set([
  'INSTRUCT_BUILD', 'INSTRUCT_ERROR',
  'CHECK_ACTIVE', 'CHECK_ERROR_1', 'CHECK_ERROR_2',
])
const CHECK_PHASES = new Set(['CHECK_ACTIVE', 'CHECK_ERROR_1', 'CHECK_ERROR_2'])

// Gate is visible from the moment Bucky introduces it ("See that blue line?")
const GATE_VISIBLE_PHASES = new Set([
  'INSTRUCT_INTRO', 'INSTRUCT_BUILD', 'INSTRUCT_ERROR', 'INSTRUCT_SUCCESS',
  'CHECK_INTRO', 'CHECK_ACTIVE', 'CHECK_ERROR_1', 'CHECK_ERROR_2', 'CHECK_SUCCESS', 'WIN',
])

// How long the EXPLORE free-play phase lasts before auto-advancing (ms)
const EXPLORE_TIMEOUT_MS = 30_000

const GOAL_SIDEBAR_PHASES = new Set([
  'INSTRUCT_INTRO', 'INSTRUCT_BUILD', 'INSTRUCT_ERROR', 'INSTRUCT_SUCCESS',
  'CHECK_INTRO', 'CHECK_ACTIVE', 'CHECK_ERROR_1', 'CHECK_ERROR_2', 'CHECK_SUCCESS',
])


export function LessonScreen({ state, dispatch }: Props) {
  const node          = getNode(state.dialogueNodeId)
  const effects       = useDialogueEffects(node)
  const dockBlocks    = state.blocks.filter(b => b.zone === 'dock')
  const buildBlocks   = state.blocks.filter(b => b.zone === 'build')
  const isDemo        = state.phase === 'DEMO'
  const isCheckPhase  = CHECK_PHASES.has(state.phase)
  const isBuildActive = BUILD_PHASES.has(state.phase)
  const isExplore     = state.phase === 'EXPLORE'
  // The kid can actually drag logs from the dock only in build-active
  // and explore phases. Dialogue-only phases (INSTRUCT_INTRO,
  // CHECK_INTRO, *_SUCCESS) leave LOG_SNAPPED unhandled in the
  // reducer — showing the dock + drag hint there would advertise an
  // interaction that silently does nothing.
  const dragEnabled   = isBuildActive || isExplore

  const gateVisible   = GATE_VISIBLE_PHASES.has(state.phase)
  const goalVisible   = GOAL_SIDEBAR_PHASES.has(state.phase)
  const canSubmit     = state.buildZoneLogs.length > 0
  const lessonPhase   = phaseToLessonPhase(state.phase)
  const { numerator: gn, denominator: gd } = state.referenceGate
  const gateLabel = `← ${gn}/${gd} →`

  // The pink "1/2 = 2/4" / "1/1 = 4/4" badge is driven entirely by the
  // dialogue node — `effects.equation` is the source of truth. Each beat
  // that needs a badge declares its equation in dialogue.ts.
  const equationText = effects.equation
  const showEquationBadge = !!equationText

  // QuartersHighlight kind for the recap. Two flags on the node map to
  // 'first-half' (LEFT two quarters) or 'all' (full row). null → no glow.
  const quartersHighlightKind: QuartersHighlightKind =
    effects.highlightFirstQuarters ? 'first-half'
    : effects.highlightAllQuarters ? 'all'
    : null

  // Chop-line position. We find the splittable block in the river and
  // compute its center as a % of the row width (sum of preceding-sibling
  // widths + half this block's width). This generalises to any chop —
  // 1/1 → 50%, left 1/2 → 25%, right 1/2 → 75%.
  const chopLinePositionPct: number | null = (() => {
    if (!effects.showChopLine) return null
    const target = buildBlocks.find(b => b.splittable)
    if (!target) return null
    let acc = 0
    for (const b of buildBlocks) {
      const w = (b.numerator / b.denominator) * 100
      if (b.id === target.id) return acc + w / 2
      acc += w
    }
    return null
  })()

  // Trim view — during recap beats, hide un-highlighted blocks so the
  // kid's eye lands only on the lesson's actual focus. Reducer state
  // still holds every block; this is purely render-time.
  //
  // Trim target derives from whichever context exists:
  //   - highlightAllQuarters → trim to 100% (effectively no-op)
  //   - highlightFirstQuarters → trim to 50%
  //   - referenceLog inline-right → trim to (100% - reference%) so the
  //     reference fills the remaining row width side-by-side.
  const visibleBuildBlocks = (() => {
    if (!effects.trimToHighlight) return buildBlocks
    let targetPct: number | null = null
    if (effects.highlightAllQuarters) targetPct = 100
    else if (effects.highlightFirstQuarters) targetPct = 50
    else if (effects.referenceLog?.position === 'inline-right') {
      const { numerator, denominator } = effects.referenceLog.fraction
      targetPct = 100 - (numerator / denominator) * 100
    }
    if (targetPct === null) return buildBlocks
    let acc = 0
    return buildBlocks.filter(b => {
      if (acc >= targetPct!) return false
      acc += (b.numerator / b.denominator) * 100
      return true
    })
  })()

  // ── Drag state ───────────────────────────────────────────────────────────
  // Tracks the log being dragged from the tray. `moved` flips true once the
  // pointer travels > 8px — used to distinguish a tap from a real drag.
  const [dragging, setDragging] = useState<{
    blockId: string
    x: number; y: number         // current pointer position (viewport coords)
    startX: number; startY: number
    moved: boolean
  } | null>(null)

  const riverRowRef  = useRef<HTMLDivElement>(null)
  const draggedBlock = dragging
    ? state.blocks.find(b => b.id === dragging.blockId)
    : null

  // ── EXPLORE timeout ──────────────────────────────────────────────────────
  const exploreTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (state.phase !== 'EXPLORE') return
    exploreTimer.current = setTimeout(
      () => dispatch({ type: 'EXPLORE_TIMEOUT' }),
      EXPLORE_TIMEOUT_MS,
    )
    return () => { if (exploreTimer.current) clearTimeout(exploreTimer.current) }
  }, [state.phase, dispatch])

  // ── Phase-transition sounds ──────────────────────────────────────────────
  // Runs whenever the phase changes. AudioContext was unlocked on Start,
  // so these fire without needing a new user gesture.
  useEffect(() => {
    switch (state.phase) {
      case 'INSTRUCT_SUCCESS':
      case 'CHECK_SUCCESS':
        playCheckCorrectSound()
        break
      case 'CHECK_ERROR_1':
        // Distinguish short vs long by errorType (passed through reducer state)
        if (state.errorType === 'too_short') playCheckTooShortSound()
        else                                 playCheckTooLongSound()
        break
      case 'WIN':
        playWinFanfare()
        break
    }
  }, [state.phase]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Drag handlers ────────────────────────────────────────────────────────

  function handleTrayPointerDown(e: React.PointerEvent, blockId: string) {
    // Don't start a drag during the demo — tray is hidden, but defensive
    if (isDemo) return
    e.preventDefault()
    setDragging({ blockId, x: e.clientX, y: e.clientY, startX: e.clientX, startY: e.clientY, moved: false })
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragging) return
    const dx = Math.abs(e.clientX - dragging.startX)
    const dy = Math.abs(e.clientY - dragging.startY)
    setDragging({ ...dragging, x: e.clientX, y: e.clientY, moved: dx > 8 || dy > 8 })
  }

  function handlePointerUp(e: React.PointerEvent) {
    if (!dragging || !draggedBlock) { setDragging(null); return }

    // Expanded drop zone: any X within the river-row's horizontal span, and
    // any Y from the top of the scene down to the bottom of the river-row
    // (i.e. NOT on the dock). This makes the kid's drag feel forgiving —
    // they don't have to land in a 64px sliver. Dropping anywhere "above
    // the dock" counts as "into the river."
    const riverRect = riverRowRef.current?.getBoundingClientRect()
    const overRiver = !!riverRect &&
      e.clientX >= riverRect.left &&
      e.clientX <= riverRect.right &&
      e.clientY <= riverRect.bottom

    // Place if dropped on river OR tapped without dragging
    if (overRiver || !dragging.moved) {
      unlockAudio()
      playSnapSound()
      playFractionTone({ numerator: draggedBlock.numerator, denominator: draggedBlock.denominator })
      dispatch({ type: 'LOG_SNAPPED', blockId: dragging.blockId, slot: state.buildZoneLogs.length })
    }

    setDragging(null)
  }

  // ── Dialogue advance ─────────────────────────────────────────────────────
  function advance() { dispatch({ type: 'DIALOGUE_ADVANCE' }) }

  // ── Scene plate layout ───────────────────────────────────────────────────
  // The scene (bucky-background.png) is set on .lesson-screen via CSS.
  // All game UI uses percentage-anchored absolute positioning, so the
  // whole layout scales fluidly with the viewport — no JS scaling needed.

  return (
    <div
      className="lesson-screen"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >

      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <TopBar
        leading={
          <BackButton
            canGoBack={state.history.length > 0}
            onPress={() => dispatch({ type: 'DIALOGUE_REWIND' })}
          />
        }
        trailing={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: 'auto' }}>
            {state.chopCount > 0 && state.phase !== 'WIN' && (
              <span
                className="chops-counter"
                data-testid="chops-counter"
                aria-label={`${state.chopCount} chop${state.chopCount !== 1 ? 's' : ''}`}
              >
                🪓 {state.chopCount}
              </span>
            )}
            <PhaseDots activePhase={lessonPhase} />
            {isCheckPhase && (
              <ChallengeCounter current={state.challengeIndex + 1} total={3} />
            )}
          </div>
        }
      />


      <div className="lesson-main">
        {/* bucky-background.png is the scene plate (applied on .lesson-screen).
            All children below are percentage-anchored overlays on top of it. */}

        <div className="lesson-stage">
          {/* Lane dividers — rendered in React so they share the river-row
              coordinate system. Hidden during pure-dialogue moments. */}
          <SnapGuides visible={isBuildActive || isDemo} />

          {/* Whole-log reference removed — the river-row's own outline (below)
              now serves as the "1 whole" frame. Avoids two competing outlines. */}

          {gateVisible && (
            <div
              className="lesson-gate-anchor"
              style={{
                // Gate width as % of lane band — matches placed-log sizing
                ['--gate-width-pct' as never]:
                  `${(state.referenceGate.numerator / state.referenceGate.denominator) * 100}%`,
              }}
            >
              <ReferenceGate
                gate={state.referenceGate}
                visible
                label={gateLabel}
                highlightGap={effects.highlightGap}
                highlightOverflow={effects.highlightOverflow}
              />
            </div>
          )}

          {/* Lane numbers + GOAL label removed — the dashed lane dividers
              inside the row outline already communicate "4 equal slots"
              spatially, and the cyan gate above the row already says
              "this is your target." Extra labels were chrome, not signal. */}

          <div
            ref={riverRowRef}
            className={'river-row' + (isBuildActive ? ' river-row--active' : '')}
          >
            {buildBlocks.length === 0 && dragEnabled && (
              <span className="river-row__hint">
                {isExplore ? 'Drag a log here →' : 'Drag logs to fill the gap →'}
              </span>
            )}

            {visibleBuildBlocks.map(b => {
              // Wrapper flex-basis is the fraction's share of the river-row,
              // so the placed logs always fit and proportions stay honest.
              const widthPct = (b.numerator / b.denominator) * 100
              return (
                <div
                  key={b.id}
                  style={{
                    position: 'relative',
                    flex: `0 0 ${widthPct}%`,
                  }}
                >
                  <Log block={b} dispatch={dispatch} />
                  {!isDemo && (
                    <button
                      type="button"
                      className="log-return-btn"
                      onClick={() => dispatch({ type: 'LOG_RETURNED', blockId: b.id })}
                      title="Return to tray"
                    >
                      ×
                    </button>
                  )}
                </div>
              )
            })}

            <GhostOverlay
              visible={effects.showGhostOverlay}
              gate={state.referenceGate}
              riverWidthPx={RIVER_WIDTH_PX}
            />

            {/* DEMO recap glow — anchored inside the river-row so the
                rectangle's coordinates inherit from the row. The CSS
                width transition (50% → 100%) makes the swap from
                Beat A to Beat B read as the highlight "widening." */}
            <QuartersHighlight kind={quartersHighlightKind} />

            {/* DEMO chop telegraph — vertical red line at the center
                of the splittable block, anticipating the chop. */}
            <ChopLine positionPct={chopLinePositionPct} />

            {/* Faded reference log floating above OR below the row
                (e.g. a 1/2 silhouette next to two highlighted 1/4s) —
                visual proof of "same size" equivalence. Position is
                authored per node. */}
            <ReferenceLog
              fraction={effects.referenceLog?.fraction ?? null}
              position={effects.referenceLog?.position}
            />
          </div>

          {isBuildActive && (
            <div className="btn-check-anchor">
              <CheckButton
                label="CHECK"
                disabled={!canSubmit}
                onPress={() => dispatch({ type: 'CHECK_SUBMIT' })}
              />
            </div>
          )}
        </div>

        {/* Goal sidebar removed: the cyan reference gate already shows the
            target spatially (its width = the fraction the kid must fill).
            Adding a text label was a 4th attention magnet competing with
            speech bubble, gate, and dock. Less is more. */}
        <GoalSidebar visible={false} gateLabel={gateLabel} gate={state.referenceGate} />
        {/* key={equationText} forces a remount when the equation switches
            from "1/2 = 2/4" to "1/1 = 4/4" so the slam-in animation fires
            on each new equation — CSS animations don't re-trigger on
            prop changes, only on element creation. */}
        <EquivalenceBadge
          key={equationText ?? 'none'}
          visible={showEquationBadge}
          equation={equationText}
          flash={effects.flashEquation}
          above={effects.equationAbove}
        />

        <div className="lesson-speech-anchor">
          <SpeechBubble
            text={node.text}
            onComplete={node.autoAdvance ? advance : undefined}
          />
        </div>

        {/* Bucky sprite — animated states per dialogue. Doubles as the
            "tap to continue" affordance.
            Fires on POINTERDOWN (not click) so the kid feels instant
            response — click events wait for pointerup which adds ~50ms
            on touch devices. */}
        <div
          className={
            'lesson-bucky-anchor'
            + (node.tapToContinue ? ' lesson-bucky-anchor--waiting' : '')
          }
          role={node.tapToContinue ? 'button' : undefined}
          tabIndex={node.tapToContinue ? 0 : undefined}
          aria-label={node.tapToContinue ? 'Tap Bucky to continue' : undefined}
          onPointerDown={
            node.tapToContinue
              ? (e) => { e.preventDefault(); advance() }
              : undefined
          }
          onKeyDown={
            node.tapToContinue
              ? (e) => { if (e.key === 'Enter' || e.key === ' ') advance() }
              : undefined
          }
        >
          <BuckyAvatar buckyState={node.buckyState} size={200} />
        </div>

        {isExplore && (
          <button
            type="button"
            className="btn-kawaii btn-ready"
            onClick={() => dispatch({ type: 'EXPLORE_COMPLETE' })}
            style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', zIndex: 30 }}
          >
            Continue →
          </button>
        )}

        {state.phase === 'WIN' && (
          <div className="win-overlay" data-testid="win-overlay">
            <div className="win-overlay__emoji" aria-hidden>🎉</div>
            <p className="win-overlay__text">{node.text}</p>
            <button
              type="button"
              className="win-overlay__btn btn-kawaii"
              onClick={() => dispatch({ type: 'PLAY_AGAIN' })}
            >
              Play Again
            </button>
          </div>
        )}

        {/* Challenge-1 bonus prompt — visible only while kid is choosing
            whether to retry with different pieces. The reducer routes
            BONUS_ACCEPTED back to CHECK_ACTIVE (still on Challenge 1);
            BONUS_DECLINED skips to Challenge 2. */}
        <BonusPrompt
          visible={
            state.phase === 'CHECK_SUCCESS'
            && state.dialogueNodeId === 'CHECK_BONUS_PROMPT_C1'
          }
          onAccept={()  => dispatch({ type: 'BONUS_ACCEPTED' })}
          onDecline={() => dispatch({ type: 'BONUS_DECLINED' })}
        />
      </div>

      {dragEnabled && (
        <div className="dock-tray" data-testid="dock-tray">
          <span className="dock-tray__label">Logs</span>

          {dockBlocks.map(b => {
            // Same proportional sizing as river-row wrappers — a 1/4 log
            // on the dock is exactly the same width as a 1/4 in the river.
            const widthPct = (b.numerator / b.denominator) * 100
            return (
              <div
                key={b.id}
                className={`dock-tray__item${dragging?.blockId === b.id ? ' dock-tray__item--dragging' : ''}`}
                onPointerDown={(e) => handleTrayPointerDown(e, b.id)}
                title={`Drag ${b.numerator}/${b.denominator} log to river`}
                style={{ flex: `0 0 ${widthPct}%` }}
              >
                <Log block={b} dispatch={dispatch} />
              </div>
            )
          })}

          {dockBlocks.length === 0 && (
            <span className="river-row__hint">All logs placed ✓</span>
          )}
        </div>
      )}

      {/* Undo button — top-left, just under the "Bucky's River Gate"
          title. Off the dock-tray so it doesn't compete with log space,
          and visually paired with the title (both top-left). */}
      {!isDemo && buildBlocks.length > 0 && (
        <button
          type="button"
          className="btn-kawaii btn-undo btn-undo--corner"
          onClick={() => {
            const lastId =
              state.buildZoneLogs[state.buildZoneLogs.length - 1]
              ?? buildBlocks[buildBlocks.length - 1]?.id
            if (lastId) dispatch({ type: 'LOG_RETURNED', blockId: lastId })
          }}
        >
          ← Undo
        </button>
      )}

      {/* ── Drag ghost ─────────────────────────────────────────────────── */}
      {/* Rendered fixed so it escapes all overflow and scale transforms.
          Size matches the river-row's current pixel width × the log's
          fraction, so the ghost is identical to the placed-log size at
          ANY viewport. Earlier we used block.pixelWidth (a fixed value
          baked in at block creation from RIVER_WIDTH_PX=960), which made
          the ghost too big on narrow viewports and too small on wide
          ones — the visual size jumped when grabbed and again when
          dropped. */}
      {dragging?.moved && draggedBlock && (() => {
        const rowWidthPx = riverRowRef.current?.clientWidth ?? RIVER_WIDTH_PX
        const ghostWidthPx = rowWidthPx * (draggedBlock.numerator / draggedBlock.denominator)
        return (
          <div style={{
            position:      'fixed',
            left:          dragging.x - ghostWidthPx / 2,
            top:           dragging.y - 36,
            width:         ghostWidthPx,
            pointerEvents: 'none',
            zIndex:        200,
            opacity:       0.85,
            transform:     'scale(1.08)',
            filter:        'drop-shadow(0 4px 12px rgba(0,0,0,0.5))',
          }}>
            <Log block={draggedBlock} dispatch={() => {}} />
          </div>
        )
      })()}
    </div>
  )
}
