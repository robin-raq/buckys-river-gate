interface ChallengeCounterProps {
  current: number   // 1-indexed for display
  total:   number   // always 3
}

export function ChallengeCounter({ current, total }: ChallengeCounterProps) {
  return (
    <div
      style={{
        display:    'flex',
        alignItems: 'center',
        gap:        '0.5rem',
        color:      'var(--ui-text, #E2E8F0)',
        fontSize:   '0.9rem',
      }}
    >
      <span>{current}</span>
      <span style={{ opacity: 0.5 }}>/</span>
      <span>{total}</span>

      <div style={{ display: 'flex', gap: '0.4rem', marginLeft: '0.5rem' }}>
        {Array.from({ length: total }, (_, i) => {
          const dotIndex    = i + 1          // 1-indexed
          const isActive    = dotIndex === current
          const isCompleted = dotIndex < current

          return (
            <span
              key={i}
              role="presentation"
              data-active={isActive ? 'true' : 'false'}
              data-completed={isCompleted ? 'true' : 'false'}
              style={{
                display:      'inline-block',
                width:        '10px',
                height:       '10px',
                borderRadius: '50%',
                background:   isCompleted
                  ? 'var(--success-glow, #34D399)'
                  : isActive
                    ? 'var(--ui-text, #E2E8F0)'
                    : '#374151',
              }}
            />
          )
        })}
      </div>
    </div>
  )
}
