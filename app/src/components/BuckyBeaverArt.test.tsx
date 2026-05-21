import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BuckyBeaverArt } from './BuckyBeaverArt'
import { BEAVER_MASCOT_BY_STATE } from '../utils/beaverMascotMap'

describe('BuckyBeaverArt', () => {
  it('renders the mascot as an <img> with state class and SVG src', () => {
    // <img> is cheaper than <object> because no nested browsing context
    // is created. Safe while /beaver-mascot.svg is static — if internal
    // SVG animations are ever reintroduced, see the tripwire in
    // BuckyBeaverArt.tsx.
    render(<BuckyBeaverArt state="chop-swing" />)
    const art = screen.getByTestId('bucky-beaver-art')
    expect(art.tagName.toLowerCase()).toBe('img')
    expect(art).toHaveClass('bucky-art--chop-swing')
    expect(art).toHaveAttribute('src', '/beaver-mascot.svg')
    expect(art).toHaveAttribute('data-bucky-mascot', 'chop-swing')
  })

  it('uses the single illustrated mascot for every BuckyState', () => {
    const states = Object.keys(BEAVER_MASCOT_BY_STATE) as (keyof typeof BEAVER_MASCOT_BY_STATE)[]
    expect(states).toHaveLength(8)
    for (const state of states) {
      const { unmount } = render(<BuckyBeaverArt state={state} />)
      // All states resolve to the same illustrated mascot — animations
      // and "expression" come from the CSS state class, not from a
      // different artwork file.
      expect(screen.getByTestId('bucky-beaver-art')).toHaveAttribute(
        'src',
        '/beaver-mascot.svg',
      )
      expect(BEAVER_MASCOT_BY_STATE[state]).toBe('/beaver-mascot.svg')
      unmount()
    }
  })
})
