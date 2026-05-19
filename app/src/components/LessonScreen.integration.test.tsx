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
  it('renders BuckyAvatar with dialogue buckyState', () => {
    render(
      <LessonScreen
        state={makeLessonState({ dialogueNodeId: 'DEMO_CHOP_1', phase: 'DEMO' })}
        dispatch={noop}
      />,
    )
    const avatar = screen.getByTestId('bucky-avatar')
    expect(avatar).toHaveAttribute('data-bucky-state', 'chop-swing')
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

  it('renders goal sidebar during INSTRUCT_BUILD', () => {
    render(
      <LessonScreen
        state={makeLessonState({ phase: 'INSTRUCT_BUILD', dialogueNodeId: 'INSTRUCT_BUILD_PROMPT' })}
        dispatch={noop}
      />,
    )
    expect(screen.getByTestId('goal-sidebar')).toBeVisible()
  })

  it('renders river scene backdrop', () => {
    render(
      <LessonScreen state={makeLessonState()} dispatch={noop} />,
    )
    expect(screen.getByTestId('river-scene')).toBeInTheDocument()
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
