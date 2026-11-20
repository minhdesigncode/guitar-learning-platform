import { useState } from 'react'
import { KEYS, FLAT_KEYS, pc, noteName } from '../lib/music.js'
import { useT } from '../i18n/index.jsx'

// Circle of fifths: position i holds the major key KEYS[i] (outer ring)
// and its relative minor (inner ring). Each lesson highlights a window of
// positions, given as offsets from the chosen key. Titles and texts live in
// the i18n dictionaries under lesson.<id>.*
const ENH = { 5: 'Cb', 6: 'Gb', 7: 'C#' }
const ENH_MINOR = { 6: 'Ebm', 7: 'A#m' }
const mod = (n, m = 12) => ((n % m) + m) % m

const LESSONS = [
  {
    id: 'penta',
    outer: [0, 1, 2, 3, 4],
    inner: [],
  },
  {
    id: 'major',
    outer: [-1, 0, 1, 2, 3, 4, 5],
    inner: [],
  },
  {
    id: 'chords',
    outer: [-1, 0, 1],
    inner: [-1, 0, 1],
  },
]

// ISO-8601 week number, so the lesson changes every Monday.
export const isoWeek = (d = new Date()) => {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const day = t.getUTCDay() || 7
  t.setUTCDate(t.getUTCDate() + 4 - day)
  const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1))
  return Math.ceil(((t - y0) / 86400000 + 1) / 7)
}

const C = 170
const R_OUT = 164, R_MID = 112, R_IN = 66
const polar = (r, deg) => {
  const a = ((deg - 90) * Math.PI) / 180
  return [C + r * Math.cos(a), C + r * Math.sin(a)]
}
const sector = (r1, r2, i) => {
  const a0 = i * 30 - 15, a1 = a0 + 30
  const [x0, y0] = polar(r2, a0), [x1, y1] = polar(r2, a1)
  const [x2, y2] = polar(r1, a1), [x3, y3] = polar(r1, a0)
  return `M${x0} ${y0}A${r2} ${r2} 0 0 1 ${x1} ${y1}L${x2} ${y2}A${r1} ${r1} 0 0 0 ${x3} ${y3}Z`
}

const majorPc = (i) => pc(KEYS[mod(i)])
const minorName = (i, flat) => noteName(majorPc(i) + 9, flat) + 'm'

function lessonInfo(lesson, pos, minor, tr) {
  const flat = FLAT_KEYS.includes(KEYS[pos])
  const n = (p) => noteName(p, flat)
  const tonicPc = minor ? majorPc(pos) + 9 : majorPc(pos)
  const sortFrom = (pcs, root) => [...pcs].sort((a, b) => mod(a - root) - mod(b - root))
  const pcsOf = (offs) => offs.map((o) => majorPc(pos + o))
  const T = KEYS[pos]
  const t = minorName(pos, flat)

  if (lesson.id === 'penta') {
    const pcs = pcsOf(lesson.outer)
    const maj = sortFrom(pcs, majorPc(pos)).map(n).join(' ')
    const min = sortFrom(pcs, majorPc(pos) + 9).map(n).join(' ')
    return {
      ...tr('lesson.penta', { minor, T, t, mroot: n(majorPc(pos) + 9), min, maj, left: KEYS[mod(pos - 1)], right: KEYS[mod(pos + 5)] }),
      notes: sortFrom(pcs, tonicPc).map(n),
    }
  }
  if (lesson.id === 'major') {
    const pcs = pcsOf(lesson.outer)
    const next = KEYS[mod(pos + 1)]
    const out = n(majorPc(pos - 1))
    const inn = noteName(majorPc(pos + 6), FLAT_KEYS.includes(next))
    return {
      ...tr('lesson.major', { minor, T, t, mroot: n(majorPc(pos) + 9), from: KEYS[mod(pos - 1)], to: KEYS[mod(pos + 5)], next, out, inn }),
      notes: sortFrom(pcs, tonicPc).map(n),
    }
  }
  const outer = [['IV', -1], ['I', 0], ['V', 1]].map(([r, o]) => ({ r, c: KEYS[mod(pos + o)], big: true }))
  const inner = [['ii', -1], ['vi', 0], ['iii', 1]].map(([r, o]) => ({ r, c: minorName(pos + o, flat) }))
  const all = minor
    ? [{ r: 'i', c: t, big: true }, { r: 'iv', c: inner[0].c }, { r: 'v', c: inner[2].c }, { r: 'III', c: T }, { r: 'VI', c: outer[0].c }, { r: 'VII', c: outer[2].c }]
    : [...outer, ...inner]
  return {
    ...tr('lesson.chords', {
      minor,
      T,
      t,
      outer: outer.map((x) => x.c).join(', '),
      inner: inner.map((x) => x.c).join(', '),
      dim: n(majorPc(pos) + 11) + 'dim',
      ex: `${outer[1].c} ${outer[2].c} ${inner[1].c} ${outer[0].c}`,
    }),
    chords: all,
  }
}

