export type LessonPhase = 'EXPLORE' | 'INSTRUCT' | 'CHECK'

interface PhaseDotsProps {
  activePhase: LessonPhase
}

const PHASES: { id: LessonPhase; label: string; testId: string }[] = [
  { id: 'EXPLORE',  label: 'Explore',  testId: 'phase-dot-explore' },
  { id: 'INSTRUCT', label: 'Instruct', testId: 'phase-dot-instruct' },
  { id: 'CHECK',    label: 'Check',    testId: 'phase-dot-check' },
]

export function PhaseDots({ activePhase }: PhaseDotsProps) {
  return (
    <div className="phase-dots" aria-label="Lesson phase progress">
      {PHASES.map(({ id, label, testId }) => {
        const isActive = id === activePhase
        return (
          <span
            key={id}
            data-testid={testId}
            data-active={isActive ? 'true' : 'false'}
            className={
              isActive ? 'phase-dots__item phase-dots__item--active' : 'phase-dots__item'
            }
          >
            {isActive ? '●' : '○'} {label}
          </span>
        )
      })}
    </div>
  )
}
