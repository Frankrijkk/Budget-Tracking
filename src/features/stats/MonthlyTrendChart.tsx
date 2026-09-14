import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts'
import { useMonthlyTrend } from './useStats'
import { useProfiles } from '../auth/useProfiles'
import { formatMoney } from '../../lib/format'

export function MonthlyTrendChart() {
  const { data } = useMonthlyTrend()
  const { data: profiles } = useProfiles()

  if (!data) return null

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={2}>
          <CartesianGrid vertical={false} stroke="var(--color-border)" />
          <XAxis dataKey="label" stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} width={40} />
          <Tooltip
            formatter={(value, key) => [formatMoney(Number(value)), key === 'me' ? profiles?.me?.display_name : profiles?.partner?.display_name]}
            contentStyle={{ background: 'var(--color-surface-raised)', border: '1px solid var(--color-border)', borderRadius: 8 }}
            labelStyle={{ color: 'var(--color-text)' }}
            cursor={{ fill: 'var(--color-border)', opacity: 0.3 }}
          />
          <Bar dataKey="me" stackId="a" fill="var(--color-accent-me)" radius={[0, 0, 0, 0]} />
          <Bar dataKey="her" stackId="a" fill="var(--color-accent-her)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-2 flex justify-center gap-4 text-xs text-text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: 'var(--color-accent-me)' }} /> {profiles?.me?.display_name}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: 'var(--color-accent-her)' }} /> {profiles?.partner?.display_name}
        </span>
      </div>
    </div>
  )
}
