import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import type { Database } from '../../types/database.types'

export type SavingsGoal = Database['public']['Tables']['savings_goals']['Row']
type SavingsGoalInsert = Database['public']['Tables']['savings_goals']['Insert']

export function useSavingsGoals() {
  return useQuery<SavingsGoal[]>({
    queryKey: ['savings_goals'],
    queryFn: async () => {
      const { data, error } = await supabase.from('savings_goals').select('*').order('created_at')
      if (error) throw error
      return data ?? []
    },
  })
}

export function useSaveSavingsGoal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (goal: SavingsGoalInsert & { id?: string }) => {
      if (goal.id) {
        const { id, ...update } = goal
        const { error } = await supabase.from('savings_goals').update(update).eq('id', id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('savings_goals').insert(goal)
        if (error) throw error
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['savings_goals'] }),
  })
}

export function useDeleteSavingsGoal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('savings_goals').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['savings_goals'] }),
  })
}

export function useContribute() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { goal_id: string; profile_id: string; amount: number; note?: string }) => {
      const { error } = await supabase.from('savings_goal_contributions').insert(input)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['savings_goals'] }),
  })
}
