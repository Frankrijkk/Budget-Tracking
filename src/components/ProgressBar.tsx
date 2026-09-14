export function ProgressBar({ ratio, color = 'var(--color-accent)' }: { ratio: number; color?: string }) {
  const pct = Math.min(Math.max(ratio, 0), 1) * 100
  const over = ratio > 1

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-border">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${pct}%`, background: over ? 'var(--color-danger)' : color }}
      />
    </div>
  )
}
