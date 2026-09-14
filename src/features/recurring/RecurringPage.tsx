import { useState } from 'react'
import { ChevronLeft, Plus, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  useRecurringTransactions,
  useSaveRecurring,
  useToggleRecurring,
  useDeleteRecurring,
  useRunRecurringNow,
  type RecurringWithRelations,
  type RecurringTransaction,
} from './useRecurring'
import { useCategories } from '../categories/useCategories'
import { useAccounts } from '../accounts/useAccounts'
import { useProfiles } from '../auth/useProfiles'
import { Modal } from '../../components/Modal'
import { formatMoney } from '../../lib/format'
import type { RecurringFrequency } from '../../types/database.types'

const FREQUENCIES: RecurringFrequency[] = ['weekly', 'monthly', 'yearly']

export function RecurringPage() {
  const navigate = useNavigate()
  const { data: rules, isLoading } = useRecurringTransactions()
  const { data: categories } = useCategories()
  const { data: accounts } = useAccounts()
  const { data: profiles } = useProfiles()
  const saveRecurring = useSaveRecurring()
  const toggleRecurring = useToggleRecurring()
  const deleteRecurring = useDeleteRecurring()
  const runNow = useRunRecurringNow()
  const [editing, setEditing] = useState<RecurringWithRelations | 'new' | null>(null)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-text-muted">
          <ChevronLeft size={20} /> Back
        </button>
        <button onClick={() => setEditing('new')} className="flex items-center gap-1 text-accent">
          <Plus size={18} /> Add
        </button>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-text">Recurring</h1>
        <button
          onClick={() => runNow.mutate()}
          disabled={runNow.isPending}
          className="flex items-center gap-1 text-xs text-text-muted"
        >
          <RefreshCw size={14} className={runNow.isPending ? 'animate-spin' : ''} /> Run now
        </button>
      </div>

      {isLoading && <p className="text-sm text-text-muted">Loading…</p>}
      {!isLoading && rules?.length === 0 && (
        <p className="py-10 text-center text-sm text-text-muted">No recurring transactions yet.</p>
      )}

      <div className="divide-y divide-border rounded-xl border border-border bg-surface">
        {rules?.map((r) => (
          <div key={r.id} className="flex items-center gap-3 p-3">
            <button onClick={() => setEditing(r)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base"
                style={{ background: `${r.category?.color ?? '#93a1b0'}25` }}
              >
                {r.category?.icon ?? '🔁'}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-text">{r.description}</span>
                <span className="block text-xs capitalize text-text-muted">
                  {r.frequency} · next {r.next_run_date}
                </span>
              </span>
            </button>
            <span className="shrink-0 text-sm font-medium text-text">{formatMoney(r.amount)}</span>
            <button
              onClick={() => toggleRecurring.mutate({ id: r.id, is_active: !r.is_active })}
              className={`h-5 w-9 shrink-0 rounded-full transition ${r.is_active ? 'bg-accent' : 'bg-border'}`}
            >
              <span
                className={`block h-4 w-4 translate-y-0.5 rounded-full bg-white transition ${
                  r.is_active ? 'translate-x-4' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      <RecurringEditor
        rule={editing}
        householdId={profiles?.me?.household_id}
        categories={categories ?? []}
        accounts={accounts ?? []}
        profiles={profiles?.all ?? []}
        onClose={() => setEditing(null)}
        onSave={async (data) => {
          await saveRecurring.mutateAsync(data)
          setEditing(null)
        }}
        onDelete={async (id) => {
          await deleteRecurring.mutateAsync(id)
          setEditing(null)
        }}
      />
    </div>
  )
}

function RecurringEditor({
  rule,
  householdId,
  categories,
  accounts,
  profiles,
  onClose,
  onSave,
  onDelete,
}: {
  rule: RecurringWithRelations | 'new' | null
  householdId: string | undefined
  categories: { id: string; name: string; icon: string }[]
  accounts: { id: string; name: string }[]
  profiles: { id: string; display_name: string }[]
  onClose: () => void
  onSave: (
    data: Partial<RecurringTransaction> & {
      household_id: string
      account_id: string
      payer_id: string
      description: string
      amount: number
      frequency: RecurringFrequency
      start_date: string
      next_run_date: string
    },
  ) => void
  onDelete: (id: string) => void
}) {
  const isNew = rule === 'new'
  const existing = isNew ? null : rule
  const [description, setDescription] = useState(existing?.description ?? '')
  const [amount, setAmount] = useState(existing?.amount?.toString() ?? '')
  const [frequency, setFrequency] = useState<RecurringFrequency>(existing?.frequency ?? 'monthly')
  const [categoryId, setCategoryId] = useState(existing?.category_id ?? '')
  const [accountId, setAccountId] = useState(existing?.account_id ?? accounts[0]?.id ?? '')
  const [payerId, setPayerId] = useState(existing?.payer_id ?? profiles[0]?.id ?? '')
  const [startDate, setStartDate] = useState(existing?.start_date ?? new Date().toISOString().slice(0, 10))

  if (!rule) return null

  return (
    <Modal open title={isNew ? 'New Recurring' : 'Edit Recurring'} onClose={onClose}>
      <div className="space-y-3">
        <input
          type="text"
          placeholder="Description (e.g. Rent)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-text focus:border-accent focus:outline-none"
        />
        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-text focus:border-accent focus:outline-none"
        />
        <div className="flex gap-2">
          {FREQUENCIES.map((f) => (
            <button
              key={f}
              onClick={() => setFrequency(f)}
              className={`flex-1 rounded-xl border px-2 py-2 text-xs capitalize ${
                frequency === f ? 'border-accent bg-accent/15 text-accent' : 'border-border text-text-muted'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-text focus:border-accent focus:outline-none"
        >
          <option value="">No category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
          ))}
        </select>
        <select
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-text focus:border-accent focus:outline-none"
        >
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
        <div className="flex gap-2">
          {profiles.map((p) => (
            <button
              key={p.id}
              onClick={() => setPayerId(p.id)}
              className={`flex-1 rounded-xl border px-3 py-2 text-sm ${
                payerId === p.id ? 'border-accent bg-accent/15 text-accent' : 'border-border text-text-muted'
              }`}
            >
              {p.display_name}
            </button>
          ))}
        </div>
        <div>
          <label className="mb-1 block text-xs text-text-muted">Start date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-text focus:border-accent focus:outline-none"
          />
        </div>

        <button
          disabled={!description || !amount || !accountId || !payerId || !householdId}
          onClick={() =>
            onSave({
              id: existing?.id,
              household_id: householdId!,
              account_id: accountId,
              category_id: categoryId || null,
              payer_id: payerId,
              description,
              amount: Number(amount),
              frequency,
              start_date: startDate,
              next_run_date: existing?.next_run_date ?? startDate,
            })
          }
          className="w-full rounded-xl bg-accent px-4 py-3 font-medium text-bg disabled:opacity-50"
        >
          Save
        </button>

        {existing && (
          <button onClick={() => onDelete(existing.id)} className="w-full py-2 text-sm text-danger">
            Delete
          </button>
        )}
      </div>
    </Modal>
  )
}
