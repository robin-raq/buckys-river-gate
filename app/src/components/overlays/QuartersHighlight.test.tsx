import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QuartersHighlight } from './QuartersHighlight'

describe('QuartersHighlight', () => {
  it('renders nothing when kind is null', () => {
    render(<QuartersHighlight kind={null} />)
    expect(screen.queryByTestId('quarters-highlight')).toBeNull()
  })

  it('renders the first-half variant covering 2 quarters', () => {
    render(<QuartersHighlight kind="first-half" />)
    const el = screen.getByTestId('quarters-highlight')
    expect(el).toHaveClass('quarters-highlight')
    expect(el).toHaveClass('quarters-highlight--first-half')
    expect(el).toHaveAttribute('data-span', 'first-half')
  })

  it('renders the all variant covering 4 quarters', () => {
    render(<QuartersHighlight kind="all" />)
    const el = screen.getByTestId('quarters-highlight')
    expect(el).toHaveClass('quarters-highlight')
    expect(el).toHaveClass('quarters-highlight--all')
    expect(el).toHaveAttribute('data-span', 'all')
  })

  it('is decorative — aria-hidden and pointer-events none via class', () => {
    render(<QuartersHighlight kind="all" />)
    const el = screen.getByTestId('quarters-highlight')
    expect(el).toHaveAttribute('aria-hidden', 'true')
  })
})
