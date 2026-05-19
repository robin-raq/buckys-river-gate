import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BuckyBeaverArt } from './BuckyBeaverArt'

describe('BuckyBeaverArt', () => {
  it('renders SVG with state class', () => {
    render(<BuckyBeaverArt state="chop-swing" />)
    const svg = screen.getByTestId('bucky-beaver-art')
    expect(svg.tagName.toLowerCase()).toBe('svg')
    expect(svg).toHaveClass('bucky-art--chop-swing')
  })

  it('includes hard hat B monogram', () => {
    render(<BuckyBeaverArt state="idle" />)
    expect(screen.getByTestId('bucky-beaver-art').textContent).toContain('B')
    expect(screen.getByTestId('bucky-beaver-art').textContent).toContain('BUCKY')
  })
})
