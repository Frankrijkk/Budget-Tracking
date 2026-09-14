import { ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useCategories } from '../categories/useCategories'
import { useCategorySpend } from './useBudgetProgress'
import { ProgressBar } from '../../components/ProgressBar'
import { formatMoney } from '../../lib/format'

export function BudgetsPage() {
  const navigate = useNavigate()
  const { data: categories } = useCategories()
  const { data: spend } = useCategorySpend()

  const budgeted = categories?.filter((c) => c.monthly_budget) ?? []

  return (
    <div className="space-y-4">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-text-muted">
        <ChevronLeft size={20} /> Back
      </button>

      <h1 className="text-lg font-semibold text-text">Budgets — This Month</h1>

      {budgeted.length === 0 && (
        <p className="py-10 text-center text-sm text-text-muted">
          No category has a monthly budget yet. Set one from Categories.
        </p>
      )}

      <div className="space-y-3">
        {budgeted.map((c) => {
          const spent = spend?.[c.id] ?? 0
          const budget = c.monthly_budget ?? 0
          const ratio = budget > 0 ? spent / budget : 0
          return (
            <div key={c.id} className="rounded-xl border border-border bg-surface p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-medium text-text">
                  <span>{c.icon}</span> {c.name}
                </span>
                <span className="text-xs text-text-muted">
                  {formatMoney(spent)} / {formatMoney(budget)}
                </span>
              </div>
              <ProgressBar ratio={ratio} color={c.color} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
