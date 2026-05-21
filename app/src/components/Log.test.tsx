import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Log } from './Log'
import type { BlockState } from '../state/types'

// Stub AudioContext so toneEngine doesn't throw in jsdom
beforeAll(() => {
  const mockComp = { connect: vi.fn() }
  const mockCtx  = {
    state: 'running' as AudioContextState,
    destination: {} as AudioDestinationNode,
    currentTime: 0,
    resume: vi.fn().mockResolvedValue(undefined),
    createOscillator: vi.fn(() => ({
      type: 'sine', frequency: { value: 0, linearRampToValueAtTime: vi.fn() },
      connect: vi.fn(), start: vi.fn(), stop: vi.fn(),
    })),
    createGain: vi.fn(() => ({
      gain: { value: 1, setTargetAtTime: vi.fn() }, connect: vi.fn(),
    })),
    createDynamicsCompressor: vi.fn(() => mockComp),
  }
  vi.stubGlobal('AudioContext', vi.fn(function() { return mockCtx }))
})

const makeBlock = (overrides: Partial<BlockState> = {}): BlockState => ({
  id:          'test-block-1',
  numerator:   1,
  denominator: 2,
  pixelWidth:  480,
  zone:        'dock',
  slot:        null,
  splittable:  true,
  selected:    false,
  locked:      false,
  ...overrides,
})

describe('Log', () => {
  it('renders with a data-block-id attribute', () => {
    render(<Log block={makeBlock()} dispatch={vi.fn()} />)
    expect(screen.getByTestId('log-test-block-1')).toBeInTheDocument()
  })

  it('exposes fraction as data attributes', () => {
    render(<Log block={makeBlock()} dispatch={vi.fn()} />)
    const el = screen.getByTestId('log-test-block-1')
    expect(el).toHaveAttribute('data-numerator', '1')
    expect(el).toHaveAttribute('data-denominator', '2')
  })

  it('exposes zone as data attribute', () => {
    render(<Log block={makeBlock({ zone: 'build' })} dispatch={vi.fn()} />)
    const el = screen.getByTestId('log-test-block-1')
    expect(el).toHaveAttribute('data-zone', 'build')
  })

  it('all logs use width: 100% to fill their proportional wrapper', () => {
    // The wrapper (in LessonScreen.tsx, for both river-row and dock-tray)
    // carries the proportional flex-basis = (num/denom)*100%, so a 1/4
    // log is the same pixel width in both zones (shared lane-band).
    for (const zone of ['build', 'dock'] as const) {
      const { unmount } = render(
        <Log block={makeBlock({ zone })} dispatch={vi.fn()} />,
      )
      expect(screen.getByTestId('log-test-block-1')).toHaveStyle({ width: '100%' })
      unmount()
    }
  })

  it('has data-splittable=true for splittable logs', () => {
    render(<Log block={makeBlock({ splittable: true })} dispatch={vi.fn()} />)
    const el = screen.getByTestId('log-test-block-1')
    expect(el).toHaveAttribute('data-splittable', 'true')
  })

  it('has data-splittable=false for quarter logs (non-splittable)', () => {
    render(<Log block={makeBlock({ splittable: false, denominator: 4 })} dispatch={vi.fn()} />)
    const el = screen.getByTestId('log-test-block-1')
    expect(el).toHaveAttribute('data-splittable', 'false')
  })

  it('has data-locked attribute when locked=true', () => {
    render(<Log block={makeBlock({ locked: true })} dispatch={vi.fn()} />)
    const el = screen.getByTestId('log-test-block-1')
    expect(el).toHaveAttribute('data-locked', 'true')
  })

  it('shows a fraction label (accessible text)', () => {
    render(<Log block={makeBlock({ numerator: 1, denominator: 4 })} dispatch={vi.fn()} />)
    // Should have "1/4" somewhere in the log label
    expect(screen.getByText(/1\/4|¼/)).toBeInTheDocument()
  })

  it('applies log--quarter class for 1/4 denominator', () => {
    render(<Log block={makeBlock({ denominator: 4 })} dispatch={vi.fn()} />)
    const el = screen.getByTestId('log-test-block-1')
    expect(el).toHaveClass('log', 'log--quarter')
  })
})

// ── Double-tap to chop ──────────────────────────────────────────────────────

describe('Log double-tap chop', () => {
  const buildSplittable = makeBlock({ zone: 'build', splittable: true })
  const buildQuarter    = makeBlock({ zone: 'build', splittable: false, denominator: 4 })
  const dockSplittable  = makeBlock({ zone: 'dock',  splittable: true })
  const lockedBuild     = makeBlock({ zone: 'build', splittable: true, locked: true })

  it('double-tap on splittable build log dispatches CHOP', async () => {
    const dispatch = vi.fn()
    render(<Log block={buildSplittable} dispatch={dispatch} />)
    await userEvent.dblClick(screen.getByTestId('log-test-block-1'))
    expect(dispatch).toHaveBeenCalledWith({ type: 'CHOP', blockId: 'test-block-1' })
  })

  it('single tap on build log does NOT dispatch CHOP', async () => {
    const dispatch = vi.fn()
    render(<Log block={buildSplittable} dispatch={dispatch} />)
    await userEvent.click(screen.getByTestId('log-test-block-1'))
    expect(dispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'CHOP' }))
  })

  it('double-tap on dock log does NOT dispatch CHOP (drag handles placement)', async () => {
    const dispatch = vi.fn()
    render(<Log block={dockSplittable} dispatch={dispatch} />)
    await userEvent.dblClick(screen.getByTestId('log-test-block-1'))
    expect(dispatch).not.toHaveBeenCalled()
  })

  it('double-tap on locked log does NOT dispatch CHOP (demo blocks)', async () => {
    const dispatch = vi.fn()
    render(<Log block={lockedBuild} dispatch={dispatch} />)
    await userEvent.dblClick(screen.getByTestId('log-test-block-1'))
    expect(dispatch).not.toHaveBeenCalled()
  })

  it('double-tap on unsplittable (quarter) build log does NOT dispatch CHOP', async () => {
    const dispatch = vi.fn()
    render(<Log block={buildQuarter} dispatch={dispatch} />)
    await userEvent.dblClick(screen.getByTestId('log-test-block-1'))
    expect(dispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'CHOP' }))
  })
})
