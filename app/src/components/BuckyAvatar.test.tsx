import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BuckyAvatar } from './BuckyAvatar'
import { buckyStateClass } from '../utils/buckyStateMap'
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

describe('BuckyAvatar', () => {
  it.each(ALL_STATES)('sets data-bucky-state and state class for %s', (state) => {
    render(<BuckyAvatar buckyState={state} />)
    const avatar = screen.getByTestId('bucky-avatar')
    expect(avatar).toHaveAttribute('data-bucky-state', state)
    expect(avatar.className).toContain('bucky-avatar')
    expect(avatar.className).toContain(buckyStateClass(state))
  })

  it('chop-swing includes bucky--chop-swing class', () => {
    render(<BuckyAvatar buckyState="chop-swing" />)
    const avatar = screen.getByTestId('bucky-avatar')
    expect(avatar.className).toContain('bucky--chop-swing')
  })

  it('merges optional className', () => {
    render(<BuckyAvatar buckyState="idle" className="extra-class" />)
    const avatar = screen.getByTestId('bucky-avatar')
    expect(avatar.className).toContain('extra-class')
  })

  it('renders the illustrated beaver mascot instead of an emoji', () => {
    // BuckyBeaverArt uses a single mascot SVG for all dialogue states.
    // Per-state expressions are conveyed by the CSS class on the wrapper.
    render(<BuckyAvatar buckyState="chop-swing" />)
    expect(screen.getByTestId('bucky-beaver-art')).toHaveAttribute('src', '/beaver-mascot.svg')
  })

  it('respects custom size prop with portrait aspect', () => {
    render(<BuckyAvatar buckyState="idle" size={96} />)
    expect(screen.getByTestId('bucky-avatar')).toHaveStyle({ width: '96px', height: '108px' })
  })
})
