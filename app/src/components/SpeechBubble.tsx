import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from '../hooks/useReducedMotion'

interface SpeechBubbleProps {
  text:        string
  onComplete?: () => void
}

export const CHARS_PER_MS = 40 / 1000

const MS_PER_CHAR = 1 / CHARS_PER_MS

function initialVisibleCount(text: string, reducedMotion: boolean): number {
  if (reducedMotion) return text.length
  return text.length > 0 ? 1 : 0
}

export function SpeechBubble({ text, onComplete }: SpeechBubbleProps) {
  const reducedMotion = useReducedMotion()
  const [visibleCount, setVisibleCount] = useState(() =>
    initialVisibleCount(text, reducedMotion),
  )
  const completedRef = useRef(false)
  const onCompleteRef = useRef(onComplete)

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    completedRef.current = false
    setVisibleCount(initialVisibleCount(text, reducedMotion))

    if (reducedMotion || text.length <= 1) return

    let count = 1
    let timerId: ReturnType<typeof setTimeout>

    const tick = () => {
      count += 1
      setVisibleCount(count)
      if (count < text.length) {
        timerId = setTimeout(tick, MS_PER_CHAR)
      }
    }

    timerId = setTimeout(tick, MS_PER_CHAR)

    return () => clearTimeout(timerId)
  }, [text, reducedMotion])

  useEffect(() => {
    if (visibleCount < text.length || completedRef.current) return
    completedRef.current = true
    onCompleteRef.current?.()
  }, [visibleCount, text.length, text])

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="speech-bubble"
      className="speech-bubble"
    >
      {text.slice(0, visibleCount)}
    </div>
  )
}
