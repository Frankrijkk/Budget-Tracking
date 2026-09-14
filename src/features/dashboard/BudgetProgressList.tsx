import { Link } from 'react-router-dom'
import { useCategories } from '../categories/useCategories'
import { useCategorySpend } from '../budgets/useBudgetProgress'
import { ProgressBar } from '../../components/ProgressBar'
import { formatMoney } from '../../lib/format'

export function BudgetProgressList() {
  const { data: categories } = useCategories()
  const { data: spend } = useCategorySpend()

  const budgeted = (categories ?? []).filter((c) => c.monthly_budget).slice(0, 4)
  if (budgeted.length === 0) return null

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium text-text">Budgets</p>
        <Link to="/budgets" className="text-xs text-accent">See all</Link>
      </div>
      <div className="space-y-2">
        {budgeted.map((c) => {
          const spent = spend?.[c.id] ?? 0
          const budget = c.monthly_budget ?? 0
          return (
            <div key={c.id} className="rounded-xl border border-border bg-surface p-3">
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="text-text">{c.icon} {c.name}</span>
                <span className="text-text-muted">{formatMoney(spent)} / {formatMoney(budget)}</span>
              </div>
              <ProgressBar ratio={budget > 0 ? spent / budget : 0} color={c.color} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
