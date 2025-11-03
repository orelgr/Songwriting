import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Font } from '@react-pdf/renderer'
import { parseChordPro } from '../lib/chord/chordpro'
import { transposeChord } from '../lib/chord/transpose'

// Define styles for PDF
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica'
  },
  title: {
    fontSize: 24,
    marginBottom: 10,
    fontWeight: 'bold'
  },
  author: {
    fontSize: 14,
    marginBottom: 5,
    color: '#666'
  },
  metadata: {
    fontSize: 12,
    marginBottom: 20,
    color: '#666'
  },
  line: {
    marginBottom: 8,
    flexDirection: 'column'
  },
  chordLine: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0066cc',
    marginBottom: 2
  },
  lyricLine: {
    fontSize: 12,
    lineHeight: 1.5
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 5,
    color: '#333'
  }
})

interface PdfExportButtonProps {
  song: {
    title: string
    author?: string
    content: string
    capo?: number
    transpose?: number
  }
}

// PDF Document component
const SongPdfDocument = ({ song }: PdfExportButtonProps) => {
  const parsed = parseChordPro(song.content)
  const effectiveTranspose = (song.transpose || 0) - (song.capo || 0)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Title */}
        <Text style={styles.title}>{song.title}</Text>

        {/* Author */}
        {song.author && (
          <Text style={styles.author}>מחבר: {song.author}</Text>
        )}

        {/* Metadata */}
        <View style={styles.metadata}>
          {song.capo && song.capo > 0 && (
            <Text>קאפו: פרט {song.capo}</Text>
          )}
          {song.transpose && song.transpose !== 0 && (
            <Text>טרנספוזיציה: {song.transpose > 0 ? '+' : ''}{song.transpose}</Text>
          )}
          {parsed.metadata.key && (
            <Text>סולם: {parsed.metadata.key}</Text>
          )}
        </View>

        {/* Song content */}
        {parsed.lines.map((line, idx) => {
          // Skip directives
          if (line.type === 'directive') {
            const directive = line.directive
            if (directive?.name === 'chorus' || directive?.name === 'soc') {
              return <Text key={idx} style={styles.sectionHeader}>פזמון:</Text>
            }
            if (directive?.name === 'verse' || directive?.name === 'sov') {
              return <Text key={idx} style={styles.sectionHeader}>בית:</Text>
            }
            if (directive?.name === 'bridge' || directive?.name === 'sob') {
              return <Text key={idx} style={styles.sectionHeader}>גשר:</Text>
            }
            return null
          }

          // Skip empty lines
          if (line.type === 'empty') {
            return <View key={idx} style={{ marginBottom: 10 }} />
          }

          // Render lyrics with chords
          if (line.chords && line.chords.length > 0) {
            // Build chord line
            const chordText = line.chords
              .map(anchor => {
                const transposed = effectiveTranspose !== 0
                  ? transposeChord(anchor.chord, effectiveTranspose, false)
                  : anchor.chord
                // Add spacing based on position
                const spaces = ' '.repeat(Math.max(0, anchor.position - (line.chords![line.chords!.indexOf(anchor) - 1]?.position || 0)))
                return spaces + transposed
              })
              .join('')

            return (
              <View key={idx} style={styles.line}>
                {chordText && <Text style={styles.chordLine}>{chordText}</Text>}
                <Text style={styles.lyricLine}>{line.text}</Text>
              </View>
            )
          }

          // Regular text line
          return (
            <Text key={idx} style={styles.lyricLine}>
              {line.text}
            </Text>
          )
        })}
      </Page>
    </Document>
  )
}

export default function PdfExportButton({ song }: PdfExportButtonProps) {
  const fileName = `${song.title.replace(/[^a-zA-Z0-9א-ת ]/g, '')}.pdf`

  return (
    <PDFDownloadLink
      document={<SongPdfDocument song={song} />}
      fileName={fileName}
      className="btn btn-secondary"
      style={{ textDecoration: 'none' }}
    >
      {({ blob, url, loading, error }) =>
        loading ? 'מכין PDF...' : '📄 ייצוא PDF'
      }
    </PDFDownloadLink>
  )
}