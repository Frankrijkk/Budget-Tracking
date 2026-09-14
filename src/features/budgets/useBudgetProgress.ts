import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { monthRange } from '../../lib/format'

export interface CategorySpend {
  /** Combined household spend in this category (compare against a shared budget). */
  shared: number
  /** Each profile's own resolved share of spend in this category (compare against a personal budget). */
  byProfile: Record<string, number>
}

/** Per-category spend for the given month, both household-wide and per-person. */
export function useCategorySpend(monthDate = new Date()) {
  const { start, end } = monthRange(monthDate)

  return useQuery<Record<string, CategorySpend>>({
    queryKey: ['stats', 'category-spend', start, end],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transaction_person_amounts')
        .select('category_id, profile_id, person_amount')
        .gte('occurred_on', start)
        .lte('occurred_on', end)
      if (error) throw error

      const totals: Record<string, CategorySpend> = {}
      for (const row of data ?? []) {
        if (!row.category_id) continue
        const entry = (totals[row.category_id] ??= { shared: 0, byProfile: {} })
        const amount = Number(row.person_amount)
        entry.shared += amount
        entry.byProfile[row.profile_id] = (entry.byProfile[row.profile_id] ?? 0) + amount
      }
      return totals
    },
  })
}
