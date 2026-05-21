# Scene plate layers (PNG background vs React)

Scene **plates** are static art only. Everything interactive or dialogue-driven is React on top.

## Chop scene (`chop-scene-plate.png`)

**On the plate (keep):**
- Forest, river, sky, lighting
- Bucky (illustrated in art)
- Top-left sign frame: "LET'S SPLIT THE LOG!" + static `1/1 WHOLE` / halves prompt chrome
- Top-right wood buttons (sound, home) + "BUCKY'S BUILD ZONE" sign
- Bottom dock wood, "YOUR PIECES", 4-column grid hint, parchment `1/1 → 1/2 + 1/2`

**React overlays (do not bake in):**
- Speech bubble + all Bucky dialogue text
- River logs (whole, halves, quarters)
- Chop target / axe glow
- Dock inventory pieces (draggable logs)
- Continue / Next button
- Dynamic fraction labels during demo (if we add `ChallengeBoard.tsx`)

**Source:** Derived from `bucky-chop-whole-to-halves.png` with river, speech, and CTA regions cleared.

## Instruct / Check (next)

Use `bucky-instruct-phase.png` and `bucky-check-phase.png` as inspiration. Same rule: environment + static chrome on plate; gate, logs, goal, and feedback in React.
