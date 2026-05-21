import type { DialogueNode } from '../state/types'

export interface DialogueEffects {
  highlightGap:           boolean
  highlightOverflow:      boolean
  showGhostOverlay:       boolean
  triggerBadge:           boolean
  triggerWin:             boolean
  // DEMO recap fields. `equation` is the pink-badge text; the two highlight
  // flags drive the QuartersHighlight overlay span inside the river-row.
  equation:               string | undefined
  highlightFirstQuarters: boolean
  highlightAllQuarters:   boolean
  // Telegraphs the chop point in the river-row before Bucky swings.
  showChopLine:           boolean
  // Run the equation badge on a continuous pulse (not just slam-in once).
  flashEquation:          boolean
  // Faded reference log floating above, below, or inline-right
  // of the river-row. null hides it.
  referenceLog: {
    fraction: { numerator: number, denominator: number }
    position: 'above' | 'below' | 'inline-right'
  } | null
  // Equation badge sits above (true) or below (false, default) the row.
  equationAbove:    boolean
  // Hide build-zone blocks outside the highlighted region (render-time).
  trimToHighlight:  boolean
}

export function useDialogueEffects(node: DialogueNode): DialogueEffects {
  return {
    highlightGap:           node.highlightGap ?? false,
    highlightOverflow:      node.highlightOverflow ?? false,
    showGhostOverlay:       node.showGhostOverlay ?? false,
    triggerBadge:           node.triggerBadge ?? false,
    triggerWin:             node.triggerWin ?? false,
    equation:               node.equation,
    highlightFirstQuarters: node.highlightFirstQuarters ?? false,
    highlightAllQuarters:   node.highlightAllQuarters ?? false,
    showChopLine:           node.showChopLine ?? false,
    flashEquation:          node.flashEquation ?? false,
    referenceLog:           node.referenceLog ?? null,
    equationAbove:          node.equationAbove ?? false,
    trimToHighlight:        node.trimToHighlight ?? false,
  }
}
