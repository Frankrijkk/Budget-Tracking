import { useCategories } from '../categories/useCategories'
import { useCategorySpend } from '../budgets/useBudgetProgress'
import { ProgressBar } from '../../components/ProgressBar'
import { formatMoney } from '../../lib/format'

export function BudgetVsActualChart() {
  const { data: categories } = useCategories()
  const { data: spend } = useCategorySpend()

  const budgeted = (categories ?? []).filter((c) => c.monthly_budget)

  if (budgeted.length === 0) {
    return <p className="py-10 text-center text-sm text-text-muted">Set a monthly budget on a category to see this.</p>
  }

  return (
    <div className="space-y-3">
      {budgeted.map((c) => {
        const spent = spend?.[c.id] ?? 0
        const budget = c.monthly_budget ?? 0
        const ratio = budget > 0 ? spent / budget : 0
        return (
          <div key={c.id}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-text">{c.icon} {c.name}</span>
              <span className={ratio > 1 ? 'text-danger' : 'text-text-muted'}>
                {formatMoney(spent)} / {formatMoney(budget)}
              </span>
            </div>
            <ProgressBar ratio={ratio} color={c.color} />
          </div>
        )
      })}
    </div>
  )
}
