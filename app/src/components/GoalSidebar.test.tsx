import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GoalSidebar } from './GoalSidebar'

describe('GoalSidebar', () => {
  const half = { numerator: 1, denominator: 2 }

  it('is hidden when visible=false', () => {
    render(
      <GoalSidebar visible={false} gateLabel="← 1/2 →" gate={half} />,
    )
    expect(screen.getByTestId('goal-sidebar')).not.toBeVisible()
  })

  it('shows GOAL heading and gate label when visible=true', () => {
    render(
      <GoalSidebar visible={true} gateLabel="← 1/2 →" gate={half} />,
    )
    expect(screen.getByTestId('goal-sidebar')).toBeVisible()
    expect(screen.getByText('GOAL')).toBeInTheDocument()
    expect(screen.getByText('← 1/2 →')).toBeInTheDocument()
  })
})
