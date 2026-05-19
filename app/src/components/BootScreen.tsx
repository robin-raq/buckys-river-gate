interface BootScreenProps {
  onStart: () => void
}

export function BootScreen({ onStart }: BootScreenProps) {
  return (
    <div
      style={{
        display:         'flex',
        flexDirection:   'column',
        alignItems:      'center',
        justifyContent:  'center',
        height:          '100dvh',
        background:      'var(--bg-deep, #0D1B2A)',
        color:           'var(--ui-text, #E2E8F0)',
        fontFamily:      'system-ui, sans-serif',
        gap:             '2rem',
      }}
    >
      <h1 style={{ fontSize: '2.5rem', margin: 0, textAlign: 'center' }}>
        🪵 Bucky's River Gate
      </h1>
      <p style={{ fontSize: '1.1rem', opacity: 0.7, margin: 0 }}>
        Help Bucky fix the dam!
      </p>
      <button
        onClick={onStart}
        style={{
          padding:       '1rem 3rem',
          fontSize:      '1.4rem',
          fontWeight:    700,
          background:    'var(--success-glow, #34D399)',
          color:         '#0D1B2A',
          border:        'none',
          borderRadius:  '1rem',
          cursor:        'pointer',
          touchAction:   'manipulation',
        }}
      >
        Start
      </button>
    </div>
  )
}
