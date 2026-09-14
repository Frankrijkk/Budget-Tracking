import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import type { Database } from '../../types/database.types'

export type Account = Database['public']['Tables']['accounts']['Row']
type AccountInsert = Database['public']['Tables']['accounts']['Insert']
type AccountUpdate = Database['public']['Tables']['accounts']['Update']

export function useAccounts(includeArchived = false) {
  return useQuery<Account[]>({
    queryKey: ['accounts', { includeArchived }],
    queryFn: async () => {
      let query = supabase.from('accounts').select('*').order('created_at')
      if (!includeArchived) query = query.eq('is_archived', false)
      const { data, error } = await query
      if (error) throw error
      return data ?? []
    },
  })
}

export function useSaveAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (account: AccountInsert & { id?: string }) => {
      if (account.id) {
        const { id, ...update } = account
        const { error } = await supabase.from('accounts').update(update as AccountUpdate).eq('id', id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('accounts').insert(account)
        if (error) throw error
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accounts'] }),
  })
}

export function useArchiveAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('accounts').update({ is_archived: true }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accounts'] }),
  })
}
