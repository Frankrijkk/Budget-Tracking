import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { X, Check } from 'lucide-react'
import { Keypad } from '../../components/Keypad'
import { useCategories } from '../categories/useCategories'
import { useAccounts } from '../accounts/useAccounts'
import { useProfiles } from '../auth/useProfiles'
import { useSaveTransaction } from './useTransactions'
import { formatMoney } from '../../lib/format'
import { CategoryIcon } from '../../lib/categoryIcons'

export function QuickAddPage() {
  const navigate = useNavigate()

  // iOS reads <meta name="apple-mobile-web-app-title"> at the moment "Add to
  // Home Screen" is tapped, not from manifest.json. Swapping it while this
  // route is open lets a second home-screen icon (added from here) be
  // labeled "Quick Add" instead of the app's main title.
  useEffect(() => {
    const meta = document.querySelector('meta[name="apple-mobile-web-app-title"]')
    const previous = meta?.getAttribute('content')
    meta?.setAttribute('content', 'Quick Add')
    return () => {
      if (previous) meta?.setAttribute('content', previous)
    }
  }, [])

  const { data: categories } = useCategories()
  const { data: accounts } = useAccounts()
  const { data: profiles } = useProfiles()
  const saveTransaction = useSaveTransaction()

  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [payerId, setPayerId] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (profiles?.me?.id && !payerId) setPayerId(profiles.me.id)
  }, [profiles, payerId])

  const amountNum = Number(amount || '0')
  const canSave = amountNum > 0 && !!categoryId && !!profiles?.me && !!profiles.partner && !!accounts?.length

  async function handleSave() {
    if (!canSave || !profiles?.me || !profiles.partner || !accounts?.length) return

    const category = categories?.find((c) => c.id === categoryId)
    // Quick Add is for personal, on-the-spot purchases -- whoever paid gets
    // the full amount on their own budget. Use the full transaction editor
    // to split something between the two of you.
    await saveTransaction.mutateAsync({
      household_id: profiles.me.household_id,
      account_id: accounts[0].id,
      category_id: categoryId,
      payer_id: payerId,
      description: category?.name ?? '',
      amount: amountNum,
      occurred_on: new Date().toISOString().slice(0, 10),
      created_by: profiles.me.id,
      shares: [
        { profile_id: payerId, share_type: payerId === profiles.me.id ? 'me' : 'her', ratio: 1 },
      ],
    })

    setSaved(true)
    setAmount('')
    setCategoryId('')
    setTimeout(() => setSaved(false), 1200)
  }

  return (
    <div className="flex min-h-dvh flex-col bg-bg px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-[calc(env(safe-area-inset-top)+1rem)]">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="text-text-muted">
          <X size={22} />
        </button>
        <span className="text-sm font-medium text-text-muted">Quick Add</span>
        <span className="w-[22px]" />
      </div>

      <div className="flex flex-1 flex-col justify-center gap-6 py-6">
        {accounts && accounts.length === 0 && (
          <Link
            to="/accounts"
            className="rounded-xl border border-accent/40 bg-accent/10 p-3 text-center text-sm text-accent"
          >
            You need at least one account before you can save a transaction — tap to add one
          </Link>
        )}

        <div className="text-center">
          <span className="money text-5xl font-semibold text-text">
            {amount ? formatMoney(amountNum) : <span className="text-text-muted">{formatMoney(0)}</span>}
          </span>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          {categories?.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategoryId(c.id)}
              className="flex h-14 w-14 flex-col items-center justify-center rounded-2xl border-2 transition"
              style={
                categoryId === c.id
                  ? { borderColor: c.color, background: `${c.color}25`, color: c.color }
                  : { borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }
              }
            >
              <CategoryIcon name={c.icon} size={22} />
            </button>
          ))}
        </div>

        {profiles?.all && profiles.all.length > 0 && (
          <div className="mx-auto flex w-full max-w-xs gap-2">
            {profiles.all.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPayerId(p.id)}
                className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium ${
                  payerId === p.id ? 'border-accent bg-accent/15 text-accent' : 'border-border text-text-muted'
                }`}
              >
                {p.display_name} paid
              </button>
            ))}
          </div>
        )}

        <Keypad value={amount} onChange={setAmount} />
      </div>

      <button
        onClick={handleSave}
        disabled={!canSave || saveTransaction.isPending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3.5 font-medium text-bg transition active:scale-[0.98] disabled:opacity-40"
      >
        {saved ? <Check size={18} /> : null}
        {saved ? (navigator.onLine ? 'Saved!' : 'Saved offline, will sync') : saveTransaction.isPending ? 'Saving…' : 'Save'}
      </button>
    </div>
  )
}
