import { useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Slider from '@mui/material/Slider'
import Typography from '@mui/material/Typography'
import { Card, Page } from '../components/ui'
import { KEYS, read, write } from '../services/storage'
import { announce } from '../services/speech'

const MODES = [
  ['speech', 'The app speaks announcements'],
  ['screenreader', 'My screen reader reads them'],
  ['silent', 'Tones and vibration only'],
]

export default function Settings() {
  const [mode, setMode] = useState(() => read(KEYS.output, 'speech'))
  const [rate, setRate] = useState(() => Number(read(KEYS.rate, 1)) || 1)
  return (
    <Page title="Settings" intro="Saved on this device.">
      <Card>
        <Box component="fieldset" sx={{ border: 0, p: 0, m: 0, display: 'grid', gap: 1.25 }}>
          <Typography component="legend" sx={{ fontWeight: 700, fontSize: '1.25rem', mb: 1.5 }}>How announcements are delivered</Typography>
          {MODES.map(([v, t]) => (
            <Box component="label" key={v} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minHeight: 56, px: 2, borderRadius: '14px', cursor: 'pointer',
              border: 2, borderColor: mode === v ? 'secondary.main' : 'divider', bgcolor: mode === v ? 'background.paper' : 'transparent' }}>
              <input type="radio" name="mode" checked={mode === v} style={{ width: 22, height: 22, accentColor: '#A84A00' }}
                onChange={() => { setMode(v); write(KEYS.output, v) }} />
              {t}
            </Box>
          ))}
        </Box>
      </Card>

      <Card sx={{ display: 'grid', gap: 1 }}>
        <Typography id="rate-label" component="h2" sx={{ fontWeight: 700, fontSize: '1.25rem' }}>Speech rate: {rate.toFixed(1)}×</Typography>
        <Slider aria-labelledby="rate-label" min={0.7} max={3} step={0.1} value={rate} color="secondary"
          getAriaValueText={(v) => `${v.toFixed(1)} times normal speed`}
          onChange={(e, v) => { setRate(v); write(KEYS.rate, v) }} sx={{ my: 1 }} />
        <Box><Button variant="outlined" onClick={() => announce('This is how fast I will speak.', { force: true })}>Test speech</Button></Box>
      </Card>
    </Page>
  )
}