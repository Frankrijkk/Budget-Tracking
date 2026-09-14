import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTransactions } from './useTransactions'
import { useCategories } from '../categories/useCategories'
import { formatMoney } from '../../lib/format'
import { format, parseISO } from 'date-fns'

export function TransactionListPage() {
  const [categoryId, setCategoryId] = useState<string>('')
  const { data: categories } = useCategories()
  const { data: transactions, isLoading } = useTransactions({ categoryId: categoryId || undefined, limit: 200 })

  const groups = useMemo(() => {
    const byDate = new Map<string, typeof transactions>()
    for (const t of transactions ?? []) {
      const list = byDate.get(t.occurred_on) ?? []
      list.push(t)
      byDate.set(t.occurred_on, list)
    }
    return Array.from(byDate.entries())
  }, [transactions])

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-text">Activity</h1>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setCategoryId('')}
          className={`shrink-0 rounded-full border px-3 py-1 text-sm ${
            categoryId === '' ? 'border-accent bg-accent/15 text-accent' : 'border-border text-text-muted'
          }`}
        >
          All
        </button>
        {categories?.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategoryId(c.id)}
            className={`shrink-0 rounded-full border px-3 py-1 text-sm ${
              categoryId === c.id ? 'border-accent bg-accent/15 text-accent' : 'border-border text-text-muted'
            }`}
          >
            {c.icon} {c.name}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-sm text-text-muted">Loading…</p>}
      {!isLoading && groups.length === 0 && (
        <p className="py-10 text-center text-sm text-text-muted">No transactions yet. Add one to get started.</p>
      )}

      <div className="space-y-4">
        {groups.map(([date, items]) => (
          <div key={date}>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-text-muted">
              {format(parseISO(date), 'EEE, MMM d')}
            </p>
            <div className="divide-y divide-border rounded-xl border border-border bg-surface">
              {items!.map((t) => (
                <Link
                  key={t.id}
                  to={`/transactions/${t.id}/edit`}
                  className="flex items-center gap-3 p-3 active:bg-surface-raised"
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base"
                    style={{ background: `${t.category?.color ?? '#93a1b0'}25` }}
                  >
                    {t.category?.icon ?? '📦'}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-text">
                      {t.description || t.category?.name || 'Transaction'}
                    </span>
                    <span className="block text-xs text-text-muted">
                      {t.payer.display_name} paid · {t.category?.name ?? 'Uncategorized'}
                    </span>
                  </span>
                  <span className="shrink-0 font-medium text-text">{formatMoney(t.amount, t.currency)}</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
