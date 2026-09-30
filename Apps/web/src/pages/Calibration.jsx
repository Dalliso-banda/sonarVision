import { useState } from 'react'
import { Page } from '../components/ui'
import { DEFAULT_ZONES } from '../services/sonar'
import { saveZones } from '../services/storage'

const STEPS = [
  { i: 1, title: 'Approach', help: 'Where the sensor should start noticing something. Hold an object at that distance.' },
  { i: 2, title: 'Near', help: 'Where you want to slow down. Hold an object at that distance.' },
  { i: 3, title: 'Close', help: 'Where you must stop. Hold an object at that distance.' },
]

export default function Calibration({ sonar: s, zones, setZones }) {
  const [msg, setMsg] = useState('')
  const apply = (next, text) => { setZones(next); saveZones(next); setMsg(text) }

  const set = ({ i, title }) => {
    if (s.distance == null) return setMsg('No sensor reading yet. Check the connection on the Live page.')
    const requested = Math.round(s.distance) // clamped so zones stay in order, as in the original
    const v = Math.max(zones[i + 1].max + 1, Math.min(zones[i - 1].max - 1, requested))
    apply(zones.map((z, k) => (k === i ? { ...z, max: v } : z)),
      `${title} set to ${v} cm${v !== requested ? `, adjusted from ${requested} to keep the zones in order` : ''}.`)
  }

  return (
    <Page title="Calibration" intro="Set the distances that suit your reach. Hold something in front of the sensor, then confirm each step.">
      <p className="msg" role="status">{msg}</p>
      {STEPS.map((st) => (
        <section className="step" key={st.i}>
          <h2>{st.title}: {zones[st.i].max} cm</h2>
          <p>{st.help}</p>
          <button className="btn primary" onClick={() => set(st)}>
            {s.distance != null ? `Use current distance (${s.distance} cm)` : 'Use current distance'}
          </button>
        </section>
      ))}
      <button className="btn" onClick={() => apply(DEFAULT_ZONES.map((z) => ({ ...z })), 'Zones reset to defaults.')}>Reset to defaults</button>
    </Page>
  )
}
