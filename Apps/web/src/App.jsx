import { useEffect, useState } from 'react'
import { useSonar } from './hooks/useSonar'
import { loadZones } from './services/storage'
import { useVision } from './hooks/useVision'
import { start as startVision, stopCamera } from './services/vision'
import { useFeedback } from './hooks/useFeedback'
import { startAudio, stopAudio } from './services/audio'
import { announce, keepSpeechAlive, unlockSpeech } from './services/speech'
import { recordEvent } from './services/storage'
import Live from './pages/Live'
import People from './pages/People'
import Calibration from './pages/Calibration'
import History from './pages/History'
import Settings from './pages/Settings'

const TABS = [['live', 'Live'], ['people', 'People'], ['calibration', 'Calibration'], ['history', 'History'], ['settings', 'Settings']]

function useHash() {
  const get = () => window.location.hash.slice(1)
  const [h, setH] = useState(get)
  useEffect(() => {
    const f = () => setH(get())
    window.addEventListener('hashchange', f)
    return () => window.removeEventListener('hashchange', f)
  }, [])
  return TABS.some((t) => t[0] === h) ? h : 'live'
}

// Screen-reader output mode: announcements land in these live regions instead of speechSynthesis.
function LiveRegions() {
  const [p, setP] = useState(''), [u, setU] = useState('')
  useEffect(() => {
    const f = (e) => {
      const set = e.detail.urgent ? setU : setP
      set(''); setTimeout(() => set(e.detail.text), 30) // clear first so repeats re-announce
    }
    window.addEventListener('sv-announce', f)
    return () => window.removeEventListener('sv-announce', f)
  }, [])
  return (<><div className="sr" role="status" aria-live="polite" aria-atomic="true">{p}</div><div className="sr" role="alert" aria-live="assertive" aria-atomic="true">{u}</div></>)
}

export default function App() {
  const page = useHash()
  const sonar = useSonar()
  const [zones, setZones] = useState(loadZones)
  const vision = useVision()
  const [running, setRunning] = useState(false)
  useFeedback(sonar, zones, running)
  useEffect(() => { const id = keepSpeechAlive(); return () => { clearInterval(id); stopAudio(); stopCamera() } }, [])
  const start = () => { unlockSpeech(); startAudio(); setRunning(true); recordEvent('session', 'started'); announce('Sonar Vision running.', { force: true }); startVision() }
  const stop = () => { stopAudio(); stopCamera(); setRunning(false); recordEvent('session', 'stopped') }
  const critical = sonar.fast || sonar.lost

  return (
    <div className="app">
      <a className="skip" href="#live" onClick={(e) => { e.preventDefault(); document.getElementById('main').focus() }}>Skip to content</a>
      <LiveRegions />
      <nav aria-label="Main">
        <a className="brand" href="#live">Sonar Vision</a>
        <ul>
          {TABS.map(([id, label]) => (
            <li key={id}><a href={`#${id}`} aria-current={id === page ? 'page' : undefined}>{label}</a></li>
          ))}
        </ul>
      </nav>
      <main id="main" tabIndex={-1}>
        {critical && page !== 'live' && (
          <div className="banner" role="alert">
            {sonar.lost ? 'Sensor signal lost.' : 'Something is closing fast.'} <a href="#live">Go to Live</a>
          </div>
        )}
        {page === 'live' && <Live sonar={sonar} zones={zones} running={running} onStart={start} onStop={stop} vision={vision} />}
        {page === 'people' && <People vision={vision} running={running} />}
        {page === 'calibration' && <Calibration sonar={sonar} zones={zones} setZones={setZones} />}
        {page === 'history' && <History />}
        {page === 'settings' && <Settings />}
      </main>
    </div>
  )
}
