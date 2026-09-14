import { useState } from 'react'
import { ChevronLeft, Plus, Wallet, CreditCard, PiggyBank, Package } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAccounts, useSaveAccount, useArchiveAccount, type Account } from './useAccounts'
import { useProfiles } from '../auth/useProfiles'
import { Modal } from '../../components/Modal'
import type { AccountType } from '../../types/database.types'

const TYPE_ICON: Record<AccountType, typeof Wallet> = {
  cash: Wallet,
  card: CreditCard,
  savings: PiggyBank,
  other: Package,
}

const TYPES: AccountType[] = ['cash', 'card', 'savings', 'other']

export function AccountsPage() {
  const navigate = useNavigate()
  const { data: accounts, isLoading } = useAccounts()
  const { data: profiles } = useProfiles()
  const saveAccount = useSaveAccount()
  const archiveAccount = useArchiveAccount()
  const [editing, setEditing] = useState<Account | 'new' | null>(null)

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

      <h1 className="text-lg font-semibold text-text">Accounts</h1>

      {isLoading && <p className="text-sm text-text-muted">Loading…</p>}

      <div className="divide-y divide-border rounded-xl border border-border bg-surface">
        {accounts?.map((a) => {
          const Icon = TYPE_ICON[a.type]
          const owner = profiles?.all.find((p) => p.id === a.owner_id)
          return (
            <button
              key={a.id}
              onClick={() => setEditing(a)}
              className="flex w-full items-center gap-3 p-3 text-left active:bg-surface-raised"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                <Icon size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-text">{a.name}</span>
                <span className="block text-xs capitalize text-text-muted">
                  {a.type} · {owner ? owner.display_name : 'Shared'}
                </span>
              </span>
            </button>
          )
        })}
      </div>

      <AccountEditor
        account={editing}
        householdId={profiles?.me?.household_id}
        profiles={profiles?.all ?? []}
        onClose={() => setEditing(null)}
        onSave={async (data) => {
          await saveAccount.mutateAsync(data)
          setEditing(null)
        }}
        onArchive={async (id) => {
          await archiveAccount.mutateAsync(id)
          setEditing(null)
        }}
      />
    </div>
  )
}

function AccountEditor({
  account,
  householdId,
  profiles,
  onClose,
  onSave,
  onArchive,
}: {
  account: Account | 'new' | null
  householdId: string | undefined
  profiles: { id: string; display_name: string }[]
  onClose: () => void
  onSave: (data: Partial<Account> & { household_id: string; name: string; type: AccountType }) => void
  onArchive: (id: string) => void
}) {
  const isNew = account === 'new'
  const existing = isNew ? null : account
  const [name, setName] = useState(existing?.name ?? '')
  const [type, setType] = useState<AccountType>(existing?.type ?? 'card')
  const [ownerId, setOwnerId] = useState(existing?.owner_id ?? '')

  if (!account) return null

  return (
    <Modal open title={isNew ? 'New Account' : 'Edit Account'} onClose={onClose}>
      <div className="space-y-3">
        <input
          type="text"
          placeholder="Name (e.g. Joint Card)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-text focus:border-accent focus:outline-none"
        />

        <div className="flex gap-2">
          {TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`flex-1 rounded-xl border px-2 py-2 text-xs capitalize ${
                type === t ? 'border-accent bg-accent/15 text-accent' : 'border-border text-text-muted'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div>
          <label className="mb-1 block text-xs text-text-muted">Owner</label>
          <div className="flex gap-2">
            <button
              onClick={() => setOwnerId('')}
              className={`flex-1 rounded-xl border px-3 py-2 text-sm ${
                ownerId === '' ? 'border-accent bg-accent/15 text-accent' : 'border-border text-text-muted'
              }`}
            >
              Shared
            </button>
            {profiles.map((p) => (
              <button
                key={p.id}
                onClick={() => setOwnerId(p.id)}
                className={`flex-1 rounded-xl border px-3 py-2 text-sm ${
                  ownerId === p.id ? 'border-accent bg-accent/15 text-accent' : 'border-border text-text-muted'
                }`}
              >
                {p.display_name}
              </button>
            ))}
          </div>
        </div>

        <button
          disabled={!name || !householdId}
          onClick={() =>
            onSave({
              id: existing?.id,
              household_id: householdId!,
              name,
              type,
              owner_id: ownerId || null,
            })
          }
          className="w-full rounded-xl bg-accent px-4 py-3 font-medium text-bg disabled:opacity-50"
        >
          Save
        </button>

        {existing && (
          <button onClick={() => onArchive(existing.id)} className="w-full py-2 text-sm text-danger">
            Archive account
          </button>
        )}
      </div>
    </Modal>
  )
}
