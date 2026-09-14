import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useProfiles } from '../auth/useProfiles'
import { format, parseISO } from 'date-fns'

export interface BalancePoint {
  date: string
  label: string
  net: number
}

export function useBalanceHistory() {
  const { data: profiles } = useProfiles()
  const meId = profiles?.me?.id

  return useQuery<BalancePoint[]>({
    queryKey: ['balance', 'history', meId],
    enabled: !!meId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('occurred_on, amount, payer_id, shares:transaction_shares(profile_id, ratio)')
        .order('occurred_on')
      if (error) throw error

      let running = 0
      const points: BalancePoint[] = []
      for (const t of data ?? []) {
        const shares = t.shares as { profile_id: string; ratio: number }[]
        if (t.payer_id === meId) {
          const othersRatio = shares.filter((s) => s.profile_id !== meId).reduce((sum, s) => sum + s.ratio, 0)
          running += othersRatio * Number(t.amount)
        } else {
          const myRatio = shares.find((s) => s.profile_id === meId)?.ratio ?? 0
          running -= myRatio * Number(t.amount)
        }
        points.push({ date: t.occurred_on, label: format(parseISO(t.occurred_on), 'MMM d'), net: running })
      }
      return points
    },
  })
}
