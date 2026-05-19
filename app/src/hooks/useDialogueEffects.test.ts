import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useDialogueEffects } from './useDialogueEffects'
import type { DialogueNode } from '../state/types'

const baseNode: DialogueNode = {
  text:       'Test line',
  buckyState: 'idle',
}

describe('useDialogueEffects', () => {
  it('returns all false when node flags are absent', () => {
    const { result } = renderHook(() => useDialogueEffects(baseNode))
    expect(result.current).toEqual({
      highlightGap:       false,
      highlightOverflow:    false,
      showGhostOverlay:     false,
      triggerBadge:         false,
      triggerWin:           false,
    })
  })

  it('maps node flags to booleans when set', () => {
    const node: DialogueNode = {
      ...baseNode,
      highlightGap:       true,
      highlightOverflow:  true,
      showGhostOverlay:   true,
      triggerBadge:       true,
      triggerWin:         true,
    }
    const { result } = renderHook(() => useDialogueEffects(node))
    expect(result.current).toEqual({
      highlightGap:       true,
      highlightOverflow:  true,
      showGhostOverlay:   true,
      triggerBadge:       true,
      triggerWin:         true,
    })
  })

  it('treats undefined flags as false', () => {
    const node: DialogueNode = {
      ...baseNode,
      highlightGap: true,
    }
    const { result } = renderHook(() => useDialogueEffects(node))
    expect(result.current.highlightGap).toBe(true)
    expect(result.current.highlightOverflow).toBe(false)
    expect(result.current.showGhostOverlay).toBe(false)
    expect(result.current.triggerBadge).toBe(false)
    expect(result.current.triggerWin).toBe(false)
  })
})
