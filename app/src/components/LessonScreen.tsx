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
import { RiverScene }           from './RiverScene'
import { SnapGuides }           from './SnapGuides'
import { GoalSidebar }          from './GoalSidebar'
import { CheckButton }          from './CheckButton'
import { ChallengeCounter }     from './ChallengeCounter'
import { Log }                  from './Log'
import { GhostOverlay }         from './overlays/GhostOverlay'
import { EquivalenceBadge }     from './overlays/EquivalenceBadge'
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

const EQUATION_NODES = new Set(['DEMO_EQUATION', 'INSTRUCT_NAME_EQUIVALENCE'])

export function LessonScreen({ state, dispatch }: Props) {
  const node          = getNode(state.dialogueNodeId)
  const effects       = useDialogueEffects(node)
  const dockBlocks    = state.blocks.filter(b => b.zone === 'dock')
  const buildBlocks   = state.blocks.filter(b => b.zone === 'build')
  const isDemo        = state.phase === 'DEMO'
  const isCheckPhase  = CHECK_PHASES.has(state.phase)
  const isBuildActive = BUILD_PHASES.has(state.phase)
  const isExplore     = state.phase === 'EXPLORE'
  const gateVisible   = GATE_VISIBLE_PHASES.has(state.phase)
  const goalVisible   = GOAL_SIDEBAR_PHASES.has(state.phase)
  const canSubmit     = state.buildZoneLogs.length > 0
  const lessonPhase   = phaseToLessonPhase(state.phase)

  const { numerator: gn, denominator: gd } = state.referenceGate
  const gateLabel = `← ${gn}/${gd} →`

  const showEquationBadge =
    effects.triggerBadge || EQUATION_NODES.has(state.dialogueNodeId)
  const equationText = showEquationBadge ? '1/2 = 2/4' : undefined

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

    const riverRect = riverRowRef.current?.getBoundingClientRect()
    const overRiver = riverRect &&
      e.clientX >= riverRect.left && e.clientX <= riverRect.right &&
      e.clientY >= riverRect.top  && e.clientY <= riverRect.bottom

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

  // ── Canvas viewport scaling ──────────────────────────────────────────────
  // The river is designed at RIVER_WIDTH_PX (960). We scale it down if the
  // viewport is narrower so nothing ever clips or scrolls horizontally.
  const canvasRef  = useRef<HTMLDivElement>(null)
  const scaleRef   = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function applyScale() {
      const outer = canvasRef.current
      const inner = scaleRef.current
      if (!outer || !inner) return
      const available = outer.clientWidth
      const scale     = Math.min(1, available / RIVER_WIDTH_PX)
      inner.style.transform       = `scale(${scale})`
      inner.style.transformOrigin = 'top center'
      outer.style.height          = `${inner.offsetHeight * scale}px`
    }
    applyScale()
    window.addEventListener('resize', applyScale)
    return () => window.removeEventListener('resize', applyScale)
  }, [])

  return (
    <div
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{
        display:       'flex',
        flexDirection: 'column',
        height:        '100dvh',
        background:    'var(--bg-deep)',
        color:         'var(--ui-text)',
        fontFamily:    "'Fredoka', 'Nunito', system-ui, sans-serif",
        overflow:      'hidden',
        touchAction:   'none',
      }}>

      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <TopBar
        trailing={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: 'auto' }}>
            <PhaseDots activePhase={lessonPhase} />
            {isCheckPhase && (
              <ChallengeCounter current={state.challengeIndex + 1} total={3} />
            )}
          </div>
        }
      />

      {/* ── Game canvas — all game UI layered here ─────────────────────── */}
      <div
        ref={canvasRef}
        style={{
          flex:       1,
          position:   'relative',
          overflow:   'hidden',
          display:    'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Scene backdrop (sky, water, trees) */}
        <RiverScene />

        {/* Scaled river content — centred horizontally */}
        <div
          ref={scaleRef}
          style={{
            width:         `${RIVER_WIDTH_PX}px`,
            display:       'flex',
            flexDirection: 'column',
            alignItems:    'flex-start',
            gap:           '0.5rem',
            position:      'relative',
            zIndex:        10,
            padding:       '0 0 0.5rem',
          }}
        >
          {/* Reference gate */}
          {gateVisible && (
            <div style={{ paddingTop: '0.25rem' }}>
              <ReferenceGate
                gate={state.referenceGate}
                visible={true}
                label={gateLabel}
                highlightGap={effects.highlightGap}
                highlightOverflow={effects.highlightOverflow}
              />
            </div>
          )}

          {/* River row */}
          <div
            ref={riverRowRef}
            className="river-row"
            style={{
              position:     'relative',
              width:        `${RIVER_WIDTH_PX}px`,
              height:       '112px',
              background:   'var(--river-water, #1a3a5c)',
              borderRadius: '12px',
              border:       '2px solid rgba(59,173,232,0.25)',
              display:      'flex',
              alignItems:   'center',
              padding:      '6px',
              gap:          '6px',
              boxShadow:    'inset 0 2px 12px rgba(0,0,0,0.4)',
            }}
          >
            {/* Grid guides — always visible during DEMO and build phases */}
            <SnapGuides visible={isDemo || isBuildActive} />

            {buildBlocks.length === 0 && !isDemo && (
              <span style={{ opacity: 0.35, fontSize: '0.9rem', paddingLeft: '0.75rem', color: 'var(--ref-gate)' }}>
                {isExplore ? 'Drag a log here →' : 'Drag logs to fill the gap →'}
              </span>
            )}

            {buildBlocks.map(b => (
              <div key={b.id} style={{ position: 'relative', flexShrink: 0 }}>
                <Log block={b} dispatch={dispatch} />
                {!isDemo && (
                  <button
                    onClick={() => dispatch({ type: 'LOG_RETURNED', blockId: b.id })}
                    style={{
                      position:     'absolute',
                      top:          '-8px',
                      right:        '-8px',
                      width:        '22px',
                      height:       '22px',
                      borderRadius: '50%',
                      background:   'var(--error-glow, #F87171)',
                      border:       'none',
                      color:        '#fff',
                      fontSize:     '14px',
                      fontWeight:   700,
                      lineHeight:   '22px',
                      textAlign:    'center',
                      cursor:       'pointer',
                      padding:      0,
                      zIndex:       1,
                    }}
                    title="Return to tray"
                  >×</button>
                )}
              </div>
            ))}

            <GhostOverlay
              visible={effects.showGhostOverlay}
              gate={state.referenceGate}
              riverWidthPx={RIVER_WIDTH_PX}
            />
          </div>

          {/* Column numbers — 1  2  3  4 below the river */}
          <div style={{ display: 'flex', width: `${RIVER_WIDTH_PX}px` }}>
            {[1, 2, 3, 4].map(n => (
              <div
                key={n}
                style={{
                  width:      `${RIVER_WIDTH_PX / 4}px`,
                  textAlign:  'center',
                  fontSize:   '0.85rem',
                  fontWeight: 600,
                  opacity:    0.45,
                  color:      'var(--ref-gate, #3BADE8)',
                  userSelect: 'none',
                }}
              >
                {n}
              </div>
            ))}
          </div>

          {/* Check button — below river in build phases */}
          {isBuildActive && (
            <div style={{ paddingTop: '0.25rem', zIndex: 2, position: 'relative' }}>
              <CheckButton
                label="CHECK"
                disabled={!canSubmit}
                onPress={() => dispatch({ type: 'CHECK_SUBMIT' })}
              />
            </div>
          )}
        </div>

        {/* ── Overlaid UI — absolute-positioned on the game canvas ────── */}

        {/* GOAL card — top left */}
        <GoalSidebar
          visible={goalVisible}
          gateLabel={gateLabel}
          gate={state.referenceGate}
        />

        {/* FRACTION FACT card — left side during equation moments */}
        <EquivalenceBadge visible={showEquationBadge} equation={equationText} />

        {/* Speech bubble — top center, floating above river */}
        <div style={{
          position:        'absolute',
          top:             '0.75rem',
          left:            '50%',
          transform:       'translateX(-50%)',
          maxWidth:        '55%',
          minWidth:        '320px',
          zIndex:          30,
          filter:          'drop-shadow(0 4px 16px rgba(0,0,0,0.5))',
        }}>
          <SpeechBubble
            text={node.text}
            onComplete={node.autoAdvance ? advance : undefined}
          />
        </div>

        {/* Bucky — bottom left, large */}
        <div style={{
          position:   'absolute',
          bottom:     0,
          left:       '1.5rem',
          zIndex:     25,
          fontSize:   '7rem',
          lineHeight: 1,
          userSelect: 'none',
          filter:     'drop-shadow(0 4px 16px rgba(0,0,0,0.6))',
        }}>
          <BuckyAvatar buckyState={node.buckyState} />
        </div>

        {/* Next button — large green circle, right side */}
        {node.tapToContinue && (
          <button
            onClick={advance}
            aria-label="Continue"
            style={{
              position:     'absolute',
              right:        '1.5rem',
              bottom:       '30%',
              width:        '72px',
              height:       '72px',
              borderRadius: '50%',
              background:   'linear-gradient(135deg, #22c55e, #16a34a)',
              border:       '3px solid rgba(255,255,255,0.3)',
              color:        '#fff',
              fontSize:     '2rem',
              display:      'flex',
              alignItems:   'center',
              justifyContent: 'center',
              cursor:       'pointer',
              zIndex:       30,
              boxShadow:    '0 4px 20px rgba(34,197,94,0.5)',
              transition:   'transform 0.1s',
            }}
          >
            ▶
          </button>
        )}

        {/* EXPLORE: skip button — top right */}
        {isExplore && (
          <button
            type="button"
            onClick={() => dispatch({ type: 'EXPLORE_COMPLETE' })}
            style={{
              position:     'absolute',
              top:          '0.75rem',
              right:        '0.75rem',
              padding:      '0.4rem 1rem',
              fontSize:     '0.85rem',
              background:   'rgba(255,255,255,0.12)',
              color:        'var(--ui-text)',
              border:       '1px solid rgba(255,255,255,0.2)',
              borderRadius: '2rem',
              cursor:       'pointer',
              zIndex:       30,
              backdropFilter: 'blur(4px)',
            }}
          >
            Ready! →
          </button>
        )}

        {/* Win overlay */}
        {state.phase === 'WIN' && (
          <div style={{
            position:       'absolute',
            inset:          0,
            display:        'flex',
            flexDirection:  'column',
            alignItems:     'center',
            justifyContent: 'center',
            background:     'rgba(13,27,42,0.92)',
            gap:            '1rem',
            zIndex:         50,
          }}>
            <div style={{ fontSize: '5rem' }}>🎉</div>
            <p style={{ fontSize: '1.2rem', textAlign: 'center', maxWidth: '400px', margin: 0, fontWeight: 700 }}>
              {node.text}
            </p>
            <button
              onClick={() => dispatch({ type: 'PLAY_AGAIN' })}
              style={{
                padding:      '0.75rem 2.5rem',
                fontSize:     '1.1rem',
                background:   'linear-gradient(135deg, #22c55e, #16a34a)',
                color:        '#fff',
                border:       'none',
                borderRadius: '2rem',
                cursor:       'pointer',
                fontWeight:   700,
                boxShadow:    '0 4px 16px rgba(34,197,94,0.4)',
              }}
            >
              Play Again 🪵
            </button>
          </div>
        )}
      </div>

      {/* ── Dock tray — hidden during DEMO ────────────────────────────── */}
      {!isDemo && (
        <div style={{
          minHeight:  '100px',
          maxHeight:  '140px',
          background: 'linear-gradient(180deg, #0a1520 0%, #0d1f30 100%)',
          borderTop:  '2px solid rgba(59,173,232,0.2)',
          display:    'flex',
          alignItems: 'center',
          padding:    '0.5rem 1rem',
          gap:        '0.5rem',
          overflowX:  'auto',
          overflowY:  'hidden',
          flexShrink: 0,
          WebkitOverflowScrolling: 'touch' as any,
        }}>
          <span style={{
            opacity:      0.35,
            fontSize:     '0.6rem',
            writingMode:  'vertical-rl' as any,
            flexShrink:   0,
            letterSpacing: '0.1em',
            textTransform: 'uppercase' as any,
          }}>
            Logs
          </span>

          {dockBlocks.map(b => (
            <div
              key={b.id}
              onPointerDown={(e) => handleTrayPointerDown(e, b.id)}
              style={{
                cursor:    'grab',
                flexShrink: 0,
                opacity:   dragging?.blockId === b.id ? 0.3 : 1,
                transition: 'opacity 0.1s',
              }}
              title={`Drag ${b.numerator}/${b.denominator} log to river`}
            >
              <Log block={b} dispatch={dispatch} />
            </div>
          ))}

          {dockBlocks.length === 0 && (
            <span style={{ opacity: 0.35, fontSize: '0.85rem', color: 'var(--ref-gate)' }}>
              All logs placed ✓
            </span>
          )}

          {buildBlocks.length > 0 && (
            <button
              onClick={() => {
                const lastId =
                  state.buildZoneLogs[state.buildZoneLogs.length - 1]
                  ?? buildBlocks[buildBlocks.length - 1]?.id
                if (lastId) dispatch({ type: 'LOG_RETURNED', blockId: lastId })
              }}
              style={{
                marginLeft:   'auto',
                padding:      '0.4rem 0.9rem',
                fontSize:     '0.8rem',
                background:   'rgba(255,255,255,0.07)',
                color:        'var(--ui-text)',
                border:       '1px solid rgba(255,255,255,0.15)',
                borderRadius: '0.5rem',
                cursor:       'pointer',
                flexShrink:   0,
              }}
            >
              ← Undo
            </button>
          )}
        </div>
      )}

      {/* ── Drag ghost ─────────────────────────────────────────────────── */}
      {/* Rendered fixed so it escapes all overflow and scale transforms.  */}
      {dragging?.moved && draggedBlock && (
        <div style={{
          position:     'fixed',
          left:         dragging.x - draggedBlock.pixelWidth / 2,
          top:          dragging.y - 36,
          pointerEvents: 'none',
          zIndex:        200,
          opacity:       0.85,
          transform:     'scale(1.08)',
          filter:        'drop-shadow(0 4px 12px rgba(0,0,0,0.5))',
        }}>
          <Log block={draggedBlock} dispatch={() => {}} />
        </div>
      )}
    </div>
  )
}
