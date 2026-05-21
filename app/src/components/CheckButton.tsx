interface CheckButtonProps {
  label:    'CHECK' | 'Submit'
  disabled: boolean
  onPress:  () => void
}

export function CheckButton({ label, disabled, onPress }: CheckButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={disabled ? undefined : onPress}
      className="btn-kawaii btn-check"
      data-testid="check-button"
    >
      {label}
    </button>
  )
}
