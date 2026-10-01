import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import StopIcon from '@mui/icons-material/Stop'
import ReportProblemIcon from '@mui/icons-material/ReportProblem'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined'
import SensorsIcon from '@mui/icons-material/Sensors'
import VisibilityIcon from '@mui/icons-material/Visibility'
import { zoneFor } from '../services/sonar'
import { Card, Page } from '../components/ui'
import { attachOverlay, attachVideo, flip } from '../services/vision'

const CAM = { off: 'Off', starting: 'Starting', on: 'On', denied: 'Denied', unavailable: 'Unavailable' }
const LOAD = { idle: 'Not loaded', loading: 'Loading', ready: 'Ready', unavailable: 'Unavailable' }
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

// The state shows as a filled card (colour) plus an icon and a title (shape and words).
const TONE_SX = {
  idle: {},
  warn: { bgcolor: '#F2C14E', borderColor: '#F2C14E', color: 'text.primary' },
  alert: { bgcolor: 'error.main', borderColor: 'error.main', color: 'error.contrastText' },
}
const chipColor = (v) => (['on', 'ready'].includes(v) ? 'success' : ['denied', 'unavailable'].includes(v) ? 'error' : 'default')

export default function Live({ sonar: s, zones, running, onStart, onStop, vision: v }) {
  const zone = s.distance != null && !s.lost ? zoneFor(zones, s.distance).label : null
  const d = describe(s, zone)
  const Icon = d.tone === 'alert' ? ReportProblemIcon : d.tone === 'warn' ? WarningAmberIcon : zone === 'far' ? CheckCircleOutlineIcon : SensorsIcon

  return (
    <Page title="Live">
      <Box>
        <Button fullWidth size="large" variant={running ? 'outlined' : 'contained'} startIcon={running ? <StopIcon /> : <PlayArrowIcon />}
          onClick={running ? onStop : onStart} sx={{ minHeight: 60, borderRadius: '20px', fontSize: '1.1rem' }}>
          {running ? 'Stop' : 'Start sound and speech'}
        </Button>
        <Typography color="text.secondary" sx={{ mt: 1, textAlign: 'center', fontSize: '0.9rem' }}>
          {running ? 'Sound and speech are on' : 'Sound and speech are off'}
        </Typography>
      </Box>

      <Card role={d.tone === 'alert' ? 'alert' : 'status'} sx={{ display: 'flex', gap: 2, alignItems: 'center', ...TONE_SX[d.tone] }}>
        <Icon aria-hidden="true" sx={{ fontSize: 44, flexShrink: 0 }} />
        <Box>
          <Typography sx={{ fontSize: 'clamp(1.5rem, 5vw, 2.2rem)', fontWeight: 700, lineHeight: 1.15 }}>{d.title}</Typography>
          <Typography sx={{ opacity: d.tone === 'idle' ? 1 : 0.95 }} color={d.tone === 'idle' ? 'text.secondary' : 'inherit'}>{d.detail}</Typography>
        </Box>
      </Card>

      <Card role="group" aria-label="Nearest distance" sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 1, py: 3 }}>
        <Typography component="span" sx={{ fontSize: 'clamp(4rem, 18vw, 7rem)', fontWeight: 700, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
          {s.distance ?? '–'}
        </Typography>
        <Typography component="span" color="text.secondary" sx={{ fontSize: '1.4rem' }}>cm</Typography>
      </Card>

      <Box component="ol" aria-label="Distance zones" sx={{ listStyle: 'none', p: 0, m: 0, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 0.75 }}>
        {Object.entries(LABEL).map(([z, t]) => {
          const on = z === zone
          return (
            <Box component="li" key={z} aria-current={on ? 'true' : undefined}
              sx={{
                py: 1.25, px: 0.5, textAlign: 'center', borderRadius: '12px', border: 1, fontSize: 'clamp(0.7rem, 2.8vw, 0.85rem)', fontWeight: on ? 700 : 400,
                bgcolor: on ? 'primary.main' : 'background.paper', color: on ? 'primary.contrastText' : 'text.secondary', borderColor: on ? 'primary.dark' : 'divider'
              }}>
              {t}
            </Box>
          )
        })}
      </Box>

      {s.multi && (
        <Box component="dl" sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.5, m: 0 }}>
          {['left', 'center', 'right'].map((c) => (
            <Card component="div" key={c} sx={{ p: 1.5, textAlign: 'center' }}>
              <Typography component="dt" color="text.secondary" sx={{ fontSize: '0.85rem' }}>{c === 'center' ? 'Centre' : c[0].toUpperCase() + c.slice(1)}</Typography>
              <Typography component="dd" sx={{ m: 0, fontSize: '1.6rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{s.channels[c] ?? '–'}</Typography>
            </Card>
          ))}
        </Box>
      )}

      {running && (v.camera === 'denied' || v.camera === 'unavailable') && (
        <Card role="status" sx={{ bgcolor: '#FFF3CD', borderColor: '#F2C14E' }}>
          {v.camera === 'denied' ? 'Camera permission denied.' : 'Camera unavailable.'} Running on the sensor only.
        </Card>
      )}

      {v.seen && (
        <Card sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <VisibilityIcon aria-hidden="true" color="secondary" />
          <Typography sx={{ fontSize: '1.25rem', fontWeight: 700 }}>In view: {v.seen}</Typography>
        </Card>
      )}

      {v.camera === 'on' && (
        <Box>
          <div className="frame" style={{ borderRadius: 20 }}><video ref={attachVideo} autoPlay playsInline muted /><canvas ref={attachOverlay} aria-hidden="true" /></div>
          <Button variant="outlined" onClick={flip}>{v.facing === 'environment' ? 'Switch to front camera' : 'Switch to rear camera'}</Button>
        </Box>
      )}

      <Box component="dl" sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, m: 0 }}>
        {[['Camera', CAM[v.camera], v.camera], ['Objects', LOAD[v.objects], v.objects], ['Faces', LOAD[v.faces], v.faces]].map(([k, label, raw]) => (
          <Chip key={k} variant="outlined" color={chipColor(raw)} label={`${k}: ${label}`} />
        ))}
      </Box>
    </Page>
  )
}