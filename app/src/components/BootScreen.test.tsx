import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BootScreen } from './BootScreen'

describe('BootScreen', () => {
  it('renders the game title in a heading', () => {
    render(<BootScreen onStart={vi.fn()} />)
    expect(screen.getByRole('heading', { name: /bucky/i })).toBeInTheDocument()
  })

  it('renders a start button', () => {
    render(<BootScreen onStart={vi.fn()} />)
    expect(screen.getByRole('button', { name: /start|play|begin/i })).toBeInTheDocument()
  })

  it('calls onStart when the button is clicked', async () => {
    const onStart = vi.fn()
    render(<BootScreen onStart={onStart} />)
    await userEvent.click(screen.getByRole('button', { name: /start|play|begin/i }))
    expect(onStart).toHaveBeenCalledOnce()
  })
})
