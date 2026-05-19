import type { Challenge } from './types'

export const CHECK_CHALLENGES: Challenge[] = [
  {
    index: 0,
    referenceGate: { numerator: 1, denominator: 4 },
    dockInventory: [
      { numerator: 1, denominator: 4 },
      { numerator: 1, denominator: 4 },
      { numerator: 1, denominator: 2 },
    ],
    validSolutions: [
      [{ numerator: 1, denominator: 4 }],
    ],
    buckySentence:
      'This leak is smaller — only one-quarter of the river wide. Pick the log that matches it exactly!',
  },
  {
    index: 1,
    referenceGate: { numerator: 1, denominator: 2 },
    dockInventory: [
      { numerator: 1, denominator: 2 },
      { numerator: 1, denominator: 4 },
      { numerator: 1, denominator: 4 },
      { numerator: 1, denominator: 4 }, // decoy — three quarters exceeds a half gate
    ],
    validSolutions: [
      [{ numerator: 1, denominator: 2 }],
      [{ numerator: 1, denominator: 4 }, { numerator: 1, denominator: 4 }],
    ],
    buckySentence:
      'Back to a half-wide gap — build it any way you like!',
  },
  {
    index: 2,
    referenceGate: { numerator: 3, denominator: 4 },
    dockInventory: [
      { numerator: 1, denominator: 2 },
      { numerator: 1, denominator: 4 },
      { numerator: 1, denominator: 4 },
      { numerator: 1, denominator: 4 },
    ],
    validSolutions: [
      [{ numerator: 1, denominator: 2 }, { numerator: 1, denominator: 4 }],
      [{ numerator: 1, denominator: 4 }, { numerator: 1, denominator: 4 }, { numerator: 1, denominator: 4 }],
    ],
    buckySentence:
      'This leak is bigger! Three-quarters of the river wide. What fits?',
  },
]
