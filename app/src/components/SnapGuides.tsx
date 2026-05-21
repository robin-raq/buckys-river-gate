/**
 * SnapGuides — dashed lane dividers rendered ON TOP of the scene plate.
 *
 * The background image (bucky-background.png) is intentionally lane-free,
 * so this overlay owns the lane geometry. Lanes align to the same
 * coordinate system as placed logs (via --zone-lane-inset / --zone-river-top
 * / --log-h in kawaii-theme.css), so a log dropped into lane N covers
 * exactly the same pixels the lane divider used to span.
 *
 * Visible during INSTRUCT_BUILD / CHECK_ACTIVE / DEMO chop moments.
 * Hidden in WIN, intro dialogues, etc.
 */
interface SnapGuidesProps {
  visible:    boolean
  slotCount?: number   // default 4 (whole / halves×2 / quarters×4)
}

export function SnapGuides({ visible, slotCount = 4 }: SnapGuidesProps) {
  return (
    <div
      data-testid="snap-guides"
      className="snap-guides"
      aria-hidden={!visible}
      style={{ visibility: visible ? 'visible' : 'hidden' }}
    >
      {Array.from({ length: slotCount - 1 }, (_, i) => (
        <div
          key={i}
          className="snap-guides__divider"
          style={{ left: `${((i + 1) / slotCount) * 100}%` }}
        />
      ))}
    </div>
  )
}
