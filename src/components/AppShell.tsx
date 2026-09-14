import { Outlet } from 'react-router-dom'
import { CloudOff } from 'lucide-react'
import { BottomNav } from './BottomNav'
import { useOfflineQueueSync } from '../hooks/useOfflineQueueSync'

export function AppShell() {
  const { pendingCount } = useOfflineQueueSync()

  return (
    <div className="min-h-dvh bg-bg pb-20">
      {pendingCount > 0 && (
        <div className="flex items-center justify-center gap-1.5 bg-accent/15 py-1.5 text-xs text-accent">
          <CloudOff size={12} />
          {pendingCount} transaction{pendingCount > 1 ? 's' : ''} waiting to sync
        </div>
      )}
      <main className="mx-auto max-w-md px-4 pt-[calc(env(safe-area-inset-top)+1rem)]">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
