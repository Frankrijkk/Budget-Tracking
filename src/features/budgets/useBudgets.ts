import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import type { Database } from '../../types/database.types'

export type Budget = Database['public']['Tables']['budgets']['Row']

export function useBudgets() {
  return useQuery<Budget[]>({
    queryKey: ['budgets'],
    queryFn: async () => {
      const { data, error } = await supabase.from('budgets').select('*')
      if (error) throw error
      return data ?? []
    },
  })
}

interface SaveBudgetInput {
  id?: string
  household_id: string
  category_id: string
  profile_id: string | null
  amount: number
}

export function useSaveBudget() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: SaveBudgetInput) => {
      if (input.id) {
        const { error } = await supabase.from('budgets').update({ amount: input.amount }).eq('id', input.id)
        if (error) throw error
        return
      }
      const { error } = await supabase.from('budgets').insert({
        household_id: input.household_id,
        category_id: input.category_id,
        profile_id: input.profile_id,
        amount: input.amount,
      })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['budgets'] }),
  })
}

export function useDeleteBudget() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('budgets').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['budgets'] }),
  })
}
