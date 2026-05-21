import chopPlateUrl from '../assets/scenes/chop-scene-plate.png'
import chopSceneUrl from '../assets/scenes/chop-scene.png'
import instructSceneUrl from '../assets/scenes/instruct-scene.png'
import checkSceneUrl from '../assets/scenes/check-scene.png'

export type SceneId = 'chop' | 'instruct' | 'check'

const SCENE_URL: Record<SceneId, string> = {
  chop:     chopPlateUrl,
  instruct: instructSceneUrl,
  check:    checkSceneUrl,
}

/** Full mockup with baked log/speech — fallback only */
export const CHOP_SCENE_FULL_URL = chopSceneUrl

interface SceneBackdropProps {
  scene?: SceneId
  /** Use full chop mockup (debug); default is clean plate */
  useFullChopArt?: boolean
}

export function SceneBackdrop({ scene = 'chop', useFullChopArt = false }: SceneBackdropProps) {
  const src = scene === 'chop' && useFullChopArt ? chopSceneUrl : SCENE_URL[scene]

  return (
    <img
      src={src}
      alt=""
      aria-hidden
      data-testid="scene-backdrop"
      data-scene={scene}
      draggable={false}
      style={{
        position:      'absolute',
        inset:         0,
        width:         '100%',
        height:        '100%',
        objectFit:     'cover',
        userSelect:    'none',
        pointerEvents: 'none',
      }}
    />
  )
}
