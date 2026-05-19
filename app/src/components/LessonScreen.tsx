import type { Dispatch } from 'react'
import type { LessonState } from '../state/types'
import type { LessonEvent } from '../state/lessonEvents'
import { getNode }          from '../state/dialogue'
import { SpeechBubble }     from './SpeechBubble'
import { ReferenceGate }    from './ReferenceGate'
import { CheckButton }      from './CheckButton'
import { ChallengeCounter } from './ChallengeCounter'
import { Log }              from './Log'
import { RIVER_WIDTH_PX }   from '../constants'

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

export function LessonScreen({ state, dispatch }: Props) {
  const node          = getNode(state.dialogueNodeId)
  const dockBlocks    = state.blocks.filter(b => b.zone === 'dock')
  const buildBlocks   = state.blocks.filter(b => b.zone === 'build')
  const isCheckPhase  = CHECK_PHASES.has(state.phase)
  const isBuildActive = BUILD_PHASES.has(state.phase)
  const canSubmit     = state.buildZoneLogs.length > 0

  // Label for the reference gate
  const { numerator: gn, denominator: gd } = state.referenceGate
  const gateLabel = `← ${gn}/${gd} →`

  function handleDialogueAdvance() {
    if (node.nextNode) {
      // Still walking a chain within the same phase — update dialogueNodeId locally
      // by dispatching DIALOGUE_ADVANCE; the reducer handles chain vs phase transitions
    }
    dispatch({ type: 'DIALOGUE_ADVANCE' })
  }

  return (
    <div style={{
      display:        'flex',
      flexDirection:  'column',
      height:         '100dvh',
      background:     'var(--bg-deep)',
      color:          'var(--ui-text)',
      fontFamily:     'system-ui, sans-serif',
      overflow:       'hidden',
      touchAction:    'none',
    }}>

      {/* ── Top bar ── */}
      <div style={{
        height:          '64px',
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'space-between',
        padding:         '0 1rem',
        flexShrink:      0,
        borderBottom:    '1px solid var(--grid-line)',
      }}>
        <span style={{ fontWeight: 700, fontSize: '1rem' }}>🪵 Bucky's River Gate</span>
        {isCheckPhase && (
          <ChallengeCounter
            current={state.challengeIndex + 1}
            total={3}
          />
        )}
        <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>
          {state.phase}
        </span>
      </div>

      {/* ── Bucky dialogue ── */}
      <div style={{
        padding:     '0.75rem 1rem',
        flexShrink:  0,
        display:     'flex',
        gap:         '0.75rem',
        alignItems:  'flex-start',
      }}>
        {/* Bucky avatar placeholder */}
        <div style={{
          width:        '56px',
          height:       '56px',
          borderRadius: '50%',
          background:   'var(--log-half)',
          display:      'flex',
          alignItems:   'center',
          justifyContent: 'center',
          fontSize:     '1.8rem',
          flexShrink:   0,
        }}>
          🦫
        </div>

        <div style={{ flex: 1 }}>
          <SpeechBubble
            text={node.text}
            onComplete={node.autoAdvance ? handleDialogueAdvance : undefined}
          />
          {node.tapToContinue && (
            <button
              onClick={handleDialogueAdvance}
              style={{
                marginTop:    '0.5rem',
                padding:      '0.4rem 1rem',
                fontSize:     '0.85rem',
                background:   'transparent',
                color:        'var(--ui-text)',
                border:       '1px solid var(--grid-line)',
                borderRadius: '0.5rem',
                cursor:       'pointer',
              }}
            >
              Tap to continue →
            </button>
          )}
        </div>
      </div>

      {/* ── River canvas ── */}
      <div style={{
        flex:           1,
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        padding:        '0.5rem',
        gap:            '0.5rem',
        overflow:       'hidden',
      }}>

        {/* Reference gate row */}
        <div style={{
          width:    `${RIVER_WIDTH_PX}px`,
          maxWidth: '100%',
          paddingTop: '1.5rem',
          display:  'flex',
          alignItems: 'center',
        }}>
          <ReferenceGate
            gate={state.referenceGate}
            visible={true}
            label={gateLabel}
          />
        </div>

        {/* Build zone row */}
        <div style={{
          width:        `${RIVER_WIDTH_PX}px`,
          maxWidth:     '100%',
          height:       '80px',
          background:   'var(--river-water)',
          borderRadius: '8px',
          border:       '1px solid var(--grid-line)',
          display:      'flex',
          alignItems:   'center',
          padding:      '4px',
          gap:          '4px',
          position:     'relative',
        }}>
          {buildBlocks.length === 0 && (
            <span style={{ opacity: 0.4, fontSize: '0.85rem', marginLeft: '0.5rem' }}>
              Drag logs here →
            </span>
          )}
          {buildBlocks.map(b => (
            <Log key={b.id} block={b} dispatch={dispatch} />
          ))}
        </div>

        {/* Check button */}
        {isBuildActive && (
          <CheckButton
            label="CHECK"
            disabled={!canSubmit}
            onPress={() => dispatch({ type: 'CHECK_SUBMIT' })}
          />
        )}

        {/* Win / success screens */}
        {state.phase === 'WIN' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem' }}>🎉</div>
            <p style={{ fontSize: '1.1rem', margin: '0.5rem 0' }}>
              {node.text}
            </p>
            <button
              onClick={() => dispatch({ type: 'PLAY_AGAIN' })}
              style={{
                marginTop:    '1rem',
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

      {/* ── Dock tray ── */}
      <div style={{
        height:       '140px',
        background:   '#0a1520',
        borderTop:    '2px solid var(--grid-line)',
        display:      'flex',
        alignItems:   'center',
        padding:      '0 1rem',
        gap:          '0.75rem',
        overflowX:    'auto',
        flexShrink:   0,
      }}>
        <span style={{ opacity: 0.5, fontSize: '0.75rem', writingMode: 'vertical-rl', flexShrink: 0 }}>
          TRAY
        </span>
        {dockBlocks.map(b => (
          <div
            key={b.id}
            onClick={() => {
              // Tap to move to build zone (simplified — no drag yet)
              const nextSlot = state.buildZoneLogs.length
              dispatch({ type: 'LOG_SNAPPED', blockId: b.id, slot: nextSlot })
            }}
            style={{ cursor: 'pointer', flexShrink: 0 }}
          >
            <Log block={b} dispatch={dispatch} />
          </div>
        ))}
        {dockBlocks.length === 0 && (
          <span style={{ opacity: 0.4, fontSize: '0.85rem' }}>
            No logs in tray
          </span>
        )}
      </div>

    </div>
  )
}
