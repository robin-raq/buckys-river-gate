import type { ReactNode } from 'react'

interface TopBarProps {
  trailing?: ReactNode
}

export function TopBar({ trailing }: TopBarProps) {
  return (
    <header
      data-testid="top-bar"
      className="top-bar"
      style={{
        height:         '52px',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        padding:        '0 1rem',
        flexShrink:     0,
        borderBottom:   '1px solid var(--grid-line)',
        gap:            '0.5rem',
      }}
    >
      <span style={{ fontWeight: 700, fontSize: '0.95rem', whiteSpace: 'nowrap' }}>
        🪵 Bucky's River Gate
      </span>
      {trailing}
    </header>
  )
}
