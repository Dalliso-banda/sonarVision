import { useEffect, useState } from 'react'
import { start as startVision, stopCamera } from '../services/vision'
import { startAudio, stopAudio } from '../services/audio'
import { announce, keepSpeechAlive, unlockSpeech } from '../services/speech'
import { recordEvent } from '../services/storage'

/**
 * Owns the "is a session currently running" state, plus everything
 * that needs to happen when it starts or stops: unlocking speech
 * synthesis, starting/stopping the audio feedback loop, starting/
 * stopping the camera, and logging session events.
 *
 * Nothing outside this hook needs to know that starting a session
 * touches the Web Audio API, the camera, and speech synthesis - it
 * just gets back { running, start, stop }.
 */
export function useSession() {
  const [running, setRunning] = useState(false)

  useEffect(() => {
    const keepAliveId = keepSpeechAlive()
    return () => {
      clearInterval(keepAliveId)
      stopAudio()
      stopCamera()
    }
  }, [])

  function start() {
    unlockSpeech()
    startAudio()
    setRunning(true)
    recordEvent('session', 'started')
    announce('Sonar Vision running.', { force: true })
    startVision()
  }

  function stop() {
    stopAudio()
    stopCamera()
    setRunning(false)
    recordEvent('session', 'stopped')
  }

  return { running, start, stop }
}