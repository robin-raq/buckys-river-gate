import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BonusPrompt } from './BonusPrompt'

describe('BonusPrompt', () => {
  it('renders nothing when visible is false', () => {
    render(<BonusPrompt visible={false} onAccept={vi.fn()} onDecline={vi.fn()} />)
    expect(screen.queryByTestId('bonus-prompt')).toBeNull()
  })

  it('renders both [Try it!] and [Skip →] buttons when visible', () => {
    render(<BonusPrompt visible onAccept={vi.fn()} onDecline={vi.fn()} />)
    expect(screen.getByTestId('bonus-prompt')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /try it/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /skip/i })).toBeInTheDocument()
  })

  it('clicking [Try it!] calls onAccept', async () => {
    const onAccept = vi.fn()
    const user = userEvent.setup()
    render(<BonusPrompt visible onAccept={onAccept} onDecline={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: /try it/i }))
    expect(onAccept).toHaveBeenCalledOnce()
  })

  it('clicking [Skip →] calls onDecline', async () => {
    const onDecline = vi.fn()
    const user = userEvent.setup()
    render(<BonusPrompt visible onAccept={vi.fn()} onDecline={onDecline} />)
    await user.click(screen.getByRole('button', { name: /skip/i }))
    expect(onDecline).toHaveBeenCalledOnce()
  })
})
