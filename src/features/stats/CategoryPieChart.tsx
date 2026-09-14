import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { useCategoryBreakdown } from './useStats'
import { formatMoney } from '../../lib/format'

export function CategoryPieChart() {
  const { data: slices } = useCategoryBreakdown()
  const total = (slices ?? []).reduce((sum, s) => sum + s.amount, 0)

  if (!slices || slices.length === 0) {
    return <p className="py-10 text-center text-sm text-text-muted">No spending this month yet.</p>
  }

  return (
    <div>
      <div className="relative mx-auto h-56 w-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={slices} dataKey="amount" nameKey="name" innerRadius={65} outerRadius={95} paddingAngle={2} strokeWidth={0}>
              {slices.map((s) => (
                <Cell key={s.categoryId} fill={s.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, _name, item) => [formatMoney(Number(value)), item.payload.name]}
              contentStyle={{ background: 'var(--color-surface-raised)', border: '1px solid var(--color-border)', borderRadius: 8 }}
              labelStyle={{ color: 'var(--color-text)' }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-text-muted">Total</span>
          <span className="text-lg font-semibold text-text">{formatMoney(total)}</span>
        </div>
      </div>

      <div className="mt-4 space-y-1.5">
        {slices.map((s) => (
          <div key={s.categoryId} className="flex items-center gap-2 text-sm">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
            <span className="flex-1 truncate text-text">{s.icon} {s.name}</span>
            <span className="text-text-muted">{formatMoney(s.amount)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
