import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, ApiError, type ApiUser } from './api'

type AuthState = {
  user: ApiUser | null
  /** True until the initial bootstrap (refresh-cookie probe) completes. */
  loading: boolean
  login: (email: string, password: string) => Promise<ApiUser>
  logout: () => Promise<void>
}

const AuthCtx = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null)
  const [loading, setLoading] = useState(true)

  // On mount, probe /auth/refresh + /auth/me to restore session if cookie is valid.
  useEffect(() => {
    let cancelled = false
    api
      .bootstrap()
      .then((u) => {
        if (!cancelled) setUser(u)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const value: AuthState = {
    user,
    loading,
    async login(email, password) {
      try {
        const data = await api.login(email, password)
        setUser(data.user)
        return data.user
      } catch (e) {
        // Surface meaningful error message to the form
        if (e instanceof ApiError) throw e
        throw new ApiError(0, 'NETWORK', 'Connexion impossible. Vérifiez votre réseau.')
      }
    },
    async logout() {
      await api.logout()
      setUser(null)
    },
  }

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
