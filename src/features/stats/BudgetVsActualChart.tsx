import { useCategories } from '../categories/useCategories'
import { useCategorySpend } from '../budgets/useBudgetProgress'
import { useBudgets } from '../budgets/useBudgets'
import { ProgressBar } from '../../components/ProgressBar'
import { formatMoney } from '../../lib/format'

export function BudgetVsActualChart() {
  const { data: categories } = useCategories()
  const { data: budgets } = useBudgets()
  const { data: spend } = useCategorySpend()

  const sharedBudgets = (budgets ?? []).filter((b) => !b.profile_id)

  if (sharedBudgets.length === 0) {
    return <p className="py-10 text-center text-sm text-text-muted">Set a shared budget on a category (Budgets screen) to see this.</p>
  }

  return (
    <div className="space-y-3">
      {sharedBudgets.map((b) => {
        const category = categories?.find((c) => c.id === b.category_id)
        if (!category) return null
        const spent = spend?.[b.category_id]?.shared ?? 0
        const ratio = b.amount > 0 ? spent / b.amount : 0
        return (
          <div key={b.id}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-text">{category.icon} {category.name}</span>
              <span className={ratio > 1 ? 'text-danger' : 'text-text-muted'}>
                {formatMoney(spent)} / {formatMoney(b.amount)}
              </span>
            </div>
            <ProgressBar ratio={ratio} color={category.color} />
          </div>
        )
      })}
    </div>
  )
}
