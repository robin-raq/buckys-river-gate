import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Log } from './Log'
import type { BlockState } from '../state/types'

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

  it('has correct pixel width as inline style', () => {
    render(<Log block={makeBlock({ pixelWidth: 480 })} dispatch={vi.fn()} />)
    const el = screen.getByTestId('log-test-block-1')
    expect(el).toHaveStyle({ width: '480px' })
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
})
