import { NavLink, useNavigate } from 'react-router-dom'
import { Home, List, Plus, BarChart3, Menu } from 'lucide-react'
import { useState } from 'react'
import { AddActionSheet } from './AddActionSheet'

const linkBase =
  'flex flex-1 flex-col items-center gap-1 py-2 text-xs transition-colors'
const linkClass = ({ isActive }: { isActive: boolean }) =>
  `${linkBase} ${isActive ? 'text-accent' : 'text-text-muted'}`

export function BottomNav() {
  const [addOpen, setAddOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-border bg-surface pb-[env(safe-area-inset-bottom)]">
        <NavLink to="/" end className={linkClass}>
          <Home size={20} />
          Home
        </NavLink>
        <NavLink to="/transactions" className={linkClass}>
          <List size={20} />
          Activity
        </NavLink>
        <button
          onClick={() => setAddOpen(true)}
          className="flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs text-text-muted"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-bg">
            <Plus size={20} />
          </span>
        </button>
        <NavLink to="/stats" className={linkClass}>
          <BarChart3 size={20} />
          Stats
        </NavLink>
        <NavLink to="/more" className={linkClass}>
          <Menu size={20} />
          More
        </NavLink>
      </nav>

      <AddActionSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSelect={(path) => {
          setAddOpen(false)
          navigate(path)
        }}
      />
    </>
  )
}