export default function TheoryOfWeek() {
  const tr = useT()
  const week = isoWeek()
  const [shift, setShift] = useState(0)
  const [pos, setPos] = useState(0)
  const [minor, setMinor] = useState(false)
  // Week 47 of 2026 starts with lesson 1 (pentatonic), then rotates weekly.
  const li = mod(week - 47 + shift, LESSONS.length)
  const lesson = LESSONS[li]
  const flat = FLAT_KEYS.includes(KEYS[pos])
  const onOuter = new Set(lesson.outer.map((o) => mod(pos + o)))
  const onInner = new Set(lesson.inner.map((o) => mod(pos + o)))
  const info = lessonInfo(lesson, pos, minor, tr)

  const pick = (i, m) => {
    setPos(i)
    setMinor(m)
  }
  const keyProps = (i, m, label) => ({
    role: 'button',
    tabIndex: 0,
    'aria-label': label,
    'aria-pressed': pos === i && minor === m,
    onClick: () => pick(i, m),
    onKeyDown: (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), pick(i, m)),
  })

  return (
    <div className="card w-theory">
      <div className="w-head">
        <div>
          <span className="w-kicker">{tr('cof.kicker', { week })}{shift ? tr('cof.other') : ''}</span>
          <h2>{tr(`lesson.${lesson.id}.title`)}</h2>
        </div>
        <div className="w-nav">
          <button className="ghost" aria-label={tr('cof.prev')} onClick={() => setShift(shift - 1)}>‹</button>
          <span className="muted">{li + 1}/{LESSONS.length}</span>
          <button className="ghost" aria-label={tr('cof.next')} onClick={() => setShift(shift + 1)}>›</button>
        </div>
      </div>
      <p className="muted" style={{ margin: '4px 0 0' }}>{tr(`lesson.${lesson.id}.hook`)}</p>
      <div className="cof-wrap">
        <svg className="cof" viewBox="0 0 340 340" role="group" aria-label={tr('cof.aria')}>
          {KEYS.map((k, i) => {
            const [x, y] = polar((R_OUT + R_MID) / 2, i * 30)
            const cls = 'o' + (onOuter.has(i) ? ' on' : '') + (pos === i && !minor ? ' tonic' : '')
            return (
              <g key={k} className={cls} {...keyProps(i, false, tr('majorKey', { k }))}>
                <path d={sector(R_MID, R_OUT, i)} />
                <text x={x} y={ENH[i] ? y - 2 : y + 7} textAnchor="middle" className="t1">{k}</text>
                {ENH[i] && <text x={x} y={y + 15} textAnchor="middle" className="t2">{ENH[i]}</text>}
              </g>
            )
          })}
          {KEYS.map((k, i) => {
            const [x, y] = polar((R_MID + R_IN) / 2, i * 30)
            const m = minorName(i, FLAT_KEYS.includes(k))
            const cls = 'i' + (onInner.has(i) ? ' on' : '') + (pos === i && minor ? ' tonic' : '')
            return (
              <g key={k} className={cls} {...keyProps(i, true, tr('minorKey', { k: m }))}>
                <path d={sector(R_IN, R_MID, i)} />
                <text x={x} y={ENH_MINOR[i] ? y - 1 : y + 5} textAnchor="middle" className="t1">{m}</text>
                {ENH_MINOR[i] && <text x={x} y={y + 11} textAnchor="middle" className="t2">{ENH_MINOR[i]}</text>}
              </g>
            )
          })}
          <circle cx={C} cy={C} r={R_IN - 6} className="hub" />
          <text x={C} y={C + 4} textAnchor="middle" className="hub-k">{minor ? minorName(pos, flat) : KEYS[pos]}</text>
          <text x={C} y={C + 24} textAnchor="middle" className="hub-s">{tr(minor ? 'minor' : 'major')}</text>
        </svg>
        <div className="cof-info">
          <h3>{info.name}</h3>
          {info.notes && (
            <div className="cof-notes">
              {info.notes.map((x, i) => <span key={x} className={i ? '' : 'root'}>{x}</span>)}
            </div>
          )}
          {info.chords && (
            <div className="cof-notes">
              {info.chords.map((x) => (
                <span key={x.r} className={x.big ? 'root' : ''}>{x.c}<small>{x.r}</small></span>
              ))}
            </div>
          )}
          {info.body.map((p, i) => <p key={i}>{p}</p>)}
          <p className="muted">{tr('cof.hint')}</p>
        </div>
      </div>
    </div>
  )
}
