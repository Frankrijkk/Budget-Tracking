import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { monthRange } from '../../lib/format'
import { useProfiles } from '../auth/useProfiles'
import { useCategories } from '../categories/useCategories'
import { subMonths, format } from 'date-fns'

export interface CategorySlice {
  categoryId: string
  name: string
  color: string
  icon: string
  amount: number
}

export function useCategoryBreakdown(monthDate = new Date()) {
  const { data: categories } = useCategories(true)
  const { start, end } = monthRange(monthDate)

  return useQuery<CategorySlice[]>({
    queryKey: ['stats', 'category-breakdown', start, end],
    enabled: !!categories,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transaction_person_amounts')
        .select('category_id, person_amount')
        .gte('occurred_on', start)
        .lte('occurred_on', end)
      if (error) throw error

      const totals: Record<string, number> = {}
      for (const row of data ?? []) {
        const key = row.category_id ?? 'uncategorized'
        totals[key] = (totals[key] ?? 0) + Number(row.person_amount)
      }

      return Object.entries(totals)
        .map(([categoryId, amount]) => {
          const cat = categories?.find((c) => c.id === categoryId)
          return {
            categoryId,
            name: cat?.name ?? 'Uncategorized',
            color: cat?.color ?? '#93a1b0',
            icon: cat?.icon ?? 'package',
            amount,
          }
        })
        .sort((a, b) => b.amount - a.amount)
    },
  })
}

export interface MonthlyPoint {
  month: string
  label: string
  me: number
  her: number
}

export function useMonthlyTrend(months = 6) {
  const { data: profiles } = useProfiles()

  return useQuery<MonthlyPoint[]>({
    queryKey: ['stats', 'monthly-trend', months, profiles?.me?.id],
    enabled: !!profiles?.me && !!profiles.partner,
    queryFn: async () => {
      const since = format(subMonths(new Date(), months - 1), 'yyyy-MM-01')
      const { data, error } = await supabase
        .from('monthly_totals')
        .select('month, profile_id, total')
        .gte('month', since)
        .order('month')
      if (error) throw error

      const byMonth = new Map<string, MonthlyPoint>()
      for (let i = months - 1; i >= 0; i--) {
        const d = subMonths(new Date(), i)
        const key = format(d, 'yyyy-MM-01')
        byMonth.set(key, { month: key, label: format(d, 'MMM'), me: 0, her: 0 })
      }
      for (const row of data ?? []) {
        const point = byMonth.get(row.month)
        if (!point) continue
        if (row.profile_id === profiles!.me!.id) point.me = Number(row.total)
        else point.her = Number(row.total)
      }
      return Array.from(byMonth.values())
    },
  })
}

export function usePersonBreakdown(monthDate = new Date()) {
  const { data: profiles } = useProfiles()
  const { start, end } = monthRange(monthDate)

  return useQuery({
    queryKey: ['stats', 'person-breakdown', start, end, profiles?.me?.id],
    enabled: !!profiles?.me && !!profiles.partner,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transaction_person_amounts')
        .select('profile_id, person_amount')
        .gte('occurred_on', start)
        .lte('occurred_on', end)
      if (error) throw error

      let me = 0
      let her = 0
      for (const row of data ?? []) {
        if (row.profile_id === profiles!.me!.id) me += Number(row.person_amount)
        else her += Number(row.person_amount)
      }
      return { me, her }
    },
  })
}
