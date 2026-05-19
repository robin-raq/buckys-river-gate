import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RiverScene } from './RiverScene'

describe('RiverScene', () => {
  it('renders the river-scene test id', () => {
    render(<RiverScene><span>child</span></RiverScene>)
    expect(screen.getByTestId('river-scene')).toBeInTheDocument()
  })

  it('renders children in the scene', () => {
    render(
      <RiverScene>
        <span data-testid="river-child">Build zone</span>
      </RiverScene>,
    )
    expect(screen.getByTestId('river-child')).toBeInTheDocument()
  })

  it('applies layered backdrop class names from river-scene.css', () => {
    render(<RiverScene />)
    const scene = screen.getByTestId('river-scene')
    expect(scene.querySelector('.river-scene__sky')).toBeInTheDocument()
    expect(scene.querySelector('.river-scene__stars')).toBeInTheDocument()
    expect(scene.querySelector('.river-scene__dock')).toBeInTheDocument()
  })
})
