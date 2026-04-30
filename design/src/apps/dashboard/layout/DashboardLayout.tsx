import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { RequireAuth } from './RequireAuth'

export function DashboardLayout() {
  return (
    <RequireAuth>
      <div className="bg-gray-50 min-h-svh flex">
        <Sidebar />
        <div className="flex-1 min-w-0 flex flex-col">
          <TopBar />
          <main className="flex-1 px-6 lg:px-8 py-8">
            <Outlet />
          </main>
        </div>
      </div>
    </RequireAuth>
  )
}
