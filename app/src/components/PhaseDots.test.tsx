import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PhaseDots } from './PhaseDots'

describe('PhaseDots', () => {
  it('highlights EXPLORE when activePhase is EXPLORE', () => {
    render(<PhaseDots activePhase="EXPLORE" />)
    expect(screen.getByTestId('phase-dot-explore')).toHaveAttribute('data-active', 'true')
    expect(screen.getByTestId('phase-dot-instruct')).toHaveAttribute('data-active', 'false')
    expect(screen.getByTestId('phase-dot-check')).toHaveAttribute('data-active', 'false')
  })

  it('highlights INSTRUCT when activePhase is INSTRUCT', () => {
    render(<PhaseDots activePhase="INSTRUCT" />)
    expect(screen.getByTestId('phase-dot-explore')).toHaveAttribute('data-active', 'false')
    expect(screen.getByTestId('phase-dot-instruct')).toHaveAttribute('data-active', 'true')
    expect(screen.getByTestId('phase-dot-check')).toHaveAttribute('data-active', 'false')
  })

  it('highlights CHECK when activePhase is CHECK', () => {
    render(<PhaseDots activePhase="CHECK" />)
    expect(screen.getByTestId('phase-dot-explore')).toHaveAttribute('data-active', 'false')
    expect(screen.getByTestId('phase-dot-instruct')).toHaveAttribute('data-active', 'false')
    expect(screen.getByTestId('phase-dot-check')).toHaveAttribute('data-active', 'true')
  })

  it('renders phase labels', () => {
    render(<PhaseDots activePhase="EXPLORE" />)
    expect(screen.getByText(/EXPLORE/i)).toBeInTheDocument()
    expect(screen.getByText(/INSTRUCT/i)).toBeInTheDocument()
    expect(screen.getByText(/CHECK/i)).toBeInTheDocument()
  })
})
