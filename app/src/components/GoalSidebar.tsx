import type { FractionValue } from '../state/types'

interface GoalSidebarProps {
  visible:    boolean
  gateLabel:  string
  gate:       FractionValue
}

const GOAL_PREVIEW_MAX_PX = 96

export function GoalSidebar({ visible, gateLabel, gate }: GoalSidebarProps) {
  const barWidth = Math.round((gate.numerator / gate.denominator) * GOAL_PREVIEW_MAX_PX)

  return (
    <aside
      data-testid="goal-sidebar"
      aria-hidden={!visible}
      style={{ visibility: visible ? 'visible' : 'hidden' }}
      className="goal-sidebar"
    >
      <h2 className="goal-sidebar__heading">Goal</h2>
      <div
        className="goal-sidebar__preview"
        data-testid="goal-sidebar-preview"
        style={{ width: `${barWidth}px`, maxWidth: `${GOAL_PREVIEW_MAX_PX}px` }}
        aria-hidden="true"
      />
      <p className="goal-sidebar__label">{gateLabel}</p>
    </aside>
  )
}
