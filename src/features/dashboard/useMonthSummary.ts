import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { monthRange } from '../../lib/format'
import { useProfiles } from '../auth/useProfiles'

export function useMonthSummary() {
  const { data: profiles } = useProfiles()
  const { start, end } = monthRange()

  return useQuery({
    queryKey: ['stats', 'month-summary', start, end, profiles?.me?.id],
    enabled: !!profiles?.me,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transaction_person_amounts')
        .select('profile_id, person_amount')
        .gte('occurred_on', start)
        .lte('occurred_on', end)
      if (error) throw error

      let household = 0
      let mine = 0
      for (const row of data ?? []) {
        household += Number(row.person_amount)
        if (row.profile_id === profiles!.me!.id) mine += Number(row.person_amount)
      }
      return { household, mine }
    },
  })
}
