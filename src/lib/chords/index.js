// Chord shapes: read a chord name as written in a song ("Am7", "C/E", "F#m") and find its guitar shapes
// in the chords-db data (loaded on first use, it is ~18 KB gzipped).
import { pc, noteName } from '../music.js'

let data = null
export const loadChords = async () => (data ??= (await import('./data.js')).default)

// Spellings people write → the suffix names chords-db uses.
const ALIAS = {
  '': 'major', M: 'major', maj: 'major', m: 'minor', min: 'minor', mi: 'minor', '-': 'minor',
  '°': 'dim', o: 'dim', '°7': 'dim7', o7: 'dim7', '+': 'aug', '+7': 'aug7', '7+': 'aug7', '7#5': 'aug7',
  M7: 'maj7', Δ: 'maj7', Δ7: 'maj7', ma7: 'maj7', M9: 'maj9', ø: 'm7b5', ø7: 'm7b5', 'm7-5': 'm7b5',
  min7: 'm7', mi7: 'm7', '-7': 'm7', mM7: 'mmaj7', 'm(maj7)': 'mmaj7', mmaj: 'mmaj7',
  '7sus': '7sus4', sus: 'sus4', 2: 'sus2', 4: 'sus4', add2: 'add9', madd2: 'madd9', '6/9': '69', '6add9': '69',
  9: '9', 7: '7', 6: '6', 5: '5', 11: '11', 13: '13',
}

/** Splits "F#m7/C#" into { root: 6, quality: 'm7', bass: 1 }, or null when it is not a chord. */
export function parseChord(name) {
  const m = String(name).trim().match(/^([A-G][#b♯♭]?)([^/]*)(?:\/([A-G][#b♯♭]?))?$/)
  if (!m) return null
  const fix = (n) => n && n.replace('♯', '#').replace('♭', 'b')
  const root = pc(fix(m[1]))
  if (root < 0) return null
  const bass = m[3] ? pc(fix(m[3])) : -1
  return { root, quality: m[2].trim(), bass }
}

const suffixOf = (q) => ALIAS[q] ?? ALIAS[q.replace(/[()]/g, '')] ?? q.replace(/[()]/g, '')

/**
 * Shapes for a chord name. Returns { shapes, exact, base } where `exact` is false when only a simpler
 * chord was found (the bass of a slash chord, or extensions, dropped) and `base` names what is shown.
 */
export function findShapes(name, flat) {
  const c = parseChord(name)
  if (!c || !data) return { shapes: [], exact: false, base: name }
  const table = data[c.root] || {}
  const suffix = suffixOf(c.quality)
  const tries = []
  if (c.bass >= 0 && c.bass !== c.root) {
    const pre = suffix === 'major' ? '' : suffix === 'minor' ? 'm' : suffix
    tries.push(pre + '/' + noteName(c.bass, false), pre + '/' + noteName(c.bass, true))
  }
  tries.push(suffix)
  for (const s of tries) if (table[s]) return { shapes: table[s].map(unpack), exact: s !== suffix || tries.length === 1, base: s === suffix ? name.replace(/\/.*/, '') : name }
  // Nothing for this spelling: fall back to the plain major or minor chord.
  const minor = /^(m(?!aj)|min|mi|-)/.test(c.quality)
  const plain = noteName(c.root, flat) + (minor ? 'm' : '')
  return { shapes: (table[minor ? 'minor' : 'major'] || []).map(unpack), exact: false, base: plain }
}

/** "x32010 032010 1 -" → { frets, fingers, baseFret, barres } in the usual chords-db shape. */
export function unpack(s) {
  const [f, n, b, bar] = s.split(' ')
  return {
    frets: [...f].map((ch) => (ch === 'x' ? -1 : parseInt(ch, 16))),
    fingers: [...n].map(Number),
    baseFret: +b,
    barres: bar === '-' ? [] : bar.split(',').map(Number),
  }
}

const OPEN = [40, 45, 50, 55, 59, 64] // E2 A2 D3 G3 B3 E4

/** MIDI notes the shape sounds, low string first; muted strings are left out. */
export const shapeMidi = ({ frets, baseFret }) =>
  frets.flatMap((f, i) => (f < 0 ? [] : [OPEN[i] + (f === 0 ? 0 : f + baseFret - 1)]))

/** Note names per string (null for muted), for labels. */
export const shapeNotes = (shape, flat) =>
  shape.frets.map((f, i) => (f < 0 ? null : noteName(OPEN[i] + (f === 0 ? 0 : f + shape.baseFret - 1), flat)))
