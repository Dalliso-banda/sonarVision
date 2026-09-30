import { useEffect, useState } from 'react'
import { Empty, Page } from '../components/ui'
import { clearEvents, getEvents } from '../services/storage'

export default function History() {
  const [st, setSt] = useState({ status: 'loading', rows: [] })
  const load = () => getEvents().then((rows) => setSt({ status: 'ready', rows: rows.sort((a, b) => b.t - a.t) }), () => setSt({ status: 'error', rows: [] }))
  useEffect(() => { load() }, [])

  const exportJson = () => {
    const rows = st.rows.map((r) => ({ ...r, time: new Date(r.t).toISOString() }))
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' }))
    a.download = 'sonar-vision-history.json'
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 5000)
  }
  const alerts = st.rows.filter((r) => r.kind === 'alert').length

  return (
    <Page title="History" intro="Zone changes and alerts recorded on this device, useful for tuning distances after a walk.">
      {st.status === 'loading' && <p role="status">Loading…</p>}
      {st.status === 'error' && <Empty title="Could not read history">Storage is unavailable in this browser.</Empty>}
      {st.status === 'ready' && !st.rows.length && <Empty title="Nothing recorded yet">Events appear here after a session in the original app.</Empty>}
      {st.rows.length > 0 && (
        <>
          <p>{st.rows.length} events, {alerts} alerts. Showing the latest 100.</p>
          <ul className="rows">
            {st.rows.slice(0, 100).map((r) => (
              <li key={r.id}><span>{r.detail}<small>{r.kind}</small></span><small>{new Date(r.t).toLocaleString()}</small></li>
            ))}
          </ul>
          <button className="btn" onClick={exportJson}>Export</button>{' '}
          <button className="btn" onClick={() => window.confirm('Clear all history on this device?') && clearEvents().then(load)}>Clear</button>
        </>
      )}
    </Page>
  )
}
