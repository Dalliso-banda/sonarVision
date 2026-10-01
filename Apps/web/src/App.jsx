import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

import AppLayout from './components/AppLayout'
import { useSonar } from './hooks/useSonar'
import { useVision } from './hooks/useVision'
import { useFeedback } from './hooks/useFeedback'
import { useSession } from './hooks/useSession'
import { loadZones } from './services/storage'

import Live from './pages/Live'
import People from './pages/People'
import Calibration from './pages/Calibration'
import History from './pages/History'
import Settings from './pages/Settings'
import Landing from './pages/LandingPage'

export default function App() {
  const sonar = useSonar()
  const vision = useVision()
  const session = useSession()
  const [zones, setZones] = useState(loadZones)
  useFeedback(sonar, zones, session.running)

  return (
    <Routes>
      {/* Full-screen landing page: no nav, no padded layout */}
      <Route path="/" element={<Landing />} />

      {/* Everything else lives inside the layout */}
      <Route
        path="/*"
        element={
          <AppLayout sonar={sonar}>
            <Routes>
              <Route
                path="/live"
                element={
                  <Live
                    sonar={sonar}
                    zones={zones}
                    running={session.running}
                    onStart={session.start}
                    onStop={session.stop}
                    vision={vision}
                  />
                }
              />
              <Route path="/people" element={<People vision={vision} running={session.running} />} />
              <Route path="/calibration" element={<Calibration sonar={sonar} zones={zones} setZones={setZones} />} />
              <Route path="/history" element={<History />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/live" replace />} />
            </Routes>
          </AppLayout>
        }
      />
    </Routes>
  )
}