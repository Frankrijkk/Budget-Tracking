import { DEFAULT_SPLIT, type SplitValue } from './split'

interface Props {
  value: SplitValue
  onChange: (value: SplitValue) => void
  meName: string
  herName: string
  /** Compact mode for dense contexts like a receipt line-item list. */
  compact?: boolean
}

const PRESETS = [0.5, 0.6, 0.4, 0.7, 0.3]

export function SplitEditor({ value, onChange, meName, herName, compact }: Props) {
  const { shareType, meRatio } = value

  return (
    <div className="space-y-2">
      <div className="flex gap-1 rounded-lg bg-surface p-1">
        {(['me', 'shared', 'her'] as const).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => onChange(type === 'shared' ? { shareType: 'shared', meRatio } : { shareType: type, meRatio })}
            className={`flex-1 rounded-md py-1.5 text-sm font-medium transition ${
              shareType === type ? 'bg-accent text-bg' : 'text-text-muted'
            }`}
          >
            {type === 'me' ? meName : type === 'her' ? herName : 'Shared'}
          </button>
        ))}
      </div>

      {shareType === 'shared' && !compact && (
        <div className="space-y-1">
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(meRatio * 100)}
            onChange={(e) => onChange({ shareType: 'shared', meRatio: Number(e.target.value) / 100 })}
            className="w-full accent-accent"
          />
          <div className="flex justify-between text-xs text-text-muted">
            <span>{meName} {Math.round(meRatio * 100)}%</span>
            <span>{herName} {Math.round((1 - meRatio) * 100)}%</span>
          </div>
          <div className="flex gap-1">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => onChange({ shareType: 'shared', meRatio: p })}
                className="rounded-md border border-border px-2 py-0.5 text-xs text-text-muted"
              >
                {Math.round(p * 100)}/{Math.round((1 - p) * 100)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export { DEFAULT_SPLIT }
export type { SplitValue }
