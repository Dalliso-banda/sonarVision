// Same keys, database name and version as public/index.html, so data is shared.
import { DEFAULT_ZONES, zonesAreOrdered } from './sonar'

const ZONES_KEY = 'sonarVisionZones'
export function loadZones() {
  try {
    const saved = JSON.parse(localStorage.getItem(ZONES_KEY))
    if (Array.isArray(saved) && saved.length === DEFAULT_ZONES.length) {
      const merged = DEFAULT_ZONES.map((z, i) => ({ ...z, max: Number(saved[i].max) }))
      if (zonesAreOrdered(merged)) return merged
    }
  } catch { /* fall through to defaults */ }
  return DEFAULT_ZONES.map((z) => ({ ...z }))
}
export function saveZones(zones) {
  try { localStorage.setItem(ZONES_KEY, JSON.stringify(zones.map((z) => ({ max: z.max })))) } catch { /* ignore */ }
}
export const read = (k, d) => { try { return localStorage.getItem(k) ?? d } catch { return d } }
export const write = (k, v) => { try { localStorage.setItem(k, String(v)) } catch { /* ignore */ } }
export const KEYS = { output: 'sonarVisionOutputMode', rate: 'sonarVisionSpeechRate' }

function openDB() {
  return new Promise((res, rej) => {
    const r = indexedDB.open('sonarVisionFaces', 2)
    r.onupgradeneeded = () => {
      ['faces', 'events'].forEach((n) => {
        if (!r.result.objectStoreNames.contains(n)) r.result.createObjectStore(n, { keyPath: 'id', autoIncrement: true })
      })
    }
    r.onsuccess = () => res(r.result)
    r.onerror = () => rej(r.error)
  })
}
async function run(store, mode, fn) {
  const db = await openDB()
  return new Promise((res, rej) => {
    const tx = db.transaction(store, mode)
    const req = fn(tx.objectStore(store))
    tx.oncomplete = () => res(req?.result)
    tx.onerror = () => rej(tx.error)
  })
}
export const getFaces = () => run('faces', 'readonly', (s) => s.getAll())
export const removeFace = (id) => run('faces', 'readwrite', (s) => s.delete(id))
export const getEvents = async () => { await flushEvents(); return run('events', 'readonly', (s) => s.getAll()) }
export const clearEvents = () => run('events', 'readwrite', (s) => s.clear())

// Session history: same 'events' store and record shape as the original, batched writes.
let queue = []
export async function flushEvents() {
  if (!queue.length) return
  const batch = queue
  queue = []
  try {
    const db = await openDB()
    const tx = db.transaction('events', 'readwrite')
    batch.forEach((e) => tx.objectStore('events').add(e))
    await new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = () => rej(tx.error) })
  } catch { /* history must never break navigation aids */ }
}
export function recordEvent(kind, detail) {
  queue.push({ t: Date.now(), kind, detail })
  if (queue.length > 40) flushEvents()
}
setInterval(flushEvents, 10000)
window.addEventListener('pagehide', flushEvents)
export const saveFace = (name, descriptors) => run('faces', 'readwrite', (s) => s.add({ name, descriptors, addedAt: Date.now() }))
