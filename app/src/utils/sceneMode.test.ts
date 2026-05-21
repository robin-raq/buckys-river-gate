import { describe, it, expect } from 'vitest'
import { useMockupScene } from './sceneMode'

describe('useMockupScene', () => {
  it('returns true for DEMO and EXPLORE phases', () => {
    expect(useMockupScene('DEMO')).toBe(true)
    expect(useMockupScene('EXPLORE')).toBe(true)
    expect(useMockupScene('EXPLORE_END')).toBe(true)
  })

  it('returns false for INSTRUCT and CHECK phases', () => {
    expect(useMockupScene('INSTRUCT_BUILD')).toBe(false)
    expect(useMockupScene('CHECK_ACTIVE')).toBe(false)
  })
})
