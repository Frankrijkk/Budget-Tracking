import { Link } from 'react-router-dom'
import { useTransactions } from '../transactions/useTransactions'
import { formatMoney } from '../../lib/format'
import { CategoryIcon } from '../../lib/categoryIcons'
import { format, parseISO } from 'date-fns'

export function RecentTransactionsList() {
  const { data: transactions } = useTransactions({ limit: 6 })

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium text-text">Recent</p>
        <Link to="/transactions" className="text-xs text-accent">See all</Link>
      </div>

      {transactions?.length === 0 && (
        <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-text-muted">
          No transactions yet
        </p>
      )}

      <div className="divide-y divide-border rounded-xl border border-border bg-surface">
        {transactions?.map((t) => (
          <Link key={t.id} to={`/transactions/${t.id}/edit`} className="flex items-center gap-3 p-3 active:bg-surface-raised">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
              style={{ background: `${t.category?.color ?? '#9891a3'}25`, color: t.category?.color ?? '#9891a3' }}
            >
              <CategoryIcon name={t.category?.icon ?? 'package'} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-text">
                {t.description || t.category?.name || 'Transaction'}
              </span>
              <span className="block text-xs text-text-muted">{format(parseISO(t.occurred_on), 'MMM d')}</span>
            </span>
            <span className="money shrink-0 font-semibold text-text">{formatMoney(t.amount, t.currency)}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
