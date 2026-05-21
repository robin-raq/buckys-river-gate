import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GameCanvas } from './GameCanvas'

describe('GameCanvas', () => {
  it('renders design canvas with test id', () => {
    render(<GameCanvas><span>child</span></GameCanvas>)
    expect(screen.getByTestId('game-canvas')).toBeInTheDocument()
    expect(screen.getByText('child')).toBeInTheDocument()
  })
})
