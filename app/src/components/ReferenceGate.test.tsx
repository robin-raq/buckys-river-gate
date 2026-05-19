import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ReferenceGate } from './ReferenceGate'

describe('ReferenceGate', () => {
  const half  = { numerator: 1, denominator: 2 }
  const threeQ = { numerator: 3, denominator: 4 }

  it('renders the label text', () => {
    render(<ReferenceGate gate={half} visible={true} label="← 1/2 →" />)
    expect(screen.getByText('← 1/2 →')).toBeInTheDocument()
  })

  it('is visible when visible=true', () => {
    render(<ReferenceGate gate={half} visible={true} label="← 1/2 →" />)
    const el = screen.getByTestId('reference-gate')
    expect(el).toBeVisible()
  })

  it('is hidden when visible=false', () => {
    render(<ReferenceGate gate={half} visible={false} label="← 1/2 →" />)
    const el = screen.getByTestId('reference-gate')
    expect(el).not.toBeVisible()
  })

  it('exposes gate fraction as data attributes', () => {
    render(<ReferenceGate gate={half} visible={true} label="← 1/2 →" />)
    const el = screen.getByTestId('reference-gate')
    expect(el).toHaveAttribute('data-numerator', '1')
    expect(el).toHaveAttribute('data-denominator', '2')
  })

  it('width style reflects gate fraction of river width (960px)', () => {
    render(<ReferenceGate gate={half} visible={true} label="← 1/2 →" />)
    const el = screen.getByTestId('reference-gate')
    // 1/2 of 960px = 480px
    expect(el).toHaveStyle({ width: '480px' })
  })

  it('width style is correct for 3/4 gate', () => {
    render(<ReferenceGate gate={threeQ} visible={true} label="← 3/4 →" />)
    const el = screen.getByTestId('reference-gate')
    // 3/4 of 960px = 720px
    expect(el).toHaveStyle({ width: '720px' })
  })

  it('sets data-highlight-gap when highlightGap=true', () => {
    render(
      <ReferenceGate gate={half} visible={true} label="← 1/2 →" highlightGap />,
    )
    expect(screen.getByTestId('reference-gate')).toHaveAttribute('data-highlight-gap', 'true')
  })

  it('sets data-highlight-overflow when highlightOverflow=true', () => {
    render(
      <ReferenceGate gate={half} visible={true} label="← 1/2 →" highlightOverflow />,
    )
    expect(screen.getByTestId('reference-gate')).toHaveAttribute('data-highlight-overflow', 'true')
  })

  it('applies pulse and gap modifier classes when visible with highlightGap', () => {
    render(
      <ReferenceGate gate={half} visible={true} label="← 1/2 →" highlightGap />,
    )
    const el = screen.getByTestId('reference-gate')
    expect(el).toHaveClass('reference-gate--pulse', 'reference-gate--gap')
  })

  it('applies overflow modifier class when highlightOverflow=true', () => {
    render(
      <ReferenceGate gate={half} visible={true} label="← 1/2 →" highlightOverflow />,
    )
    expect(screen.getByTestId('reference-gate')).toHaveClass('reference-gate--overflow')
  })
})
