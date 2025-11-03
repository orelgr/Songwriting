import { Note, Chord, Interval } from 'tonal';

/**
 * Transpose a chord symbol by a number of semitones
 * @param chordSymbol - The chord symbol to transpose (e.g., "Am7", "G/B")
 * @param semitones - Number of semitones to transpose (-12 to 12)
 * @param preferSharps - Whether to prefer sharps over flats in the output
 * @returns The transposed chord symbol
 */
export function transposeChord(
  chordSymbol: string,
  semitones: number,
  preferSharps: boolean = false
): string {
  if (!chordSymbol || semitones === 0) return chordSymbol;

  // Parse slash chords (e.g., "G/B")
  const slashIndex = chordSymbol.indexOf('/');
  let mainChord = chordSymbol;
  let bassNote = '';

  if (slashIndex !== -1) {
    mainChord = chordSymbol.substring(0, slashIndex);
    bassNote = chordSymbol.substring(slashIndex + 1);
  }

  // Parse the chord
  const parsed = Chord.get(mainChord);

  if (parsed.empty) {
    // If tonal can't parse it, try to extract root and quality manually
    const rootMatch = mainChord.match(/^([A-G][#b]?)/);
    if (!rootMatch) return chordSymbol;

    const root = rootMatch[1];
    const quality = mainChord.substring(root.length);

    const transposedRoot = transposeNote(root, semitones, preferSharps);
    const transposedBass = bassNote ? transposeNote(bassNote, semitones, preferSharps) : '';

    return transposedBass ? `${transposedRoot}${quality}/${transposedBass}` : `${transposedRoot}${quality}`;
  }

  // Transpose the root note
  const transposedRoot = transposeNote(parsed.tonic || '', semitones, preferSharps);

  // Reconstruct the chord symbol
  let result = transposedRoot;

  // Add the chord quality/type
  if (parsed.aliases.length > 0) {
    // Use the shortest alias that preserves the original quality
    const quality = mainChord.substring(parsed.tonic?.length || 0);
    result += quality;
  } else if (parsed.symbol !== parsed.tonic) {
    result += mainChord.substring(parsed.tonic?.length || 0);
  }

  // Transpose bass note if present
  if (bassNote) {
    const transposedBass = transposeNote(bassNote, semitones, preferSharps);
    result += `/${transposedBass}`;
  }

  return result;
}

/**
 * Transpose a single note by a number of semitones
 * @param note - The note to transpose (e.g., "C", "F#")
 * @param semitones - Number of semitones to transpose
 * @param preferSharps - Whether to prefer sharps over flats
 * @returns The transposed note
 */
export function transposeNote(note: string, semitones: number, preferSharps: boolean = false): string {
  if (!note || semitones === 0) return note;

  const transposed = Note.transpose(note, Interval.fromSemitones(semitones));

  if (!transposed) return note;

  // Simplify enharmonics based on preference
  return simplifyEnharmonic(transposed, preferSharps);
}

/**
 * Simplify enharmonic equivalents based on preference
 * @param note - The note to simplify
 * @param preferSharps - Whether to prefer sharps over flats
 * @returns The simplified note
 */
function simplifyEnharmonic(note: string, preferSharps: boolean): string {
  if (!note) return note;

  // Note.enharmonic returns a single string, not an array
  const enharmonic = Note.enharmonic(note);

  if (!enharmonic) return note;

  // Choose between the original and enharmonic based on preference
  const hasSharp = note.includes('#');
  const hasFlat = note.includes('b');
  const enharmonicHasSharp = enharmonic.includes('#');
  const enharmonicHasFlat = enharmonic.includes('b');

  // Avoid double sharps/flats
  if (note.includes('##') || note.includes('bb')) {
    return enharmonic;
  }

  if (preferSharps) {
    // Prefer sharps over flats
    if (hasSharp) return note;
    if (enharmonicHasSharp) return enharmonic;
    return note;
  } else {
    // Prefer flats over sharps
    if (hasFlat) return note;
    if (enharmonicHasFlat) return enharmonic;
    return note;
  }
}

/**
 * Detect the key of a song based on the chords used
 * @param chords - Array of chord symbols used in the song
 * @returns The most likely key
 */
export function detectKey(chords: string[]): string | null {
  if (chords.length === 0) return null;

  // Count occurrences of each chord root
  const rootCounts = new Map<string, number>();

  for (const chord of chords) {
    const parsed = Chord.get(chord);
    if (parsed.tonic) {
      const current = rootCounts.get(parsed.tonic) || 0;
      rootCounts.set(parsed.tonic, current + 1);
    }
  }

  // Find the most common root (likely the tonic)
  let maxCount = 0;
  let likelyTonic = '';

  for (const [root, count] of rootCounts) {
    if (count > maxCount) {
      maxCount = count;
      likelyTonic = root;
    }
  }

  // Check if major or minor by looking for the relative major/minor chord
  const hasMajor = chords.some(c => {
    const parsed = Chord.get(c);
    return parsed.tonic === likelyTonic && parsed.quality === 'Major';
  });

  const hasMinor = chords.some(c => {
    const parsed = Chord.get(c);
    return parsed.tonic === likelyTonic && parsed.quality === 'Minor';
  });

  if (hasMajor && !hasMinor) return likelyTonic;
  if (hasMinor && !hasMajor) return `${likelyTonic}m`;

  return likelyTonic;
}

/**
 * Calculate the capo position needed to play in a different key
 * @param originalKey - The original key
 * @param targetKey - The target key to play in
 * @returns The capo position (0-11)
 */
export function calculateCapo(originalKey: string, targetKey: string): number {
  const original = Note.get(originalKey.replace('m', ''));
  const target = Note.get(targetKey.replace('m', ''));

  if (!original.name || !target.name) return 0;

  const semitones = Interval.distance(original.name, target.name);
  const capo = Interval.semitones(semitones) || 0;

  // Ensure positive capo position
  return capo < 0 ? capo + 12 : capo;
}

/**
 * Get chord suggestions for a given key
 * @param key - The key to get suggestions for
 * @returns Array of common chord progressions
 */
export function getChordSuggestions(key: string): string[][] {
  const isMinor = key.includes('m');
  const root = key.replace('m', '');

  if (isMinor) {
    // Common minor progressions
    return [
      [root + 'm', transposeChord(root + 'm', 5), transposeChord(root + 'm', 7), root + 'm'], // i-iv-v-i
      [root + 'm', transposeChord(root, 3), transposeChord(root + 'm', 7), root + 'm'], // i-III-v-i
      [root + 'm', transposeChord(root + 'm', 5), transposeChord(root, 3), transposeChord(root + 'm', 7)], // i-iv-III-v
    ];
  } else {
    // Common major progressions
    return [
      [root, transposeChord(root, 7), transposeChord(root, 5), root], // I-V-IV-I
      [root, transposeChord(root + 'm', 9), transposeChord(root, 5), transposeChord(root, 7)], // I-vi-IV-V
      [root, transposeChord(root, 5), transposeChord(root + 'm', 9), transposeChord(root, 7)], // I-IV-vi-V
    ];
  }
}