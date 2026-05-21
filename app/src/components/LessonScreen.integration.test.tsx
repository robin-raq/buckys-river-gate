import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LessonScreen } from './LessonScreen'
import { makeLessonState } from '../test/helpers/lessonState'

beforeAll(() => {
  const mockComp = { connect: vi.fn() }
  const mockCtx = {
    state:                    'running' as AudioContextState,
    destination:              {} as AudioDestinationNode,
    resume:                   vi.fn().mockResolvedValue(undefined),
    createDynamicsCompressor: vi.fn(() => mockComp),
    createOscillator:         vi.fn(() => ({
      connect: vi.fn(), start: vi.fn(), stop: vi.fn(),
      frequency: { setValueAtTime: vi.fn() }, type: '',
    })),
    createGain: vi.fn(() => ({
      connect: vi.fn(),
      gain: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
      },
    })),
    currentTime: 0,
  }
  vi.stubGlobal('AudioContext', vi.fn(() => mockCtx))
})

const noop = () => {}

describe('LessonScreen visual integration', () => {
  it('uses kawaii river scene during DEMO', () => {
    render(
      <LessonScreen
        state={makeLessonState({ dialogueNodeId: 'DEMO_CHOP_1', phase: 'DEMO' })}
        dispatch={noop}
      />,
    )
    expect(screen.getByTestId('speech-bubble')).toBeInTheDocument()
    expect(screen.queryByTestId('scene-backdrop')).not.toBeInTheDocument()
    expect(screen.queryByTestId('game-canvas')).not.toBeInTheDocument()
  })

  it('renders equivalence badge on INSTRUCT_NAME_EQUIVALENCE', () => {
    render(
      <LessonScreen
        state={makeLessonState({ dialogueNodeId: 'INSTRUCT_NAME_EQUIVALENCE', phase: 'INSTRUCT_SUCCESS' })}
        dispatch={noop}
      />,
    )
    expect(screen.getByTestId('equivalence-badge')).toHaveTextContent('1/2 = 2/4')
  })

  it('hides the standalone goal sidebar (cyan gate communicates the target)', () => {
    // Design decision: the cyan reference gate's WIDTH already shows the
    // fraction the kid must fill. A separate "GOAL: 1/2" sign was a 4th
    // attention magnet competing with the speech bubble, gate, and dock.
    // We removed it for visual focus. The element stays in the DOM for
    // hidden state but is not visible to the user.
    render(
      <LessonScreen
        state={makeLessonState({ phase: 'INSTRUCT_BUILD', dialogueNodeId: 'INSTRUCT_BUILD_PROMPT' })}
        dispatch={noop}
      />,
    )
    expect(screen.getByTestId('goal-sidebar')).not.toBeVisible()
    expect(screen.getByTestId('reference-gate')).toBeVisible()
  })

  it('renders scene plate layout with animated Bucky sprite during INSTRUCT', () => {
    render(
      <LessonScreen
        state={makeLessonState({ phase: 'INSTRUCT_BUILD', dialogueNodeId: 'INSTRUCT_BUILD_PROMPT' })}
        dispatch={noop}
      />,
    )
    expect(document.querySelector('.lesson-screen')).toBeInTheDocument()
    expect(document.querySelector('.river-row')).toBeInTheDocument()
    expect(screen.getByTestId('speech-bubble')).toBeInTheDocument()
    // Bucky is now a sprite on top of bucky-background.png (Option A from design mockup)
    expect(screen.getByTestId('bucky-avatar')).toBeVisible()
    // Lane dividers show in BUILD phases so the kid sees the snap targets.
    expect(screen.getByTestId('snap-guides')).toBeVisible()
  })

  it('highlights reference gate when dialogue requests highlightGap', () => {
    render(
      <LessonScreen
        state={makeLessonState({ dialogueNodeId: 'INSTRUCT_ERROR_SHORT', phase: 'INSTRUCT_ERROR' })}
        dispatch={noop}
      />,
    )
    expect(screen.getByTestId('reference-gate')).toHaveAttribute('data-highlight-gap', 'true')
  })
})
