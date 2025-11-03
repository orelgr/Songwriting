import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../lib/api'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await api.login({ email, password })
      navigate('/folders')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בהתחברות')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container" style={{
      maxWidth: '400px',
      marginTop: '10vh'
    }}>
      <div className="card">
        <h1 className="text-center">התחברות</h1>

        {error && (
          <div style={{
            padding: 'var(--space-md)',
            marginBottom: 'var(--space-md)',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '4px',
            color: '#dc2626'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group mb-md">
            <label htmlFor="email">אימייל</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="your@email.com"
            />
          </div>

          <div className="form-group mb-md">
            <label htmlFor="password">סיסמה</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', marginBottom: 'var(--space-md)' }}
          >
            {loading ? 'מתחבר...' : 'התחבר'}
          </button>
        </form>

        <div className="text-center">
          <p className="text-muted">
            אין לך חשבון עדיין?{' '}
            <Link to="/register">הירשם כאן</Link>
          </p>
        </div>

        <hr style={{
          margin: 'var(--space-lg) 0',
          border: 'none',
          borderTop: '1px solid var(--color-border)'
        }} />

        <div className="text-center">
          <Link to="/folders" className="btn btn-secondary">
            המשך ללא התחברות (מצב דמו)
          </Link>
        </div>
      </div>
    </div>
  )
}