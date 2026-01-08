import './App.css'
import FlowDashboard from './FlowDashboard'

function App() {
  return (
    <main className="app-shell">
      <header className="hero">
        <p className="eyebrow">Demo Frontend</p>
        <h1>Service Flow Dashboard</h1>
        <p className="subhead">Real-time view of all microservices in the flow.</p>
      </header>

      <FlowDashboard />
    </main>
  )
}

export default App
