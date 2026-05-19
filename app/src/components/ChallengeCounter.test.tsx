import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ChallengeCounter } from './ChallengeCounter'

describe('ChallengeCounter', () => {
  it('renders the current challenge number (1-indexed)', () => {
    render(<ChallengeCounter current={1} total={3} />)
    expect(screen.getByText(/1/)).toBeInTheDocument()
  })

  it('renders total count', () => {
    render(<ChallengeCounter current={1} total={3} />)
    expect(screen.getByText(/3/)).toBeInTheDocument()
  })

  it('shows correct count on challenge 2', () => {
    render(<ChallengeCounter current={2} total={3} />)
    expect(screen.getByText(/2/)).toBeInTheDocument()
  })

  it('renders the correct number of dot indicators', () => {
    render(<ChallengeCounter current={1} total={3} />)
    // total=3 means 3 dots exist
    const dots = screen.getAllByRole('presentation')
    expect(dots).toHaveLength(3)
  })

  it('marks the current dot as active', () => {
    render(<ChallengeCounter current={2} total={3} />)
    const dots = screen.getAllByRole('presentation')
    // dot at index 1 (0-based) is the active one
    expect(dots[1]).toHaveAttribute('data-active', 'true')
  })

  it('marks previous dots as completed', () => {
    render(<ChallengeCounter current={3} total={3} />)
    const dots = screen.getAllByRole('presentation')
    expect(dots[0]).toHaveAttribute('data-completed', 'true')
    expect(dots[1]).toHaveAttribute('data-completed', 'true')
  })
})
