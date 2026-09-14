import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

const SYNCED_TABLES = [
  'transactions',
  'transaction_shares',
  'categories',
  'accounts',
  'receipts',
  'recurring_transactions',
  'savings_goals',
  'savings_goal_contributions',
] as const

/** Invalidates the matching query keys whenever the other phone writes data. */
export function useRealtimeSync(enabled: boolean) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!enabled) return

    const channel = supabase.channel('household-changes')

    for (const table of SYNCED_TABLES) {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        () => {
          queryClient.invalidateQueries({ queryKey: [table] })
          if (table === 'transactions' || table === 'transaction_shares') {
            queryClient.invalidateQueries({ queryKey: ['stats'] })
            queryClient.invalidateQueries({ queryKey: ['balance'] })
          }
        },
      )
    }

    channel.subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [enabled, queryClient])
}
