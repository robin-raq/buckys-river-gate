import type { ReactNode } from 'react'
import '../styles/river-scene.css'

interface RiverSceneProps {
  children?: ReactNode
}

export function RiverScene({ children }: RiverSceneProps) {
  return (
    <div data-testid="river-scene" className="river-scene">
      <div className="river-scene__sky" aria-hidden="true" />
      <div className="river-scene__stars" aria-hidden="true" />
      <div className="river-scene__trees" aria-hidden="true" />
      <div className="river-scene__water" aria-hidden="true" />
      <div className="river-scene__dock" aria-hidden="true" />
      <div className="river-scene__lanterns" aria-hidden="true" />
      <div className="river-scene__content">{children}</div>
    </div>
  )
}
