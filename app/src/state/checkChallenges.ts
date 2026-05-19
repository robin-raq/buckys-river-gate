import type { Challenge } from './types'

export const CHECK_CHALLENGES: Challenge[] = [
  {
    index: 0,
    referenceGate: { numerator: 1, denominator: 2 },
    dockInventory: [
      { numerator: 1, denominator: 2 },
      { numerator: 1, denominator: 4 },
      { numerator: 1, denominator: 4 },
    ],
    validSolutions: [
      [{ numerator: 1, denominator: 2 }],
      [{ numerator: 1, denominator: 4 }, { numerator: 1, denominator: 4 }],
    ],
    buckySentence: "You helped me earlier — can you build a 1/2 gap again? Any way you like!",
  },
  {
    index: 1,
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
    buckySentence: "Ooh, this gap is bigger! Three-quarters of the river wide. What fits?",
  },
  {
    index: 2,
    referenceGate: { numerator: 1, denominator: 2 },
    dockInventory: [
      { numerator: 1, denominator: 4 },
      { numerator: 1, denominator: 4 },
      { numerator: 1, denominator: 4 }, // decoy — only 2 fit
    ],
    validSolutions: [
      [{ numerator: 1, denominator: 4 }, { numerator: 1, denominator: 4 }],
    ],
    buckySentence: "No big logs this time — only quarters. Can you still fill a 1/2 gap?",
  },
]
