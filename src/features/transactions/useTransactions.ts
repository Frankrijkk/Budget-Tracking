import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { enqueueTransaction } from '../../lib/offlineQueue'
import type { Database } from '../../types/database.types'
import type { Category } from '../categories/useCategories'
import type { Account } from '../accounts/useAccounts'
import type { Profile } from '../auth/useProfiles'
import type { ResolvedShare } from './split'

export type Transaction = Database['public']['Tables']['transactions']['Row']
export type TransactionShare = Database['public']['Tables']['transaction_shares']['Row']

export interface TransactionWithRelations extends Transaction {
  category: Category | null
  account: Account | null
  payer: Profile
  shares: TransactionShare[]
}

interface TransactionFilters {
  from?: string
  to?: string
  categoryId?: string
  limit?: number
}

const SELECT_WITH_RELATIONS =
  '*, category:categories(*), account:accounts(*), payer:profiles!transactions_payer_id_fkey(*), shares:transaction_shares(*)'

export function useTransactions(filters: TransactionFilters = {}) {
  return useQuery<TransactionWithRelations[]>({
    queryKey: ['transactions', filters],
    queryFn: async () => {
      let query = supabase
        .from('transactions')
        .select(SELECT_WITH_RELATIONS)
        .eq('is_settlement', false)
        .order('occurred_on', { ascending: false })
        .order('created_at', { ascending: false })

      if (filters.from) query = query.gte('occurred_on', filters.from)
      if (filters.to) query = query.lte('occurred_on', filters.to)
      if (filters.categoryId) query = query.eq('category_id', filters.categoryId)
      if (filters.limit) query = query.limit(filters.limit)

      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as unknown as TransactionWithRelations[]
    },
  })
}

export function useTransaction(id: string | undefined) {
  return useQuery<TransactionWithRelations | null>({
    queryKey: ['transactions', 'one', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select(SELECT_WITH_RELATIONS)
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as unknown as TransactionWithRelations
    },
  })
}

export interface SaveTransactionInput {
  id?: string
  household_id: string
  account_id: string
  category_id?: string | null
  payer_id: string
  description?: string
  amount: number
  occurred_on: string
  note?: string | null
  created_by: string
  is_settlement?: boolean
  shares: ResolvedShare[]
}

export async function saveTransactionRemote(input: SaveTransactionInput) {
  const { shares, ...transaction } = input
  const { error } = await supabase.rpc('upsert_transaction_with_shares', {
    p_transaction: transaction,
    p_shares: shares as unknown as Record<string, unknown>[],
  })
  if (error) throw error
}

export function useSaveTransaction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: SaveTransactionInput) => {
      // Offline support is scoped to *new* transactions (Quick Add / manual
      // entry) -- editing an existing one while offline isn't queued, since
      // that would need to merge against whatever the other phone changed.
      if (!input.id && !navigator.onLine) {
        await enqueueTransaction(input)
        return
      }

      try {
        await saveTransactionRemote(input)
      } catch (e) {
        if (!input.id && !navigator.onLine) {
          await enqueueTransaction(input)
          return
        }
        throw e
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      queryClient.invalidateQueries({ queryKey: ['balance'] })
    },
  })
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('transactions').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      queryClient.invalidateQueries({ queryKey: ['balance'] })
    },
  })
}
