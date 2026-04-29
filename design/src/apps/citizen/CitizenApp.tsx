import { Routes, Route } from 'react-router-dom'
import { CitizenLanding } from './screens/CitizenLanding'

export function CitizenApp() {
  return (
    <Routes>
      <Route path="/" element={<CitizenLanding />} />
    </Routes>
  )
}
