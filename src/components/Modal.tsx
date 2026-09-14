import type { ReactNode } from 'react'
import { X } from 'lucide-react'

interface Props {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

export function Modal({ open, title, onClose, children }: Props) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/50" />
      <div className="relative z-10 w-full max-w-md rounded-t-2xl border-t border-border bg-surface-raised p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] sm:rounded-2xl sm:border">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-text">{title}</h2>
          <button onClick={onClose} className="text-text-muted">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
