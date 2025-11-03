import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom'
import { api, useSong } from '../lib/api'
import SongEditor from '../components/SongEditor'
import { SongRenderer } from '../components/ChordLineRenderer'
import ChordToolbar from '../components/ChordToolbar'
import FloatingScrollControls from '../components/FloatingScrollControls'
import PdfExportButton from '../components/PdfExportButton'

export default function EditorPage() {
  const { songId } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const folderId = searchParams.get('folder')

  const { song, loading, error, save } = useSong(songId ? Number(songId) : undefined)

  const [isEditMode, setIsEditMode] = useState(!songId) // New songs start in edit mode
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [content, setContent] = useState('')
  const [capo, setCapo] = useState(0)
  const [transpose, setTranspose] = useState(0)
  const [preferSharps, setPreferSharps] = useState(false)
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null)
  const [folders, setFolders] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  const previewRef = useRef<HTMLDivElement>(null)

  // Load folders
  useEffect(() => {
    api.getFolders()
      .then(setFolders)
      .catch(err => console.error('Failed to load folders:', err))
  }, [])

  // Initialize form when song loads
  useEffect(() => {
    if (song) {
      setTitle(song.title)
      setAuthor(song.author || '')
      setContent(song.content_chordpro)
      setCapo(song.capo)
      setTranspose(song.transpose_semitones)
      setSelectedFolderId(song.folder_id || null)
      setLastSaved(new Date(song.updated_at))
    } else if (folderId) {
      setSelectedFolderId(Number(folderId))
    }
  }, [song, folderId])

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      alert('נא למלא שם שיר ותוכן')
      return
    }

    setSaving(true)
    try {
      const songData = {
        title: title.trim(),
        author: author.trim() || undefined,
        content_chordpro: content,
        capo,
        transpose_semitones: transpose,
        folder_id: selectedFolderId || undefined
      }

      if (songId) {
        // Update existing song
        await save(songData)
        setLastSaved(new Date())
      } else {
        // Create new song
        const newSong = await api.createSong(songData)
        setLastSaved(new Date())
        // Navigate to the new song's edit page
        navigate(`/songs/${newSong.id}`, { replace: true })
      }
    } catch (err) {
      console.error('Failed to save song:', err)
      alert('שגיאה בשמירת השיר')
    } finally {
      setSaving(false)
    }
  }

  // Auto-save draft (only for existing songs)
  useEffect(() => {
    if (!songId || !title || !content) return

    const timer = setTimeout(() => {
      handleSave()
    }, 5000) // Auto-save after 5 seconds of no typing

    return () => clearTimeout(timer)
  }, [title, author, content, capo, transpose])

  const handleReset = () => {
    setTranspose(0)
    setCapo(0)
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
          <button className="btn btn-primary mt-md" onClick={() => navigate('/folders')}>
            חזרה לתיקיות
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="editor-container">
      {/* Header */}
      <div style={{
        padding: 'var(--space-md)',
        borderBottom: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-bg-secondary)'
      }}>
        <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: 'var(--space-md)' }}>
          <div className="flex items-center gap-md">
            <Link
              to={selectedFolderId ? `/folders/${selectedFolderId}` : '/folders'}
              className="btn btn-secondary"
              style={{ fontSize: 'var(--font-size-sm)' }}
            >
              ← חזרה
            </Link>
            <h2 style={{ margin: 0 }}>{title || 'שיר חדש'}</h2>
            {lastSaved && (
              <span className="text-muted" style={{ fontSize: 'var(--font-size-sm)' }}>
                נשמר: {lastSaved.toLocaleTimeString('he-IL')}
              </span>
            )}
          </div>

          <div className="flex gap-sm">
            <button
              className={`btn ${isEditMode ? 'btn-secondary' : 'btn-primary'}`}
              onClick={() => setIsEditMode(!isEditMode)}
            >
              {isEditMode ? 'תצוגה מקדימה' : 'עריכה'}
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving || !title.trim() || !content.trim()}
            >
              {saving ? 'שומר...' : 'שמור'}
            </button>
            {songId && <PdfExportButton song={{ title, author, content, capo, transpose }} />}
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Edit mode */}
        {isEditMode ? (
          <div className="editor-pane" style={{ flex: 1, padding: 'var(--space-lg)', overflow: 'auto' }}>
            <SongEditor
              title={title}
              author={author}
              content={content}
              capo={capo}
              transpose={transpose}
              folderId={selectedFolderId}
              folders={folders}
              onTitleChange={setTitle}
              onAuthorChange={setAuthor}
              onContentChange={setContent}
              onCapoChange={setCapo}
              onTransposeChange={setTranspose}
              onFolderChange={setSelectedFolderId}
            />
          </div>
        ) : (
          /* Preview mode */
          <div className="preview-pane" style={{ flex: 1, overflow: 'auto' }} ref={previewRef}>
            <div style={{ padding: 'var(--space-lg)', paddingBottom: '100px' }}>
              {/* Controls */}
              <ChordToolbar
                transpose={transpose}
                capo={capo}
                preferSharps={preferSharps}
                onTransposeChange={setTranspose}
                onCapoChange={setCapo}
                onPreferSharpsChange={setPreferSharps}
                onReset={handleReset}
              />

              {/* Song info */}
              <div style={{ marginBottom: 'var(--space-lg)' }}>
                <h1>{title}</h1>
                {author && <p className="text-muted">מחבר: {author}</p>}
              </div>

              {/* Song content with chords */}
              <SongRenderer
                content={content}
                transpose={transpose}
                capo={capo}
                preferSharps={preferSharps}
              />
            </div>

            {/* Floating scroll controls */}
            <FloatingScrollControls containerRef={previewRef} />
          </div>
        )}
      </div>
    </div>
  )
}