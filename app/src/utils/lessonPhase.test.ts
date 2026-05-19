import { describe, it, expect } from 'vitest'
import { phaseToLessonPhase } from './lessonPhase'

describe('phaseToLessonPhase', () => {
  it('maps BOOT, DEMO, EXPLORE to EXPLORE', () => {
    expect(phaseToLessonPhase('BOOT')).toBe('EXPLORE')
    expect(phaseToLessonPhase('DEMO')).toBe('EXPLORE')
    expect(phaseToLessonPhase('EXPLORE')).toBe('EXPLORE')
    expect(phaseToLessonPhase('EXPLORE_END')).toBe('EXPLORE')
  })

  it('maps INSTRUCT phases to INSTRUCT', () => {
    expect(phaseToLessonPhase('INSTRUCT_BUILD')).toBe('INSTRUCT')
    expect(phaseToLessonPhase('INSTRUCT_ERROR')).toBe('INSTRUCT')
  })

  it('maps CHECK and WIN to CHECK', () => {
    expect(phaseToLessonPhase('CHECK_ACTIVE')).toBe('CHECK')
    expect(phaseToLessonPhase('WIN')).toBe('CHECK')
  })
})
