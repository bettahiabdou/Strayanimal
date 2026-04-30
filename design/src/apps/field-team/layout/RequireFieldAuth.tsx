import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import type { ReactNode } from 'react'

/**
 * Gate for the field-team area.
 *
 * - Empty pane while the session bootstrap (refresh-cookie probe) runs, to
 *   avoid flashing the mobile chrome before we know who's logged in.
 * - Not logged in → /field-team/login (preserves intended destination).
 * - Wrong role (ADMIN/SUPERVISOR/AGENT) → /dashboard, since this app is
 *   strictly for field teams.
 */
export function RequireFieldAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <div className="min-h-svh bg-gray-50" aria-hidden />

  if (!user) {
    return <Navigate to="/field-team/login" replace state={{ from: location }} />
  }

  if (user.role !== 'FIELD_TEAM') {
    // Avoid "wrong app" confusion — bounce dashboard users to the dashboard.
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
