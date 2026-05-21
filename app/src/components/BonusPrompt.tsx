interface BonusPromptProps {
  /** Whether the prompt is currently shown. Only true on the
   *  CHECK_BONUS_PROMPT_C1 dialogue node WHILE phase is CHECK_SUCCESS —
   *  i.e., right after the first solve, before the kid chooses. */
  visible:   boolean
  onAccept:  () => void   // dispatches BONUS_ACCEPTED
  onDecline: () => void   // dispatches BONUS_DECLINED
}

/**
 * Two-button affordance rendered alongside Bucky's bonus prompt. The
 * kid picks whether to retry the same gate with different pieces
 * (Try it!) or move on to the next challenge (Skip →).
 *
 * Visual treatment: [Try it!] is the warm encouragement (gold pill),
 * [Skip →] is the soft alternative (white pill). Both clearly
 * tappable — kids parse "two buttons = choose one" instantly.
 */
export function BonusPrompt({ visible, onAccept, onDecline }: BonusPromptProps) {
  if (!visible) return null

  return (
    <div
      className="bonus-prompt"
      data-testid="bonus-prompt"
    >
      <button
        type="button"
        className="btn-kawaii btn-bonus-accept"
        onClick={onAccept}
      >
        ✨ Try it!
      </button>
      <button
        type="button"
        className="btn-kawaii btn-bonus-decline"
        onClick={onDecline}
      >
        Skip →
      </button>
    </div>
  )
}
