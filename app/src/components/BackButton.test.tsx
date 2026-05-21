import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BackButton } from './BackButton'

describe('BackButton', () => {
  it('renders with ← arrow label', () => {
    render(<BackButton canGoBack onPress={vi.fn()} />)
    const btn = screen.getByTestId('back-button')
    expect(btn.textContent).toMatch(/back/i)
    expect(btn.textContent).toMatch(/←/)
  })

  it('calls onPress when activated and there is history', async () => {
    const onPress = vi.fn()
    const user = userEvent.setup()
    render(<BackButton canGoBack onPress={onPress} />)
    await user.click(screen.getByTestId('back-button'))
    expect(onPress).toHaveBeenCalledOnce()
  })

  it('renders nothing when canGoBack is false', () => {
    render(<BackButton canGoBack={false} onPress={vi.fn()} />)
    expect(screen.queryByTestId('back-button')).toBeNull()
  })

  it('exposes an accessible label naming the action', () => {
    render(<BackButton canGoBack onPress={vi.fn()} />)
    expect(screen.getByRole('button', { name: /go back/i })).toBeInTheDocument()
  })
})
