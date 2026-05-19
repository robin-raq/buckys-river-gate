import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GhostOverlay } from './GhostOverlay'

describe('GhostOverlay', () => {
  const half = { numerator: 1, denominator: 2 }

  it('renders testid and correct width for 1/2 gate at 960px river', () => {
    render(
      <GhostOverlay visible={true} gate={half} riverWidthPx={960} />,
    )
    const el = screen.getByTestId('ghost-overlay')
    expect(el).toBeInTheDocument()
    expect(el).toHaveStyle({ width: '480px' })
    expect(el).toHaveTextContent('1/2')
  })

  it('does not render when visible is false', () => {
    render(
      <GhostOverlay visible={false} gate={half} riverWidthPx={960} />,
    )
    expect(screen.queryByTestId('ghost-overlay')).toBeNull()
  })
})
