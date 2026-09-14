import { Zap, Receipt, PlusCircle } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  onSelect: (path: string) => void
}

const options = [
  { path: '/quick-add', label: 'Quick Add', hint: 'Fastest way to log a spend', icon: Zap },
  { path: '/transactions/new', label: 'Full Transaction', hint: 'Amount, category, split, notes', icon: PlusCircle },
  { path: '/receipts/capture', label: 'Scan Receipt', hint: 'Photo → itemized split', icon: Receipt },
]

export function AddActionSheet({ open, onClose, onSelect }: Props) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end" role="dialog" aria-modal="true">
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/50"
      />
      <div className="relative z-10 w-full rounded-t-2xl border-t border-border bg-surface-raised p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />
        <div className="space-y-2">
          {options.map(({ path, label, hint, icon: Icon }) => (
            <button
              key={path}
              onClick={() => onSelect(path)}
              className="flex w-full items-center gap-3 rounded-xl border border-border bg-surface p-3 text-left transition active:scale-[0.98]"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                <Icon size={20} />
              </span>
              <span>
                <span className="block font-medium text-text">{label}</span>
                <span className="block text-xs text-text-muted">{hint}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
