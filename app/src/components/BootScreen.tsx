import { unlockAudio } from '../audio/toneEngine'
import { BuckyAvatar } from './BuckyAvatar'

interface BootScreenProps {
  onStart: () => void
}

export function BootScreen({ onStart }: BootScreenProps) {
  function handleStart() {
    unlockAudio()
    onStart()
  }

  return (
    <div className="boot-screen" data-testid="boot-screen">
      <div className="boot-screen__mascot" aria-hidden>
        <BuckyAvatar buckyState="excited" size={140} />
      </div>
      <h1 className="boot-screen__title">Bucky&apos;s River Gate</h1>
      <p className="boot-screen__tagline">
        Tap logs, hear music, and build gates with your new beaver friend!
      </p>
      <button type="button" className="boot-screen__start btn-kawaii" onClick={handleStart}>
        Let&apos;s Build!
      </button>
    </div>
  )
}
