import { useState } from 'react'
import { Page } from '../components/ui'
import { KEYS, read, write } from '../services/storage'

const MODES = [
  ['speech', 'The app speaks announcements'],
  ['screenreader', 'My screen reader reads them'],
  ['silent', 'Tones and vibration only'],
]

export default function Settings() {
  const [mode, setMode] = useState(() => read(KEYS.output, 'speech'))
  const [rate, setRate] = useState(() => Number(read(KEYS.rate, 1)) || 1)
  return (
    <Page title="Settings" intro="Saved on this device and shared with the original app.">
      <fieldset>
        <legend>How announcements are delivered</legend>
        {MODES.map(([v, t]) => (
          <label className="choice" key={v}>
            <input type="radio" name="mode" checked={mode === v} onChange={() => { setMode(v); write(KEYS.output, v) }} />{t}
          </label>
        ))}
      </fieldset>
      <label htmlFor="rate"><strong>Speech rate: {rate.toFixed(1)}×</strong></label>
      <input id="rate" className="range" type="range" min="0.7" max="3" step="0.1" value={rate}
        onChange={(e) => { const v = Number(e.target.value); setRate(v); write(KEYS.rate, v) }} />
    </Page>
  )
}
