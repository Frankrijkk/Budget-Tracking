import { useState } from 'react'
import { CategoryPieChart } from './CategoryPieChart'
import { MonthlyTrendChart } from './MonthlyTrendChart'
import { BudgetVsActualChart } from './BudgetVsActualChart'
import { PersonSplitChart } from './PersonSplitChart'
import { BalanceHistoryChart } from './BalanceHistoryChart'

const TABS = [
  { key: 'category', label: 'Category', component: CategoryPieChart },
  { key: 'trend', label: 'Trend', component: MonthlyTrendChart },
  { key: 'budget', label: 'Budget', component: BudgetVsActualChart },
  { key: 'person', label: 'By Person', component: PersonSplitChart },
  { key: 'balance', label: 'Balance', component: BalanceHistoryChart },
] as const

export function StatsPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('category')
  const Active = TABS.find((t) => t.key === tab)?.component ?? CategoryPieChart

  return (
    <div className="space-y-4 pb-4">
      <h1 className="text-lg font-semibold text-text">Statistics</h1>

      <div className="flex gap-1 overflow-x-auto rounded-lg bg-surface p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition ${
              tab === t.key ? 'bg-accent text-bg' : 'text-text-muted'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-surface p-4">
        <Active />
      </div>
    </div>
  )
}
