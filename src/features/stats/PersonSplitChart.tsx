import { usePersonBreakdown } from './useStats'
import { useProfiles } from '../auth/useProfiles'
import { formatMoney } from '../../lib/format'

export function PersonSplitChart() {
  const { data } = usePersonBreakdown()
  const { data: profiles } = useProfiles()

  if (!data || !profiles?.me || !profiles.partner) return null

  const total = data.me + data.her || 1
  const mePct = (data.me / total) * 100

  return (
    <div className="space-y-3">
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-border">
        <div className="h-full" style={{ width: `${mePct}%`, background: 'var(--color-accent-me)' }} />
        <div className="h-full flex-1" style={{ background: 'var(--color-accent-her)' }} />
      </div>
      <div className="flex justify-between">
        <div>
          <p className="flex items-center gap-1.5 text-sm text-text">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: 'var(--color-accent-me)' }} />
            {profiles.me.display_name}
          </p>
          <p className="money text-lg font-semibold text-text">{formatMoney(data.me)}</p>
        </div>
        <div className="text-right">
          <p className="flex items-center justify-end gap-1.5 text-sm text-text">
            {profiles.partner.display_name}
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: 'var(--color-accent-her)' }} />
          </p>
          <p className="money text-lg font-semibold text-text">{formatMoney(data.her)}</p>
        </div>
      </div>
    </div>
  )
}
