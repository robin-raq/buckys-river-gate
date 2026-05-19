import { describe, it, expect } from 'vitest'
import {
  validateBuildZone,
  computeShortfallBracket,
  computeOverflowBracket,
  detectWrongType,
  isSolutionValid,
  fractionsEqual,
} from './fractionMath'
import { CHECK_CHALLENGES } from '../state/checkChallenges'
import type { FractionValue } from '../state/types'

// ── Helpers ────────────────────────────────────────────────────────────────
const fv = (n: number, d: number): FractionValue => ({ numerator: n, denominator: d })
const HALF    = fv(1, 2)
const QUARTER = fv(1, 4)
const WHOLE   = fv(1, 1)
const THREE_Q = fv(3, 4)

// ── validateBuildZone ──────────────────────────────────────────────────────
describe('validateBuildZone', () => {
  describe('correct', () => {
    it('1/4 + 1/4 fills a 1/2 gate', () => {
      expect(validateBuildZone([QUARTER, QUARTER], HALF)).toBe('correct')
    })
    it('1/2 alone fills a 1/2 gate', () => {
      expect(validateBuildZone([HALF], HALF)).toBe('correct')
    })
    it('1/2 + 1/4 fills a 3/4 gate', () => {
      expect(validateBuildZone([HALF, QUARTER], THREE_Q)).toBe('correct')
    })
    it('1/4 + 1/4 + 1/4 fills a 3/4 gate', () => {
      expect(validateBuildZone([QUARTER, QUARTER, QUARTER], THREE_Q)).toBe('correct')
    })
  })

  describe('too_short', () => {
    it('single 1/4 against a 1/2 gate', () => {
      expect(validateBuildZone([QUARTER], HALF)).toBe('too_short')
    })
    it('empty build zone', () => {
      expect(validateBuildZone([], HALF)).toBe('too_short')
    })
    it('empty build zone against 3/4 gate', () => {
      expect(validateBuildZone([], THREE_Q)).toBe('too_short')
    })
    it('1/4 against a 3/4 gate', () => {
      expect(validateBuildZone([QUARTER], THREE_Q)).toBe('too_short')
    })
  })

  describe('too_long', () => {
    it('whole log against a 1/2 gate', () => {
      expect(validateBuildZone([WHOLE], HALF)).toBe('too_long')
    })
    it('three 1/4 logs against a 1/2 gate — the decoy', () => {
      expect(validateBuildZone([QUARTER, QUARTER, QUARTER], HALF)).toBe('too_long')
    })
    it('1/2 + 1/2 against a 1/2 gate', () => {
      expect(validateBuildZone([HALF, HALF], HALF)).toBe('too_long')
    })
  })
})

// ── computeShortfallBracket ────────────────────────────────────────────────
describe('computeShortfallBracket', () => {
  it('nothing placed → empty', () => {
    expect(computeShortfallBracket([], HALF)).toBe('empty')
  })
  it('nothing placed against 3/4 gate → empty', () => {
    expect(computeShortfallBracket([], THREE_Q)).toBe('empty')
  })
  it('one 1/4 placed, gate 1/2 → one_unit short', () => {
    expect(computeShortfallBracket([QUARTER], HALF)).toBe('one_unit')
  })
  it('one 1/4 placed, gate 3/4 → partial (two units short)', () => {
    expect(computeShortfallBracket([QUARTER], THREE_Q)).toBe('partial')
  })
  it('1/2 placed, gate 3/4 → one_unit short', () => {
    expect(computeShortfallBracket([HALF], THREE_Q)).toBe('one_unit')
  })
})

// ── computeOverflowBracket ─────────────────────────────────────────────────
describe('computeOverflowBracket', () => {
  it('whole log against 1/2 gate → whole_log', () => {
    expect(computeOverflowBracket([WHOLE], HALF, 0)).toBe('whole_log')
  })
  it('three 1/4 logs on challenge index 2 → decoy_c2', () => {
    expect(computeOverflowBracket([QUARTER, QUARTER, QUARTER], HALF, 2)).toBe('decoy_c2')
  })
  it('three 1/4 logs on challenge index 0 → one_unit (not decoy)', () => {
    expect(computeOverflowBracket([QUARTER, QUARTER, QUARTER], HALF, 0)).toBe('one_unit')
  })
  it('1/2 + 1/4 against 1/2 gate → one_unit overflow', () => {
    expect(computeOverflowBracket([HALF, QUARTER], HALF, 0)).toBe('one_unit')
  })
})

