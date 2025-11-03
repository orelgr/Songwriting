import { useState } from 'react'

interface SongEditorProps {
  title: string
  author: string
  content: string
  capo: number
  transpose: number
  folderId: number | null
  folders: Array<{ id: number; name: string }>
  onTitleChange: (value: string) => void
  onAuthorChange: (value: string) => void
  onContentChange: (value: string) => void
  onCapoChange: (value: number) => void
  onTransposeChange: (value: number) => void
  onFolderChange: (value: number | null) => void
}

export default function SongEditor({
  title,
  author,
  content,
  capo,
  transpose,
  folderId,
  folders,
  onTitleChange,
  onAuthorChange,
  onContentChange,
  onCapoChange,
  onTransposeChange,
  onFolderChange
}: SongEditorProps) {
  const [showHelp, setShowHelp] = useState(false)

  const insertChord = (chord: string) => {
    const textarea = document.getElementById('content-editor') as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newContent =
      content.substring(0, start) +
      `[${chord}]` +
      content.substring(end)

    onContentChange(newContent)

    // Set cursor position after the inserted chord
    setTimeout(() => {
      textarea.selectionStart = start + chord.length + 2
      textarea.selectionEnd = start + chord.length + 2
      textarea.focus()
    }, 0)
  }

  const commonChords = [
    'C', 'D', 'E', 'F', 'G', 'A', 'B',
    'Cm', 'Dm', 'Em', 'Fm', 'Gm', 'Am', 'Bm',
    'C7', 'D7', 'E7', 'F7', 'G7', 'A7', 'B7',
    'Cmaj7', 'Dmaj7', 'Emaj7', 'Fmaj7', 'Gmaj7', 'Amaj7', 'Bmaj7',
    'F#', 'Bb', 'Eb', 'Ab', 'F#m', 'Bbm'
  ]

  return (
    <div className="song-editor">
      {/* Metadata fields */}
      <div className="form-group mb-md">
        <label htmlFor="title">שם השיר *</label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="הכנס שם שיר..."
          required
        />
      </div>

      <div className="form-group mb-md">
        <label htmlFor="author">מחבר / אמן</label>
        <input
          id="author"
          type="text"
          value={author}
          onChange={(e) => onAuthorChange(e.target.value)}
          placeholder="הכנס שם מחבר או אמן..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-md mb-md">
        <div className="form-group">
          <label htmlFor="folder">תיקייה</label>
          <select
            id="folder"
            value={folderId || ''}
            onChange={(e) => onFolderChange(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">ללא תיקייה</option>
            {folders.map(folder => (
              <option key={folder.id} value={folder.id}>
                {folder.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="capo">קאפו</label>
          <select
            id="capo"
            value={capo}
            onChange={(e) => onCapoChange(Number(e.target.value))}
          >
            {[...Array(13)].map((_, i) => (
              <option key={i} value={i}>
                {i === 0 ? 'ללא קאפו' : `פרט ${i}`}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="transpose">טרנספוזיציה</label>
          <select
            id="transpose"
            value={transpose}
            onChange={(e) => onTransposeChange(Number(e.target.value))}
          >
            {[...Array(25)].map((_, i) => {
              const value = i - 12
              return (
                <option key={i} value={value}>
                  {value === 0 ? 'ללא' : (value > 0 ? `+${value}` : value)}
                </option>
              )
            })}
          </select>
        </div>
      </div>

      {/* Chord insertion toolbar */}
      <div className="chord-insertion-toolbar mb-md">
        <label style={{ display: 'block', marginBottom: 'var(--space-sm)' }}>
          הוסף אקורד מהיר:
        </label>
        <div className="flex gap-sm" style={{ flexWrap: 'wrap' }}>
          {commonChords.map(chord => (
            <button
              key={chord}
              type="button"
              className="btn btn-secondary"
              onClick={() => insertChord(chord)}
              style={{ padding: '4px 12px', fontSize: 'var(--font-size-sm)' }}
            >
              {chord}
            </button>
          ))}
        </div>
      </div>

      {/* Content editor */}
      <div className="form-group mb-md">
        <div className="flex items-center justify-between mb-sm">
          <label htmlFor="content-editor">תוכן השיר (פורמט ChordPro) *</label>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setShowHelp(!showHelp)}
            style={{ fontSize: 'var(--font-size-sm)' }}
          >
            {showHelp ? 'הסתר עזרה' : 'עזרה'}
          </button>
        </div>

        {showHelp && (
          <div className="card mb-md" style={{
            backgroundColor: 'var(--color-bg-secondary)',
            fontSize: 'var(--font-size-sm)'
          }}>
            <h4>כיצד להוסיף אקורדים:</h4>
            <ul style={{ marginBottom: 'var(--space-md)' }}>
              <li>הקף אקורדים בסוגריים מרובעים: <code>[C]</code>, <code>[Am]</code>, <code>[G7]</code></li>
              <li>הצב אקורדים לפני ההברה או המילה: <code>[C]שלום [Am]עולם</code></li>
              <li>אפשר להוסיף אקורדים בשורה נפרדת מעל המילים</li>
              <li>השתמש בכפתורי האקורדים המהירים למעלה</li>
            </ul>

            <h4>תגיות מיוחדות:</h4>
            <ul>
              <li><code>{'{'}title: שם השיר{'}'}</code> - כותרת השיר</li>
              <li><code>{'{'}artist: שם האמן{'}'}</code> - שם האמן</li>
              <li><code>{'{'}capo: 3{'}'}</code> - מיקום הקאפו</li>
              <li><code>{'{'}key: C{'}'}</code> - סולם השיר</li>
              <li><code>{'{'}chorus{'}'}</code> / <code>{'{'}end_of_chorus{'}'}</code> - תחילת וסוף פזמון</li>
              <li><code>{'{'}verse{'}'}</code> / <code>{'{'}end_of_verse{'}'}</code> - תחילת וסוף בית</li>
            </ul>
          </div>
        )}

        <textarea
          id="content-editor"
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          placeholder={`הכנס את מילות השיר עם אקורדים...

דוגמה:
[C]על כל [Am]אלה, [F]על כל [G]אלה
[C]שמור נא [Am]לי א-[F]לי הטוב [G]שלי
[C]על הדבש ו[Am]על העוקץ
[F]על המר [G]והמתוק`}
          style={{
            minHeight: '400px',
            fontFamily: 'monospace',
            fontSize: '14px',
            lineHeight: '1.8'
          }}
          required
        />
      </div>

      {/* Character count */}
      <div className="text-muted" style={{ fontSize: 'var(--font-size-sm)' }}>
        {content.length} תווים | {content.split('\n').length} שורות
      </div>
    </div>
  )
}