import { Link } from 'react-router-dom'
import { Tag, Wallet, Repeat, PiggyBank, Scale, Settings } from 'lucide-react'

const ITEMS = [
  { to: '/categories', label: 'Categories', icon: Tag },
  { to: '/accounts', label: 'Accounts', icon: Wallet },
  { to: '/recurring', label: 'Recurring', icon: Repeat },
  { to: '/goals', label: 'Savings Goals', icon: PiggyBank },
  { to: '/balance', label: 'Balance / Settle Up', icon: Scale },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function MorePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-text">More</h1>
      <div className="divide-y divide-border rounded-xl border border-border bg-surface">
        {ITEMS.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} className="flex items-center gap-3 p-3.5 active:bg-surface-raised">
            <Icon size={18} className="text-text-muted" />
            <span className="text-sm font-medium text-text">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
