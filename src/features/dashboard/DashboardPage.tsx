import { useSession } from '../auth/useSession'
import { useProfiles } from '../auth/useProfiles'
import { useRealtimeSync } from '../../hooks/useRealtimeSync'
import { useMonthSummary } from './useMonthSummary'
import { BalanceCard } from './BalanceCard'
import { BudgetProgressList } from './BudgetProgressList'
import { RecentTransactionsList } from './RecentTransactionsList'
import { formatMoney } from '../../lib/format'

export function DashboardPage() {
  const { session } = useSession()
  const { data: profiles } = useProfiles()
  const { data: summary } = useMonthSummary()
  useRealtimeSync(!!session)

  return (
    <div className="space-y-5 pb-4">
      <div>
        <p className="text-sm text-text-muted">Hey {profiles?.me?.display_name ?? ''} 👋</p>
        <h1 className="text-2xl font-semibold text-text">This Month</h1>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border bg-surface p-4">
          <p className="text-xs text-text-muted">Household</p>
          <p className="mt-1 text-xl font-semibold text-text">{formatMoney(summary?.household ?? 0)}</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-4">
          <p className="text-xs text-text-muted">Your share</p>
          <p className="mt-1 text-xl font-semibold text-text">{formatMoney(summary?.mine ?? 0)}</p>
        </div>
      </div>

      <BalanceCard />
      <BudgetProgressList />
      <RecentTransactionsList />
    </div>
  )
}
