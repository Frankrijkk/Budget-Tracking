import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import type { Database } from '../../types/database.types'
import type { Category } from '../categories/useCategories'
import type { Account } from '../accounts/useAccounts'

export type RecurringTransaction = Database['public']['Tables']['recurring_transactions']['Row']
type RecurringInsert = Database['public']['Tables']['recurring_transactions']['Insert']

export interface RecurringWithRelations extends RecurringTransaction {
  category: Category | null
  account: Account | null
}

export function useRecurringTransactions() {
  return useQuery<RecurringWithRelations[]>({
    queryKey: ['recurring_transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recurring_transactions')
        .select('*, category:categories(*), account:accounts(*)')
        .order('next_run_date')
      if (error) throw error
      return (data ?? []) as unknown as RecurringWithRelations[]
    },
  })
}

export function useSaveRecurring() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (rule: RecurringInsert & { id?: string }) => {
      if (rule.id) {
        const { id, ...update } = rule
        const { error } = await supabase.from('recurring_transactions').update(update).eq('id', id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('recurring_transactions').insert(rule)
        if (error) throw error
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recurring_transactions'] }),
  })
}

export function useToggleRecurring() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('recurring_transactions').update({ is_active }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recurring_transactions'] }),
  })
}

export function useDeleteRecurring() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('recurring_transactions').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recurring_transactions'] }),
  })
}

export function useRunRecurringNow() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.functions.invoke('generate-recurring', { body: {} })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring_transactions'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      queryClient.invalidateQueries({ queryKey: ['balance'] })
    },
  })
}
