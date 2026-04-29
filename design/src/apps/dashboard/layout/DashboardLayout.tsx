import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

export function DashboardLayout() {
  return (
    <div className="bg-gray-50 min-h-svh flex">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar />
        <main className="flex-1 px-6 lg:px-8 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
