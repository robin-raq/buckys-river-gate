import type { FractionValue } from '../state/types'

// ── Frequency map ──────────────────────────────────────────────────────────
// Triangle waveform — warmer than sine, less harsh than square.
// Musical analogy: whole note / half note / quarter note.

export const FRACTION_TONES: Record<number, number> = {
  1: 261.63,   // C4 — whole log
  2: 392.00,   // G4 — half log
  4: 523.25,   // C5 — quarter log
}

// Duration in seconds per log size (matches musical note lengths)
const FRACTION_DURATIONS: Record<number, number> = {
  1: 1.2,
  2: 0.6,
  4: 0.3,
}

// ── Singleton context ──────────────────────────────────────────────────────
// Safari allows max 4 AudioContexts per page — never create more than one.

let audioCtx:   AudioContext | null       = null
let compressor: DynamicsCompressorNode | null = null

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Must be called inside a user-gesture handler (click / touchend).
 * Creates the AudioContext and compressor chain on first call;
 * resumes a suspended context on subsequent calls.
 */
export function unlockAudio(): void {
  if (!audioCtx) {
    audioCtx   = new AudioContext()
    compressor = audioCtx.createDynamicsCompressor()
    compressor.connect(audioCtx.destination)
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
}

/** True only after unlockAudio() and context is actively running. */
export function isAudioReady(): boolean {
  return audioCtx !== null && audioCtx.state === 'running'
}

// ── Internal tone primitive ────────────────────────────────────────────────

function playTone(
  frequency: number,
  duration:  number,
  gainPeak:  number = 0.3,
): void {
  if (!audioCtx || !compressor || audioCtx.state !== 'running') return

  const osc  = audioCtx.createOscillator()
  const gain = audioCtx.createGain()

  osc.type            = 'triangle'
  osc.frequency.value = frequency

  const now = audioCtx.currentTime
  gain.gain.value = 0
  gain.gain.setTargetAtTime(gainPeak, now, 0.01)               // fast attack
  gain.gain.setTargetAtTime(0, now + duration * 0.75, 0.04)    // gentle release

  osc.connect(gain)
  gain.connect(compressor)
  osc.start(now)
  osc.stop(now + duration + 0.1)
}

// ── Fraction tones ─────────────────────────────────────────────────────────

/** Plays the tone mapped to the log's denominator (C4 / G4 / C5). */
export function playFractionTone(fraction: FractionValue): void {
  const freq     = FRACTION_TONES[fraction.denominator]
  const duration = FRACTION_DURATIONS[fraction.denominator] ?? 0.3
  if (!freq) return
  playTone(freq, duration)
}

// ── UI feedback tones ──────────────────────────────────────────────────────

/** Soft thunk when a log snaps into the build zone. */
export function playSnapSound(): void {
  playTone(130, 0.08, 0.25)
}

/** Low bonk — played when student tries to chop a 1/4 log. */
export function playBonkSound(): void {
  playTone(80, 0.25, 0.4)
}

/** Axe-crack + two child tones (50 ms stagger). */
export function playChopSound(children: [FractionValue, FractionValue]): void {
  playBonkSound()
  setTimeout(() => playFractionTone(children[0]), 50)
  setTimeout(() => playFractionTone(children[1]), 120)
}

// ── CHECK result sounds ────────────────────────────────────────────────────

/** C4 + G4 + C5 triad — 100 ms stagger — gate filled correctly. */
export function playGateMatchSound(): void {
  playTone(261.63, 0.8, 0.35)
  setTimeout(() => playTone(392.00, 0.8, 0.35), 100)
  setTimeout(() => playTone(523.25, 0.8, 0.35), 200)
}

/** Same as gate match — fires on CHECK correct. */
export function playCheckCorrectSound(): void {
  playGateMatchSound()
}

/** Descending G4 → E4 slide — too short. */
export function playCheckTooShortSound(): void {
  if (!audioCtx || !compressor || audioCtx.state !== 'running') return
  const osc  = audioCtx.createOscillator()
  const gain = audioCtx.createGain()
  osc.type            = 'triangle'
  osc.frequency.value = 392   // G4
  osc.frequency.linearRampToValueAtTime(329.63, audioCtx.currentTime + 0.35)  // E4
  gain.gain.value = 0.2
  gain.gain.setTargetAtTime(0, audioCtx.currentTime + 0.25, 0.05)
  osc.connect(gain)
  gain.connect(compressor)
  osc.start()
  osc.stop(audioCtx.currentTime + 0.5)
}

/** Low 160 Hz wobble — too long. */
export function playCheckTooLongSound(): void {
  playTone(160, 0.35, 0.3)
}

/** Rising 4-note fanfare for WIN. */
export function playWinFanfare(): void {
  [261.63, 329.63, 392.00, 523.25].forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.5, 0.4), i * 160)
  })
}

// ── Drag / chop tension (stubs — implemented after touch drag) ─────────────

export function startDragRustle(): void { /* white-noise rustle — post-demo */ }
export function stopDragRustle():  void { /* */ }
export function startChopTension(): void { /* rising sweep — post-demo */ }
export function stopChopTension():  void { /* */ }
export function playIdleCreak():    void { playTone(100, 0.15, 0.08) }
