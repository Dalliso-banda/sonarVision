import { zoneFor } from '../services/sonar'
import { Page } from '../components/ui'
import { attachOverlay, attachVideo, flip } from '../services/vision'

const CAM = { off: 'Off', starting: 'Starting…', on: 'On', denied: 'Permission denied. Allow camera access in your browser settings.', unavailable: 'Unavailable' }
const LOAD = { idle: 'Not loaded', loading: 'Loading…', ready: 'Ready', unavailable: 'Unavailable' }
const LABEL = { far: 'Far', approach: 'Approach', near: 'Near', close: 'Close', contact: 'Contact' }

function describe(s, zone) {
  if (!s.connected) return { tone: 'idle', title: 'Not connected', detail: 'Waiting for the server. This page reconnects on its own.' }
  if (s.serial === false) return { tone: 'warn', title: 'Sensor not connected', detail: 'The server is running, but no sensor is sending data.' }
  if (s.lost) return { tone: 'alert', title: 'Sensor signal lost', detail: 'Distance readings have stopped. Do not rely on this screen.' }
  if (s.fast) return { tone: 'alert', title: 'Closing fast', detail: `Something is approaching at ${s.speed} cm per second.` }
  if (s.distance == null) return { tone: 'idle', title: 'Ready', detail: 'Listening for the sensor.' }
  const by = {
    contact: { tone: 'alert', title: 'Contact', detail: 'Something is touching the sensor.' },
    close: { tone: 'alert', title: 'Very close', detail: 'An obstacle is within your close boundary.' },
    near: { tone: 'warn', title: 'Close', detail: 'An obstacle is within your near boundary.' },
    approach: { tone: 'idle', title: 'Something ahead', detail: 'An obstacle is in range.' },
    far: { tone: 'idle', title: 'Clear ahead', detail: 'Nothing within range.' },
  }
  return by[zone]
}

export default function Live({ sonar: s, zones, running, onStart, onStop, vision: v }) {
  const zone = s.distance != null && !s.lost ? zoneFor(zones, s.distance).label : null
  const d = describe(s, zone)
  return (
    <Page title="Live">
      <div className="actions">
        <button className={`btn${running ? '' : ' primary'}`} onClick={running ? onStop : onStart}>{running ? 'Stop' : 'Start sound and speech'}</button>
        <span className="audio">{running ? 'Sound and speech are on' : 'Sound and speech are off'}</span>
      </div>
      <section className={`status status-${d.tone}`} role={d.tone === 'alert' ? 'alert' : 'status'}>
        <p className="status-title">{d.title}</p>
        <p className="status-detail">{d.detail}</p>
      </section>
      <div className="reading" aria-label="Nearest distance">
        <span className="num">{s.distance ?? '–'}</span><span className="unit">cm</span>
      </div>
      <ol className="zones" aria-label="Distance zones">
        {Object.entries(LABEL).map(([z, t]) => (
          <li key={z} className={z === zone ? 'on' : ''} aria-current={z === zone ? 'true' : undefined}>{t}</li>
        ))}
      </ol>
      {s.multi && (
        <dl className="sides">
          {['left', 'center', 'right'].map((c) => (
            <div key={c}><dt>{c === 'center' ? 'Centre' : c[0].toUpperCase() + c.slice(1)}</dt><dd>{s.channels[c] ?? '–'}</dd></div>
          ))}
        </dl>
      )}
      {running && (v.camera === 'denied' || v.camera === 'unavailable') && (
        <p className="degraded" role="status">{v.camera === 'denied' ? 'Camera permission denied.' : 'Camera unavailable.'} Running on the sensor only.</p>
      )}
      {v.seen && <p className="seen">In view: {v.seen}</p>}
      {v.camera === 'on' && (
        <>
          <div className="frame"><video ref={attachVideo} autoPlay playsInline muted /><canvas ref={attachOverlay} aria-hidden="true" /></div>
          <div className="actions"><button className="btn" onClick={flip}>{v.facing === 'environment' ? 'Switch to front camera' : 'Switch to rear camera'}</button></div>
        </>
      )}
      <dl className="systems">
        <dt>Camera</dt><dd>{CAM[v.camera]}</dd><dt>Objects</dt><dd>{LOAD[v.objects]}</dd><dt>Faces</dt><dd>{LOAD[v.faces]}</dd>
      </dl>
    </Page>
  )
}
