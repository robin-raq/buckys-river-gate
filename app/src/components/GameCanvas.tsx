import { useEffect, useRef, type ReactNode } from 'react'
import { DESIGN_WIDTH, DESIGN_HEIGHT } from '../constants/designCanvas'

interface GameCanvasProps {
  children: ReactNode
}

/**
 * Fixed 1536×1024 design canvas that scales to fit its parent (letterboxed).
 * Overlay children use absolute % positions from designCanvas.ts.
 */
export function GameCanvas({ children }: GameCanvasProps) {
  const outerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function fit() {
      const outer = outerRef.current
      const inner = innerRef.current
      if (!outer || !inner) return

      const scale = Math.min(
        outer.clientWidth / DESIGN_WIDTH,
        outer.clientHeight / DESIGN_HEIGHT,
      )
      inner.style.transform       = `scale(${scale})`
      inner.style.transformOrigin = 'top center'
      outer.style.height          = `${DESIGN_HEIGHT * scale}px`
    }
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])

  return (
    <div
      ref={outerRef}
      data-testid="game-canvas"
      style={{
        position:       'relative',
        width:          '100%',
        height:         '100%',
        display:        'flex',
        justifyContent: 'center',
        overflow:       'hidden',
      }}
    >
      <div
        ref={innerRef}
        style={{
          position:   'relative',
          width:      `${DESIGN_WIDTH}px`,
          height:     `${DESIGN_HEIGHT}px`,
          flexShrink: 0,
        }}
      >
        {children}
      </div>
    </div>
  )
}
