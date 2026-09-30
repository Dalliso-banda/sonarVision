import { useEffect, useState } from 'react'
import { Empty, Page } from '../components/ui'
import { getFaces, removeFace } from '../services/storage'
import { attachOverlay, attachVideo, enroll, init, reloadFaces, startCamera, stopCamera } from '../services/vision'

const Rec = window.SpeechRecognition || window.webkitSpeechRecognition

export default function People({ vision: v, running }) {
  const [st, setSt] = useState({ status: 'loading', rows: [] })
  const [name, setName] = useState('')
  const [msg, setMsg] = useState('')
  const load = () => getFaces().then((rows) => setSt({ status: 'ready', rows }), () => setSt({ status: 'error', rows: [] }))
  useEffect(() => { load() }, [])

  const open = async () => { setMsg(''); await init(); await startCamera() }
  const add = async () => {
    if (!name.trim()) return setMsg('Enter or say a name first.')
    const r = await enroll(name.trim())
    setMsg(r.ok ? `${name.trim()} added with ${r.looks} looks.` : r.reason === 'noface' ? 'No face found. Point the camera at them and try again.' : 'Adding failed. Try again.')
    if (r.ok) { setName(''); load() }
  }
  const say = () => {
    const r = new Rec()
    r.lang = navigator.language || 'en-US'; r.interimResults = false; r.maxAlternatives = 1
    r.onresult = (e) => setName(e.results[0][0].transcript.trim().replace(/[.?!]$/, ''))
    r.onerror = () => setMsg('Could not catch that. Type the name instead.')
    try { r.start() } catch { /* already listening */ }
  }
  const remove = async (id) => { await removeFace(id); await reloadFaces(); load() }
  const cameraOn = v.camera === 'on'

  return (
    <Page title="People" intro="People you add are announced by name. Faces are stored on this device as numbers, not photos.">
      {st.status === 'loading' && <p role="status">Loading…</p>}
      {st.status === 'error' && <Empty title="Could not read saved people">Storage is unavailable in this browser.</Empty>}
      {st.status === 'ready' && !st.rows.length && <Empty title="No one added yet">Add someone below, and they will be announced by name.</Empty>}
      {st.rows.length > 0 && (
        <ul className="rows">
          {st.rows.map((r) => {
            const n = (r.descriptors || [r.descriptor].filter(Boolean)).length
            return (
              <li key={r.id}>
                <span>{r.name}<small>{n} {n === 1 ? 'look' : 'looks'}</small></span>
                <button className="btn" aria-label={`Remove ${r.name}`} onClick={() => remove(r.id)}>Remove</button>
              </li>
            )
          })}
        </ul>
      )}
      <section className="step">
        <h2>Add someone</h2>
        {!cameraOn && (
          <>
            <p>{v.camera === 'denied' ? 'Camera permission denied. Allow camera access in your browser settings.' : v.camera === 'unavailable' ? 'Camera unavailable.' : 'Point the camera at them and ask them to turn their head slowly. Five looks are taken over a few seconds.'}</p>
            <button className="btn primary" onClick={open} disabled={v.camera === 'starting'}>Open camera</button>
          </>
        )}
        {cameraOn && (
          <>
            <div className="frame"><video ref={attachVideo} autoPlay playsInline muted /><canvas ref={attachOverlay} aria-hidden="true" /></div>
            {v.faces !== 'ready' && <p role="status">{v.faces === 'unavailable' ? 'Face recognition is unavailable, so people cannot be added.' : 'Loading face recognition…'}</p>}
            <label htmlFor="pname"><strong>Name</strong></label>
            <input id="pname" className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="For example Mom" />
            <div className="actions">
              <button className="btn primary" onClick={add} disabled={v.faces !== 'ready' || v.enrolling}>{v.enrolling ? `Look ${v.looks} of 5…` : 'Add from camera'}</button>
              {Rec && <button className="btn" onClick={say}>Say the name</button>}
              {!running && <button className="btn" onClick={stopCamera}>Close camera</button>}
            </div>
          </>
        )}
        <p className="msg" role="status">{msg}</p>
        <p className="note">Ask each person before adding them. In many places, recording someone&rsquo;s face needs their consent.</p>
      </section>
    </Page>
  )
}
