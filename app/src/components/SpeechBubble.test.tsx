import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { SpeechBubble, CHARS_PER_MS } from './SpeechBubble'

vi.mock('../hooks/useReducedMotion', () => ({
  useReducedMotion: vi.fn(() => false),
}))

import { useReducedMotion } from '../hooks/useReducedMotion'

const mockUseReducedMotion = vi.mocked(useReducedMotion)

afterEach(() => {
  vi.useRealTimers()
  mockUseReducedMotion.mockReturnValue(false)
})

describe('SpeechBubble', () => {
  it('exports CHARS_PER_MS for typewriter timing', () => {
    expect(CHARS_PER_MS).toBe(40 / 1000)
  })

  it('renders the provided text after typewriter completes', async () => {
    vi.useFakeTimers()
    render(<SpeechBubble text="Hello Builder!" />)
    await act(async () => { vi.runAllTimers() })
    expect(screen.getByText('Hello Builder!')).toBeInTheDocument()
    vi.useRealTimers()
  })

  it('renders different text when text prop changes', async () => {
    vi.useFakeTimers()
    const { rerender } = render(<SpeechBubble text="First line" />)
    await act(async () => { vi.runAllTimers() })
    expect(screen.getByText('First line')).toBeInTheDocument()
    rerender(<SpeechBubble text="Second line" />)
    await act(async () => { vi.runAllTimers() })
    expect(screen.getByText('Second line')).toBeInTheDocument()
    vi.useRealTimers()
  })

  it('shows full text immediately when reduced motion is enabled', () => {
    mockUseReducedMotion.mockReturnValue(true)
    render(<SpeechBubble text="Hello Builder!" />)
    const bubble = screen.getByTestId('speech-bubble')
    expect(bubble).toHaveTextContent('Hello Builder!')
  })

  it('shows partial text initially when reduced motion is off', () => {
    mockUseReducedMotion.mockReturnValue(false)
    vi.useFakeTimers()
    render(<SpeechBubble text="Hello Builder!" />)
    const bubble = screen.getByTestId('speech-bubble')
    expect(bubble.textContent).not.toBe('Hello Builder!')
    expect(bubble.textContent!.length).toBeGreaterThan(0)
    vi.useRealTimers()
  })

  it('calls onComplete when text is fully displayed', async () => {
    vi.useFakeTimers()
    const onComplete = vi.fn()
    render(<SpeechBubble text="Hi" onComplete={onComplete} />)
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

  it('keeps role="status" for screen readers', () => {
    mockUseReducedMotion.mockReturnValue(true)
    render(<SpeechBubble text="Accessible" />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })
})
