import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EquivalenceBadge } from './EquivalenceBadge'

describe('EquivalenceBadge', () => {
  it('renders equation with testid and equivalence-badge class when visible', () => {
    render(<EquivalenceBadge visible={true} equation="1/2 = 2/4" />)
    const badge = screen.getByTestId('equivalence-badge')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('equivalence-badge')
    expect(badge).toHaveTextContent('1/2 = 2/4')
  })

  it('applies slam animation class when visible', () => {
    render(<EquivalenceBadge visible={true} equation="1/2 = 2/4" />)
    expect(screen.getByTestId('equivalence-badge')).toHaveClass('equivalence-badge-slam')
  })

  it('does not render when visible is false', () => {
    render(<EquivalenceBadge visible={false} equation="1/2 = 2/4" />)
    expect(screen.queryByTestId('equivalence-badge')).toBeNull()
  })

  it('calls onDismiss when dismiss control is activated', async () => {
    const onDismiss = vi.fn()
    const user = userEvent.setup()
    render(
      <EquivalenceBadge
        visible={true}
        equation="1/2 = 2/4"
        onDismiss={onDismiss}
      />,
    )
    await user.click(screen.getByRole('button', { name: /dismiss/i }))
    expect(onDismiss).toHaveBeenCalledOnce()
  })
})
