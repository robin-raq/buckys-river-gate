import '../../styles/overlays.css'

export interface EquivalenceBadgeProps {
  visible:    boolean
  equation?:  string
  onDismiss?: () => void
  /** When true, adds the `equivalence-badge--flash` class which layers a
   *  continuous pulse on top of the one-shot slam-in. Used on beats
   *  where the equation IS the lesson (e.g. DEMO_SHOW_HALVES). */
  flash?:     boolean
  /** When true, repositions the badge above the river-row. Used on
   *  recap beats where a reference log lives below the row. */
  above?:     boolean
}

export function EquivalenceBadge({ visible, equation, onDismiss, flash, above }: EquivalenceBadgeProps) {
  if (!visible) return null

  const className = [
    'equivalence-badge',
    'equivalence-badge-slam',
    flash ? 'equivalence-badge--flash' : null,
    above ? 'equivalence-badge--above' : null,
  ].filter(Boolean).join(' ')

  return (
    <button
      type="button"
      className={className}
      data-testid="equivalence-badge"
      aria-label="Dismiss equivalence badge"
      onClick={onDismiss}
    >
      {equation ?? ''}
    </button>
  )
}
