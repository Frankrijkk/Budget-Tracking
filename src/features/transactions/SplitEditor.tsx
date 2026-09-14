import { useEffect, useState } from 'react'
import { DEFAULT_SPLIT, type SplitValue } from './split'
import { formatMoney } from '../../lib/format'

interface Props {
  value: SplitValue
  onChange: (value: SplitValue) => void
  meName: string
  herName: string
  /** Compact mode for dense contexts like a receipt line-item list. */
  compact?: boolean
  /** The transaction's total amount -- enables the "split by amount" mode. Omit or 0 to hide it. */
  amount?: number
}

const PRESETS = [0.5, 0.6, 0.4, 0.7, 0.3]

export function SplitEditor({ value, onChange, meName, herName, compact, amount = 0 }: Props) {
  const { shareType, meRatio } = value
  const [mode, setMode] = useState<'percent' | 'amount'>('percent')

  function setMeAmount(raw: string) {
    const clamped = Math.min(Math.max(Number(raw) || 0, 0), amount)
    onChange({ shareType: 'shared', meRatio: amount > 0 ? clamped / amount : 0.5 })
  }

  function setHerAmount(raw: string) {
    const clamped = Math.min(Math.max(Number(raw) || 0, 0), amount)
    const meAmount = amount - clamped
    onChange({ shareType: 'shared', meRatio: amount > 0 ? meAmount / amount : 0.5 })
  }

  const meAmount = Math.round(amount * meRatio * 100) / 100
  const herAmount = Math.round((amount - meAmount) * 100) / 100

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
        <div className="space-y-2">
          {amount > 0 && (
            <div className="flex justify-end gap-1">
              {(['percent', 'amount'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`rounded-md px-2 py-0.5 text-xs ${
                    mode === m ? 'bg-accent/15 text-accent' : 'text-text-muted'
                  }`}
                >
                  {m === 'percent' ? '%' : 'Amount'}
                </button>
              ))}
            </div>
          )}

          {mode === 'percent' || amount <= 0 ? (
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
                <span>
                  {meName} {Math.round(meRatio * 100)}%{amount > 0 ? ` (${formatMoney(meAmount)})` : ''}
                </span>
                <span>
                  {herName} {Math.round((1 - meRatio) * 100)}%{amount > 0 ? ` (${formatMoney(herAmount)})` : ''}
                </span>
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
          ) : (
            <AmountSplitInputs
              meName={meName}
              herName={herName}
              meAmount={meAmount}
              herAmount={herAmount}
              onMeAmountChange={setMeAmount}
              onHerAmountChange={setHerAmount}
            />
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Two amount fields that always sum to the total, Tricount-style: typing in
 * one live-fills the other. Kept separate from SplitEditor so each field
 * can hold its own in-progress typed text (e.g. a trailing "7.") without
 * React re-rendering it back to a rounded number mid-keystroke -- only the
 * field NOT currently focused gets reformatted from the computed value.
 */
function AmountSplitInputs({
  meName,
  herName,
  meAmount,
  herAmount,
  onMeAmountChange,
  onHerAmountChange,
}: {
  meName: string
  herName: string
  meAmount: number
  herAmount: number
  onMeAmountChange: (raw: string) => void
  onHerAmountChange: (raw: string) => void
}) {
  const [focused, setFocused] = useState<'me' | 'her' | null>(null)
  const [meText, setMeText] = useState(meAmount.toFixed(2))
  const [herText, setHerText] = useState(herAmount.toFixed(2))

  useEffect(() => {
    if (focused !== 'me') setMeText(meAmount.toFixed(2))
  }, [meAmount, focused])
  useEffect(() => {
    if (focused !== 'her') setHerText(herAmount.toFixed(2))
  }, [herAmount, focused])

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1">
        <label className="mb-1 block text-xs text-text-muted">{meName}</label>
        <input
          type="number"
          inputMode="decimal"
          step="0.01"
          min={0}
          value={meText}
          onFocus={() => setFocused('me')}
          onBlur={() => setFocused(null)}
          onChange={(e) => {
            setMeText(e.target.value)
            onMeAmountChange(e.target.value)
          }}
          className="w-full rounded-lg border border-border bg-bg px-2.5 py-1.5 text-sm text-text focus:border-accent focus:outline-none"
        />
      </div>
      <div className="flex-1">
        <label className="mb-1 block text-xs text-text-muted">{herName}</label>
        <input
          type="number"
          inputMode="decimal"
          step="0.01"
          min={0}
          value={herText}
          onFocus={() => setFocused('her')}
          onBlur={() => setFocused(null)}
          onChange={(e) => {
            setHerText(e.target.value)
            onHerAmountChange(e.target.value)
          }}
          className="w-full rounded-lg border border-border bg-bg px-2.5 py-1.5 text-sm text-text focus:border-accent focus:outline-none"
        />
      </div>
    </div>
  )
}

export { DEFAULT_SPLIT }
export type { SplitValue }
