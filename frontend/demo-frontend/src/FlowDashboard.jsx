import { useEffect, useState } from 'react'

function FlowDashboard() {
  const [flow, setFlow] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchFlow = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/flow')
      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`)
      }
      const body = await res.json()
      setFlow(body)
    } catch (err) {
      setError(err.message || 'Failed to fetch flow data')
      setFlow(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFlow()
  }, [])

  const cards = []
  if (flow?.gateway) {
    cards.push({ ...flow.gateway, label: 'Gateway' })
  }
  if (Array.isArray(flow?.downstream)) {
    flow.downstream.forEach((svc) => {
      cards.push({ ...svc, label: svc.service || 'Service' })
    })
  }

  return (
    <section className="flow-section">
      <div className="flow-header">
        <div>
          <p className="eyebrow">Flow View</p>
          <h2 className="flow-title">Service Flow</h2>
          <p className="panel-meta">Aggregated from /api/flow</p>
        </div>
        <div className="flow-actions">
          {loading && <span className="muted">Loading...</span>}
          {!loading && (
            <button onClick={fetchFlow} className="btn-refresh">
              Refresh
            </button>
          )}
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      {!error && !loading && cards.length === 0 && (
        <p className="muted">No flow data available.</p>
      )}

      <div className="flow-stack" aria-live="polite">
        {cards.map((card, idx) => (
          <div key={`${card.label}-${idx}`} className="flow-card">
            <div>
              <p className="flow-label">{card.label}</p>
              <p className="flow-name">{card.service || 'Unknown service'}</p>
              <p className="flow-pod">Pod: {card.pod || 'unknown'}</p>
            </div>
            <div className="flow-time">
              <span>{card.timestamp || 'n/a'}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default FlowDashboard
