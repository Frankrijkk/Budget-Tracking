import { useState } from 'react'
import { ChevronLeft, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  useSavingsGoals,
  useSaveSavingsGoal,
  useDeleteSavingsGoal,
  useContribute,
  type SavingsGoal,
} from './useSavingsGoals'
import { useProfiles } from '../auth/useProfiles'
import { Modal } from '../../components/Modal'
import { ProgressBar } from '../../components/ProgressBar'
import { formatMoney } from '../../lib/format'

const EMOJI_OPTIONS = ['🏖️', '🏠', '🚗', '💍', '👶', '🎓', '🛡️', '🎁']

export function SavingsGoalsPage() {
  const navigate = useNavigate()
  const { data: goals, isLoading } = useSavingsGoals()
  const { data: profiles } = useProfiles()
  const saveGoal = useSaveSavingsGoal()
  const deleteGoal = useDeleteSavingsGoal()
  const contribute = useContribute()
  const [editing, setEditing] = useState<SavingsGoal | 'new' | null>(null)
  const [contributing, setContributing] = useState<SavingsGoal | null>(null)

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

      <h1 className="text-lg font-semibold text-text">Savings Goals</h1>

      {isLoading && <p className="text-sm text-text-muted">Loading…</p>}
      {!isLoading && goals?.length === 0 && (
        <p className="py-10 text-center text-sm text-text-muted">No goals yet. Add one to start saving together.</p>
      )}

      <div className="space-y-3">
        {goals?.map((g) => {
          const ratio = g.target_amount > 0 ? g.current_amount / g.target_amount : 0
          return (
            <div key={g.id} className="rounded-2xl border border-border bg-surface p-4">
              <div className="mb-2 flex items-center justify-between">
                <button onClick={() => setEditing(g)} className="flex items-center gap-2 text-left">
                  <span className="text-xl">{g.icon}</span>
                  <span className="font-medium text-text">{g.name}</span>
                </button>
                {g.is_achieved && <span className="text-xs text-accent">Achieved 🎉</span>}
              </div>
              <ProgressBar ratio={ratio} color={g.color ?? undefined} />
              <div className="mt-1.5 flex items-center justify-between text-xs text-text-muted">
                <span>{formatMoney(g.current_amount)} / {formatMoney(g.target_amount)}</span>
                {g.target_date && <span>by {g.target_date}</span>}
              </div>
              <button
                onClick={() => setContributing(g)}
                className="mt-3 w-full rounded-lg border border-border py-1.5 text-sm text-text-muted active:bg-surface-raised"
              >
                Add contribution
              </button>
            </div>
          )
        })}
      </div>

      <GoalEditor
        goal={editing}
        householdId={profiles?.me?.household_id}
        onClose={() => setEditing(null)}
        onSave={async (data) => {
          await saveGoal.mutateAsync(data)
          setEditing(null)
        }}
        onDelete={async (id) => {
          await deleteGoal.mutateAsync(id)
          setEditing(null)
        }}
      />

      <ContributeModal
        goal={contributing}
        meId={profiles?.me?.id}
        onClose={() => setContributing(null)}
        onContribute={async (amount) => {
          if (!contributing || !profiles?.me) return
          await contribute.mutateAsync({ goal_id: contributing.id, profile_id: profiles.me.id, amount })
          setContributing(null)
        }}
      />
    </div>
  )
}

function GoalEditor({
  goal,
  householdId,
  onClose,
  onSave,
  onDelete,
}: {
  goal: SavingsGoal | 'new' | null
  householdId: string | undefined
  onClose: () => void
  onSave: (data: Partial<SavingsGoal> & { household_id: string; name: string; target_amount: number }) => void
  onDelete: (id: string) => void
}) {
  const isNew = goal === 'new'
  const existing = isNew ? null : goal
  const [name, setName] = useState(existing?.name ?? '')
  const [icon, setIcon] = useState(existing?.icon ?? EMOJI_OPTIONS[0])
  const [target, setTarget] = useState(existing?.target_amount?.toString() ?? '')
  const [targetDate, setTargetDate] = useState(existing?.target_date ?? '')

  if (!goal) return null

  return (
    <Modal open title={isNew ? 'New Goal' : 'Edit Goal'} onClose={onClose}>
      <div className="space-y-3">
        <input
          type="text"
          placeholder="Goal name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-text focus:border-accent focus:outline-none"
        />
        <div className="flex flex-wrap gap-2">
          {EMOJI_OPTIONS.map((e) => (
            <button
              key={e}
              onClick={() => setIcon(e)}
              className={`flex h-10 w-10 items-center justify-center rounded-full border text-lg ${
                icon === e ? 'border-accent bg-accent/15' : 'border-border'
              }`}
            >
              {e}
            </button>
          ))}
        </div>
        <input
          type="number"
          placeholder="Target amount"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-text focus:border-accent focus:outline-none"
        />
        <input
          type="date"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
          className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-text focus:border-accent focus:outline-none"
        />
        <button
          disabled={!name || !target || !householdId}
          onClick={() =>
            onSave({
              id: existing?.id,
              household_id: householdId!,
              name,
              icon,
              target_amount: Number(target),
              target_date: targetDate || null,
            })
          }
          className="w-full rounded-xl bg-accent px-4 py-3 font-medium text-bg disabled:opacity-50"
        >
          Save
        </button>
        {existing && (
          <button onClick={() => onDelete(existing.id)} className="w-full py-2 text-sm text-danger">
            Delete goal
          </button>
        )}
      </div>
    </Modal>
  )
}

function ContributeModal({
  goal,
  meId,
  onClose,
  onContribute,
}: {
  goal: SavingsGoal | null
  meId: string | undefined
  onClose: () => void
  onContribute: (amount: number) => void
}) {
  const [amount, setAmount] = useState('')
  if (!goal) return null

  return (
    <Modal open title={`Contribute to ${goal.name}`} onClose={onClose}>
      <div className="space-y-3">
        <input
          type="number"
          inputMode="decimal"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-text focus:border-accent focus:outline-none"
        />
        <button
          disabled={!amount || !meId}
          onClick={() => onContribute(Number(amount))}
          className="w-full rounded-xl bg-accent px-4 py-3 font-medium text-bg disabled:opacity-50"
        >
          Add
        </button>
      </div>
    </Modal>
  )
}
