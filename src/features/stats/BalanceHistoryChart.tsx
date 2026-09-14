import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, ReferenceLine } from 'recharts'
import { useBalanceHistory } from '../balance/useBalanceHistory'
import { formatMoney } from '../../lib/format'

export function BalanceHistoryChart() {
  const { data } = useBalanceHistory()

  if (!data || data.length === 0) {
    return <p className="py-10 text-center text-sm text-text-muted">No balance history yet.</p>
  }

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid vertical={false} stroke="var(--color-border)" />
          <XAxis dataKey="label" stroke="var(--color-text-muted)" fontSize={11} tickLine={false} axisLine={false} minTickGap={30} />
          <YAxis stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} width={40} />
          <ReferenceLine y={0} stroke="var(--color-border)" />
          <Tooltip
            formatter={(value) => [formatMoney(Number(value)), 'Net balance']}
            contentStyle={{ background: 'var(--color-surface-raised)', border: '1px solid var(--color-border)', borderRadius: 8 }}
            labelStyle={{ color: 'var(--color-text)' }}
          />
          <Line type="monotone" dataKey="net" stroke="var(--color-accent)" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
