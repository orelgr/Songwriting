import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, useFolders } from '../lib/api'

export default function FoldersPage() {
  const navigate = useNavigate()
  const { folders, loading, error, refresh } = useFolders()
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState('')

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return

    try {
      await api.createFolder(newFolderName)
      setNewFolderName('')
      setShowNewFolder(false)
      refresh()
    } catch (err) {
      console.error('Failed to create folder:', err)
      alert('שגיאה ביצירת תיקייה')
    }
  }

  const handleUpdateFolder = async (id: number) => {
    if (!editingName.trim()) return

    try {
      await api.updateFolder(id, editingName)
      setEditingId(null)
      setEditingName('')
      refresh()
    } catch (err) {
      console.error('Failed to update folder:', err)
      alert('שגיאה בעדכון תיקייה')
    }
  }

  const handleDeleteFolder = async (id: number, name: string) => {
    if (!confirm(`למחוק את התיקייה "${name}" וכל השירים בה?`)) return

    try {
      await api.deleteFolder(id)
      refresh()
    } catch (err) {
      console.error('Failed to delete folder:', err)
      alert('שגיאה במחיקת תיקייה')
    }
  }

  const startEdit = (id: number, name: string) => {
    setEditingId(id)
    setEditingName(name)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditingName('')
  }

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: '2rem' }}>
        <div className="flex items-center justify-center">
          <div className="spinner"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container" style={{ paddingTop: '2rem' }}>
        <div className="card">
          <p style={{ color: 'var(--color-danger)' }}>שגיאה: {error}</p>
          <button className="btn btn-primary mt-md" onClick={refresh}>
            נסה שנית
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-lg">
        <h1>התיקיות שלי</h1>
        <div className="flex gap-md">
          <button
            className="btn btn-primary"
            onClick={() => navigate('/new-song')}
          >
            שיר חדש
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setShowNewFolder(true)}
          >
            תיקייה חדשה
          </button>
        </div>
      </div>

      {/* New folder form */}
      {showNewFolder && (
        <div className="card mb-lg">
          <h3>יצירת תיקייה חדשה</h3>
          <div className="flex gap-md" style={{ marginTop: 'var(--space-md)' }}>
            <input
              type="text"
              placeholder="שם התיקייה"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
              autoFocus
              style={{ flex: 1 }}
            />
            <button
              className="btn btn-primary"
              onClick={handleCreateFolder}
              disabled={!newFolderName.trim()}
            >
              צור
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setShowNewFolder(false)
                setNewFolderName('')
              }}
            >
              ביטול
            </button>
          </div>
        </div>
      )}

      {/* Folders grid */}
      {folders.length === 0 ? (
        <div className="card text-center">
          <h2>אין תיקיות עדיין</h2>
          <p className="text-muted mb-lg">
            צור תיקייה חדשה כדי לארגן את השירים שלך
          </p>
          <button
            className="btn btn-primary"
            onClick={() => setShowNewFolder(true)}
          >
            צור תיקייה ראשונה
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {folders.map((folder) => (
            <div
              key={folder.id}
              className="card"
              style={{
                cursor: editingId === folder.id ? 'default' : 'pointer',
                transition: 'box-shadow var(--transition-fast)'
              }}
              onClick={() => {
                if (editingId !== folder.id) {
                  navigate(`/folders/${folder.id}`)
                }
              }}
              onMouseEnter={(e) => {
                if (editingId !== folder.id) {
                  e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
              }}
            >
              {editingId === folder.id ? (
                <div onClick={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleUpdateFolder(folder.id)
                      if (e.key === 'Escape') cancelEdit()
                    }}
                    autoFocus
                    style={{ marginBottom: 'var(--space-sm)' }}
                  />
                  <div className="flex gap-sm">
                    <button
                      className="btn btn-primary"
                      onClick={() => handleUpdateFolder(folder.id)}
                      disabled={!editingName.trim()}
                    >
                      שמור
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={cancelEdit}
                    >
                      ביטול
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h3>{folder.name}</h3>
                  <p className="text-muted">
                    {folder.songs_count || 0} שירים
                  </p>
                  <div
                    className="flex gap-sm mt-md"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className="btn btn-secondary"
                      onClick={() => startEdit(folder.id, folder.name)}
                      style={{ fontSize: 'var(--font-size-sm)' }}
                    >
                      ערוך
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDeleteFolder(folder.id, folder.name)}
                      style={{ fontSize: 'var(--font-size-sm)' }}
                    >
                      מחק
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}