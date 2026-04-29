import { Routes, Route } from 'react-router-dom'
import { DashboardLayout } from './layout/DashboardLayout'
import { Login } from './screens/Login'
import { Overview } from './screens/Overview'
import { Triage } from './screens/Triage'
import { Reports } from './screens/Reports'
import { Carte } from './screens/Carte'
import { Teams } from './screens/Teams'
import { Stats } from './screens/Stats'
import { Heatmap } from './screens/Heatmap'
import { Users } from './screens/Users'
import { Settings } from './screens/Settings'
import { AuditLog } from './screens/AuditLog'

export function DashboardApp() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<DashboardLayout />}>
        <Route index element={<Overview />} />
        <Route path="triage" element={<Triage />} />
        <Route path="reports" element={<Reports />} />
        <Route path="map" element={<Carte />} />
        <Route path="teams" element={<Teams />} />
        <Route path="stats" element={<Stats />} />
        <Route path="heatmap" element={<Heatmap />} />
        <Route path="users" element={<Users />} />
        <Route path="settings" element={<Settings />} />
        <Route path="audit" element={<AuditLog />} />
      </Route>
    </Routes>
  )
}
