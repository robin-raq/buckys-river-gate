import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SnapGuides } from './SnapGuides'

describe('SnapGuides', () => {
  it('renders the snap-guides test id', () => {
    render(<SnapGuides visible={true} />)
    expect(screen.getByTestId('snap-guides')).toBeInTheDocument()
  })

  it('renders four dashed column guides by default', () => {
    render(<SnapGuides visible={true} />)
    const columns = screen.getByTestId('snap-guides').querySelectorAll('.snap-guides__column')
    expect(columns).toHaveLength(4)
  })

  it('is hidden when visible=false', () => {
    render(<SnapGuides visible={false} />)
    expect(screen.getByTestId('snap-guides')).not.toBeVisible()
  })

  it('respects slotCount when provided', () => {
    render(<SnapGuides visible={true} slotCount={2} />)
    const columns = screen.getByTestId('snap-guides').querySelectorAll('.snap-guides__column')
    expect(columns).toHaveLength(2)
  })
})
