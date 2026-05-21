interface BackButtonProps {
  /** Whether history exists. When false the component renders nothing
   *  (don't show a disabled control — kids parse "absent" faster than
   *  "greyed out"). */
  canGoBack: boolean
  onPress:   () => void
}

/**
 * Top-left navigation chrome. Dispatches DIALOGUE_REWIND, which pops
 * the most recent state snapshot off the lesson history stack and
 * restores it (full state rewind — un-chops blocks, reverts phase, etc).
 *
 * Hidden when history is empty so the kid never sees a non-functional
 * affordance.
 */
export function BackButton({ canGoBack, onPress }: BackButtonProps) {
  if (!canGoBack) return null

  return (
    <button
      type="button"
      className="btn-kawaii btn-back"
      data-testid="back-button"
      aria-label="Go back to previous slide"
      onClick={onPress}
    >
      ← Back
    </button>
  )
}
