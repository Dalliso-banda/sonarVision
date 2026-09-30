import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { createSonar, LOST_MS } from '../services/sonar'

const initial = { connected: false, serial: null, lost: false, multi: false, distance: null, speed: 0, fast: false, channels: {} }

// Consumes the existing server.js events: 'distance' ({distanceCm} or {left,center,right}).
// `serial` mirrors the `connected` flag server.js includes in each payload.
export function useSonar() {
  const [state, setState] = useState(initial)
  useEffect(() => {
    const sonar = createSonar()
    const socket = io()
    let lost = false, serial = null
    const publish = (extra) => {
      const s = sonar.snapshot(Date.now())
      setState((p) => ({ ...p, ...extra, serial, lost, multi: s.multi, distance: s.distance, speed: s.speed, fast: s.fast && !lost, channels: s.channels }))
    }
    socket.on('connect', () => publish({ connected: true }))
    socket.on('disconnect', () => publish({ connected: false }))
    socket.on('distance', (d) => {
      if (!d) return
      if (typeof d.connected === 'boolean') serial = d.connected
      if (sonar.push(d, Date.now())) lost = false
      publish()
    })
    // Watchdog, same thresholds as the original: flag lost after LOST_MS of silence.
    const timer = setInterval(() => {
      const now = Date.now(), s = sonar.snapshot(now)
      if (s.active && !s.anyFresh && !lost && now - s.lastSeen > LOST_MS) { lost = true; sonar.reset() }
      publish()
    }, 300)
    return () => { clearInterval(timer); socket.close() }
  }, [])
  return state
}
