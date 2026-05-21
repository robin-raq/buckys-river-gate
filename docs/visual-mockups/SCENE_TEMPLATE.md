# Scene Template Plate — Layering Guide

**File:** `scene-template-plate.png` (also deployed as `app/public/scene-bg.png`)  
**Size:** 1536 × 1024 px (4:3 landscape — iPad-friendly)  
**Purpose:** Empty environment only. All gameplay UI is React/CSS on top.

---

## What’s ON the plate (baked in)

| Layer | Content |
|-------|---------|
| Sky | Pink → lavender → purple twilight, soft stars |
| Banks | Stones, bushes, flowers (left/right) |
| River | Teal water channel (lane guides are React/CSS, not baked into PNG) |
| Dock | Empty wooden plank band at bottom |

## What’s ON the plate (environment art)

- **Bucky** — cute chibi beaver sitting by the **pink blossom tree** (lower left bank)
- Four equal river columns (align via CSS/React snap guides)

## What’s NOT on the plate (build in React)

- Speech bubble, logs, reference gate  
- GOAL / FRACTION FACT / CHOPS panels (use `GoalSidebar` + future HUD components)  
- Continue / undo / volume / home buttons  
- Any text in the dock area  

---

## Overlay regions (% of 1536×1024)

Calibrated for `app/src/constants/designCanvas.ts`:

```
┌────────────────────────────────────────────────────────────┐ 0%
│  [speech anchor — top center, 18–82% x, 6–22% y]          │
│                                                            │
│  [goal HUD — optional, right edge mid]                     │
│                                                            │
│         ┌──────────────────────────────┐                  │ 40%
│         │  RIVER BUILD ZONE (84% w)    │  ← logs snap here │
│         │  4 columns · 960px logical   │                  │
│         └──────────────────────────────┘                  │ 58%
│                                                            │
│  [bucky — bottom left, outside river]                      │
│                                                            │
│  ┌──────────────────────────────────────┐               │ 77.5%
│  │  DOCK TRAY — logs only, no text       │               │
│  └──────────────────────────────────────┘               │ 96%
└────────────────────────────────────────────────────────────┘
```

| Region | left | top | width | height | React hook |
|--------|------|-----|-------|--------|------------|
| Speech | 18% | 6% | 64% | 16% | `.lesson-speech-anchor` |
| River | 8% | 40% | 84% | 18% | `.lesson-stage` / `.river-row` |
| Dock | 7% | 77.5% | 86% | 19% | `.dock-tray` |
| Continue | — | — | — | — | `right: 4%`, `bottom: 32%` |

**Logical river width:** 960px (`RIVER_WIDTH_PX`) — scales with viewport via `transform: scale()` in `LessonScreen`.

---

## CSS tokens (match the plate)

Use these from `app/src/styles/tokens.css` so logs and bubbles don’t clash:

| Token | Hex | Use |
|-------|-----|-----|
| `--river-water` | `#7ec8e3` | Snap guides, hints |
| `--log-half` | `#f5c6a5` | Half logs |
| `--log-quarter` | `#ffe4cc` | Quarter logs |
| `--bucky-bubble` | `#fff5f8` | Speech bubble fill |
| `--bucky-bubble-border` | `#ffb3d9` | Bubble outline |
| `--bg-deep` | `#2d1b4e` | Top bar fallback |

---

## Z-index stack

| z-index | Layer |
|---------|--------|
| 0 | `scene-bg.png` on `.lesson-screen` |
| 10 | `.lesson-stage` (gate, river row, slot labels) |
| 15 | `.goal-sidebar` |
| 25 | `.lesson-bucky-anchor` |
| 30 | Speech, continue, ready buttons |
| 50 | Win overlay |
| 200 | Drag ghost |

---

## Replacing the plate

1. Export new art at **1536×1024** with the same river/dock alignment.  
2. Replace `app/public/scene-bg.png`.  
3. Tweak `--scene-river-padding-top` in `kawaii-theme.css` if the water band moved.  
4. Run the app in landscape and verify logs sit on the water, dock logs on the wood.

---

## Debug mode

Set `data-scene-debug="true"` on `.lesson-screen` (dev only) to show region outlines — see `kawaii-theme.css`.
