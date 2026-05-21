import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ReferenceLog } from './ReferenceLog'

describe('ReferenceLog', () => {
  it('renders nothing when fraction is null', () => {
    render(<ReferenceLog fraction={null} />)
    expect(screen.queryByTestId('reference-log')).toBeNull()
  })

  it('renders a 1/2 reference with the half size class', () => {
    render(<ReferenceLog fraction={{ numerator: 1, denominator: 2 }} />)
    const wrapper = screen.getByTestId('reference-log')
    // Width = fraction% — no frame padding, so the wrapper equals the
    // inner log's share of the row exactly.
    expect(wrapper).toHaveStyle({ width: '50%' })
    const inner = wrapper.querySelector('.log')
    expect(inner).not.toBeNull()
    expect(inner).toHaveClass('log--half')
    expect(inner).toHaveClass('reference-log__inner')
    expect(wrapper).toHaveTextContent('1/2')
  })

  it('renders a 1/1 reference with the whole size class', () => {
    render(<ReferenceLog fraction={{ numerator: 1, denominator: 1 }} />)
    const wrapper = screen.getByTestId('reference-log')
    expect(wrapper).toHaveStyle({ width: '100%' })
    expect(wrapper.querySelector('.log')).toHaveClass('log--whole')
  })

  it('is decorative — aria-hidden, no pointer events on the wrapper class', () => {
    render(<ReferenceLog fraction={{ numerator: 1, denominator: 2 }} />)
    expect(screen.getByTestId('reference-log')).toHaveAttribute('aria-hidden', 'true')
  })

  it('defaults to position=above when no position prop given', () => {
    render(<ReferenceLog fraction={{ numerator: 1, denominator: 2 }} />)
    const el = screen.getByTestId('reference-log')
    expect(el).toHaveClass('reference-log-anchor--above')
    expect(el).toHaveAttribute('data-position', 'above')
  })

  it('applies the below variant when position="below"', () => {
    render(<ReferenceLog fraction={{ numerator: 1, denominator: 2 }} position="below" />)
    const el = screen.getByTestId('reference-log')
    expect(el).toHaveClass('reference-log-anchor--below')
    expect(el).toHaveAttribute('data-position', 'below')
  })
})
