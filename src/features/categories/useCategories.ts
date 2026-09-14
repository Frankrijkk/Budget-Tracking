import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import type { Database } from '../../types/database.types'

export type Category = Database['public']['Tables']['categories']['Row']
type CategoryInsert = Database['public']['Tables']['categories']['Insert']
type CategoryUpdate = Database['public']['Tables']['categories']['Update']

export function useCategories(includeArchived = false) {
  return useQuery<Category[]>({
    queryKey: ['categories', { includeArchived }],
    queryFn: async () => {
      let query = supabase.from('categories').select('*').order('sort_order')
      if (!includeArchived) query = query.eq('is_archived', false)
      const { data, error } = await query
      if (error) throw error
      return data ?? []
    },
  })
}

export function useSaveCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (category: CategoryInsert & { id?: string }) => {
      if (category.id) {
        const { id, ...update } = category
        const { error } = await supabase.from('categories').update(update as CategoryUpdate).eq('id', id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('categories').insert(category)
        if (error) throw error
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  })
}

export function useArchiveCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('categories').update({ is_archived: true }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  })
}
