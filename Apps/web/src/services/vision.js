// Camera, COCO-SSD, face-api and enrolment, ported from public/index.html.
// Same CDN libraries, same load order, thresholds, intervals and stored record shape.
// A singleton (not React state) because the loops run independently of any page.
import { announce } from './speech'
import { getFaces, recordEvent, saveFace } from './storage'

const SCRIPTS = [
  'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.10.0/dist/tf.min.js',
  'https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.2/dist/coco-ssd.min.js',
  // face-api ships its own TFJS and reassigns global `tf`, so it MUST load after coco-ssd.
  'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/dist/face-api.js',
]
const FACE_MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model'
const DETECT_MS = 300, FACE_MS = 500, FACE_IDLE_MS = 1500, CONF = 0.6, MATCH = 0.55
const DET_STALE = DETECT_MS * 2.5, FACE_STALE = FACE_MS * 2.5, SAMPLES = 5, SAMPLE_GAP = 800
const RELEVANT = new Set(['person', 'bicycle', 'car', 'motorcycle', 'bus', 'truck', 'bench', 'chair', 'couch', 'bed',
  'dining table', 'toilet', 'potted plant', 'backpack', 'handbag', 'suitcase', 'refrigerator', 'oven', 'sink', 'tv',
  'dog', 'cat', 'traffic light', 'stop sign', 'fire hydrant'])

let state = { camera: 'off', objects: 'idle', faces: 'idle', facing: 'environment', enrolling: false, looks: 0, seen: null, people: 0 }
const subs = new Set()
const set = (p) => { state = { ...state, ...p }; subs.forEach((f) => f()) }
export const subscribe = (f) => { subs.add(f); return () => subs.delete(f) }
export const getSnapshot = () => state

let video = null, overlay = null, stream = null, model = null, matcher = null, loading = null, loopsOn = false
let dets = [], detsAt = 0, faces = [], facesAt = 0, person = false

const loadScript = (src) => new Promise((res) => {
  const s = document.createElement('script')
  s.src = src; s.onload = () => res(true); s.onerror = () => res(false)
  document.head.appendChild(s)
})

// Loads libraries then both model sets in parallel; each fails independently (graceful degradation).
export function init() {
  loading ||= (async () => {
    set({ objects: 'loading', faces: 'loading' })
    for (const src of SCRIPTS) await loadScript(src)
    await Promise.all([loadObjects(), loadFaces()])
  })()
  return loading
}
async function loadObjects() {
  try { if (!window.cocoSsd) throw new Error('missing'); model = await window.cocoSsd.load(); set({ objects: 'ready' }) }
  catch { model = null; set({ objects: 'unavailable' }) }
}
async function loadFaces() {
  try {
    const f = window.faceapi
    if (!f) throw new Error('missing')
    await f.nets.tinyFaceDetector.loadFromUri(FACE_MODEL_URL)
    await f.nets.faceLandmark68Net.loadFromUri(FACE_MODEL_URL)
    await f.nets.faceRecognitionNet.loadFromUri(FACE_MODEL_URL)
    set({ faces: 'ready' })
    await reloadFaces()
  } catch { set({ faces: 'unavailable' }) }
}

export async function reloadFaces() {
  let rows
  try { rows = await getFaces() } catch { return }
  set({ people: rows.length })
  const f = window.faceapi
  if (!f || state.faces !== 'ready') return
  const by = {}
  rows.forEach((r) => { // v1 rows: single `descriptor`; v2: `descriptors[]`
    const list = r.descriptors || (r.descriptor ? [r.descriptor] : [])
    by[r.name] ||= []
    list.forEach((d) => by[r.name].push(new Float32Array(d)))
  })
  const labeled = Object.entries(by).filter(([, d]) => d.length).map(([n, d]) => new f.LabeledFaceDescriptors(n, d))
  matcher = labeled.length ? new f.FaceMatcher(labeled, MATCH) : null
}

function sizeOverlay() { if (overlay && video?.videoWidth) { overlay.width = video.videoWidth; overlay.height = video.videoHeight } }
async function bind() {
  if (video && stream && video.srcObject !== stream) { video.srcObject = stream; try { await video.play() } catch { /* autoplay blocked */ } }
  sizeOverlay()
}
export function attachVideo(el) { video = el; if (el) bind() }
export function attachOverlay(el) { overlay = el; sizeOverlay() }

export async function startCamera() {
  set({ camera: 'starting' })
  try {
    stream?.getTracks().forEach((t) => t.stop())
    // Look where the user is walking: `video: true` gives the selfie camera on most phones.
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: state.facing }, width: { ideal: 640 }, height: { ideal: 480 } }, audio: false,
    })
    set({ camera: 'on' })
    await bind()
    return true
  } catch (err) {
    stream = null
    set({ camera: err?.name === 'NotAllowedError' ? 'denied' : 'unavailable' })
    return false
  }
}
export function stopCamera() {
  loopsOn = false
  stream?.getTracks().forEach((t) => t.stop())
  stream = null
  if (video) video.srcObject = null
  dets = []; faces = []; person = false
  set({ camera: 'off', seen: null })
}
export async function flip() { set({ facing: state.facing === 'environment' ? 'user' : 'environment' }); return startCamera() }

