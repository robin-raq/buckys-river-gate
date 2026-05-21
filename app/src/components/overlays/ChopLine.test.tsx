import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ChopLine } from './ChopLine'

describe('ChopLine', () => {
  it('renders nothing when positionPct is null', () => {
    render(<ChopLine positionPct={null} />)
    expect(screen.queryByTestId('chop-line')).toBeNull()
  })

  it('renders at the given horizontal percentage', () => {
    render(<ChopLine positionPct={50} />)
    const el = screen.getByTestId('chop-line')
    expect(el).toHaveClass('chop-line')
    // Style is inline (not class-driven) because position depends on the
    // splittable block's center, which the reducer can place anywhere.
    expect(el).toHaveStyle({ left: '50%' })
  })

  it('positions correctly for non-center chops (25% and 75%)', () => {
    const { rerender } = render(<ChopLine positionPct={25} />)
    expect(screen.getByTestId('chop-line')).toHaveStyle({ left: '25%' })
    rerender(<ChopLine positionPct={75} />)
    expect(screen.getByTestId('chop-line')).toHaveStyle({ left: '75%' })
  })

  it('is decorative — aria-hidden', () => {
    render(<ChopLine positionPct={50} />)
    expect(screen.getByTestId('chop-line')).toHaveAttribute('aria-hidden', 'true')
  })
})
