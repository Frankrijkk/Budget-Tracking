import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ChevronLeft, Trash2 } from 'lucide-react'
import { useCategories } from '../categories/useCategories'
import { useAccounts } from '../accounts/useAccounts'
import { useProfiles } from '../auth/useProfiles'
import { useTransaction, useSaveTransaction, useDeleteTransaction } from './useTransactions'
import { SplitEditor } from './SplitEditor'
import { DEFAULT_SPLIT, resolveSplit, splitFromShares, type SplitValue } from './split'

export function TransactionFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: categories } = useCategories()
  const { data: accounts } = useAccounts()
  const { data: profiles } = useProfiles()
  const { data: existing } = useTransaction(id)
  const saveTransaction = useSaveTransaction()
  const deleteTransaction = useDeleteTransaction()

  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [note, setNote] = useState('')
  const [occurredOn, setOccurredOn] = useState(() => new Date().toISOString().slice(0, 10))
  const [categoryId, setCategoryId] = useState('')
  const [accountId, setAccountId] = useState('')
  const [payerId, setPayerId] = useState('')
  const [split, setSplit] = useState<SplitValue>(DEFAULT_SPLIT)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (accounts?.length && !accountId) setAccountId(accounts[0].id)
  }, [accounts, accountId])

  useEffect(() => {
    if (profiles?.me?.id && !payerId) setPayerId(profiles.me.id)
  }, [profiles, payerId])

  useEffect(() => {
    if (!existing || !profiles?.me) return
    setAmount(String(existing.amount))
    setDescription(existing.description)
    setNote(existing.note ?? '')
    setOccurredOn(existing.occurred_on)
    setCategoryId(existing.category_id ?? '')
    setAccountId(existing.account_id)
    setPayerId(existing.payer_id)
    setSplit(splitFromShares(existing.shares, profiles.me.id))
  }, [existing, profiles?.me])

  async function handleSave() {
    setError(null)
    const amountNum = Number(amount)
    if (!amountNum || amountNum <= 0) return setError('Enter an amount')
    if (!accountId) return setError('Choose an account')
    if (!payerId) return setError('Choose who paid')
    if (!profiles?.me || !profiles.partner) return setError('Household not fully set up yet')

    const shares = resolveSplit(split, profiles.me.id, profiles.partner.id)

    try {
      await saveTransaction.mutateAsync({
        id: existing?.id,
        household_id: profiles.me.household_id,
        account_id: accountId,
        category_id: categoryId || null,
        payer_id: payerId,
        description,
        amount: amountNum,
        occurred_on: occurredOn,
        note: note || null,
        created_by: profiles.me.id,
        shares,
      })
      navigate(-1)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    }
  }

  async function handleDelete() {
    if (!existing) return
    await deleteTransaction.mutateAsync(existing.id)
    navigate(-1)
  }

  if (!profiles?.me || !profiles.partner) {
    return <p className="p-4 text-sm text-text-muted">Loading…</p>
  }

  return (
    <div className="space-y-5 pb-8">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-text-muted">
          <ChevronLeft size={20} /> Back
        </button>
        {existing && (
          <button onClick={handleDelete} className="text-danger">
            <Trash2 size={18} />
          </button>
        )}
      </div>

      <h1 className="text-lg font-semibold text-text">{existing ? 'Edit Transaction' : 'New Transaction'}</h1>

      {accounts && accounts.length === 0 && (
        <Link
          to="/accounts"
          className="block rounded-xl border border-accent/40 bg-accent/10 p-3 text-sm text-accent"
        >
          You don't have any accounts yet — tap to add one (e.g. a shared card or cash) before saving a transaction.
        </Link>
      )}

      <div>
        <label className="mb-1 block text-xs text-text-muted">Amount</label>
        <input
          type="number"
          inputMode="decimal"
          step="0.01"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-2xl font-semibold text-text focus:border-accent focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs text-text-muted">Description</label>
        <input
          type="text"
          placeholder="What was it?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-text focus:border-accent focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs text-text-muted">Date</label>
          <input
            type="date"
            value={occurredOn}
            onChange={(e) => setOccurredOn(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-text focus:border-accent focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-text-muted">Account</label>
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            disabled={!accounts?.length}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-text focus:border-accent focus:outline-none disabled:opacity-50"
          >
            {!accounts?.length && <option value="">No accounts yet</option>}
            {accounts?.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs text-text-muted">Category</label>
        <div className="flex flex-wrap gap-2">
          {categories?.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategoryId(c.id)}
              className={`rounded-full border px-3 py-1.5 text-sm ${
                categoryId === c.id ? 'border-accent bg-accent/15 text-accent' : 'border-border text-text-muted'
              }`}
            >
              {c.icon} {c.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs text-text-muted">Who paid</label>
        <div className="flex gap-2">
          {profiles.all.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPayerId(p.id)}
              className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium ${
                payerId === p.id ? 'border-accent bg-accent/15 text-accent' : 'border-border text-text-muted'
              }`}
            >
              {p.display_name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs text-text-muted">Split</label>
        <SplitEditor
          value={split}
          onChange={setSplit}
          meName={profiles.me.display_name}
          herName={profiles.partner.display_name}
        />
      </div>

      <div>
        <label className="mb-1 block text-xs text-text-muted">Note (optional)</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-text focus:border-accent focus:outline-none"
        />
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <button
        onClick={handleSave}
        disabled={saveTransaction.isPending}
        className="w-full rounded-xl bg-accent px-4 py-3 font-medium text-bg transition active:scale-[0.98] disabled:opacity-50"
      >
        {saveTransaction.isPending ? 'Saving…' : 'Save'}
      </button>
    </div>
  )
}
