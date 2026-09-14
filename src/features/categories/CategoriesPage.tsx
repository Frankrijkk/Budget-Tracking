import { useState } from 'react'
import { ChevronLeft, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useCategories, useSaveCategory, useArchiveCategory, type Category } from './useCategories'
import { useProfiles } from '../auth/useProfiles'
import { Modal } from '../../components/Modal'
import { formatMoney } from '../../lib/format'

const COLOR_OPTIONS = ['#4fd1a5', '#ffb454', '#5b9bff', '#ff7ab8', '#f6c945', '#c792ea', '#7fdbff', '#ff6b6b', '#93a1b0']
const EMOJI_OPTIONS = ['🛒', '🍔', '🚗', '🏠', '💡', '🛍️', '🎬', '💊', '✈️', '🐾', '📚', '📦']

export function CategoriesPage() {
  const navigate = useNavigate()
  const { data: categories, isLoading } = useCategories()
  const { data: profiles } = useProfiles()
  const saveCategory = useSaveCategory()
  const archiveCategory = useArchiveCategory()
  const [editing, setEditing] = useState<Category | 'new' | null>(null)

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

      <h1 className="text-lg font-semibold text-text">Categories</h1>

      {isLoading && <p className="text-sm text-text-muted">Loading…</p>}

      <div className="divide-y divide-border rounded-xl border border-border bg-surface">
        {categories?.map((c) => (
          <button
            key={c.id}
            onClick={() => setEditing(c)}
            className="flex w-full items-center gap-3 p-3 text-left active:bg-surface-raised"
          >
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base"
              style={{ background: `${c.color}25` }}
            >
              {c.icon}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-text">{c.name}</span>
            </span>
            <span className="shrink-0 text-xs text-text-muted">
              {c.monthly_budget ? `${formatMoney(c.monthly_budget)}/mo` : 'No budget'}
            </span>
          </button>
        ))}
      </div>

      <CategoryEditor
        category={editing}
        householdId={profiles?.me?.household_id}
        onClose={() => setEditing(null)}
        onSave={async (data) => {
          await saveCategory.mutateAsync(data)
          setEditing(null)
        }}
        onArchive={async (id) => {
          await archiveCategory.mutateAsync(id)
          setEditing(null)
        }}
      />
    </div>
  )
}

function CategoryEditor({
  category,
  householdId,
  onClose,
  onSave,
  onArchive,
}: {
  category: Category | 'new' | null
  householdId: string | undefined
  onClose: () => void
  onSave: (data: Partial<Category> & { household_id: string; name: string; icon: string; color: string }) => void
  onArchive: (id: string) => void
}) {
  const isNew = category === 'new'
  const existing = isNew ? null : category
  const [name, setName] = useState(existing?.name ?? '')
  const [icon, setIcon] = useState(existing?.icon ?? EMOJI_OPTIONS[0])
  const [color, setColor] = useState(existing?.color ?? COLOR_OPTIONS[0])
  const [budget, setBudget] = useState(existing?.monthly_budget?.toString() ?? '')

  if (!category) return null

  return (
    <Modal open title={isNew ? 'New Category' : 'Edit Category'} onClose={onClose}>
      <div className="space-y-3">
        <input
          type="text"
          placeholder="Name"
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

        <div className="flex flex-wrap gap-2">
          {COLOR_OPTIONS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className="h-8 w-8 rounded-full border-2"
              style={{ background: c, borderColor: color === c ? '#fff' : 'transparent' }}
            />
          ))}
        </div>

        <input
          type="number"
          placeholder="Monthly budget (optional)"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-text focus:border-accent focus:outline-none"
        />

        <button
          disabled={!name || !householdId}
          onClick={() =>
            onSave({
              id: existing?.id,
              household_id: householdId!,
              name,
              icon,
              color,
              monthly_budget: budget ? Number(budget) : null,
            })
          }
          className="w-full rounded-xl bg-accent px-4 py-3 font-medium text-bg disabled:opacity-50"
        >
          Save
        </button>

        {existing && (
          <button onClick={() => onArchive(existing.id)} className="w-full py-2 text-sm text-danger">
            Archive category
          </button>
        )}
      </div>
    </Modal>
  )
}
