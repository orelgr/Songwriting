import { useState } from 'react'

interface ChordToolbarProps {
  transpose: number
  capo: number
  preferSharps: boolean
  onTransposeChange: (value: number) => void
  onCapoChange: (value: number) => void
  onPreferSharpsChange: (value: boolean) => void
  onReset?: () => void
}

export default function ChordToolbar({
  transpose,
  capo,
  preferSharps,
  onTransposeChange,
  onCapoChange,
  onPreferSharpsChange,
  onReset
}: ChordToolbarProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleTranspose = (delta: number) => {
    const newValue = transpose + delta
    if (newValue >= -12 && newValue <= 12) {
      onTransposeChange(newValue)
    }
  }

  const handleCapoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onCapoChange(parseInt(e.target.value) || 0)
  }

  const handleReset = () => {
    onTransposeChange(0)
    onCapoChange(0)
    if (onReset) {
      onReset()
    }
  }

  return (
    <div className="chord-toolbar" style={{
      padding: 'var(--space-md)',
      backgroundColor: 'var(--color-bg-secondary)',
      borderRadius: '8px',
      marginBottom: 'var(--space-md)'
    }}>
      <div className="flex items-center gap-md" style={{ flexWrap: 'wrap' }}>
        {/* Transpose controls */}
        <div className="flex items-center gap-sm">
          <label style={{ fontWeight: 500 }}>טרנספוז:</label>
          <button
            className="btn btn-secondary"
            onClick={() => handleTranspose(-1)}
            disabled={transpose <= -12}
            style={{ minWidth: '40px', padding: '4px 8px' }}
          >
            -1
          </button>
          <span style={{
            minWidth: '60px',
            textAlign: 'center',
            fontWeight: 'bold',
            fontSize: 'var(--font-size-lg)'
          }}>
            {transpose > 0 ? `+${transpose}` : transpose}
          </span>
          <button
            className="btn btn-secondary"
            onClick={() => handleTranspose(1)}
            disabled={transpose >= 12}
            style={{ minWidth: '40px', padding: '4px 8px' }}
          >
            +1
          </button>
        </div>

        {/* Quick transpose buttons */}
        <div className="flex gap-sm">
          <button
            className="btn btn-secondary"
            onClick={() => onTransposeChange(transpose - 12)}
            disabled={transpose <= -12}
            style={{ fontSize: 'var(--font-size-sm)' }}
          >
            -אוקטבה
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => onTransposeChange(transpose + 12)}
            disabled={transpose >= 12}
            style={{ fontSize: 'var(--font-size-sm)' }}
          >
            +אוקטבה
          </button>
        </div>

        {/* Capo selector */}
        <div className="flex items-center gap-sm">
          <label htmlFor="capo-select" style={{ fontWeight: 500 }}>קאפו:</label>
          <select
            id="capo-select"
            value={capo}
            onChange={handleCapoChange}
            style={{
              width: 'auto',
              padding: '4px 8px',
              minHeight: 'auto'
            }}
          >
            {[...Array(13)].map((_, i) => (
              <option key={i} value={i}>
                {i === 0 ? 'ללא' : `פרט ${i}`}
              </option>
            ))}
          </select>
        </div>

        {/* Sharp/Flat preference */}
        <div className="flex items-center gap-sm">
          <label style={{ fontWeight: 500 }}>תצוגה:</label>
          <button
            className={`btn ${preferSharps ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => onPreferSharpsChange(!preferSharps)}
            style={{ padding: '4px 12px' }}
          >
            {preferSharps ? '# (דיאז)' : '♭ (במול)'}
          </button>
        </div>

        {/* Reset button */}
        <button
          className="btn btn-secondary"
          onClick={handleReset}
          style={{ marginLeft: 'auto' }}
        >
          איפוס
        </button>
      </div>

      {/* Advanced options (collapsible) */}
      <div style={{ marginTop: 'var(--space-md)' }}>
        <button
          className="btn btn-secondary"
          onClick={() => setShowAdvanced(!showAdvanced)}
          style={{ fontSize: 'var(--font-size-sm)' }}
        >
          {showAdvanced ? 'הסתר' : 'הצג'} אפשרויות מתקדמות
        </button>

        {showAdvanced && (
          <div style={{
            marginTop: 'var(--space-md)',
            padding: 'var(--space-md)',
            backgroundColor: 'var(--color-bg)',
            borderRadius: '4px'
          }}>
            {/* Preset transpositions */}
            <div>
              <label style={{ fontWeight: 500, marginBottom: 'var(--space-sm)', display: 'block' }}>
                טרנספוזיציות נפוצות:
              </label>
              <div className="flex gap-sm" style={{ flexWrap: 'wrap' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => onTransposeChange(-5)}
                  style={{ fontSize: 'var(--font-size-sm)' }}
                >
                  -5 (קווינטה למטה)
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => onTransposeChange(-3)}
                  style={{ fontSize: 'var(--font-size-sm)' }}
                >
                  -3 (טרצה קטנה למטה)
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => onTransposeChange(2)}
                  style={{ fontSize: 'var(--font-size-sm)' }}
                >
                  +2 (סקונדה גדולה)
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => onTransposeChange(3)}
                  style={{ fontSize: 'var(--font-size-sm)' }}
                >
                  +3 (טרצה קטנה)
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => onTransposeChange(5)}
                  style={{ fontSize: 'var(--font-size-sm)' }}
                >
                  +5 (קווינטה)
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => onTransposeChange(7)}
                  style={{ fontSize: 'var(--font-size-sm)' }}
                >
                  +7 (קווינטה נקייה)
                </button>
              </div>
            </div>

            {/* Capo suggestions */}
            {capo > 0 && (
              <div style={{ marginTop: 'var(--space-md)' }}>
                <p className="text-muted" style={{ fontSize: 'var(--font-size-sm)' }}>
                  עם קאפו בפרט {capo}, האקורדים המוצגים הם כפי שמנגנים (לא הצליל בפועל).
                  הצליל בפועל גבוה ב-{capo} חצאי טונים.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}