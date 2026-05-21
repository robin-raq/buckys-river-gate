import type { BuckyState } from '../state/types'
import { beaverMascotSrc } from '../utils/beaverMascotMap'

interface BuckyBeaverArtProps {
  state: BuckyState
}

/**
 * Beaver mascot from /public/beaver-mascot.svg. The file is a static
 * SVG — all per-state motion comes from the wrapper's `.bucky--<state>`
 * CSS keyframes (see bucky.css), not from inside the SVG.
 *
 * TRIPWIRE: if you ever reintroduce internal SVG animations (e.g. a
 * <style> block with @keyframes inside the SVG), you must switch this
 * back to <object>. Chrome's SVG-as-image renderer silently strips
 * embedded <style> blocks containing @media queries when loaded via
 * <img>, so the animations would just not run.
 *
 * We prefer <img> while the SVG is static because <object> instantiates
 * a nested browsing context — its own DOM, style resolution, and paint
 * pipeline — which costs CPU on every compositor tick.
 */
export function BuckyBeaverArt({ state }: BuckyBeaverArtProps) {
  return (
    <img
      src={beaverMascotSrc(state)}
      alt=""
      className={`bucky-art bucky-art--${state}`}
      data-testid="bucky-beaver-art"
      data-bucky-mascot={state}
      aria-hidden
      draggable={false}
    />
  )
}