// ── detectWrongType ────────────────────────────────────────────────────────
describe('detectWrongType', () => {
  it('1/2 log in INSTRUCT_BUILD → true (correct width, wrong pieces)', () => {
    expect(detectWrongType([HALF], 'INSTRUCT_BUILD')).toBe(true)
  })
  it('two 1/4 logs in INSTRUCT_BUILD → false (correct type)', () => {
    expect(detectWrongType([QUARTER, QUARTER], 'INSTRUCT_BUILD')).toBe(false)
  })
  it('1/2 log in CHECK_ACTIVE → false (wrong-type only applies in INSTRUCT)', () => {
    expect(detectWrongType([HALF], 'CHECK_ACTIVE')).toBe(false)
  })
  it('single 1/4 in INSTRUCT_BUILD → false (wrong width, not wrong type)', () => {
    expect(detectWrongType([QUARTER], 'INSTRUCT_BUILD')).toBe(false)
  })
})

// ── fractionsEqual ─────────────────────────────────────────────────────────
describe('fractionsEqual', () => {
  it('1/2 equals 1/2', () => {
    expect(fractionsEqual(HALF, HALF)).toBe(true)
  })
  it('1/2 equals 2/4 via cross-multiplication', () => {
    expect(fractionsEqual(fv(1, 2), fv(2, 4))).toBe(true)
  })
  it('1/4 does not equal 1/2', () => {
    expect(fractionsEqual(QUARTER, HALF)).toBe(false)
  })
  it('1/1 does not equal 1/2', () => {
    expect(fractionsEqual(WHOLE, HALF)).toBe(false)
  })
})

// ── isSolutionValid ────────────────────────────────────────────────────────
describe('isSolutionValid', () => {
  const C0 = CHECK_CHALLENGES[0]  // gate 1/2 — valid: [1/2] or [1/4,1/4]
  const C1 = CHECK_CHALLENGES[1]  // gate 3/4 — valid: [1/2,1/4] or [1/4,1/4,1/4]
  const C2 = CHECK_CHALLENGES[2]  // gate 1/2 — valid: [1/4,1/4] ONLY

  describe('Challenge 0', () => {
    it('[1/2] is valid', () => {
      expect(isSolutionValid([HALF], C0)).toBe(true)
    })
    it('[1/4, 1/4] is valid', () => {
      expect(isSolutionValid([QUARTER, QUARTER], C0)).toBe(true)
    })
    it('[1/4] alone is not valid', () => {
      expect(isSolutionValid([QUARTER], C0)).toBe(false)
    })
    it('[1/4, 1/4, 1/4] overflows — not valid', () => {
      expect(isSolutionValid([QUARTER, QUARTER, QUARTER], C0)).toBe(false)
    })
  })

  describe('Challenge 1', () => {
    it('[1/2, 1/4] is valid', () => {
      expect(isSolutionValid([HALF, QUARTER], C1)).toBe(true)
    })
    it('[1/4, 1/4, 1/4] is valid', () => {
      expect(isSolutionValid([QUARTER, QUARTER, QUARTER], C1)).toBe(true)
    })
    it('[1/2, 1/2] overflows — not valid', () => {
      expect(isSolutionValid([HALF, HALF], C1)).toBe(false)
    })
    it('[1/4, 1/4] is too short — not valid', () => {
      expect(isSolutionValid([QUARTER, QUARTER], C1)).toBe(false)
    })
  })

  describe('Challenge 2 — decoy quarter', () => {
    it('[1/4, 1/4] is valid', () => {
      expect(isSolutionValid([QUARTER, QUARTER], C2)).toBe(true)
    })
    it('[1/4, 1/4, 1/4] triggers the decoy — not valid', () => {
      expect(isSolutionValid([QUARTER, QUARTER, QUARTER], C2)).toBe(false)
    })
    it('[1/2] is not in C2 valid solutions', () => {
      expect(isSolutionValid([HALF], C2)).toBe(false)
    })
  })
})
