import { useState, useEffect } from 'react'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  debounceMs?: number
  style?: React.CSSProperties
}

export default function SearchBar({
  value,
  onChange,
  placeholder = 'חפש...',
  debounceMs = 300,
  style
}: SearchBarProps) {
  const [localValue, setLocalValue] = useState(value)

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue)
      }
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [localValue, debounceMs])

  return (
    <div className="search-bar" style={{ position: 'relative', ...style }}>
      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder}
        style={{
          paddingLeft: '40px',
          paddingRight: localValue ? '40px' : '12px'
        }}
      />

      {/* Search icon */}
      <span
        style={{
          position: 'absolute',
          left: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'var(--color-text-muted)',
          pointerEvents: 'none'
        }}
      >
        🔍
      </span>

      {/* Clear button */}
      {localValue && (
        <button
          onClick={() => {
            setLocalValue('')
            onChange('')
          }}
          style={{
            position: 'absolute',
            right: '8px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
            padding: '4px',
            fontSize: '20px',
            lineHeight: 1,
            minWidth: 'auto',
            minHeight: 'auto'
          }}
          title="נקה חיפוש"
        >
          ×
        </button>
      )}
    </div>
  )
}