import { useEffect, useRef, type Dispatch } from 'react'
import type { LessonState } from '../state/types'
import type { LessonEvent } from '../state/lessonEvents'
import { getNode }              from '../state/dialogue'
import { SpeechBubble }         from './SpeechBubble'
import { ReferenceGate }        from './ReferenceGate'
import { CheckButton }          from './CheckButton'
import { ChallengeCounter }     from './ChallengeCounter'
import { Log }                  from './Log'
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

// Gate only makes sense once the student has seen INSTRUCT_BUILD
const GATE_VISIBLE_PHASES = new Set([
  'INSTRUCT_BUILD', 'INSTRUCT_ERROR', 'INSTRUCT_SUCCESS',
  'CHECK_INTRO', 'CHECK_ACTIVE', 'CHECK_ERROR_1', 'CHECK_ERROR_2', 'CHECK_SUCCESS', 'WIN',
])

// How long the EXPLORE free-play phase lasts before auto-advancing (ms)
const EXPLORE_TIMEOUT_MS = 30_000

export function LessonScreen({ state, dispatch }: Props) {
  const node          = getNode(state.dialogueNodeId)
  const dockBlocks    = state.blocks.filter(b => b.zone === 'dock')
  const buildBlocks   = state.blocks.filter(b => b.zone === 'build')
  const isDemo        = state.phase === 'DEMO'
  const isCheckPhase  = CHECK_PHASES.has(state.phase)
  const isBuildActive = BUILD_PHASES.has(state.phase)
  const isExplore     = state.phase === 'EXPLORE'
  const gateVisible   = GATE_VISIBLE_PHASES.has(state.phase)
  const canSubmit     = state.buildZoneLogs.length > 0

  const { numerator: gn, denominator: gd } = state.referenceGate
  const gateLabel = `← ${gn}/${gd} →`

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
      inner.style.transformOrigin = 'top left'
      outer.style.height          = `${inner.offsetHeight * scale}px`
    }
    applyScale()
    window.addEventListener('resize', applyScale)
    return () => window.removeEventListener('resize', applyScale)
  }, [])

  return (
    <div style={{
      display:       'flex',
      flexDirection: 'column',
      height:        '100dvh',
      background:    'var(--bg-deep)',
      color:         'var(--ui-text)',
      fontFamily:    'system-ui, sans-serif',
      overflow:      'hidden',
      touchAction:   'manipulation',
    }}>

      {/* ── Top bar ───────────────────────────────────────────────────── */}
      <div style={{
        height:         '52px',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        padding:        '0 1rem',
        flexShrink:     0,
        borderBottom:   '1px solid var(--grid-line)',
        gap:            '0.5rem',
      }}>
        <span style={{ fontWeight: 700, fontSize: '0.95rem', whiteSpace: 'nowrap' }}>
          🪵 Bucky's River Gate
        </span>

        {isCheckPhase && (
          <ChallengeCounter current={state.challengeIndex + 1} total={3} />
        )}

        {/* EXPLORE: skip button so demo can progress */}
        {isExplore && (
          <button
            onClick={() => dispatch({ type: 'EXPLORE_COMPLETE' })}
            style={{
              padding:      '0.3rem 0.8rem',
              fontSize:     '0.8rem',
              background:   'transparent',
              color:        'var(--ui-text)',
              border:       '1px solid var(--grid-line)',
              borderRadius: '0.4rem',
              cursor:       'pointer',
              opacity:      0.7,
            }}
          >
            Ready! →
          </button>
        )}

        <span style={{ fontSize: '0.7rem', opacity: 0.4, flexShrink: 0 }}>
          {state.phase}
        </span>
      </div>

      {/* ── Bucky dialogue ─────────────────────────────────────────────── */}
      <div style={{
        padding:    '0.6rem 1rem',
        flexShrink: 0,
        display:    'flex',
        gap:        '0.6rem',
        alignItems: 'flex-start',
      }}>
        {/* Bucky avatar */}
        <div style={{
          width:          '48px',
          height:         '48px',
          borderRadius:   '50%',
          background:     'var(--log-half)',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          fontSize:       '1.6rem',
          flexShrink:     0,
        }}>
          🦫
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <SpeechBubble
            text={node.text}
            onComplete={node.autoAdvance ? advance : undefined}
          />
          {node.tapToContinue && (
            <button
              onClick={advance}
              style={{
                marginTop:    '0.4rem',
                padding:      '0.35rem 0.9rem',
                fontSize:     '0.8rem',
                background:   'transparent',
                color:        'var(--ui-text)',
                border:       '1px solid var(--grid-line)',
                borderRadius: '0.4rem',
                cursor:       'pointer',
              }}
            >
              Tap to continue →
            </button>
          )}
        </div>
      </div>

      {/* ── River canvas (viewport-scaled) ─────────────────────────────── */}
      <div
        ref={canvasRef}
        style={{
          flex:      1,
          width:     '100%',
          overflow:  'hidden',
          position:  'relative',
          flexShrink: 1,
        }}
      >
        <div
          ref={scaleRef}
          style={{
            width:          `${RIVER_WIDTH_PX}px`,
            display:        'flex',
            flexDirection:  'column',
            alignItems:     'flex-start',
            padding:        '1.5rem 0 0.75rem',
            gap:            '0.5rem',
          }}
        >
          {/* Reference gate — only visible once introduced */}
          {gateVisible && (
            <div style={{ paddingTop: '0.5rem' }}>
              <ReferenceGate
                gate={state.referenceGate}
                visible={true}
                label={gateLabel}
              />
            </div>
          )}

          {/* Demo label — tells student this is Bucky's demonstration */}
          {isDemo && (
            <div style={{
              fontSize:    '0.7rem',
              opacity:     0.55,
              letterSpacing: '0.08em',
              paddingLeft: '0.25rem',
              color:       'var(--ui-text)',
            }}>
              BUCKY'S DEMO ↓
            </div>
          )}

          {/* River row — always shown so logs have somewhere to land */}
          <div style={{
            width:        `${RIVER_WIDTH_PX}px`,
            height:       '80px',
            background:   'var(--river-water)',
            borderRadius: '8px',
            border:       '1px solid var(--grid-line)',
            display:      'flex',
            alignItems:   'center',
            padding:      '4px',
            gap:          '4px',
          }}>
            {buildBlocks.length === 0 && !isDemo && (
              <span style={{ opacity: 0.35, fontSize: '0.8rem', paddingLeft: '0.5rem' }}>
                {isExplore
                  ? 'Click a log below to place it here'
                  : isBuildActive
                    ? 'Click logs below to fill the gap →'
                    : ''}
              </span>
            )}
            {buildBlocks.map(b => (
              // In DEMO: logs are read-only — no remove button, no interaction
              <div key={b.id} style={{ position: 'relative', flexShrink: 0 }}>
                <Log block={b} dispatch={dispatch} />
                {!isDemo && (
                <button
                  onClick={() => dispatch({ type: 'LOG_RETURNED', blockId: b.id })}
                  style={{
                    position:       'absolute',
                    top:            '-10px',
                    right:          '-10px',
                    width:          '22px',
                    height:         '22px',
                    borderRadius:   '50%',
                    background:     'var(--error-glow, #F87171)',
                    border:         'none',
                    color:          '#fff',
                    fontSize:       '14px',
                    fontWeight:     700,
                    lineHeight:     '22px',
                    textAlign:      'center',
                    cursor:         'pointer',
                    padding:        0,
                    zIndex:         1,
                  }}
                  title="Return to tray"
                >
                  ×
                </button>
                )}
              </div>
            ))}
          </div>

          {/* Check button */}
          {isBuildActive && (
            <div style={{ paddingTop: '0.25rem' }}>
              <CheckButton
                label="CHECK"
                disabled={!canSubmit}
                onPress={() => dispatch({ type: 'CHECK_SUBMIT' })}
              />
            </div>
          )}
        </div>

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
          }}>
            <div style={{ fontSize: '4rem' }}>🎉</div>
            <p style={{ fontSize: '1.1rem', textAlign: 'center', maxWidth: '360px', margin: 0 }}>
              {node.text}
            </p>
            <button
              onClick={() => dispatch({ type: 'PLAY_AGAIN' })}
              style={{
                padding:      '0.75rem 2rem',
                fontSize:     '1rem',
                background:   'var(--success-glow)',
                color:        '#0D1B2A',
                border:       'none',
                borderRadius: '0.75rem',
                cursor:       'pointer',
              }}
            >
              Play Again
            </button>
          </div>
        )}
      </div>

      {/* ── Dock tray — hidden during DEMO (Bucky is demonstrating) ───── */}
      {!isDemo && <div style={{
        minHeight:    '120px',
        maxHeight:    '160px',
        background:   '#0a1520',
        borderTop:    '2px solid var(--grid-line)',
        display:      'flex',
        alignItems:   'center',
        padding:      '0.5rem 0.75rem',
        gap:          '0.5rem',
        overflowX:    'auto',
        overflowY:    'hidden',
        flexShrink:   0,
        WebkitOverflowScrolling: 'touch' as any,
      }}>
        <span style={{
          opacity:     0.4,
          fontSize:    '0.65rem',
          writingMode: 'vertical-rl' as any,
          flexShrink:  0,
          letterSpacing: '0.05em',
        }}>
          TRAY
        </span>

        {dockBlocks.map(b => (
          <button
            key={b.id}
            onClick={() => {
              unlockAudio()   // belt-and-suspenders for iOS mid-session resume
              playSnapSound()
              playFractionTone({ numerator: b.numerator, denominator: b.denominator })
              dispatch({ type: 'LOG_SNAPPED', blockId: b.id, slot: state.buildZoneLogs.length })
            }}
            style={{
              background: 'none', border: 'none', padding: 0,
              cursor: 'pointer', flexShrink: 0,
            }}
            title={`Place ${b.numerator}/${b.denominator} log`}
          >
            <Log block={b} dispatch={dispatch} />
          </button>
        ))}

        {dockBlocks.length === 0 && (
          <span style={{ opacity: 0.35, fontSize: '0.8rem' }}>
            All logs placed
          </span>
        )}

        {/* Undo: remove the last-placed log — works in all phases */}
        {buildBlocks.length > 0 && (
          <button
            onClick={() => {
              // In build phases buildZoneLogs is tracked; in EXPLORE fall back to buildBlocks
              const lastId =
                state.buildZoneLogs[state.buildZoneLogs.length - 1]
                ?? buildBlocks[buildBlocks.length - 1]?.id
              if (lastId) dispatch({ type: 'LOG_RETURNED', blockId: lastId })
            }}
            style={{
              marginLeft:   'auto',
              padding:      '0.4rem 0.75rem',
              fontSize:     '0.8rem',
              background:   'transparent',
              color:        'var(--ui-text)',
              border:       '1px solid var(--grid-line)',
              borderRadius: '0.4rem',
              cursor:       'pointer',
              flexShrink:   0,
              opacity:      0.7,
            }}
          >
            ← Undo
          </button>
        )}
      </div>}
    </div>
  )
}
