import { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlined'
import SensorsIcon from '@mui/icons-material/Sensors'
import SensorsOffIcon from '@mui/icons-material/SensorsOff'
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver'
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutlined'
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import { Card, Empty, Page } from '../components/ui'
import { clearEvents, getEvents } from '../services/storage'

const KIND_ICON = { alert: ErrorOutlineIcon, zone: SensorsIcon, sensor: SensorsOffIcon, announce: RecordVoiceOverIcon, session: PlayCircleOutlineIcon, enroll: PersonAddAltIcon }

export default function History() {
  const [st, setSt] = useState({ status: 'loading', rows: [] })
  const load = () => getEvents().then((rows) => setSt({ status: 'ready', rows: rows.sort((a, b) => b.t - a.t) }), () => setSt({ status: 'error', rows: [] }))
  useEffect(() => { load() }, [])

  const exportJson = () => {
    const rows = st.rows.map((r) => ({ ...r, time: new Date(r.t).toISOString() }))
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' }))
    a.download = 'sonar-vision-history.json'
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 5000)
  }
  const alerts = st.rows.filter((r) => r.kind === 'alert').length
  const groups = st.rows.slice(0, 100).reduce((acc, r) => {
    const day = new Date(r.t).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })
    ;(acc[day] ||= []).push(r)
    return acc
  }, {})

  return (
    <Page title="History" intro="Zone changes and alerts recorded on this device, useful for tuning distances after a walk.">
      {st.status === 'loading' && <Typography role="status">Loading…</Typography>}
      {st.status === 'error' && <Empty title="Could not read history">Storage is unavailable in this browser.</Empty>}
      {st.status === 'ready' && !st.rows.length && <Empty title="Nothing recorded yet">Events appear here after a session.</Empty>}
      {st.rows.length > 0 && (
        <>
          <Typography color="text.secondary">{st.rows.length} events, {alerts} alerts. Showing the latest 100.</Typography>
          {Object.entries(groups).map(([day, rows]) => (
            <Card key={day} sx={{ p: 2 }}>
              <Typography component="h2" sx={{ fontWeight: 700, fontSize: '1.05rem', mb: 1 }}>{day}</Typography>
              <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
                {rows.map((r) => {
                  const Icon = KIND_ICON[r.kind] || InfoOutlinedIcon
                  return (
                    <Box component="li" key={r.id} sx={{ display: 'flex', gap: 1.5, alignItems: 'center', py: 1.25, borderTop: 1, borderColor: 'divider', overflowWrap: 'anywhere' }}>
                      <Icon aria-hidden="true" sx={{ color: r.kind === 'alert' ? 'error.main' : 'text.secondary' }} />
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography>{r.detail}</Typography>
                        <Typography color="text.secondary" sx={{ fontSize: '0.8rem' }}>{r.kind}</Typography>
                      </Box>
                      <Typography color="text.secondary" sx={{ fontSize: '0.85rem', flexShrink: 0 }}>{new Date(r.t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Typography>
                    </Box>
                  )
                })}
              </Box>
            </Card>
          ))}
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button variant="contained" onClick={exportJson}>Export</Button>
            <Button variant="outlined" onClick={() => window.confirm('Clear all history on this device?') && clearEvents().then(load)}>Clear</Button>
          </Box>
        </>
      )}
    </Page>
  )
}