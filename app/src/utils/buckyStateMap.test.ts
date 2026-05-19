import { describe, it, expect } from 'vitest'
import { buckyStateClass, BUCKY_EMOJI } from './buckyStateMap'
import type { BuckyState } from '../state/types'

const ALL_STATES: BuckyState[] = [
  'idle',
  'excited',
  'thinking',
  'chop-swing',
  'build-stack',
  'encouraging',
  'disappointed',
  'celebrating',
]

const EXPECTED_CLASSES: Record<BuckyState, string> = {
  idle:          'bucky--idle',
  excited:       'bucky--excited',
  thinking:      'bucky--thinking',
  'chop-swing':  'bucky--chop-swing',
  'build-stack': 'bucky--build-stack',
  encouraging:   'bucky--encouraging',
  disappointed:  'bucky--disappointed',
  celebrating:   'bucky--celebrating',
}

describe('buckyStateClass', () => {
  it.each(ALL_STATES)('maps %s to the expected CSS class', (state) => {
    expect(buckyStateClass(state)).toBe(EXPECTED_CLASSES[state])
  })
})

describe('BUCKY_EMOJI', () => {
  it.each(ALL_STATES)('provides an emoji for %s', (state) => {
    expect(BUCKY_EMOJI[state]).toBeTruthy()
    expect(typeof BUCKY_EMOJI[state]).toBe('string')
  })
})
