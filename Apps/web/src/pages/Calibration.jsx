import { useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { Card, Page } from '../components/ui'
import { DEFAULT_ZONES } from '../services/sonar'
import { saveZones } from '../services/storage'

const STEPS = [
  { i: 1, title: 'Approach', help: 'Where the sensor should start noticing something. Hold an object at that distance.' },
  { i: 2, title: 'Near', help: 'Where you want to slow down. Hold an object at that distance.' },
  { i: 3, title: 'Close', help: 'Where you must stop. Hold an object at that distance.' },
]
const SHADES = ['background.paper', 'primary.light', 'primary.main', 'primary.dark', 'error.main'] // far to contact

// Visual only (the numbers are in the headings): zones drawn to scale, far on the left.
function Ruler({ zones }) {
  const total = zones[0].max / 0.8 // leave 20% of the bar for "far"
  const edges = [total, zones[0].max, zones[1].max, zones[2].max, zones[3].max, 0]
  return (
    <Box aria-hidden="true" sx={{ position: 'relative', mb: 3 }}>
      <Box sx={{ display: 'flex', flexDirection: 'row-reverse', height: 16, borderRadius: 8, overflow: 'hidden', border: 1, borderColor: 'divider' }}>
        {SHADES.map((bg, k) => (
          <Box key={k} sx={{ width: `${((edges[k] - edges[k + 1]) / total) * 100}%`, bgcolor: bg }} />
        ))}
      </Box>
      {zones.slice(0, 4).map((z) => (
        <Typography key={z.label} component="span" sx={{ position: 'absolute', top: 20, left: `${(z.max / total) * 100}%`, transform: 'translateX(-50%)', fontSize: '0.75rem', color: 'text.secondary' }}>
          {z.max}
        </Typography>
      ))}
    </Box>
  )
}

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
      <Card>
        <Ruler zones={zones} />
        <Typography role="status" color="text.secondary" sx={{ minHeight: '1.5em' }}>{msg}</Typography>
      </Card>
      {STEPS.map((st) => (
        <Card key={st.i} sx={{ display: 'grid', gap: 1.5 }}>
          <Typography component="h2" sx={{ fontSize: '1.25rem', fontWeight: 700 }}>{st.title}: {zones[st.i].max} cm</Typography>
          <Typography color="text.secondary">{st.help}</Typography>
          <Button variant="contained" size="large" onClick={() => set(st)}>
            {s.distance != null ? `Use current distance (${s.distance} cm)` : 'Use current distance'}
          </Button>
        </Card>
      ))}
      <Button sx={{mb:7}} variant="outlined" size="large" onClick={() => apply(DEFAULT_ZONES.map((z) => ({ ...z })), 'Zones reset to defaults.')}>Reset to defaults</Button>
    </Page>
  )
}