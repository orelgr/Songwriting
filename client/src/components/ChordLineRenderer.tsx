import { useMemo } from 'react'
import { parseChordLine, ChordAnchor, calculateChordPositions } from '../lib/chord/chordpro'
import { transposeChord } from '../lib/chord/transpose'

interface ChordLineRendererProps {
  line: string
  transpose?: number
  preferSharps?: boolean
  fontSize?: number
}

export default function ChordLineRenderer({
  line,
  transpose = 0,
  preferSharps = false,
  fontSize = 16
}: ChordLineRendererProps) {
  const parsed = useMemo(() => parseChordLine(line), [line])

  // If it's a directive or empty line, render as-is
  if (parsed.type === 'directive' || parsed.type === 'empty') {
    return null
  }

  // If there are no chords, just render the text
  if (!parsed.chords || parsed.chords.length === 0) {
    return <div className="lyric-line">{parsed.text}</div>
  }

  // Transpose chords if needed
  const transposedChords = useMemo(() => {
    if (!parsed.chords || transpose === 0) return parsed.chords

    return parsed.chords.map(anchor => ({
      ...anchor,
      chord: transposeChord(anchor.chord, transpose, preferSharps)
    }))
  }, [parsed.chords, transpose, preferSharps])

  // Calculate display positions for chords
  const chordPositions = useMemo(() => {
    if (!transposedChords) return []
    return calculateChordPositions(parsed.text, transposedChords, fontSize)
  }, [parsed.text, transposedChords, fontSize])

  // If it's a chord-only line (no lyrics)
  if (parsed.type === 'chord-line') {
    return (
      <div className="chord-line">
        {chordPositions.map((pos, idx) => (
          <span key={idx} style={{ marginRight: '1em' }}>
            {pos.chord}
          </span>
        ))}
      </div>
    )
  }

  // Render lyrics with chords above
  return (
    <div className="lyric-line" style={{ position: 'relative', paddingTop: '1.5em' }}>
      {/* Render chords above the text */}
      {chordPositions.map((pos, idx) => (
        <span
          key={idx}
          className="chord-above"
          style={{ left: `${pos.x}px` }}
        >
          {pos.chord}
        </span>
      ))}
      {/* Render the lyric text */}
      <span>{parsed.text}</span>
    </div>
  )
}

interface SongRendererProps {
  content: string
  transpose?: number
  preferSharps?: boolean
  capo?: number
}

export function SongRenderer({
  content,
  transpose = 0,
  preferSharps = false,
  capo = 0
}: SongRendererProps) {
  const lines = useMemo(() => content.split('\n'), [content])

  // Apply capo as negative transposition for display
  const effectiveTranspose = transpose - capo

  return (
    <div className="song-content" style={{ fontFamily: 'inherit', lineHeight: 1.8 }}>
      {capo > 0 && (
        <div className="capo-indicator" style={{
          marginBottom: '1em',
          padding: '0.5em',
          backgroundColor: 'var(--color-bg-secondary)',
          borderRadius: '4px'
        }}>
          קאפו: פרט {capo} | Capo: {capo}
        </div>
      )}

      {lines.map((line, idx) => {
        // Skip directive lines
        if (line.trim().startsWith('{') && line.trim().endsWith('}')) {
          return null
        }

        // Handle empty lines
        if (!line.trim()) {
          return <div key={idx} style={{ height: '1em' }}></div>
        }

        return (
          <ChordLineRenderer
            key={idx}
            line={line}
            transpose={effectiveTranspose}
            preferSharps={preferSharps}
          />
        )
      })}
    </div>
  )
}