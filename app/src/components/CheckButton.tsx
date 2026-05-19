interface CheckButtonProps {
  label:    'CHECK' | 'Submit'
  disabled: boolean
  onPress:  () => void
}

export function CheckButton({ label, disabled, onPress }: CheckButtonProps) {
  return (
    <button
      disabled={disabled}
      onClick={disabled ? undefined : onPress}
      style={{
        padding:         '0.75rem 2.5rem',
        fontSize:        '1.2rem',
        fontWeight:      700,
        background:      disabled ? '#374151' : 'var(--success-glow, #34D399)',
        color:           disabled ? '#6B7280' : '#0D1B2A',
        border:          'none',
        borderRadius:    '0.75rem',
        cursor:          disabled ? 'not-allowed' : 'pointer',
        touchAction:     'manipulation',
        transition:      'background 0.15s',
        opacity:         disabled ? 0.5 : 1,
      }}
    >
      {label}
    </button>
  )
}
