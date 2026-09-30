// Ported from public/index.html with the same constants and maths.
export const CHANNELS = ['left', 'center', 'right']
const MEDIAN_WINDOW = 5, SPEED_WINDOW_MS = 600, FAST_CM_S = 30, CONFIRM_FRAMES = 2
export const STALE_MS = 1200, LOST_MS = 2000
export const DEFAULT_ZONES = [
  { max: 300, label: 'far' }, { max: 100, label: 'approach' }, { max: 50, label: 'near' },
  { max: 20, label: 'close' }, { max: 0, label: 'contact' },
]
export const zoneFor = (zones, d) => zones.find((z) => d > z.max) || zones[zones.length - 1]
export const zonesAreOrdered = (z) => z.every((x, i) => i === 0 || x.max < z[i - 1].max)

const median = (v) => {
  const s = [...v].sort((a, b) => a - b), m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}
const blank = () => ({ raw: [], history: [], value: null, at: 0, speed: 0, fast: 0, active: false })

export function createSonar() {
  const ch = {}
  CHANNELS.forEach((c) => (ch[c] = blank()))
  let multi = false
  const fresh = (c, now) => ch[c].active && ch[c].value !== null && now - ch[c].at < STALE_MS

  function ingest(c, cm, now) {
    const s = ch[c]
    s.active = true
    s.raw.push(cm); if (s.raw.length > MEDIAN_WINDOW) s.raw.shift()
    s.value = Math.round(median(s.raw)); s.at = now
    s.history.push({ t: now, v: s.value })
    while (s.history.length > 1 && now - s.history[0].t > SPEED_WINDOW_MS) s.history.shift()
    const first = s.history[0], last = s.history[s.history.length - 1]
    const dt = (last.t - first.t) / 1000
    s.speed = s.history.length >= 2 && dt > 0.15 ? Math.round((first.v - last.v) / dt) : 0 // + = closing
    s.fast = s.speed > FAST_CM_S ? s.fast + 1 : 0
  }

  return {
    // Accepts {distanceCm} or {left, center, right}. Returns true if a reading was used.
    push(data, now) {
      let got = false
      CHANNELS.forEach((c) => {
        const v = data[c]
        if (typeof v === 'number' && Number.isFinite(v) && v >= 0) { ingest(c, v, now); got = true; if (c !== 'center') multi = true }
      })
      if (!got && typeof data.distanceCm === 'number' && Number.isFinite(data.distanceCm)) { ingest('center', data.distanceCm, now); got = true }
      return got
    },
    snapshot(now) {
      let near = null
      CHANNELS.forEach((c) => { if (fresh(c, now) && (near === null || ch[c].value < ch[near].value)) near = c })
      return {
        multi, anyFresh: near !== null,
        distance: near ? ch[near].value : null,
        speed: near ? ch[near].speed : 0,
        fast: CHANNELS.some((c) => fresh(c, now) && ch[c].fast >= CONFIRM_FRAMES),
        channels: Object.fromEntries(CHANNELS.map((c) => [c, fresh(c, now) ? ch[c].value : null])),
        active: CHANNELS.some((c) => ch[c].active),
        lastSeen: Math.max(...CHANNELS.map((c) => ch[c].at)),
      }
    },
    reset() { CHANNELS.forEach((c) => Object.assign(ch[c], { raw: [], history: [], value: null, speed: 0, fast: 0 })) },
  }
}
