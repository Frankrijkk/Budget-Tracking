import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useSession } from '../features/auth/useSession'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useSession()

  if (loading) {
    return <div className="flex min-h-dvh items-center justify-center text-text-muted">Loading…</div>
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
