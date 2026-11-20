export const SHARPS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
export const FLATS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
export const FLAT_KEYS = ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb']
export const KEYS = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F']

export const pc = (n) => {
  const i = SHARPS.indexOf(n)
  return i < 0 ? FLATS.indexOf(n) : i
}
export const noteName = (i, flat) => (flat ? FLATS : SHARPS)[((i % 12) + 12) % 12]
export const prefersFlat = (i) => FLAT_KEYS.includes(noteName(i, true))

// True for chord names like G, Bm7, Dsus4, C#m7b5, G/B. False for labels like Verse 1, Chorus, Bridge.
export const isChord = (s) =>
  /^[A-G][#b]?(?:maj|min|dim|aug|sus|add|m|M|°|ø|\+|\d|#|b|\(|\)|,|-)*(?:\/[A-G][#b]?)?$/.test(s.trim())

export const transposeChord = (chord, n, flat) =>
  chord.replace(/^([A-G][#b]?)(.*?)(?:\/([A-G][#b]?))?$/, (m, root, quality, bass) => {
    if (pc(root) < 0) return m
    let out = noteName(pc(root) + n, flat) + quality
    if (bass && pc(bass) >= 0) out += '/' + noteName(pc(bass) + n, flat)
    return out
  })

export const transposeBody = (text, n, flat) =>
  text.replace(/\[([^\]]+)\]/g, (m, c) => (isChord(c) ? '[' + transposeChord(c.trim(), n, flat) + ']' : m))

export const transposeKey = (key, n) => {
  const minor = /m$/.test(key)
  const root = pc(key.replace(/m$/, ''))
  if (root < 0) return { key, flat: false }
  const flat = prefersFlat(root + n)
  return { key: noteName(root + n, flat) + (minor ? 'm' : ''), flat }
}

export const SCALES = [
  { name: 'Trưởng (Major)', iv: [0, 2, 4, 5, 7, 9, 11], minor: false, desc: 'Âm giai sáng, vui, nền tảng của đa số bài pop.' },
  { name: 'Thứ tự nhiên (Natural minor)', iv: [0, 2, 3, 5, 7, 8, 10], minor: true, desc: 'Buồn, sâu lắng hơn. Cùng nốt với key trưởng cách 1,5 cung lên.' },
  { name: 'Ngũ cung trưởng (Major pentatonic)', iv: [0, 2, 4, 7, 9], minor: false, desc: '5 nốt, bỏ bậc 4 và 7 của âm giai trưởng. Gần màu nhạc dân gian, rất dễ ứng tác.' },
  { name: 'Ngũ cung thứ (Minor pentatonic)', iv: [0, 3, 5, 7, 10], minor: true, desc: 'Hộp ngũ cung quen thuộc để solo rock, blues.' },
  { name: 'Blues', iv: [0, 3, 5, 6, 7, 10], minor: true, desc: 'Ngũ cung thứ thêm “blue note” (bậc 4 thăng).' },
]

export const MAJOR_CHORDS = [['', 0, 'I'], ['m', 2, 'ii'], ['m', 4, 'iii'], ['', 5, 'IV'], ['', 7, 'V'], ['m', 9, 'vi'], ['dim', 11, 'vii°']]
export const MINOR_CHORDS = [['m', 0, 'i'], ['dim', 2, 'ii°'], ['', 3, 'III'], ['m', 5, 'iv'], ['m', 7, 'v'], ['', 8, 'VI'], ['', 10, 'VII']]

export const chordsOf = (root, flat, minor) =>
  (minor ? MINOR_CHORDS : MAJOR_CHORDS).map(([q, iv, rn]) => ({ chord: noteName(root + iv, flat) + q, roman: rn }))

export const PROGRESSIONS = [
  ['I V vi IV', 'Vòng pop “bốn hợp âm”'],
  ['I vi IV V', 'Vòng thập niên 50–60, ngọt kiểu Beatles'],
  ['vi IV I V', 'Vòng ballad buồn'],
  ['ii V I', 'Vòng jazz kinh điển'],
  ['I IV V IV', 'Vòng rock cơ bản'],
  ['I iii IV V', 'Đi lên nhẹ nhàng, hợp verse kể chuyện'],
  ['IV V iii vi', 'Vòng “canon” kiểu nhạc Nhật/Hàn'],
]

export const progressionIn = (root, flat, prog) => {
  const ch = chordsOf(root, flat, false)
  const map = Object.fromEntries(MAJOR_CHORDS.map((m, i) => [m[2], ch[i].chord]))
  return prog.split(' ').map((r) => map[r])
}

// Guess the key from a list of chords the player figured out by ear.
export const detectKey = (input) => {
  const parsed = input
    .trim()
    .split(/[\s,–-]+/)
    .filter(Boolean)
    .map((c) => {
      const m = c.match(/^([A-G][#b]?)(.*)$/)
      if (!m || pc(m[1]) < 0) return null
      const q = m[2]
      const t = /^(m(?!aj)|min)/.test(q) ? 'm' : /dim|°/.test(q) ? 'dim' : ''
      return { r: pc(m[1]), t }
    })
    .filter(Boolean)
  if (!parsed.length) return []
  const res = []
  for (let k = 0; k < 12; k++) {
    let score = 0
    parsed.forEach((c) => {
      if (MAJOR_CHORDS.some(([q, iv]) => (k + iv) % 12 === c.r && q === c.t)) score += 1
      else if (c.r === (k + 11) % 12 || c.r === (k + 4) % 12) score += 0.4
    })
    if (parsed[0].r === k && !parsed[0].t) score += 0.5
    if (parsed[0].r === (k + 9) % 12 && parsed[0].t === 'm') score += 0.4
    res.push({ k, score, pct: Math.round((Math.min(score, parsed.length) / parsed.length) * 100) })
  }
  return res.sort((a, b) => b.score - a.score).slice(0, 3)
}
