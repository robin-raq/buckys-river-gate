import '../../styles/overlays.css'

interface Fraction {
  numerator:   number
  denominator: number
}

interface ReferenceLogProps {
  /** null hides the reference. When set, the log occupies a slice of
   *  the river-row sized to (num/denom) of the row width. */
  fraction: Fraction | null
  /** Whether the reference floats above the row, below the row, or
   *  takes the row's empty right half inline. Defaults to 'above'. */
  position?: 'above' | 'below' | 'inline-right'
}

const SIZE_CLASS: Record<number, string> = {
  1: 'log--whole',
  2: 'log--half',
  4: 'log--quarter',
}

/**
 * Faded reference log floating above .river-row. Used to visually prove
 * equivalence — a 1/2 silhouette sitting directly above two highlighted
 * 1/4 logs makes "same size" undeniable.
 *
 * Reuses the existing `.log` + `.log--<size>` classes for wood styling.
 * The `.reference-log__inner` modifier adds the fade. The component is
 * decorative — aria-hidden, no click handler — so the kid can't
 * accidentally interact with it.
 */
export function ReferenceLog({ fraction, position = 'above' }: ReferenceLogProps) {
  if (fraction === null) return null
  const { numerator, denominator } = fraction
  const widthPct = (numerator / denominator) * 100
  const sizeClass = SIZE_CLASS[denominator] ?? SIZE_CLASS[4]
  const label = `${numerator}/${denominator}`

  return (
    <div
      data-testid="reference-log"
      data-numerator={numerator}
      data-denominator={denominator}
      data-position={position}
      aria-hidden="true"
      className={`reference-log-anchor reference-log-anchor--${position}`}
      // Width = fraction's share of the row. No padding/border on the
      // wrapper anymore, so the inner log fills exactly its share.
      style={{ width: `${widthPct}%` }}
    >
      {/* data-locked="true" makes the reference inherit the same
          opacity + grayscale filter the real DEMO logs have (they're
          locked because the kid can't interact with them during DEMO).
          Without this, the reference would look brighter/more saturated
          than the real 1/4s sitting beside it — defeating the "same
          color" goal. */}
      <div
        className={`log ${sizeClass} reference-log__inner`}
        data-locked="true"
      >
        <span className="log__label">{label}</span>
      </div>
    </div>
  )
}
