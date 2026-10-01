import { useEffect, useState } from 'react'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { Card, Empty, Page } from '../components/ui'
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
      {st.status === 'loading' && <Typography role="status">Loading…</Typography>}
      {st.status === 'error' && <Empty title="Could not read saved people">Storage is unavailable in this browser.</Empty>}
      {st.status === 'ready' && !st.rows.length && <Empty title="No one added yet">Add someone below, and they will be announced by name.</Empty>}
      {st.rows.length > 0 && (
        <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0, display: 'grid', gap: 1.5 }}>
          {st.rows.map((r) => {
            const n = (r.descriptors || [r.descriptor].filter(Boolean)).length
            return (
              <Card component="li" key={r.id} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
                <Avatar aria-hidden="true" sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 700 }}>{r.name?.[0]?.toUpperCase()}</Avatar>
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 700, overflowWrap: 'anywhere' }}>{r.name}</Typography>
                  <Chip size="small" variant="outlined" label={`${n} ${n === 1 ? 'look' : 'looks'}`} />
                </Box>
                <Button variant="outlined" aria-label={`Remove ${r.name}`} onClick={() => remove(r.id)}>Remove</Button>
              </Card>
            )
          })}
        </Box>
      )}

      <Card sx={{ display: 'grid', gap: 2 }}>
        <Typography component="h2" sx={{ fontWeight: 700, fontSize: '1.25rem' }}>Add someone</Typography>
        {!cameraOn && (
          <>
            <Typography color="text.secondary">
              {v.camera === 'denied' ? 'Camera permission denied. Allow camera access in your browser settings.' : v.camera === 'unavailable' ? 'Camera unavailable.' : 'Point the camera at them and ask them to turn their head slowly. Five looks are taken over a few seconds.'}
            </Typography>
            <Button variant="contained" size="large" onClick={open} disabled={v.camera === 'starting'}>Open camera</Button>
          </>
        )}
        {cameraOn && (
          <>
            <div className="frame" style={{ borderRadius: 20, margin: 0 }}><video ref={attachVideo} autoPlay playsInline muted /><canvas ref={attachOverlay} aria-hidden="true" /></div>
            {v.faces !== 'ready' && <Typography role="status">{v.faces === 'unavailable' ? 'Face recognition is unavailable, so people cannot be added.' : 'Loading face recognition…'}</Typography>}
            <TextField id="pname" label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="For example Mom" fullWidth />
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              <Button variant="contained" onClick={add} disabled={v.faces !== 'ready' || v.enrolling}>{v.enrolling ? `Look ${v.looks} of 5…` : 'Add from camera'}</Button>
              {Rec && <Button variant="outlined" onClick={say}>Say the name</Button>}
              {!running && <Button variant="outlined" onClick={stopCamera}>Close camera</Button>}
            </Box>
          </>
        )}
        <Typography role="status" color="text.secondary" sx={{ minHeight: '1.5em' }}>{msg}</Typography>
        <Typography color="text.secondary" sx={{ fontSize: '0.9rem' }}>Ask each person before adding them. In many places, recording someone&rsquo;s face needs their consent.</Typography>
      </Card>
    </Page>
  )
}