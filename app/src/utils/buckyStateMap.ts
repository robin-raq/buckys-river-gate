import type { BuckyState } from '../state/types'

const STATE_CLASS: Record<BuckyState, string> = {
  idle:          'bucky--idle',
  excited:       'bucky--excited',
  thinking:      'bucky--thinking',
  'chop-swing':  'bucky--chop-swing',
  'build-stack': 'bucky--build-stack',
  encouraging:   'bucky--encouraging',
  disappointed:  'bucky--disappointed',
  celebrating:   'bucky--celebrating',
}

export const BUCKY_EMOJI: Record<BuckyState, string> = {
  idle:          '🦫',
  excited:       '😄',
  thinking:      '🤔',
  'chop-swing':  '🪓',
  'build-stack': '🪵',
  encouraging:   '👍',
  disappointed:  '😔',
  celebrating:   '🎉',
}

export function buckyStateClass(state: BuckyState): string {
  return STATE_CLASS[state]
}
