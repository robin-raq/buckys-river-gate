# CHOP Animation Storyboard — Handoff for Implementers

**Game:** Bucky's River Gate  
**Interaction:** Long-press log (500ms) → tap confirm → split  
**Target:** iPad Safari, 60fps CSS transforms + optional sprite sheet

---

## Sequence A — 1/2 → 2× 1/4 (primary EXPLORE teachable moment)

| Frame | Name | Duration | Visual | Audio | Bucky |
|-------|------|----------|--------|-------|-------|
| 1 | **IDLE** | — | Half log in build zone or dock; normal wood state | — | `idle` |
| 2 | **HOLD** | 500ms | Amber outline pulse; hold progress bar 0→100%; finger ghost optional | Rising tone 300→600 Hz sine sweep | `thinking` |
| 3 | **READY** | until tap | Dashed saw-cut line at log center; axe icon bobs above; `splittable-hint` class | Sustain quiet hum | `chopping` (axe raised) |
| 4 | **SWING** | 120ms | Bucky sprite `chopping` — axe mid-swing; log scaleX squeeze 1.0→0.95 | Sharp crack 600Hz, 80ms | `chopping` |
| 5 | **SPLIT** | 200ms | Log divides; two children translate apart 8px then snap flush; 4–8 wood chips burst | Crack + two quarter tones staggered 50ms | `excited` |
| 6 | **DONE** | 300ms | Two 1/4 logs aligned; brief green glow on seam; scale bounce 1.08→1.0 | Both quarter tones + soft thunk | `excited` → dialogue |

**Total active animation:** ~1120ms (excluding hold wait)

---

## Sequence B — 1/1 → 2× 1/2

Same frame names; differences:

| Frame | Change from Sequence A |
|-------|------------------------|
| IDLE | Full-width amber log (`1 whole`, 100% river) |
| HOLD / READY | Saw line at 50% width (center of whole) |
| SPLIT | Two **half** logs (gold `#F59E0B`), not quarters |
| DONE | Bucky line: *"One whole became two halves — still the same river width!"* |
| Audio | Whole tone (C4) → two half tones (G4) staggered |

---

## Sequence C — Blocked chop (1/4)

| Frame | Duration | Visual | Audio |
|-------|----------|--------|-------|
| HOLD attempt | 300ms | Log `wiggle` ±3° × 3; red lock icon | 120Hz bonk, 200ms |
| DONE | — | No split; bubble: smallest piece | — |

---

## CSS / state hooks (prototype)

```css
.log.chopping       /* amber pulse + progress bar */
.log .saw-line      /* dashed center cut */
.log-splitting      /* children split-apart keyframes */
.log.wiggle         /* blocked chop */
.chip-burst .chip   /* particle fly-out */
```

```typescript
type ChopPhase = 'idle' | 'holding' | 'ready' | 'swinging' | 'splitting' | 'done'

// On hold complete (500ms):
blockState.splittable = true
blockState.chopPhase = 'ready'

// On confirm tap:
runChopAnimation(blockId) // frames 4–6
replaceBlock(blockId, childBlocks) // rational split: 1/2 → 2×1/4, 1/1 → 2×1/2
```

---

## Asset checklist

- [ ] Bucky sprite: `chopping` (axe raised), `excited` (post-split)
- [ ] Wood chip particles (6×6px brown squares, 4–8 per chop)
- [ ] Saw-cut dashed line overlay (SVG or CSS border)
- [ ] Hold progress bar (6px, amber gradient)
- [ ] Optional: `bucky-chop-storyboard.png` contact sheet in repo

---

## Reference images (repo)

| File | Shows |
|------|--------|
| `bucky-chop-longpress.png` | 1/2 hold + saw line |
| `bucky-chop-complete.png` | 1/2 → 2× 1/4 done |
| `bucky-chop-whole-to-halves.png` | 1/1 hold |
| `bucky-chop-whole-complete.png` | 1/1 → 2× 1/2 done |
| `bucky-chop-storyboard.png` | 6-panel contact sheet |

**Interactive:** `index.html` → tabs **Chop 1/1**, **1/1 → halves**, **Storyboard** (▶ Play steps through frames).
