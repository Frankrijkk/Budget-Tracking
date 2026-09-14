import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { monthRange } from '../../lib/format'

export interface CategorySpend {
  category_id: string
  spent: number
}

export function useCategorySpend(monthDate = new Date()) {
  const { start, end } = monthRange(monthDate)

  return useQuery<Record<string, number>>({
    queryKey: ['stats', 'category-spend', start, end],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transaction_person_amounts')
        .select('category_id, person_amount')
        .gte('occurred_on', start)
        .lte('occurred_on', end)
      if (error) throw error

      const totals: Record<string, number> = {}
      for (const row of data ?? []) {
        if (!row.category_id) continue
        totals[row.category_id] = (totals[row.category_id] ?? 0) + Number(row.person_amount)
      }
      return totals
    },
  })
}
