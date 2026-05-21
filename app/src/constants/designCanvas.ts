/** Design resolution for mockup-based scenes (matches chop-scene.png). */
export const DESIGN_WIDTH  = 1536
export const DESIGN_HEIGHT = 1024

/** River width inside the design canvas (4 snap columns). */
export const DESIGN_RIVER_WIDTH_PX = 1280

/** Percent-based layout regions — calibrated to chop-scene.png */
export const SCENE_LAYOUT = {
  speech: { left: 0.18, top: 0.06, width: 0.64, height: 0.16 },
  river:  { left: 0.08, top: 0.40, width: 0.84, height: 0.18 },
  dock:   { left: 0.07, top: 0.775, width: 0.86, height: 0.19 },
  continue: { right: 0.04, bottom: 0.32 },
} as const

export type LayoutStyle = Record<string, string | number>

export function layoutToStyle(
  region: { left?: number; top?: number; width?: number; height?: number; right?: number; bottom?: number },
): LayoutStyle {
  const s: LayoutStyle = { position: 'absolute' }
  if (region.left != null)   s.left   = `${region.left * 100}%`
  if (region.top != null)    s.top    = `${region.top * 100}%`
  if (region.width != null)  s.width  = `${region.width * 100}%`
  if (region.height != null) s.height = `${region.height * 100}%`
  if (region.right != null)  s.right  = `${region.right * 100}%`
  if (region.bottom != null) s.bottom = `${region.bottom * 100}%`
  return s
}
