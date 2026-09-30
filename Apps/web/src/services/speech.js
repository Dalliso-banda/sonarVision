// Ported from announce()/speak()/unlockSpeech() in public/index.html.
// Output mode and rate are read from the shared localStorage keys on every call.
import { KEYS, read, recordEvent } from './storage'
import { vibrate } from './audio'

const SPEECH_COOLDOWN_MS = 3000, STOP_COOLDOWN_MS = 2000
let lastSpoken = 0, lastStop = 0

// force: user-initiated, bypasses cooldown.
export function announce(text, { urgent = false, force = false } = {}) {
  const now = Date.now()
  if (!force) {
    if (urgent) { if (now - lastStop < STOP_COOLDOWN_MS) return; lastStop = now }
    else { if (now - lastSpoken < SPEECH_COOLDOWN_MS) return; lastSpoken = now }
  }
  if (urgent) vibrate([100, 50, 100, 50, 100])
  recordEvent(urgent ? 'alert' : 'announce', text)
  const mode = read(KEYS.output, 'speech')
  if (mode === 'silent') return
  if (mode === 'screenreader') { window.dispatchEvent(new CustomEvent('sv-announce', { detail: { text, urgent } })); return }
  speak(text, urgent)
}

function speak(text, urgent) {
  const synth = window.speechSynthesis
  if (!synth) return
  if (urgent && synth.speaking) synth.cancel()
  else if (!urgent && synth.speaking) return
  const u = new SpeechSynthesisUtterance(text)
  u.rate = Math.min(3, (Number(read(KEYS.rate, 1)) || 1) * (urgent ? 1.15 : 1))
  u.pitch = urgent ? 1.2 : 1
  setTimeout(() => synth.speak(u), urgent ? 60 : 0) // iOS drops speak() right after cancel()
}

export function unlockSpeech() {
  const u = new SpeechSynthesisUtterance('ready')
  u.volume = 0.01
  window.speechSynthesis?.speak(u)
}
// iOS Safari lets the queue go dead when idle; resume() nudges it.
export const keepSpeechAlive = () => setInterval(() => { if (window.speechSynthesis?.paused) window.speechSynthesis.resume() }, 8000)
