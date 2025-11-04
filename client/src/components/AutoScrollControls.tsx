import { useState, useRef, useEffect } from 'react'
import { useAutoScroll } from '../lib/autoscript/scroll'

interface AutoScrollControlsProps {
  containerRef: React.RefObject<HTMLElement>
  disabled?: boolean
}

export default function AutoScrollControls({ containerRef, disabled = false }: AutoScrollControlsProps) {
  const [speed, setSpeed] = useState(30)
  const [showSpeedControl, setShowSpeedControl] = useState(false)
  const { start, stop, isScrolling, isPaused, setSpeed: updateScrollSpeed } = useAutoScroll(containerRef)

  // Check for reduced motion preference
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed)
    updateScrollSpeed(newSpeed)
  }

  const handleToggle = () => {
    if (isScrolling) {
      stop()
    } else {
      start()
    }
  }

  if (reducedMotion) {
    return (
      <div className="auto-scroll-controls" style={{
        padding: 'var(--space-sm)',
        backgroundColor: 'var(--color-bg-secondary)',
        borderRadius: '4px',
        marginBottom: 'var(--space-md)',
        textAlign: 'center'
      }}>
        <p className="text-muted" style={{ fontSize: 'var(--font-size-sm)' }}>
          גלילה אוטומטית מושבתת עקב העדפות נגישות
        </p>
      </div>
    )
  }

  return (
    <div className="auto-scroll-controls" style={{
      padding: 'var(--space-md)',
      backgroundColor: 'var(--color-bg-secondary)',
      borderRadius: '8px',
      marginBottom: 'var(--space-md)'
    }}>
      <div className="flex items-center gap-md" style={{ flexWrap: 'wrap' }}>
        {/* Play/Pause button */}
        <button
          className={`btn ${isScrolling ? 'btn-danger' : 'btn-primary'}`}
          onClick={handleToggle}
          disabled={disabled}
          style={{ minWidth: '120px' }}
        >
          {isScrolling ? (
            <>
              <span style={{ marginRight: '8px' }}>⏸</span>
              עצור גלילה
            </>
          ) : (
            <>
              <span style={{ marginRight: '8px' }}>▶</span>
              התחל גלילה
            </>
          )}
        </button>

        {/* Speed display */}
        <div className="flex items-center gap-sm">
          <label style={{ fontWeight: 500 }}>מהירות:</label>
          <span style={{
            fontWeight: 'bold',
            fontSize: 'var(--font-size-lg)',
            minWidth: '60px',
            textAlign: 'center'
          }}>
            {speed}px/s
          </span>
        </div>

        {/* Speed controls */}
        <button
          className="btn btn-secondary"
          onClick={() => setShowSpeedControl(!showSpeedControl)}
        >
          {showSpeedControl ? 'הסתר' : 'התאם'} מהירות
        </button>

        {/* Quick speed presets */}
        <div className="flex gap-sm" style={{ marginLeft: 'auto' }}>
          <button
            className="btn btn-secondary"
            onClick={() => handleSpeedChange(20)}
            style={{ fontSize: 'var(--font-size-sm)' }}
          >
            איטי
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => handleSpeedChange(30)}
            style={{ fontSize: 'var(--font-size-sm)' }}
          >
            רגיל
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => handleSpeedChange(50)}
            style={{ fontSize: 'var(--font-size-sm)' }}
          >
            מהיר
          </button>
        </div>
      </div>

      {/* Speed slider (collapsible) */}
      {showSpeedControl && (
        <div style={{
          marginTop: 'var(--space-md)',
          padding: 'var(--space-md)',
          backgroundColor: 'var(--color-bg)',
          borderRadius: '4px'
        }}>
          <div className="flex items-center gap-md">
            <label htmlFor="speed-slider" style={{ fontWeight: 500 }}>
              מהירות גלילה:
            </label>
            <input
              id="speed-slider"
              type="range"
              min="5"
              max="100"
              step="5"
              value={speed}
              onChange={(e) => handleSpeedChange(parseInt(e.target.value))}
              style={{ flex: 1 }}
            />
            <input
              type="number"
              min="5"
              max="100"
              step="5"
              value={speed}
              onChange={(e) => handleSpeedChange(parseInt(e.target.value) || 30)}
              style={{
                width: '80px',
                padding: '4px 8px',
                fontSize: 'var(--font-size-sm)'
              }}
            />
            <span style={{ fontSize: 'var(--font-size-sm)' }}>px/s</span>
          </div>

          <div style={{ marginTop: 'var(--space-sm)' }}>
            <p className="text-muted" style={{ fontSize: 'var(--font-size-sm)' }}>
              טיפ: התאם את המהירות לקצב השיר. ניתן לשנות את המהירות גם תוך כדי גלילה.
            </p>
          </div>

          {/* Advanced timing presets */}
          <div style={{ marginTop: 'var(--space-md)' }}>
            <label style={{ fontWeight: 500, marginBottom: 'var(--space-sm)', display: 'block' }}>
              הגדרות מוכנות לפי אורך:
            </label>
            <div className="flex gap-sm" style={{ flexWrap: 'wrap' }}>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  const height = containerRef.current?.scrollHeight || 1000
                  const viewHeight = containerRef.current?.clientHeight || 500
                  const scrollDistance = height - viewHeight
                  const targetTime = 120 // 2 minutes
                  const calculatedSpeed = scrollDistance / targetTime
                  handleSpeedChange(Math.round(calculatedSpeed))
                }}
                style={{ fontSize: 'var(--font-size-sm)' }}
              >
                2 דקות
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  const height = containerRef.current?.scrollHeight || 1000
                  const viewHeight = containerRef.current?.clientHeight || 500
                  const scrollDistance = height - viewHeight
                  const targetTime = 180 // 3 minutes
                  const calculatedSpeed = scrollDistance / targetTime
                  handleSpeedChange(Math.round(calculatedSpeed))
                }}
                style={{ fontSize: 'var(--font-size-sm)' }}
              >
                3 דקות
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  const height = containerRef.current?.scrollHeight || 1000
                  const viewHeight = containerRef.current?.clientHeight || 500
                  const scrollDistance = height - viewHeight
                  const targetTime = 240 // 4 minutes
                  const calculatedSpeed = scrollDistance / targetTime
                  handleSpeedChange(Math.round(calculatedSpeed))
                }}
                style={{ fontSize: 'var(--font-size-sm)' }}
              >
                4 דקות
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  const height = containerRef.current?.scrollHeight || 1000
                  const viewHeight = containerRef.current?.clientHeight || 500
                  const scrollDistance = height - viewHeight
                  const targetTime = 300 // 5 minutes
                  const calculatedSpeed = scrollDistance / targetTime
                  handleSpeedChange(Math.round(calculatedSpeed))
                }}
                style={{ fontSize: 'var(--font-size-sm)' }}
              >
                5 דקות
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status indicator */}
      {isScrolling && (
        <div style={{
          marginTop: 'var(--space-sm)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-sm)'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            backgroundColor: isPaused ? 'var(--color-warning)' : 'var(--color-secondary)',
            borderRadius: '50%',
            animation: isPaused ? 'none' : 'pulse 1.5s infinite'
          }}></div>
          <span className="text-muted" style={{ fontSize: 'var(--font-size-sm)' }}>
            {isPaused
              ? 'גלילה מושהית זמנית - גלול ידנית כרצונך'
              : `גלילה פעילה במהירות ${speed} פיקסלים לשנייה`}
          </span>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  )
}