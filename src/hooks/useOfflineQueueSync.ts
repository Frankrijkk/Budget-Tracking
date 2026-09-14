import { useEffect, useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getQueuedTransactions, removeFromQueue } from '../lib/offlineQueue'
import { saveTransactionRemote } from '../features/transactions/useTransactions'

/** Drains the offline transaction queue whenever the app comes back online. */
export function useOfflineQueueSync() {
  const queryClient = useQueryClient()
  const [pendingCount, setPendingCount] = useState(0)

  const refreshCount = useCallback(async () => {
    setPendingCount((await getQueuedTransactions()).length)
  }, [])

  const drain = useCallback(async () => {
    const queue = await getQueuedTransactions()
    for (const item of queue) {
      try {
        await saveTransactionRemote(item.input)
        await removeFromQueue(item.localId)
      } catch {
        // Still offline or the server rejected it -- leave it queued and
        // stop; we'll retry the whole queue next time we're back online.
        break
      }
    }
    await refreshCount()
    queryClient.invalidateQueries({ queryKey: ['transactions'] })
    queryClient.invalidateQueries({ queryKey: ['stats'] })
    queryClient.invalidateQueries({ queryKey: ['balance'] })
  }, [queryClient, refreshCount])

  useEffect(() => {
    refreshCount()
    if (navigator.onLine) drain()

    window.addEventListener('online', drain)
    return () => window.removeEventListener('online', drain)
  }, [drain, refreshCount])

  return { pendingCount, drain }
}
