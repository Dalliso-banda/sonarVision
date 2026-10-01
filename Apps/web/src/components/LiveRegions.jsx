import { useEffect, useState } from 'react'

/**
 * Screen-reader output mode: announcements land in these two hidden
 * live regions instead of going through speechSynthesis. Listens for
 * the app-wide 'sv-announce' event (dispatched from services/speech.js)
 * and routes it to the polite or urgent region depending on severity.
 */
export default function LiveRegions() {
  const [politeMessage, setPoliteMessage] = useState('')
  const [urgentMessage, setUrgentMessage] = useState('')

  useEffect(() => {
    function handleAnnounce(event) {
      const setMessage = event.detail.urgent ? setUrgentMessage : setPoliteMessage
      setMessage('')
      setTimeout(() => setMessage(event.detail.text), 30)
    }
    window.addEventListener('sv-announce', handleAnnounce)
    return () => window.removeEventListener('sv-announce', handleAnnounce)
  }, [])

  return (
    <>
      <div className="sr" role="status" aria-live="polite" aria-atomic="true">
        {politeMessage}
      </div>
      <div className="sr" role="alert" aria-live="assertive" aria-atomic="true">
        {urgentMessage}
      </div>
    </>
  )
}