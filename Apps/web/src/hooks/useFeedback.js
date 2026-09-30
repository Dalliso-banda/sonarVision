import { useEffect, useRef } from 'react'
import { forgetZone, setPan, silence, updateTone } from '../services/audio'
import { announce } from '../services/speech'
import { recordEvent } from '../services/storage'
import { bearingFor, getIdentity, panFor } from '../services/vision'

// Tone, pan and spoken alerts while `running`. Mirrors updateFusedReadout() in the original:
// urgent alert first (and it returns), otherwise announce identity when it CHANGES.
export function useFeedback(sonar, zones, running) {
  const wasLost = useRef(false)
  const lastLabel = useRef(null)
  useEffect(() => { forgetZone() }, [zones])
  useEffect(() => {
    if (!running) return
    if (sonar.lost) {
      if (!wasLost.current) {
        wasLost.current = true
        silence()
        recordEvent('sensor', 'signal lost')
        announce('Sensor signal lost.', { urgent: true })
      }
      return
    }
    if (wasLost.current) {
      wasLost.current = false
      recordEvent('sensor', 'signal restored')
      announce('Sensor signal back', { force: true })
    }
    const identity = getIdentity()
    const near = Object.entries(sonar.channels).filter(([, v]) => v != null).sort((a, b) => a[1] - b[1])[0]?.[0]
    if (sonar.distance != null) updateTone(zones, sonar.distance)
    if (sonar.multi) setPan(near === 'left' ? -0.85 : near === 'right' ? 0.85 : 0) // real bearing
    else setPan(identity ? panFor(identity.box) : 0) // camera guess: sonar cone and lens may differ

    if (sonar.fast) {
      const who = identity ? identity.label : 'Something'
      const side = sonar.multi && near && near !== 'center' ? ` on your ${near}` : (identity ? ` ${bearingFor(identity.box) || 'ahead'}` : '')
      announce(`Stop. ${who}${side} closing fast`, { urgent: true })
      lastLabel.current = who
      return
    }
    if (identity && identity.label !== lastLabel.current) {
      const dist = sonar.distance != null && sonar.distance > 0 && sonar.distance < zones[2].max ? `, ${sonar.distance} centimetres` : ''
      announce(`${identity.label} ${bearingFor(identity.box) || 'ahead'}${dist}`)
      lastLabel.current = identity.label
    } else if (!identity) lastLabel.current = null
  }, [sonar, zones, running])
}
