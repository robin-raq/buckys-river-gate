import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TopBar } from './TopBar'

describe('TopBar', () => {
  it('renders title and data-testid', () => {
    render(<TopBar />)
    expect(screen.getByTestId('top-bar')).toBeInTheDocument()
    expect(screen.getByText(/Bucky's River Gate/)).toBeInTheDocument()
  })

  it('renders trailing slot content', () => {
    render(<TopBar trailing={<span data-testid="trailing">child</span>} />)
    expect(screen.getByTestId('trailing')).toBeInTheDocument()
  })
})
