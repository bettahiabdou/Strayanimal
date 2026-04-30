import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './lib/auth-context'
import { PreviewHub } from './preview/PreviewHub'
import { CitizenApp } from './apps/citizen/CitizenApp'
import { DashboardApp } from './apps/dashboard/DashboardApp'
import { FieldTeamApp } from './apps/field-team/FieldTeamApp'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<PreviewHub />} />
        <Route path="/citizen/*" element={<CitizenApp />} />
        <Route path="/dashboard/*" element={<DashboardApp />} />
        <Route path="/field-team/*" element={<FieldTeamApp />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
