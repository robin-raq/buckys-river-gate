import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CheckButton } from './CheckButton'

describe('CheckButton', () => {
  it('renders the label text', () => {
    render(<CheckButton label="CHECK" disabled={false} onPress={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'CHECK' })).toBeInTheDocument()
  })

  it('fires onPress when clicked and enabled', async () => {
    const onPress = vi.fn()
    render(<CheckButton label="CHECK" disabled={false} onPress={onPress} />)
    await userEvent.click(screen.getByRole('button', { name: 'CHECK' }))
    expect(onPress).toHaveBeenCalledOnce()
  })

  it('does NOT fire onPress when disabled', async () => {
    const onPress = vi.fn()
    render(<CheckButton label="CHECK" disabled={true} onPress={onPress} />)
    await userEvent.click(screen.getByRole('button', { name: 'CHECK' }))
    expect(onPress).not.toHaveBeenCalled()
  })

  it('has disabled attribute when disabled=true', () => {
    render(<CheckButton label="CHECK" disabled={true} onPress={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'CHECK' })).toBeDisabled()
  })

  it('renders Submit label variant', () => {
    render(<CheckButton label="Submit" disabled={false} onPress={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument()
  })
})
