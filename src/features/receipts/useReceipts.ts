import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { compressImage } from '../../lib/imageCompress'
import { useProfiles } from '../auth/useProfiles'
import type { Database } from '../../types/database.types'

export type Receipt = Database['public']['Tables']['receipts']['Row']

export interface ParsedReceiptItem {
  name: string
  price: number
}

export interface ParsedReceipt {
  store: string
  date: string
  items: ParsedReceiptItem[]
  total: number
}

export function useReceipt(id: string | undefined) {
  return useQuery<Receipt | null>({
    queryKey: ['receipts', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from('receipts').select('*').eq('id', id!).single()
      if (error) throw error
      return data
    },
  })
}

/** supabase-js's invoke() error only carries a generic "non-2xx status
 * code" message by default -- the actual reason is in the response body,
 * reachable via the error's `context` (the raw Response). Surface that
 * instead so failures are diagnosable from the UI. */
async function extractFunctionErrorMessage(invokeError: unknown): Promise<string> {
  const context = (invokeError as { context?: Response }).context
  if (context && typeof context.json === 'function') {
    try {
      const body = await context.clone().json()
      if (typeof body?.error === 'string') return body.error
    } catch {
      // response body wasn't JSON -- fall through to the generic message
    }
  }
  return invokeError instanceof Error ? invokeError.message : String(invokeError)
}

export function useUploadReceipt() {
  const { data: profiles } = useProfiles()

  return useMutation({
    mutationFn: async (file: File) => {
      if (!profiles?.me) throw new Error('Not signed in')

      const compressed = await compressImage(file)
      const path = `${profiles.me.household_id}/${crypto.randomUUID()}.jpg`

      const { error: uploadError } = await supabase.storage.from('receipts').upload(path, compressed, {
        contentType: 'image/jpeg',
      })
      if (uploadError) throw uploadError

      const { data, error: invokeError } = await supabase.functions.invoke<{
        receipt: Receipt
        parsed: ParsedReceipt
      }>('parse-receipt', { body: { storagePath: path } })

      if (invokeError) throw new Error(await extractFunctionErrorMessage(invokeError))
      if (!data) throw new Error('No response from receipt parser')
      return data
    },
  })
}

export interface ReceiptItemDraft {
  description: string
  amount: number
  category_id: string | null
  shares: { profile_id: string; share_type: string; ratio: number }[]
}

export function useSaveReceiptItems() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      id: string
      store_name: string
      receipt_date: string
      payer_id: string
      account_id: string | null
      total_amount: number
      items: ReceiptItemDraft[]
    }) => {
      const { items, ...receipt } = input
      const { error } = await supabase.rpc('save_receipt_transactions', {
        p_receipt: receipt,
        p_items: items as unknown as Record<string, unknown>[],
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      queryClient.invalidateQueries({ queryKey: ['balance'] })
      queryClient.invalidateQueries({ queryKey: ['receipts'] })
    },
  })
}
