import { useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function Register() {
  const { user, register } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to="/dashboard" replace />

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 8) {
      setError('Password must be at least 8 characters and include a digit.')
      return
    }
    if (!/\d/.test(password)) {
      setError('Password must include at least one digit.')
      return
    }
    setBusy(true)
    try {
      await register(email.trim(), password, displayName.trim() || undefined)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: '0 auto' }}>
      <h1>Create account</h1>
      <p className="muted">Password: 8+ characters and at least one digit (matches API rules).</p>
      {error && <div className="error-banner">{error}</div>}
      <form onSubmit={onSubmit} className="card" style={{ marginTop: '1rem' }}>
        <div className="field">
          <label htmlFor="name">Display name (optional)</label>
          <input id="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={120} />
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={busy} style={{ width: '100%' }}>
          {busy ? 'Creating…' : 'Register'}
        </button>
        <p className="muted" style={{ marginTop: '1rem', marginBottom: 0, textAlign: 'center' }}>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  )
}
