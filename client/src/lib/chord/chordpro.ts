/**
 * ChordPro format parser and utilities for client-side rendering
 */

export interface ChordAnchor {
  chord: string;
  position: number;
  originalPosition: number;
}

export interface ParsedLine {
  type: 'chord-line' | 'lyric-line' | 'directive' | 'empty';
  text: string;
  chords?: ChordAnchor[];
  directive?: {
    name: string;
    value: string;
  };
}

export interface SongMetadata {
  title?: string;
  artist?: string;
  capo?: number;
  key?: string;
  tempo?: string;
  time?: string;
}

export interface ParsedSong {
  metadata: SongMetadata;
  lines: ParsedLine[];
}

/**
 * Parse a ChordPro formatted song
 */
export function parseChordPro(content: string): ParsedSong {
  const lines = content.split('\n');
  const metadata: SongMetadata = {};
  const parsedLines: ParsedLine[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      parsedLines.push({ type: 'empty', text: '' });
      continue;
    }

    // Check for directives
    const directiveMatch = trimmed.match(/^\{([^:}]+)(?::([^}]*))?\}$/);
    if (directiveMatch) {
      const [, name, value = ''] = directiveMatch;

      // Store metadata
      switch (name.toLowerCase()) {
        case 'title':
        case 't':
          metadata.title = value;
          break;
        case 'artist':
        case 'a':
          metadata.artist = value;
          break;
        case 'capo':
          metadata.capo = parseInt(value) || 0;
          break;
        case 'key':
          metadata.key = value;
          break;
        case 'tempo':
          metadata.tempo = value;
          break;
        case 'time':
          metadata.time = value;
          break;
      }

      parsedLines.push({
        type: 'directive',
        text: trimmed,
        directive: { name, value }
      });
      continue;
    }

    // Parse chord/lyric lines
    const parsed = parseChordLine(line);
    parsedLines.push(parsed);
  }

  return { metadata, lines: parsedLines };
}

/**
 * Parse a single line containing chords and lyrics
 */
export function parseChordLine(line: string): ParsedLine {
  const chordRegex = /\[([^\]]+)\]/g;
  const chords: ChordAnchor[] = [];
  let match;
  let lastEnd = 0;
  let textWithoutChords = '';

  while ((match = chordRegex.exec(line)) !== null) {
    const chord = match[1];
    const chordStart = match.index;
    const chordEnd = match.index + match[0].length;

    // Add text before the chord
    textWithoutChords += line.substring(lastEnd, chordStart);

    // Record chord position in the text without chords
    chords.push({
      chord,
      position: textWithoutChords.length,
      originalPosition: chordStart
    });

    lastEnd = chordEnd;
  }

  // Add remaining text
  textWithoutChords += line.substring(lastEnd);

  // Determine line type
  const hasChords = chords.length > 0;
  const hasText = textWithoutChords.trim().length > 0;

  if (hasChords && !hasText) {
    return {
      type: 'chord-line',
      text: '',
      chords
    };
  } else if (hasChords && hasText) {
    return {
      type: 'lyric-line',
      text: textWithoutChords,
      chords
    };
  } else {
    return {
      type: 'lyric-line',
      text: textWithoutChords
    };
  }
}

/**
 * Convert parsed song back to ChordPro format
 */
export function toChordPro(song: ParsedSong): string {
  const lines: string[] = [];

  // Add metadata directives
  if (song.metadata.title) {
    lines.push(`{title:${song.metadata.title}}`);
  }
  if (song.metadata.artist) {
    lines.push(`{artist:${song.metadata.artist}}`);
  }
  if (song.metadata.capo && song.metadata.capo > 0) {
    lines.push(`{capo:${song.metadata.capo}}`);
  }
  if (song.metadata.key) {
    lines.push(`{key:${song.metadata.key}}`);
  }

  if (lines.length > 0) {
    lines.push(''); // Empty line after metadata
  }

  // Add content lines
  for (const line of song.lines) {
    if (line.type === 'directive') {
      lines.push(line.text);
    } else if (line.type === 'empty') {
      lines.push('');
    } else if (line.chords && line.chords.length > 0) {
      // Reconstruct line with chords
      let result = '';
      let lastPos = 0;

      for (const chord of line.chords) {
        result += line.text.substring(lastPos, chord.position);
        result += `[${chord.chord}]`;
        lastPos = chord.position;
      }
      result += line.text.substring(lastPos);

      lines.push(result);
    } else {
      lines.push(line.text);
    }
  }

  return lines.join('\n');
}

/**
 * Calculate display positions for chords above lyrics
 * Takes into account character widths for proper alignment
 */
export function calculateChordPositions(
  text: string,
  chords: ChordAnchor[],
  fontSize: number = 16
): Array<{ chord: string; x: number }> {
  const positions: Array<{ chord: string; x: number }> = [];

  // Create a temporary canvas to measure text
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    // Fallback to character-based positioning
    return chords.map(anchor => ({
      chord: anchor.chord,
      x: anchor.position * (fontSize * 0.6) // Approximate char width
    }));
  }

  ctx.font = `${fontSize}px monospace`;

  for (const anchor of chords) {
    const textBeforeChord = text.substring(0, anchor.position);
    const width = ctx.measureText(textBeforeChord).width;

    positions.push({
      chord: anchor.chord,
      x: width
    });
  }

  return positions;
}

/**
 * Format a ChordPro song for display with proper sections
 */
export function formatSongSections(lines: ParsedLine[]): Array<{
  type: 'verse' | 'chorus' | 'bridge' | 'tab' | 'default';
  lines: ParsedLine[];
}> {
  const sections: Array<{
    type: 'verse' | 'chorus' | 'bridge' | 'tab' | 'default';
    lines: ParsedLine[];
  }> = [];

  let currentSection: ParsedLine[] = [];
  let currentType: 'verse' | 'chorus' | 'bridge' | 'tab' | 'default' = 'default';

  for (const line of lines) {
    if (line.type === 'directive' && line.directive) {
      const name = line.directive.name.toLowerCase();

      // Check for section start directives
      if (['soc', 'start_of_chorus', 'chorus'].includes(name)) {
        if (currentSection.length > 0) {
          sections.push({ type: currentType, lines: currentSection });
        }
        currentSection = [];
        currentType = 'chorus';
      } else if (['sov', 'start_of_verse', 'verse'].includes(name)) {
        if (currentSection.length > 0) {
          sections.push({ type: currentType, lines: currentSection });
        }
        currentSection = [];
        currentType = 'verse';
      } else if (['sob', 'start_of_bridge', 'bridge'].includes(name)) {
        if (currentSection.length > 0) {
          sections.push({ type: currentType, lines: currentSection });
        }
        currentSection = [];
        currentType = 'bridge';
      } else if (['sot', 'start_of_tab', 'tab'].includes(name)) {
        if (currentSection.length > 0) {
          sections.push({ type: currentType, lines: currentSection });
        }
        currentSection = [];
        currentType = 'tab';
      }
      // Check for section end directives
      else if (['eoc', 'end_of_chorus', 'eov', 'end_of_verse', 'eob', 'end_of_bridge', 'eot', 'end_of_tab'].includes(name)) {
        if (currentSection.length > 0) {
          sections.push({ type: currentType, lines: currentSection });
        }
        currentSection = [];
        currentType = 'default';
      } else {
        currentSection.push(line);
      }
    } else {
      currentSection.push(line);
    }
  }

  // Add remaining section
  if (currentSection.length > 0) {
    sections.push({ type: currentType, lines: currentSection });
  }

  return sections;
}