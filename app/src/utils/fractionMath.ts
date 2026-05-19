import type { FractionValue, Phase, Challenge } from '../state/types'

export type ValidationResult = 'correct' | 'too_short' | 'too_long'
export type ShortfallBracket = 'empty' | 'one_unit' | 'partial'
export type OverflowBracket  = 'whole_log' | 'one_unit' | 'decoy_c2'

// All denominators in this lesson divide evenly into 4 (1, 2, 4).
// Scaling to fourths means every fraction becomes an integer — no floats ever.
// 1/1 → 4,  1/2 → 2,  1/4 → 1,  3/4 → 3
const DENOM = 4

function toFourths(f: FractionValue): number {
  return f.numerator * (DENOM / f.denominator)
}

function sumFourths(fractions: FractionValue[]): number {
  return fractions.reduce((acc, f) => acc + toFourths(f), 0)
}

// ── Core validation ────────────────────────────────────────────────────────

export function validateBuildZone(
  placed: FractionValue[],
  gate:   FractionValue,
): ValidationResult {
  const placedSum = sumFourths(placed)
  const gateSum   = toFourths(gate)
  if (placedSum === gateSum) return 'correct'
  if (placedSum  <  gateSum) return 'too_short'
  return 'too_long'
}

// ── Shortfall bracket ──────────────────────────────────────────────────────
// Maps how-far-short to a dialogue selector so Bucky gives a unit-specific hint.

export function computeShortfallBracket(
  placed: FractionValue[],
  gate:   FractionValue,
): ShortfallBracket {
  const shortfall = toFourths(gate) - sumFourths(placed)  // always > 0 at call site
  if (shortfall === toFourths(gate)) return 'empty'        // nothing placed at all
  if (shortfall === 1)               return 'one_unit'     // exactly 1 quarter short
  return 'partial'
}

// ── Overflow bracket ───────────────────────────────────────────────────────
// Maps how-far-over to a dialogue selector. Challenge 1 (1/2 gate): three
// quarter logs placed gets a specific hint ("three is too many for a half gap").

export function computeOverflowBracket(
  placed:         FractionValue[],
  gate:           FractionValue,
  challengeIndex: number,
): OverflowBracket {
  const hasWholeLog = placed.some(f => toFourths(f) === DENOM)
  if (hasWholeLog) return 'whole_log'

  const overflow = sumFourths(placed) - toFourths(gate)  // always > 0 at call site
  const quarterCount = placed.filter(f => f.denominator === 4).length
  if (
    challengeIndex === 1
    && quarterCount === 3
    && overflow === 1
    && toFourths(gate) === 2
  ) {
    return 'decoy_c2'
  }
  return 'one_unit'
}

// ── Wrong-type detection ───────────────────────────────────────────────────
// INSTRUCT phase only: fires when the student places a 1/2 log instead of
// two 1/4 logs. Width is correct but the lesson requires decomposition.

export function detectWrongType(placed: FractionValue[], phase: Phase): boolean {
  if (phase !== 'INSTRUCT_BUILD') return false
  const correctWidth = validateBuildZone(placed, { numerator: 1, denominator: 2 }) === 'correct'
  const hasHalfLog   = placed.some(f => f.numerator === 1 && f.denominator === 2)
  return correctWidth && hasHalfLog
}

// ── Solution matching ─────────────────────────────────────────────────────
// Checks placed logs against ALL valid solution arrays for the challenge.
// Order of logs doesn't matter — we compare sorted fourths arrays.

export function isSolutionValid(placed: FractionValue[], challenge: Challenge): boolean {
  const placedSorted = placed.map(toFourths).sort((a, b) => a - b)
  return challenge.validSolutions.some(sol => {
    const solSorted = sol.map(toFourths).sort((a, b) => a - b)
    if (solSorted.length !== placedSorted.length) return false
    return solSorted.every((v, i) => v === placedSorted[i])
  })
}

// ── Exact rational equality ───────────────────────────────────────────────
// a/b === c/d  ↔  a×d === b×c  — never float, never approximate.

export function fractionsEqual(a: FractionValue, b: FractionValue): boolean {
  return a.numerator * b.denominator === b.numerator * a.denominator
}
