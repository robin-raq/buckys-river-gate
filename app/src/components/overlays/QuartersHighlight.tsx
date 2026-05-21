import '../../styles/overlays.css'

export type QuartersHighlightKind = 'first-half' | 'all' | null

interface QuartersHighlightProps {
  kind: QuartersHighlightKind
}

/**
 * Glow rectangle rendered inside .river-row to call out a specific span
 * of placed quarter logs during the DEMO recap.
 *
 *   first-half — covers the LEFT two quarters (50% width of the row).
 *                Visually anchors "two quarters fit where one half was."
 *   all        — covers all four quarters (100% width of the row).
 *                Visually anchors "four quarters make one whole."
 *
 * Width and pulse animation live in overlays.css. The component is
 * decorative — it carries no semantic content for screen readers; the
 * speech bubble is the source of truth.
 */
export function QuartersHighlight({ kind }: QuartersHighlightProps) {
  if (kind === null) return null

  return (
    <div
      data-testid="quarters-highlight"
      data-span={kind}
      aria-hidden="true"
      className={`quarters-highlight quarters-highlight--${kind}`}
    />
  )
}
