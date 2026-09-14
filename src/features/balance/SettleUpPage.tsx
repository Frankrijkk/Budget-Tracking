import { useEffect, useState } from 'react'
import { ChevronLeft, PartyPopper } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useBalance } from './useBalance'
import { useProfiles } from '../auth/useProfiles'
import { useAccounts } from '../accounts/useAccounts'
import { useSaveTransaction } from '../transactions/useTransactions'
import { BalanceHistoryChart } from '../stats/BalanceHistoryChart'
import { formatMoney } from '../../lib/format'

export function SettleUpPage() {
  const navigate = useNavigate()
  const { data: balance } = useBalance()
  const { data: profiles } = useProfiles()
  const { data: accounts } = useAccounts()
  const saveTransaction = useSaveTransaction()

  const [amount, setAmount] = useState('')
  const [accountId, setAccountId] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (balance) setAmount(Math.abs(balance.meNet).toFixed(2))
  }, [balance])

  useEffect(() => {
    if (accounts?.length && !accountId) setAccountId(accounts[0].id)
  }, [accounts, accountId])

  if (!balance || !profiles?.me || !profiles.partner) return null

  const settled = Math.abs(balance.meNet) < 0.01
  const owesMe = balance.meNet > 0
  // Whoever is in debt pays; the settlement's payer/shares mirror that.
  const payerId = owesMe ? profiles.partner.id : profiles.me.id
  const creditorId = owesMe ? profiles.me.id : profiles.partner.id

  async function handleSettle() {
    const amountNum = Number(amount)
    if (!amountNum || amountNum <= 0 || !accountId || !profiles?.me || !profiles.partner) return

    await saveTransaction.mutateAsync({
      household_id: profiles.me.household_id,
      account_id: accountId,
      payer_id: payerId,
      description: 'Settle up',
      amount: amountNum,
      occurred_on: new Date().toISOString().slice(0, 10),
      created_by: profiles.me.id,
      is_settlement: true,
      shares: [{ profile_id: creditorId, share_type: creditorId === profiles.me.id ? 'me' : 'her', ratio: 1 }],
    })
    setDone(true)
  }

  return (
    <div className="space-y-5">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-text-muted">
        <ChevronLeft size={20} /> Back
      </button>

      <h1 className="text-lg font-semibold text-text">Balance</h1>

      <div className="rounded-2xl border border-border bg-surface p-5 text-center">
        {settled || done ? (
          <p className="flex items-center justify-center gap-2 text-xl font-semibold text-text">
            <PartyPopper size={20} className="text-accent" /> All settled up
          </p>
        ) : (
          <>
            <p className="text-sm text-text-muted">
              {owesMe ? `${profiles.partner.display_name} owes ${profiles.me.display_name}` : `${profiles.me.display_name} owes ${profiles.partner.display_name}`}
            </p>
            <p className={`money mt-1 text-3xl font-semibold ${owesMe ? 'text-accent' : 'text-danger'}`}>
              {formatMoney(Math.abs(balance.meNet))}
            </p>
          </>
        )}
      </div>

      {!settled && !done && (
        <div className="space-y-3 rounded-2xl border border-border bg-surface p-4">
          <p className="text-sm font-medium text-text">Record a settlement</p>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="money w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-text focus:border-accent focus:outline-none"
          />
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-text focus:border-accent focus:outline-none"
          >
            {accounts?.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
          <button
            onClick={handleSettle}
            disabled={saveTransaction.isPending}
            className="w-full rounded-xl bg-accent px-4 py-3 font-medium text-bg disabled:opacity-50"
          >
            {saveTransaction.isPending ? 'Saving…' : 'Mark as settled'}
          </button>
        </div>
      )}

      <div>
        <p className="mb-2 text-sm font-medium text-text">History</p>
        <BalanceHistoryChart />
      </div>
    </div>
  )
}
