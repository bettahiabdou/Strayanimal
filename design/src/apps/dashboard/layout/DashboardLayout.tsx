import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { RequireAuth } from './RequireAuth'

export function DashboardLayout() {
  const location = useLocation()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  // Close the drawer on every route change so navigating doesn't leave the
  // off-canvas sidebar covering the destination.
  useEffect(() => {
    setMobileNavOpen(false)
  }, [location.pathname])

  // Esc closes the drawer.
  useEffect(() => {
    if (!mobileNavOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileNavOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mobileNavOpen])

  return (
    <RequireAuth>
      <div className="bg-gray-50 min-h-svh flex">
        <Sidebar mobileOpen={mobileNavOpen} onMobileClose={() => setMobileNavOpen(false)} />
        <div className="flex-1 min-w-0 flex flex-col">
          <TopBar onMobileMenuOpen={() => setMobileNavOpen(true)} />
          <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <Outlet />
          </main>
        </div>
      </div>
    </RequireAuth>
  )
}
