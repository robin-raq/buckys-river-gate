import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LessonScreen } from './LessonScreen'
import type { LessonState } from '../state/types'

// ── AudioContext stub ──────────────────────────────────────────────────────
// LessonScreen imports toneEngine which calls new AudioContext() on first use.
// jsdom has no AudioContext, so stub it out before any tests run.
beforeAll(() => {
  const mockComp = { connect: vi.fn() }
  const mockCtx = {
    state:                    'running' as AudioContextState,
    destination:              {} as AudioDestinationNode,
    resume:                   vi.fn().mockResolvedValue(undefined),
    createDynamicsCompressor: vi.fn(() => mockComp),
    createOscillator:         vi.fn(() => ({ connect: vi.fn(), start: vi.fn(), stop: vi.fn(), frequency: { setValueAtTime: vi.fn() }, type: '' })),
    createGain:               vi.fn(() => ({ connect: vi.fn(), gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() } })),
    currentTime:              0,
  }
  vi.stubGlobal('AudioContext', vi.fn(function() { return mockCtx }))
})

// ── Test helpers ───────────────────────────────────────────────────────────

/** Minimal valid LessonState with sensible defaults */
function makeState(overrides: Partial<LessonState> = {}): LessonState {
  return {
    phase:               'CHECK_ERROR_2',
    dialogueNodeId:      'CHECK_ERROR_2_GHOST',
    attemptCount:        2,
    totalAttempts:       2,
    blocks:              [],
    buildZoneLogs:       [],
    referenceGate:       { numerator: 1, denominator: 2 },
    challengeIndex:      0,
    challengesPassed:    0,
    exploreInteractions: [],
    exploreStartTime:    0,
    audioUnlocked:       true,
    errorType:           'too_short',
    log:                 [],
    ...overrides,
  }
}

const noop = () => {}

// ── Ghost overlay ──────────────────────────────────────────────────────────

describe('LessonScreen ghost overlay', () => {
  it('renders a ghost-overlay element when node.showGhostOverlay is true', () => {
    render(<LessonScreen state={makeState()} dispatch={noop} />)

    // The overlay should be present with a recognisable testid
    const ghost = screen.getByTestId('ghost-overlay')
    expect(ghost).toBeTruthy()
  })

  it('does NOT render ghost overlay when node.showGhostOverlay is false/absent', () => {
    // CHECK_ERROR_2_RESTART has autoAdvance + no showGhostOverlay
    render(
      <LessonScreen
        state={makeState({ dialogueNodeId: 'CHECK_ERROR_2_RESTART' })}
        dispatch={noop}
      />
    )
    expect(screen.queryByTestId('ghost-overlay')).toBeNull()
  })

  it('ghost overlay width reflects the referenceGate numerator/denominator', () => {
    // Gate = 1/4 → ghost should be 240px wide (960 / 4)
    render(
      <LessonScreen
        state={makeState({ referenceGate: { numerator: 1, denominator: 4 } })}
        dispatch={noop}
      />
    )
    const ghost = screen.getByTestId('ghost-overlay')
    expect(ghost).toHaveStyle({ width: '240px' })
  })
})
