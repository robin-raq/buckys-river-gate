import type { DialogueNode } from '../state/types'

export interface DialogueEffects {
  highlightGap:       boolean
  highlightOverflow:  boolean
  showGhostOverlay:   boolean
  triggerBadge:       boolean
  triggerWin:         boolean
}

export function useDialogueEffects(node: DialogueNode): DialogueEffects {
  return {
    highlightGap:       node.highlightGap ?? false,
    highlightOverflow:  node.highlightOverflow ?? false,
    showGhostOverlay:   node.showGhostOverlay ?? false,
    triggerBadge:       node.triggerBadge ?? false,
    triggerWin:         node.triggerWin ?? false,
  }
}
