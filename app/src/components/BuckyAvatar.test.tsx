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

  it('renders the beaver emoji for the current state', () => {
    render(<BuckyAvatar buckyState="excited" />)
    expect(screen.getByTestId('bucky-avatar')).toHaveTextContent('😄')
  })
})
