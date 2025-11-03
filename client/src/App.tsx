import { Routes, Route, Navigate } from 'react-router-dom'
import FoldersPage from './pages/FoldersPage'
import SongsPage from './pages/SongsPage'
import EditorPage from './pages/EditorPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import { useEffect, useState } from 'react'
import { api } from './lib/api'

function App() {
  const [authEnabled, setAuthEnabled] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if authentication is enabled
    api.health()
      .then(data => {
        setAuthEnabled(data.auth_enabled)
      })
      .catch(err => {
        console.error('Failed to check auth status:', err)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '100vh' }}>
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="app">
      <Routes>
        {/* Main routes */}
        <Route path="/" element={<Navigate to="/folders" replace />} />
        <Route path="/folders" element={<FoldersPage />} />
        <Route path="/folders/:folderId" element={<SongsPage />} />
        <Route path="/songs/:songId" element={<EditorPage />} />
        <Route path="/new-song" element={<EditorPage />} />

        {/* Auth routes (skeleton for now) */}
        {authEnabled && (
          <>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </>
        )}

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App