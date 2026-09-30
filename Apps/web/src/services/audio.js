// Ported from initAudioFeedback / updateSonification in public/index.html (same pitches, rhythms, gains).
import { zoneFor } from './sonar'
import { recordEvent } from './storage'

const PITCH = { far: 300, approach: 500, near: 700, close: 900, contact: 1100 }
const INTERVAL = { approach: 700, near: 350, close: 150 }
let ctx = null, osc = null, gain = null, pan = null, timer = null, beepOn = false, current = null

export function vibrate(p) { try { navigator.vibrate?.(p) } catch { /* unsupported (iOS) */ } }

// Must be called from a user gesture (browser autoplay rules).
export function startAudio() {
  if (ctx) return
  ctx = new (window.AudioContext || window.webkitAudioContext)()
  osc = ctx.createOscillator(); gain = ctx.createGain()
  osc.type = 'sine'; gain.gain.value = 0
  osc.connect(gain)
  if (ctx.createStereoPanner) { pan = ctx.createStereoPanner(); gain.connect(pan); pan.connect(ctx.destination) } else gain.connect(ctx.destination)
  osc.start()
  if (ctx.state === 'suspended') ctx.resume()
}
export function silence() {
  clearInterval(timer); timer = null; current = null
  if (gain && ctx) gain.gain.setTargetAtTime(0, ctx.currentTime, 0.05)
}
export function stopAudio() {
  silence()
  try { osc?.stop(); ctx?.close() } catch { /* already closed */ }
  ctx = osc = gain = pan = null
}
export const forgetZone = () => { current = null } // re-evaluate after calibration
export function setPan(v) { if (pan && ctx) pan.pan.setTargetAtTime(v, ctx.currentTime, 0.1) }

export function updateTone(zones, distance) {
  if (!osc || distance == null) return
  const zone = zoneFor(zones, distance), t = ctx.currentTime
  osc.frequency.setTargetAtTime(PITCH[zone.label], t, 0.05)
  if (zone.label === current) return
  recordEvent('zone', `${current || 'none'} to ${zone.label} at ${distance} cm`)
  current = zone.label
  clearInterval(timer); timer = null
  if (zone.label === 'far') gain.gain.setTargetAtTime(0, t, 0.1)
  else if (zone.label === 'contact') { gain.gain.setTargetAtTime(0.15, t, 0.05); vibrate([150, 60, 150, 60, 150]) }
  else {
    const iv = INTERVAL[zone.label]
    beepOn = false
    timer = setInterval(() => {
      beepOn = !beepOn
      gain.gain.setTargetAtTime(beepOn ? 0.15 : 0, ctx.currentTime, 0.02)
      if (beepOn) vibrate(Math.min(iv / 2, 80))
    }, iv / 2)
  }
}
