import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useProfiles } from '../auth/useProfiles'

export interface NetBalance {
  /** Positive = the household owes "me"; negative = "me" owes the household (i.e. the partner). */
  meNet: number
}

export function useBalance() {
  const { data: profiles } = useProfiles()
  const householdId = profiles?.me?.household_id

  return useQuery<NetBalance>({
    queryKey: ['balance', householdId],
    enabled: !!householdId && !!profiles?.me,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_household_balance', {
        p_household_id: householdId!,
      })
      if (error) throw error
      const mine = (data ?? []).find((row) => row.profile_id === profiles!.me!.id)
      return { meNet: Number(mine?.net_amount ?? 0) }
    },
  })
}
