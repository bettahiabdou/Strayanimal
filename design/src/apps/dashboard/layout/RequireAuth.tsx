import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import type { ReactNode } from 'react'

/**
 * Gate for the authenticated dashboard area.
 *
 * - While bootstrapping the session (refresh-cookie probe), shows nothing
 *   (an empty bg) to avoid a flicker of the dashboard chrome.
 * - If the user is not logged in once bootstrap finishes, redirects to /dashboard/login,
 *   preserving where they were trying to go.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div className="min-h-svh bg-gray-50" aria-hidden />
  }

  if (!user) {
    return <Navigate to="/dashboard/login" replace state={{ from: location }} />
  }

  return <>{children}</>
}
