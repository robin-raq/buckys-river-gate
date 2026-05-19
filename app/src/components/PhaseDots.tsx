export type LessonPhase = 'EXPLORE' | 'INSTRUCT' | 'CHECK'

interface PhaseDotsProps {
  activePhase: LessonPhase
}

const PHASES: { id: LessonPhase; label: string; testId: string }[] = [
  { id: 'EXPLORE',  label: 'EXPLORE',  testId: 'phase-dot-explore' },
  { id: 'INSTRUCT', label: 'INSTRUCT', testId: 'phase-dot-instruct' },
  { id: 'CHECK',    label: 'CHECK',    testId: 'phase-dot-check' },
]

export function PhaseDots({ activePhase }: PhaseDotsProps) {
  return (
    <div
      className="phase-dots"
      style={{
        display:    'flex',
        gap:        '0.75rem',
        alignItems: 'center',
        fontSize:   '0.75rem',
        color:      'var(--ui-text, #E2E8F0)',
      }}
      aria-label="Lesson phase progress"
    >
      {PHASES.map(({ id, label, testId }) => {
        const isActive = id === activePhase
        return (
          <span
            key={id}
            data-testid={testId}
            data-active={isActive ? 'true' : 'false'}
            style={{ opacity: isActive ? 1 : 0.35 }}
          >
            {isActive ? '●' : '○'} {label}
          </span>
        )
      })}
    </div>
  )
}
