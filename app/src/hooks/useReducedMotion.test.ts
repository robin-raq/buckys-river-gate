import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useReducedMotion } from './useReducedMotion'

function mockMatchMedia(matches: boolean) {
  const listeners: Array<() => void> = []
  const mq = {
    matches,
    addEventListener: (_: string, fn: () => void) => { listeners.push(fn) },
    removeEventListener: (_: string, fn: () => void) => {
      const i = listeners.indexOf(fn)
      if (i >= 0) listeners.splice(i, 1)
    },
  }
  vi.stubGlobal('matchMedia', vi.fn(() => mq))
  return {
    setMatches(next: boolean) {
      mq.matches = next
      listeners.forEach(fn => fn())
    },
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useReducedMotion', () => {
  it('returns false when prefers-reduced-motion is not set', () => {
    mockMatchMedia(false)
    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(false)
  })

  it('returns true when prefers-reduced-motion matches', () => {
    mockMatchMedia(true)
    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(true)
  })

  it('updates when the media query changes', () => {
    const mq = mockMatchMedia(false)
    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(false)
    act(() => { mq.setMatches(true) })
    expect(result.current).toBe(true)
  })
})
