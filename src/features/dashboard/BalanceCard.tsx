import { Link } from 'react-router-dom'
import { useBalance } from '../balance/useBalance'
import { useProfiles } from '../auth/useProfiles'
import { formatMoney } from '../../lib/format'

export function BalanceCard() {
  const { data: balance } = useBalance()
  const { data: profiles } = useProfiles()

  if (!balance || !profiles?.partner) return null

  const settled = Math.abs(balance.meNet) < 0.01
  const owesMe = balance.meNet > 0

  return (
    <Link
      to="/balance"
      className="block rounded-2xl border border-border bg-surface p-4 active:bg-surface-raised"
    >
      <p className="text-xs text-text-muted">Balance</p>
      {settled ? (
        <p className="mt-1 text-lg font-semibold text-text">All settled up 🎉</p>
      ) : (
        <p className="mt-1 text-lg font-semibold text-text">
          {owesMe ? `${profiles.partner.display_name} owes you` : `You owe ${profiles.partner.display_name}`}{' '}
          <span className={owesMe ? 'text-accent' : 'text-danger'}>{formatMoney(Math.abs(balance.meNet))}</span>
        </p>
      )}
    </Link>
  )
}
