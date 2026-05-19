import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── AudioContext mock factory ──────────────────────────────────────────────
// jsdom has no Web Audio API. We build a minimal mock per test so the
// singleton inside toneEngine resets cleanly via vi.resetModules().

function makeMockNodes() {
  const oscillator = {
    type:      'sine' as OscillatorType,
    frequency: { value: 0, linearRampToValueAtTime: vi.fn() },
    connect:   vi.fn(),
    start:     vi.fn(),
    stop:      vi.fn(),
  }
  const gain = {
    gain: { value: 1, setTargetAtTime: vi.fn() },
    connect: vi.fn(),
  }
  const compressor = { connect: vi.fn() }
  return { oscillator, gain, compressor }
}

function makeCtx(state: AudioContextState = 'running') {
  const nodes = makeMockNodes()
  return {
    state,
    currentTime:              0,
    destination:              {} as AudioDestinationNode,
    resume:                   vi.fn().mockResolvedValue(undefined),
    createOscillator:         vi.fn(function() { return nodes.oscillator }),
    createGain:               vi.fn(function() { return nodes.gain }),
    createDynamicsCompressor: vi.fn(function() { return nodes.compressor }),
    _nodes: nodes,
  }
}

// AudioContext is called with `new` — must NOT be an arrow function.
// We export a named function so vitest can track calls and `new` works.
let mockCtx = makeCtx()
function MockAudioContext(this: unknown) { return mockCtx }
vi.stubGlobal('AudioContext', vi.fn(MockAudioContext))

// ── FRACTION_TONES ─────────────────────────────────────────────────────────
// Pure data — no AudioContext needed.

describe('FRACTION_TONES', () => {
  it('maps denominator 1 → C4 (261.63 Hz)', async () => {
    const { FRACTION_TONES } = await import('./toneEngine')
    expect(FRACTION_TONES[1]).toBeCloseTo(261.63)
  })
  it('maps denominator 2 → G4 (392.00 Hz)', async () => {
    const { FRACTION_TONES } = await import('./toneEngine')
    expect(FRACTION_TONES[2]).toBeCloseTo(392.00)
  })
  it('maps denominator 4 → C5 (523.25 Hz)', async () => {
    const { FRACTION_TONES } = await import('./toneEngine')
    expect(FRACTION_TONES[4]).toBeCloseTo(523.25)
  })
})

// ── isAudioReady ───────────────────────────────────────────────────────────

describe('isAudioReady', () => {
  beforeEach(() => {
    vi.resetModules()
    mockCtx = makeCtx('running')
    vi.stubGlobal('AudioContext', vi.fn(function() { return mockCtx }))
  })

  it('returns false before unlockAudio is called', async () => {
    const { isAudioReady } = await import('./toneEngine')
    expect(isAudioReady()).toBe(false)
  })

  it('returns true after unlockAudio when context is running', async () => {
    const { isAudioReady, unlockAudio } = await import('./toneEngine')
    unlockAudio()
    expect(isAudioReady()).toBe(true)
  })

  it('returns false when AudioContext state is suspended', async () => {
    mockCtx = makeCtx('suspended')
    vi.stubGlobal('AudioContext', vi.fn(function() { return mockCtx }))
    const { isAudioReady, unlockAudio } = await import('./toneEngine')
    unlockAudio()
    expect(isAudioReady()).toBe(false)
  })
})

// ── unlockAudio ────────────────────────────────────────────────────────────

