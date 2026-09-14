import { Link } from 'react-router-dom'
import { useCategories } from '../categories/useCategories'
import { useCategorySpend } from '../budgets/useBudgetProgress'
import { useBudgets } from '../budgets/useBudgets'
import { ProgressBar } from '../../components/ProgressBar'
import { formatMoney } from '../../lib/format'
import { CategoryIcon } from '../../lib/categoryIcons'

export function BudgetProgressList() {
  const { data: categories } = useCategories()
  const { data: budgets } = useBudgets()
  const { data: spend } = useCategorySpend()

  const sharedBudgets = (budgets ?? []).filter((b) => !b.profile_id).slice(0, 4)
  if (sharedBudgets.length === 0) return null

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium text-text">Budgets</p>
        <Link to="/budgets" className="text-xs text-accent">See all</Link>
      </div>
      <div className="space-y-2">
        {sharedBudgets.map((b) => {
          const category = categories?.find((c) => c.id === b.category_id)
          if (!category) return null
          const spent = spend?.[b.category_id]?.shared ?? 0
          return (
            <div key={b.id} className="rounded-xl border border-border bg-surface p-3">
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-text">
                  <CategoryIcon name={category.icon} size={14} /> {category.name}
                </span>
                <span className="money text-text-muted">{formatMoney(spent)} / {formatMoney(b.amount)}</span>
              </div>
              <ProgressBar ratio={b.amount > 0 ? spent / b.amount : 0} color={category.color} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
