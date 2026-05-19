import { describe, it, expect, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { SpeechBubble } from './SpeechBubble'

describe('SpeechBubble', () => {
  it('renders the provided text', () => {
    render(<SpeechBubble text="Hello Builder!" />)
    expect(screen.getByText('Hello Builder!')).toBeInTheDocument()
  })

  it('renders different text when text prop changes', () => {
    const { rerender } = render(<SpeechBubble text="First line" />)
    expect(screen.getByText('First line')).toBeInTheDocument()
    rerender(<SpeechBubble text="Second line" />)
    expect(screen.getByText('Second line')).toBeInTheDocument()
  })

  it('calls onComplete when text is fully displayed', async () => {
    vi.useFakeTimers()
    const onComplete = vi.fn()
    render(<SpeechBubble text="Hi" onComplete={onComplete} />)
    // Advance all pending timers so typewriter completes
    await act(async () => { vi.runAllTimers() })
    expect(onComplete).toHaveBeenCalledOnce()
    vi.useRealTimers()
  })

  it('does not throw when onComplete is not provided', async () => {
    vi.useFakeTimers()
    expect(() => render(<SpeechBubble text="No callback" />)).not.toThrow()
    await act(async () => { vi.runAllTimers() })
    vi.useRealTimers()
  })

  it('resets and calls onComplete again when text changes', async () => {
    vi.useFakeTimers()
    const onComplete = vi.fn()
    const { rerender } = render(<SpeechBubble text="A" onComplete={onComplete} />)
    await act(async () => { vi.runAllTimers() })
    expect(onComplete).toHaveBeenCalledTimes(1)

    rerender(<SpeechBubble text="B" onComplete={onComplete} />)
    await act(async () => { vi.runAllTimers() })
    expect(onComplete).toHaveBeenCalledTimes(2)
    vi.useRealTimers()
  })
})
