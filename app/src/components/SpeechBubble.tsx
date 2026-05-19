import { useEffect, useRef } from 'react'

interface SpeechBubbleProps {
  text:        string
  onComplete?: () => void
}

// Characters per millisecond for the typewriter effect.
// At 40 chars/s a typical Bucky line (~60 chars) plays in ~1.5s.
const CHARS_PER_MS = 40 / 1000

export function SpeechBubble({ text, onComplete }: SpeechBubbleProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // Clear any pending timer from the previous text
    if (timerRef.current !== null) clearTimeout(timerRef.current)

    // Schedule onComplete after the typewriter duration
    const duration = Math.max(100, text.length / CHARS_PER_MS)
    timerRef.current = setTimeout(() => {
      onComplete?.()
    }, duration)

    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current)
    }
  }, [text, onComplete])

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        background:   'var(--bucky-bubble, #FEFCE8)',
        color:        'var(--bucky-text, #1C1917)',
        borderRadius: '1rem',
        padding:      '0.75rem 1rem',
        fontSize:     '1rem',
        lineHeight:   1.5,
        maxWidth:     '480px',
        boxShadow:    '0 2px 8px rgba(0,0,0,0.3)',
      }}
    >
      {text}
    </div>
  )
}
