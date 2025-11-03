import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { api, useSongs } from '../lib/api'
import SearchBar from '../components/SearchBar'

export default function SongsPage() {
  const { folderId } = useParams()
  const navigate = useNavigate()
  const { songs, loading, error, refresh } = useSongs(Number(folderId))
  const [folderName, setFolderName] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredSongs, setFilteredSongs] = useState(songs)

  useEffect(() => {
    // Load folder name
    if (folderId) {
      api.getFolders().then(folders => {
        const folder = folders.find(f => f.id === Number(folderId))
        if (folder) {
          setFolderName(folder.name)
        }
      }).catch(err => {
        console.error('Failed to load folder name:', err)
      })
    }
  }, [folderId])

  useEffect(() => {
    // Filter songs based on search query
    if (!searchQuery) {
      setFilteredSongs(songs)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredSongs(songs.filter(song =>
        song.title.toLowerCase().includes(query) ||
        (song.author && song.author.toLowerCase().includes(query)) ||
        song.content_chordpro.toLowerCase().includes(query)
      ))
    }
  }, [songs, searchQuery])

  const handleDeleteSong = async (id: number, title: string) => {
    if (!confirm(`למחוק את השיר "${title}"?`)) return

    try {
      await api.deleteSong(id)
      refresh()
    } catch (err) {
      console.error('Failed to delete song:', err)
      alert('שגיאה במחיקת השיר')
    }
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
      <div className="mb-lg">
        <div className="flex items-center gap-md mb-md">
          <Link to="/folders" className="btn btn-secondary">
            ← חזרה לתיקיות
          </Link>
          <h1 style={{ margin: 0 }}>{folderName || 'שירים'}</h1>
        </div>

        <div className="flex items-center gap-md" style={{ flexWrap: 'wrap' }}>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="חפש שיר לפי שם, מחבר או תוכן..."
            style={{ flex: 1, minWidth: '200px' }}
          />
          <button
            className="btn btn-primary"
            onClick={() => navigate(`/new-song?folder=${folderId}`)}
          >
            שיר חדש
          </button>
        </div>
      </div>

      {/* Songs list */}
      {filteredSongs.length === 0 ? (
        <div className="card text-center">
          {searchQuery ? (
            <>
              <h2>לא נמצאו שירים</h2>
              <p className="text-muted mb-lg">
                לא נמצאו שירים התואמים לחיפוש "{searchQuery}"
              </p>
              <button
                className="btn btn-secondary"
                onClick={() => setSearchQuery('')}
              >
                נקה חיפוש
              </button>
            </>
          ) : (
            <>
              <h2>אין שירים בתיקייה זו</h2>
              <p className="text-muted mb-lg">
                הוסף שיר חדש לתיקייה כדי להתחיל
              </p>
              <button
                className="btn btn-primary"
                onClick={() => navigate(`/new-song?folder=${folderId}`)}
              >
                צור שיר ראשון
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="songs-list">
          {filteredSongs.map((song) => (
            <div
              key={song.id}
              className="card mb-md"
              style={{
                cursor: 'pointer',
                transition: 'box-shadow var(--transition-fast)'
              }}
              onClick={() => navigate(`/songs/${song.id}`)}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
              }}
            >
              <div className="flex items-center justify-between">
                <div style={{ flex: 1 }}>
                  <h3 style={{ marginBottom: 'var(--space-xs)' }}>{song.title}</h3>
                  {song.author && (
                    <p className="text-muted" style={{ marginBottom: 'var(--space-xs)' }}>
                      מחבר: {song.author}
                    </p>
                  )}
                  <div className="flex gap-md text-muted" style={{ fontSize: 'var(--font-size-sm)' }}>
                    {song.capo > 0 && <span>קאפו: {song.capo}</span>}
                    {song.transpose_semitones !== 0 && (
                      <span>טרנספוז: {song.transpose_semitones > 0 ? '+' : ''}{song.transpose_semitones}</span>
                    )}
                    <span>עודכן: {new Date(song.updated_at).toLocaleDateString('he-IL')}</span>
                  </div>
                </div>

                <div
                  className="flex gap-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className="btn btn-secondary"
                    onClick={() => navigate(`/songs/${song.id}`)}
                    style={{ fontSize: 'var(--font-size-sm)' }}
                  >
                    ערוך
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDeleteSong(song.id, song.title)}
                    style={{ fontSize: 'var(--font-size-sm)' }}
                  >
                    מחק
                  </button>
                </div>
              </div>

              {/* Preview first few lines */}
              <div
                className="text-muted"
                style={{
                  fontSize: 'var(--font-size-sm)',
                  marginTop: 'var(--space-md)',
                  maxHeight: '3em',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {song.content_chordpro
                  .split('\n')
                  .filter(line => !line.startsWith('{') && line.trim())
                  .slice(0, 2)
                  .join(' | ')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}