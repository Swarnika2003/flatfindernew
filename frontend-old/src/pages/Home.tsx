import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function Home() {
  const { user } = useAuth()

  return (
    <div style={{ textAlign: 'left', maxWidth: 640 }}>
      <h1>Find your next flat in Kathmandu</h1>
      <p>
        Search by neighborhood, monthly rent, and number of rooms. Save preferences to get recommendations tuned to
        your budget and areas like Thamel, Patan, Boudha, and Baneshwor.
      </p>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
        {user ? (
          <Link to="/dashboard" className="btn btn-primary" style={{ textDecoration: 'none', color: 'inherit' }}>
            Go to dashboard
          </Link>
        ) : (
          <>
            <Link to="/register" className="btn btn-primary" style={{ textDecoration: 'none', color: 'inherit' }}>
              Create account
            </Link>
            <Link to="/login" className="btn btn-ghost" style={{ textDecoration: 'none' }}>
              Log in
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