describe('unlockAudio', () => {
  beforeEach(() => {
    vi.resetModules()
    mockCtx = makeCtx('running')
    vi.stubGlobal('AudioContext', vi.fn(function() { return mockCtx }))
  })

  it('creates an AudioContext on first call', async () => {
    const { unlockAudio } = await import('./toneEngine')
    unlockAudio()
    expect(AudioContext).toHaveBeenCalledTimes(1)
  })

  it('does NOT create a second AudioContext on repeated calls', async () => {
    const { unlockAudio } = await import('./toneEngine')
    unlockAudio()
    unlockAudio()
    unlockAudio()
    expect(AudioContext).toHaveBeenCalledTimes(1)
  })

  it('calls resume() when context is suspended', async () => {
    mockCtx = makeCtx('suspended')
    vi.stubGlobal('AudioContext', vi.fn(function() { return mockCtx }))
    const { unlockAudio } = await import('./toneEngine')
    unlockAudio()
    expect(mockCtx.resume).toHaveBeenCalled()
  })
})

// ── playFractionTone ───────────────────────────────────────────────────────

describe('playFractionTone', () => {
  beforeEach(() => {
    vi.resetModules()
    mockCtx = makeCtx('running')
    vi.stubGlobal('AudioContext', vi.fn(function() { return mockCtx }))
  })

  it('does nothing when audio is not unlocked', async () => {
    const { playFractionTone } = await import('./toneEngine')
    expect(() => playFractionTone({ numerator: 1, denominator: 4 })).not.toThrow()
    expect(mockCtx.createOscillator).not.toHaveBeenCalled()
  })

  it('sets triangle oscillator at C5 for a 1/4 log', async () => {
    const { unlockAudio, playFractionTone } = await import('./toneEngine')
    unlockAudio()
    playFractionTone({ numerator: 1, denominator: 4 })
    expect(mockCtx.createOscillator).toHaveBeenCalled()
    expect(mockCtx._nodes.oscillator.type).toBe('triangle')
    expect(mockCtx._nodes.oscillator.frequency.value).toBeCloseTo(523.25)
  })

  it('sets G4 frequency for a 1/2 log', async () => {
    const { unlockAudio, playFractionTone } = await import('./toneEngine')
    unlockAudio()
    playFractionTone({ numerator: 1, denominator: 2 })
    expect(mockCtx._nodes.oscillator.frequency.value).toBeCloseTo(392.00)
  })

  it('sets C4 frequency for a 1/1 log', async () => {
    const { unlockAudio, playFractionTone } = await import('./toneEngine')
    unlockAudio()
    playFractionTone({ numerator: 1, denominator: 1 })
    expect(mockCtx._nodes.oscillator.frequency.value).toBeCloseTo(261.63)
  })

  it('routes oscillator → gain → compressor → destination', async () => {
    const { unlockAudio, playFractionTone } = await import('./toneEngine')
    unlockAudio()
    playFractionTone({ numerator: 1, denominator: 4 })
    expect(mockCtx._nodes.oscillator.connect).toHaveBeenCalledWith(mockCtx._nodes.gain)
    expect(mockCtx._nodes.gain.connect).toHaveBeenCalledWith(mockCtx._nodes.compressor)
    expect(mockCtx._nodes.compressor.connect).toHaveBeenCalled()
  })
})

// ── utility sounds ─────────────────────────────────────────────────────────

describe('utility sounds', () => {
  beforeEach(() => {
    vi.resetModules()
    mockCtx = makeCtx('running')
    vi.stubGlobal('AudioContext', vi.fn(function() { return mockCtx }))
  })

  it('playSnapSound creates an oscillator when ready', async () => {
    const { unlockAudio, playSnapSound } = await import('./toneEngine')
    unlockAudio()
    playSnapSound()
    expect(mockCtx.createOscillator).toHaveBeenCalled()
  })

  it('playBonkSound creates an oscillator when ready', async () => {
    const { unlockAudio, playBonkSound } = await import('./toneEngine')
    unlockAudio()
    playBonkSound()
    expect(mockCtx.createOscillator).toHaveBeenCalled()
  })

  it('playSnapSound is silent (no throw) when not unlocked', async () => {
    const { playSnapSound } = await import('./toneEngine')
    expect(() => playSnapSound()).not.toThrow()
    expect(mockCtx.createOscillator).not.toHaveBeenCalled()
  })
})
