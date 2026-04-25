import { Link, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ThemeToggle } from './ThemeToggle'

export function Layout() {
  const { user, logout } = useAuth()

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: '0 auto',
            padding: '0.75rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <Link to="/" style={{ fontWeight: 700, fontSize: '1.15rem', color: 'var(--text)', textDecoration: 'none' }}>
            FlatFinder
            <span className="muted" style={{ fontWeight: 500, marginLeft: 6 }}>
              Kathmandu
            </span>
          </Link>
          <nav style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <ThemeToggle />
            {user ? (
              <>
                <span className="muted" style={{ fontSize: '0.875rem' }}>
                  {user.displayName}
                </span>
                <Link to="/dashboard" className="btn btn-ghost" style={{ textDecoration: 'none' }}>
                  Dashboard
                </Link>
                <button type="button" className="btn btn-ghost" onClick={logout}>
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost" style={{ textDecoration: 'none' }}>
                  Log in
                </Link>
                <Link to="/register" className="btn btn-primary" style={{ textDecoration: 'none', color: 'inherit' }}>
                  Sign up
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main style={{ flex: 1, maxWidth: 1100, width: '100%', margin: '0 auto', padding: '1.25rem' }}>
        <Outlet />
      </main>
      <footer style={{ borderTop: '1px solid var(--border)', padding: '1rem', textAlign: 'center' }} className="muted">
        FlatFinder · Rentals in Kathmandu Valley · Your data is sent over HTTPS in production; tokens stay in this
        browser only.
      </footer>
    </div>
  )
}
