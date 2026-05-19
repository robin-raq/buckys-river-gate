import '../../styles/overlays.css'

export interface EquivalenceBadgeProps {
  visible:    boolean
  equation?:  string
  onDismiss?: () => void
}

export function EquivalenceBadge({ visible, equation, onDismiss }: EquivalenceBadgeProps) {
  if (!visible) return null

  return (
    <button
      type="button"
      className="equivalence-badge equivalence-badge-slam"
      data-testid="equivalence-badge"
      aria-label="Dismiss equivalence badge"
      onClick={onDismiss}
    >
      {equation ?? ''}
    </button>
  )
}
