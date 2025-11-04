import { useState, useEffect } from 'react'
import { useAutoScroll } from '../lib/autoscript/scroll'

interface FloatingScrollControlsProps {
  containerRef: React.RefObject<HTMLElement>
  disabled?: boolean
}

export default function FloatingScrollControls({ containerRef, disabled = false }: FloatingScrollControlsProps) {
  const [speed, setSpeed] = useState(30)
  const [showControls, setShowControls] = useState(false)
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

  if (reducedMotion || disabled) {
    return null
  }

  return (
    <>
      {/* Floating Button */}
      <div
        style={{
          position: 'fixed',
          left: '20px',
          bottom: '20px',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          alignItems: 'flex-start'
        }}
      >
        {/* Speed controls - only when scrolling or panel open */}
        {(showControls || isScrolling) && (
          <div
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(10px)',
              borderRadius: '12px',
              padding: '15px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
              minWidth: '200px',
              animation: 'slideUp 0.2s ease-out'
            }}
          >
            <div style={{ color: 'white', fontSize: '12px', marginBottom: '10px', fontWeight: '500' }}>
              מהירות גלילה
            </div>

            {/* Speed slider */}
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={speed}
              onChange={(e) => handleSpeedChange(parseInt(e.target.value))}
              style={{
                width: '100%',
                marginBottom: '10px',
                accentColor: '#2563eb'
              }}
            />

            {/* Speed display */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              color: 'white',
              fontSize: '11px'
            }}>
              <span>איטי</span>
              <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{speed}</span>
              <span>מהיר</span>
            </div>

            {/* Quick presets */}
            <div style={{
              display: 'flex',
              gap: '5px',
              marginTop: '10px'
            }}>
              <button
                onClick={() => handleSpeedChange(20)}
                style={{
                  flex: 1,
                  padding: '6px',
                  fontSize: '11px',
                  background: speed === 20 ? '#2563eb' : 'rgba(255,255,255,0.2)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                איטי
              </button>
              <button
                onClick={() => handleSpeedChange(30)}
                style={{
                  flex: 1,
                  padding: '6px',
                  fontSize: '11px',
                  background: speed === 30 ? '#2563eb' : 'rgba(255,255,255,0.2)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                רגיל
              </button>
              <button
                onClick={() => handleSpeedChange(50)}
                style={{
                  flex: 1,
                  padding: '6px',
                  fontSize: '11px',
                  background: speed === 50 ? '#2563eb' : 'rgba(255,255,255,0.2)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                מהיר
              </button>
            </div>
          </div>
        )}

        {/* Main control button */}
        <button
          onClick={handleToggle}
          onMouseEnter={() => setShowControls(true)}
          onMouseLeave={() => !isScrolling && setShowControls(false)}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: isScrolling
              ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
              : 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
            color: 'white',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease',
            position: 'relative',
            backdropFilter: 'blur(10px)'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)'
            e.currentTarget.style.boxShadow = '0 6px 30px rgba(0, 0, 0, 0.4)'
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)'
          }}
          title={isScrolling ? 'עצור גלילה (Spacebar)' : 'התחל גלילה (Spacebar)'}
        >
          {isPaused ? '⏯' : (isScrolling ? '⏸' : '▶')}

          {/* Pulsing animation when scrolling */}
          {isScrolling && !isPaused && (
            <div
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                border: '2px solid white',
                animation: 'pulse 1.5s infinite'
              }}
            />
          )}

          {/* Paused indicator */}
          {isPaused && (
            <div
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                border: '2px solid orange',
                animation: 'none'
              }}
            />
          )}
        </button>

        {/* Speed indicator when scrolling */}
        {isScrolling && (
          <div
            style={{
              backgroundColor: isPaused ? 'rgba(255, 165, 0, 0.6)' : 'rgba(0, 0, 0, 0.6)',
              color: 'white',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: '500',
              alignSelf: 'center',
              backdropFilter: 'blur(10px)'
            }}
          >
            {isPaused ? 'מושהה' : `${speed} px/s`}
          </div>
        )}
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(1.4);
            opacity: 0;
          }
        }

        @keyframes slideUp {
          from {
            transform: translateY(10px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        /* Keyboard shortcut hint */
        @media (min-width: 768px) {
          .scroll-hint {
            position: fixed;
            left: 90px;
            bottom: 30px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 8px 12px;
            border-radius: 8px;
            font-size: 12px;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.3s;
            z-index: 999;
          }

          .scroll-hint.show {
            opacity: 1;
          }
        }
      `}</style>
    </>
  )
}
