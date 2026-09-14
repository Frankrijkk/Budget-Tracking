import { useMemo, useState } from 'react'
import { ChevronLeft, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useCategories } from '../categories/useCategories'
import { useCategorySpend } from './useBudgetProgress'
import { useBudgets, useSaveBudget, useDeleteBudget, type Budget } from './useBudgets'
import { useProfiles } from '../auth/useProfiles'
import { Modal } from '../../components/Modal'
import { ProgressBar } from '../../components/ProgressBar'
import { formatMoney } from '../../lib/format'

/** null = the shared/household scope; a string = that profile's personal scope. */
type Scope = string | null

interface EditingTarget {
  categoryId: string
  categoryName: string
  scope: Scope
  scopeLabel: string
  existing: Budget | null
}

export function BudgetsPage() {
  const navigate = useNavigate()
  const { data: categories } = useCategories()
  const { data: budgets } = useBudgets()
  const { data: spend } = useCategorySpend()
  const { data: profiles } = useProfiles()
  const saveBudget = useSaveBudget()
  const deleteBudget = useDeleteBudget()
  const [editing, setEditing] = useState<EditingTarget | null>(null)

  const budgetsByCategory = useMemo(() => {
    const map: Record<string, { shared?: Budget; byProfile: Record<string, Budget> }> = {}
    for (const b of budgets ?? []) {
      const entry = (map[b.category_id] ??= { byProfile: {} })
      if (b.profile_id) entry.byProfile[b.profile_id] = b
      else entry.shared = b
    }
    return map
  }, [budgets])

  if (!profiles?.me || !profiles.partner) return null

  const scopes: { key: Scope; label: string }[] = [
    { key: null, label: 'Shared' },
    { key: profiles.me.id, label: profiles.me.display_name },
    { key: profiles.partner.id, label: profiles.partner.display_name },
  ]

  return (
    <div className="space-y-4">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-text-muted">
        <ChevronLeft size={20} /> Back
      </button>

      <h1 className="text-lg font-semibold text-text">Budgets — This Month</h1>
      <p className="text-xs text-text-muted">
        Set a shared budget for the whole household and/or a personal budget for each of you, per category.
      </p>

      <div className="space-y-3">
        {categories?.map((c) => {
          const entry = budgetsByCategory[c.id]
          const categorySpend = spend?.[c.id]

          return (
            <div key={c.id} className="rounded-xl border border-border bg-surface p-3">
              <p className="mb-2 flex items-center gap-2 text-sm font-medium text-text">
                <span>{c.icon}</span> {c.name}
              </p>

              <div className="space-y-2.5">
                {scopes.map(({ key, label }) => {
                  const budget = key === null ? entry?.shared : entry?.byProfile[key]
                  const spentAmount = key === null ? (categorySpend?.shared ?? 0) : (categorySpend?.byProfile[key] ?? 0)
                  const ratio = budget && budget.amount > 0 ? spentAmount / budget.amount : 0

                  return (
                    <button
                      key={label}
                      onClick={() =>
                        setEditing({
                          categoryId: c.id,
                          categoryName: c.name,
                          scope: key,
                          scopeLabel: label,
                          existing: budget ?? null,
                        })
                      }
                      className="block w-full text-left"
                    >
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="text-text-muted">{label}</span>
                        {budget ? (
                          <span className={ratio > 1 ? 'text-danger' : 'text-text-muted'}>
                            {formatMoney(spentAmount)} / {formatMoney(budget.amount)}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-accent">
                            <Plus size={12} /> Add budget
                          </span>
                        )}
                      </div>
                      {budget && <ProgressBar ratio={ratio} color={c.color} />}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {editing && (
        <BudgetEditModal
          target={editing}
          householdId={profiles.me.household_id}
          onClose={() => setEditing(null)}
          onSave={async (amount) => {
            await saveBudget.mutateAsync({
              id: editing.existing?.id,
              household_id: profiles.me!.household_id,
              category_id: editing.categoryId,
              profile_id: editing.scope,
              amount,
            })
            setEditing(null)
          }}
          onDelete={editing.existing
            ? async () => {
                await deleteBudget.mutateAsync(editing.existing!.id)
                setEditing(null)
              }
            : undefined}
        />
      )}
    </div>
  )
}

function BudgetEditModal({
  target,
  onClose,
  onSave,
  onDelete,
}: {
  target: EditingTarget
  householdId: string
  onClose: () => void
  onSave: (amount: number) => void
  onDelete?: () => void
}) {
  const [amount, setAmount] = useState(target.existing?.amount.toString() ?? '')

  return (
    <Modal open title={`${target.scopeLabel} · ${target.categoryName}`} onClose={onClose}>
      <div className="space-y-3">
        <input
          type="number"
          inputMode="decimal"
          placeholder="Monthly budget amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-text focus:border-accent focus:outline-none"
        />
        <button
          disabled={!amount || Number(amount) <= 0}
          onClick={() => onSave(Number(amount))}
          className="w-full rounded-xl bg-accent px-4 py-3 font-medium text-bg disabled:opacity-50"
        >
          Save
        </button>
        {onDelete && (
          <button onClick={onDelete} className="w-full py-2 text-sm text-danger">
            Remove this budget
          </button>
        )}
      </div>
    </Modal>
  )
}
