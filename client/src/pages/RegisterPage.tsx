import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../lib/api'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [passwordErrors, setPasswordErrors] = useState<string[]>([])

  const validatePassword = (pass: string) => {
    const errors: string[] = []

    if (pass.length < 8) {
      errors.push('הסיסמה חייבת להכיל לפחות 8 תווים')
    }
    if (!/[A-Z]/.test(pass)) {
      errors.push('הסיסמה חייבת להכיל לפחות אות גדולה אחת באנגלית')
    }
    if (!/[a-z]/.test(pass)) {
      errors.push('הסיסמה חייבת להכיל לפחות אות קטנה אחת באנגלית')
    }
    if (!/[0-9]/.test(pass)) {
      errors.push('הסיסמה חייבת להכיל לפחות ספרה אחת')
    }

    setPasswordErrors(errors)
    return errors.length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('הסיסמאות אינן תואמות')
      return
    }

    // Validate password strength
    if (!validatePassword(password)) {
      setError('הסיסמה אינה עומדת בדרישות')
      return
    }

    setLoading(true)

    try {
      await api.register({ email, password })
      navigate('/folders')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בהרשמה')
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
        <h1 className="text-center">הרשמה</h1>

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
              onChange={(e) => {
                setPassword(e.target.value)
                if (e.target.value) {
                  validatePassword(e.target.value)
                }
              }}
              required
              autoComplete="new-password"
              placeholder="••••••••"
            />
            {passwordErrors.length > 0 && (
              <ul style={{
                marginTop: 'var(--space-sm)',
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-danger)',
                listStyle: 'none'
              }}>
                {passwordErrors.map((err, idx) => (
                  <li key={idx}>• {err}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="form-group mb-md">
            <label htmlFor="confirmPassword">אימות סיסמה</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              placeholder="••••••••"
            />
            {confirmPassword && password !== confirmPassword && (
              <p style={{
                marginTop: 'var(--space-sm)',
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-danger)'
              }}>
                הסיסמאות אינן תואמות
              </p>
            )}
          </div>

          <div style={{
            padding: 'var(--space-md)',
            marginBottom: 'var(--space-md)',
            backgroundColor: 'var(--color-bg-secondary)',
            borderRadius: '4px',
            fontSize: 'var(--font-size-sm)'
          }}>
            <strong>דרישות סיסמה:</strong>
            <ul style={{ marginTop: 'var(--space-sm)', marginBottom: 0 }}>
              <li style={{ color: password.length >= 8 ? 'var(--color-secondary)' : 'inherit' }}>
                ✓ לפחות 8 תווים
              </li>
              <li style={{ color: /[A-Z]/.test(password) ? 'var(--color-secondary)' : 'inherit' }}>
                ✓ לפחות אות גדולה אחת
              </li>
              <li style={{ color: /[a-z]/.test(password) ? 'var(--color-secondary)' : 'inherit' }}>
                ✓ לפחות אות קטנה אחת
              </li>
              <li style={{ color: /[0-9]/.test(password) ? 'var(--color-secondary)' : 'inherit' }}>
                ✓ לפחות ספרה אחת
              </li>
            </ul>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || passwordErrors.length > 0 || password !== confirmPassword}
            style={{ width: '100%', marginBottom: 'var(--space-md)' }}
          >
            {loading ? 'נרשם...' : 'הירשם'}
          </button>
        </form>

        <div className="text-center">
          <p className="text-muted">
            יש לך חשבון?{' '}
            <Link to="/login">התחבר כאן</Link>
          </p>
        </div>

        <hr style={{
          margin: 'var(--space-lg) 0',
          border: 'none',
          borderTop: '1px solid var(--color-border)'
        }} />

        <div className="text-center">
          <Link to="/folders" className="btn btn-secondary">
            המשך ללא הרשמה (מצב דמו)
          </Link>
        </div>
      </div>
    </div>
  )
}