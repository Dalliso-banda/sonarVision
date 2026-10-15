import { useEffect, useState, useRef } from 'react'
import { io } from 'socket.io-client'
import { createSonar, LOST_MS } from '../services/sonar'
import { KEYS, read } from '../services/storage'
import { announce } from '../services/speech'

export function calculateBatteryPercent(voltage) {
  if (voltage == null || isNaN(voltage)) return null
  if (voltage >= 4.2) return 100
  if (voltage <= 3.3) return 0
  if (voltage >= 4.0) return Math.min(100, Math.round(80 + (voltage - 4.0) * 100))
  if (voltage >= 3.7) return Math.round(35 + (voltage - 3.7) * 150)
  return Math.max(0, Math.round((voltage - 3.3) * (35 / 0.4)))
}

const initial = {
  connected: false,
  serial: null,
  lost: false,
  multi: false,
  distance: null,
  speed: 0,
  fast: false,
  channels: {},
  voltage: null,
  batteryPercent: null,
  isLowBattery: false,
  telemetrySource: 'none', // 'esp32' | 'socketio'
}

const LOW_BATTERY_ALERT_GAP_MS = 120000 // 2 minutes between low battery voice alerts
let lastLowBatterySpoken = 0

export function useSonar() {
  const [state, setState] = useState(initial)
  const lastBatteryAlert = useRef(0)

  useEffect(() => {
    const sonar = createSonar()
    let lost = false
    let serial = null
    let latestVoltage = null
    let latestBattery = null
    let activeSource = 'none'

    const publish = (extra = {}) => {
      const now = Date.now()
      const s = sonar.snapshot(now)
      const bat = latestBattery ?? (latestVoltage != null ? calculateBatteryPercent(latestVoltage) : null)
      const isLow = bat != null && bat <= 20

      // Low battery voice alert (rate limited)
      if (isLow && now - lastLowBatterySpoken > LOW_BATTERY_ALERT_GAP_MS) {
        lastLowBatterySpoken = now
        announce(`Warning: Camera battery low, ${bat} percent.`, { urgent: true })
      }

      setState((p) => ({
        ...p,
        ...extra,
        serial,
        lost,
        multi: s.multi,
        distance: s.distance,
        speed: s.speed,
        fast: s.fast && !lost,
        channels: s.channels,
        voltage: latestVoltage,
        batteryPercent: bat,
        isLowBattery: isLow,
        telemetrySource: activeSource,
      }))
    }

    const handleTelemetryData = (d, source) => {
      if (!d) return
      activeSource = source
      if (typeof d.connected === 'boolean') serial = d.connected
      if (typeof d.voltage === 'number') latestVoltage = Math.round(d.voltage * 100) / 100
      if (typeof d.batteryPercent === 'number') latestBattery = Math.round(d.batteryPercent)
      else if (typeof d.battery === 'number') latestBattery = Math.round(d.battery)

      if (sonar.push(d, Date.now())) {
        lost = false
      }
      publish({ connected: true })
    }

    // 1. ESP32-CAM Direct WebSocket connection
    const esp32Host = read(KEYS.esp32Host, '192.168.4.1')
    let ws = null
    let wsAlive = false

    const connectWebSocket = () => {
      if (!esp32Host) return
      try {
        const wsUrl = `ws://${esp32Host}/telemetry`
        ws = new WebSocket(wsUrl)

        ws.onopen = () => {
          wsAlive = true
          publish({ connected: true })
        }

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            handleTelemetryData(data, 'esp32')
          } catch {
            // plain text distance reading
            const text = String(event.data).trim()
            const match = text.match(/(-?\d+(\.\d+)?)/)
            if (match) {
              handleTelemetryData({ distanceCm: parseFloat(match[1]) }, 'esp32')
            }
          }
        }

        ws.onclose = () => {
          wsAlive = false
        }

        ws.onerror = () => {
          wsAlive = false
        }
      } catch {
        wsAlive = false
      }
    }

    connectWebSocket()

    // 2. Local Socket.IO fallback (for dev or server.js USB serial)
    let socket = null
    try {
      socket = io({ autoConnect: true, reconnectionAttempts: 5 })
      socket.on('connect', () => {
        if (!wsAlive) publish({ connected: true })
      })
      socket.on('disconnect', () => {
        if (!wsAlive) publish({ connected: false })
      })
      socket.on('distance', (d) => {
        handleTelemetryData(d, 'socketio')
      })
      socket.on('telemetry', (d) => {
        handleTelemetryData(d, 'socketio')
      })
    } catch {
      // socket.io unavailable
    }

    // 3. HTTP polling fallback for ESP32 if WebSocket is closed
    const pollInterval = setInterval(async () => {
      if (wsAlive) return
      const host = read(KEYS.esp32Host, '192.168.4.1')
      if (!host) return
      try {
        const res = await fetch(`http://${host}/telemetry`, { signal: AbortSignal.timeout(600) })
        if (res.ok) {
          const data = await res.json()
          handleTelemetryData(data, 'esp32')
        }
      } catch {
        // ESP32 polling unreachable
      }
    }, 1000)

    // 4. Watchdog: flag lost if no signal received within LOST_MS
    const watchdogTimer = setInterval(() => {
      const now = Date.now()
      const s = sonar.snapshot(now)
      if (s.active && !s.anyFresh && !lost && now - s.lastSeen > LOST_MS) {
        lost = true
        sonar.reset()
      }
      publish()
    }, 300)

    return () => {
      clearInterval(pollInterval)
      clearInterval(watchdogTimer)
      if (ws) ws.close()
      if (socket) socket.close()
    }
  }, [])

  return state
}
