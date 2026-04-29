import { Routes, Route } from 'react-router-dom'
import { MobileShell } from './layout/MobileShell'
import { Login } from './screens/Login'
import { Inbox } from './screens/Inbox'
import { MissionDetail } from './screens/MissionDetail'
import { History } from './screens/History'
import { Profile } from './screens/Profile'

export function FieldTeamApp() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<MobileShell />}>
        <Route index element={<Inbox />} />
        <Route path="mission/:id" element={<MissionDetail />} />
        <Route path="history" element={<History />} />
        <Route path="profile" element={<Profile />} />
      </Route>
    </Routes>
  )
}
