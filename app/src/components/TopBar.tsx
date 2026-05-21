import type { ReactNode } from 'react'

interface TopBarProps {
  /** Content rendered to the LEFT of the title (back button, etc.). */
  leading?:  ReactNode
  trailing?: ReactNode
}

export function TopBar({ leading, trailing }: TopBarProps) {
  return (
    <header data-testid="top-bar" className="top-bar">
      {/* Left group: optional leading slot + title. Keeping these in
          one container means the title sits next to the back button
          instead of floating between leading and trailing under
          space-between. */}
      <div className="top-bar__leading">
        {leading}
        <span className="top-bar__title">Bucky&apos;s River Gate</span>
      </div>
      {trailing}
    </header>
  )
}
