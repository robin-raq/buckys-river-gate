import { RIVER_WIDTH_PX, SLOT_WIDTH_PX } from '../constants'

interface SnapGuidesProps {
  visible:    boolean
  slotCount?: number
}

export function SnapGuides({ visible, slotCount = 4 }: SnapGuidesProps) {
  const columns = Array.from({ length: slotCount }, (_, i) => i)

  return (
    <div
      data-testid="snap-guides"
      className="snap-guides"
      aria-hidden={!visible}
      style={{
        visibility:  visible ? 'visible' : 'hidden',
        position:    'absolute',
        inset:       0,
        display:     'flex',
        width:       `${RIVER_WIDTH_PX}px`,
        pointerEvents: 'none',
      }}
    >
      {columns.map((slot) => (
        <div
          key={slot}
          className="snap-guides__column"
          style={{
            width:       `${SLOT_WIDTH_PX}px`,
            height:      '100%',
            borderRight: slot < slotCount - 1
              ? '1px dashed var(--grid-line, #1F4E72)'
              : undefined,
            boxSizing:   'border-box',
          }}
        />
      ))}
    </div>
  )
}
