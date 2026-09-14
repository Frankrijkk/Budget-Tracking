import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Plus, Trash2 } from 'lucide-react'
import { useReceipt, useSaveReceiptItems, type ParsedReceipt } from './useReceipts'
import { useCategories } from '../categories/useCategories'
import { useAccounts } from '../accounts/useAccounts'
import { useProfiles } from '../auth/useProfiles'
import { SplitEditor } from '../transactions/SplitEditor'
import { DEFAULT_SPLIT, resolveSplit, type SplitValue } from '../transactions/split'
import { formatMoney } from '../../lib/format'

interface ItemDraft {
  key: string
  description: string
  amount: string
  categoryId: string
  split: SplitValue
}

export function ReceiptReviewPage() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { data: receipt } = useReceipt(id)
  const { data: categories } = useCategories()
  const { data: accounts } = useAccounts()
  const { data: profiles } = useProfiles()
  const saveItems = useSaveReceiptItems()

  const parsedFromState = (location.state as { parsed?: ParsedReceipt } | null)?.parsed
  const parsed = parsedFromState ?? (receipt?.raw_ai_response as ParsedReceipt | undefined)

  const [storeName, setStoreName] = useState('')
  const [date, setDate] = useState('')
  const [payerId, setPayerId] = useState('')
  const [accountId, setAccountId] = useState('')
  const [items, setItems] = useState<ItemDraft[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!receipt) return
    setStoreName(receipt.store_name ?? '')
    setDate(receipt.receipt_date ?? new Date().toISOString().slice(0, 10))
    setPayerId(receipt.payer_id)
  }, [receipt])

  useEffect(() => {
    if (accounts?.length && !accountId) setAccountId(accounts[0].id)
  }, [accounts, accountId])

  useEffect(() => {
    if (parsed && items.length === 0) {
      setItems(
        parsed.items.map((i) => ({
          key: crypto.randomUUID(),
          description: i.name,
          amount: i.price.toString(),
          categoryId: '',
          split: DEFAULT_SPLIT,
        })),
      )
    }
  }, [parsed, items.length])

  const sumOfItems = items.reduce((sum, i) => sum + (Number(i.amount) || 0), 0)
  const aiTotal = parsed?.total ?? 0
  const mismatch = Math.abs(sumOfItems - aiTotal) > 0.01

  function updateItem(key: string, patch: Partial<ItemDraft>) {
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, ...patch } : i)))
  }

  function removeItem(key: string) {
    setItems((prev) => prev.filter((i) => i.key !== key))
  }

  function addItem() {
    setItems((prev) => [...prev, { key: crypto.randomUUID(), description: '', amount: '', categoryId: '', split: DEFAULT_SPLIT }])
  }

  function applySplitToAll(split: SplitValue) {
    setItems((prev) => prev.map((i) => ({ ...i, split })))
  }

  async function handleSave() {
    setError(null)
    if (!id || !profiles?.me || !profiles.partner || !accountId || !payerId) return setError('Missing required fields')
    if (items.some((i) => !Number(i.amount) || Number(i.amount) <= 0)) return setError('Every item needs a price')

    try {
      await saveItems.mutateAsync({
        id,
        store_name: storeName,
        receipt_date: date,
        payer_id: payerId,
        account_id: accountId,
        total_amount: sumOfItems,
        items: items.map((i) => ({
          description: i.description || 'Item',
          amount: Number(i.amount),
          category_id: i.categoryId || null,
          shares: resolveSplit(i.split, profiles.me!.id, profiles.partner!.id),
        })),
      })
      navigate('/transactions')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    }
  }

  if (!parsed || !profiles?.me || !profiles.partner) {
    return <p className="p-4 text-sm text-text-muted">Loading…</p>
  }

  return (
    <div className="space-y-5 pb-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-text-muted">
        <ChevronLeft size={20} /> Back
      </button>

      <h1 className="text-lg font-semibold text-text">Review Receipt</h1>

      <div className="grid grid-cols-2 gap-3">
        <input
          type="text"
          placeholder="Store"
          value={storeName}
          onChange={(e) => setStoreName(e.target.value)}
          className="rounded-xl border border-border bg-surface px-3 py-2.5 text-text focus:border-accent focus:outline-none"
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-xl border border-border bg-surface px-3 py-2.5 text-text focus:border-accent focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs text-text-muted">Who paid</label>
          <div className="flex gap-2">
            {profiles.all.map((p) => (
              <button
                key={p.id}
                onClick={() => setPayerId(p.id)}
                className={`flex-1 rounded-xl border px-2 py-2 text-xs font-medium ${
                  payerId === p.id ? 'border-accent bg-accent/15 text-accent' : 'border-border text-text-muted'
                }`}
              >
                {p.display_name}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs text-text-muted">Account</label>
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-2 py-2.5 text-sm text-text focus:border-accent focus:outline-none"
          >
            {accounts?.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-3">
        <p className="mb-2 text-xs font-medium text-text-muted">Apply one split to every item</p>
        <SplitEditor value={items[0]?.split ?? DEFAULT_SPLIT} onChange={applySplitToAll} meName={profiles.me.display_name} herName={profiles.partner.display_name} />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium text-text">Items</p>
          <button onClick={addItem} className="flex items-center gap-1 text-xs text-accent">
            <Plus size={14} /> Add item
          </button>
        </div>

        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.key} className="space-y-2 rounded-xl border border-border bg-surface p-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Item name"
                  value={item.description}
                  onChange={(e) => updateItem(item.key, { description: e.target.value })}
                  className="min-w-0 flex-1 rounded-lg border border-border bg-bg px-2.5 py-1.5 text-sm text-text focus:border-accent focus:outline-none"
                />
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={item.amount}
                  onChange={(e) => updateItem(item.key, { amount: e.target.value })}
                  className="w-20 rounded-lg border border-border bg-bg px-2.5 py-1.5 text-sm text-text focus:border-accent focus:outline-none"
                />
                <button onClick={() => removeItem(item.key)} className="shrink-0 text-text-muted">
                  <Trash2 size={16} />
                </button>
              </div>

              <select
                value={item.categoryId}
                onChange={(e) => updateItem(item.key, { categoryId: e.target.value })}
                className="w-full rounded-lg border border-border bg-bg px-2.5 py-1.5 text-sm text-text focus:border-accent focus:outline-none"
              >
                <option value="">Uncategorized</option>
                {categories?.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <SplitEditor
                value={item.split}
                onChange={(split) => updateItem(item.key, { split })}
                meName={profiles.me!.display_name}
                herName={profiles.partner!.display_name}
                compact
              />
            </div>
          ))}
        </div>
      </div>

      <div className={`rounded-xl border p-3 text-sm ${mismatch ? 'border-danger/50 bg-danger/10 text-danger' : 'border-border bg-surface text-text-muted'}`}>
        Items total <span className="money">{formatMoney(sumOfItems)}</span> · Receipt total <span className="money">{formatMoney(aiTotal)}</span>
        {mismatch && ' — double check the amounts above'}
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <button
        onClick={handleSave}
        disabled={saveItems.isPending || items.length === 0}
        className="w-full rounded-xl bg-accent px-4 py-3 font-medium text-bg disabled:opacity-50"
      >
        {saveItems.isPending ? 'Saving…' : 'Save Receipt'}
      </button>
    </div>
  )
}