// Called from the Start button: needs coco-ssd and a working camera, else sonar-only (as the original).
export async function start() {
  await init()
  if (!model || !(await startCamera())) return false
  if (!loopsOn) { loopsOn = true; detectLoop(); faceLoop(); tick() }
  return true
}

async function detectLoop() {
  if (!loopsOn) return
  try {
    if (model && stream && video && video.readyState === 4) {
      const raw = await model.detect(video)
      dets = raw.filter((d) => RELEVANT.has(d.class) && d.score >= CONF).sort((a, b) => b.score - a.score)
      detsAt = Date.now()
      person = dets.some((d) => d.class === 'person')
      draw()
    }
  } catch { /* keep looping */ }
  setTimeout(detectLoop, DETECT_MS)
}

// Idle back hard when nobody is in frame: descriptor extraction on empty frames wastes battery.
async function faceLoop() {
  if (!loopsOn) return
  let wait = FACE_IDLE_MS
  try {
    const f = window.faceapi
    if (state.faces === 'ready' && stream && video && video.readyState === 4 && !state.enrolling) {
      if (person) {
        wait = FACE_MS
        const res = await f.detectAllFaces(video, new f.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptors()
        faces = res.map((r) => {
          let name = null, score = null
          if (matcher) { const b = matcher.findBestMatch(r.descriptor); if (b.label !== 'unknown') { name = b.label; score = b.distance } }
          return { box: r.detection.box, name, score }
        })
        facesAt = Date.now()
        draw()
      } else if (faces.length) { faces = []; draw() }
    }
  } catch { /* keep looping */ }
  setTimeout(faceLoop, wait)
}

function draw() {
  if (!overlay) return
  const c = overlay.getContext('2d'), now = Date.now()
  c.clearRect(0, 0, overlay.width, overlay.height)
  c.lineWidth = 3; c.font = '16px system-ui'
  const box = (x, y, w, h, label, col) => {
    c.strokeStyle = col; c.strokeRect(x, y, w, h)
    c.fillStyle = col; c.fillRect(x, y - 20, c.measureText(label).width + 8, 20)
    c.fillStyle = '#000'; c.fillText(label, x + 4, y - 5)
  }
  if (now - detsAt < DET_STALE) dets.forEach((d) => box(...d.bbox, `${d.class} ${Math.round(d.score * 100)}%`, '#e5c05a'))
  if (now - facesAt < FACE_STALE) faces.forEach((f) => box(f.box.x, f.box.y, f.box.width, f.box.height, f.name || 'unknown face', '#8ed1c7'))
}

const centerX = (b) => (b.x !== undefined ? b.x + b.width / 2 : b[0] + b[2] / 2)
const frameW = () => overlay?.width || video?.videoWidth || 0
export function bearingFor(box) {
  const w = frameW()
  if (!box || !w) return null
  const n = centerX(box) / w
  return n < 0.34 ? 'to your left' : n > 0.66 ? 'to your right' : 'ahead'
}
export const panFor = (box) => Math.max(-1, Math.min(1, (centerX(box) / (frameW() || 1)) * 2 - 1))
export function getIdentity() { // a fresh named face beats a generic object
  const now = Date.now()
  if (now - facesAt < FACE_STALE) {
    const named = faces.filter((f) => f.name).sort((a, b) => a.score - b.score)[0]
    if (named) return { label: named.name, box: named.box, isFace: true }
  }
  if (now - detsAt < DET_STALE && dets[0]) return { label: dets[0].class[0].toUpperCase() + dets[0].class.slice(1), box: dets[0].bbox, isFace: false }
  return null
}
function tick() {
  if (!loopsOn) return
  const id = getIdentity()
  const seen = id ? `${id.label} ${bearingFor(id.box) || 'ahead'}` : null
  if (seen !== state.seen) set({ seen })
  setTimeout(tick, 300)
}

// Several looks per person: one descriptor is fragile across lighting and head angle.
export async function enroll(name) {
  const f = window.faceapi
  if (state.faces !== 'ready' || state.camera !== 'on' || state.enrolling || !video) return { ok: false, reason: 'notready' }
  set({ enrolling: true, looks: 0 })
  announce(`Adding ${name}. Ask them to turn their head slowly.`, { force: true })
  const ds = []
  try {
    for (let i = 0; i < SAMPLES; i += 1) {
      const r = await f.detectSingleFace(video, new f.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor()
      if (r) { ds.push(Array.from(r.descriptor)); set({ looks: ds.length }); announce(`Look ${ds.length} of ${SAMPLES}`, { force: true }) }
      await new Promise((res) => setTimeout(res, SAMPLE_GAP))
    }
    if (!ds.length) { announce('No face found. Point the camera at them and try again.', { force: true }); return { ok: false, reason: 'noface' } }
    await saveFace(name, ds)
    await reloadFaces()
    recordEvent('enroll', `${name} (${ds.length} looks)`)
    announce(`${name} added with ${ds.length} looks`, { force: true })
    return { ok: true, looks: ds.length }
  } catch {
    announce('Adding failed. Try again.', { force: true })
    return { ok: false, reason: 'error' }
  } finally { set({ enrolling: false }) }
}
