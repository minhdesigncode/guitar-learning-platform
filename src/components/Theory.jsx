import { useEffect, useRef, useState } from 'react'
import { KEYS, SCALES, PROGRESSIONS, FLAT_KEYS, pc, noteName, chordsOf, progressionIn, detectKey } from '../lib/music.js'
import { useT } from '../i18n/index.jsx'

const TUNING = [4, 11, 7, 2, 9, 4] // high E to low E

function Fretboard({ root, scale, flat }) {
  const ref = useRef(null)
  const [w, setW] = useState(0)
  useEffect(() => {
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width))
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])
  const H = 260, L = 34, R = w - 12, T = 22, B = H - 28, F = 12
  const fw = (R - L) / F, sh = (B - T) / 5, rr = Math.min(13, fw * 0.36)
  return (
    <div className="fig" ref={ref}>
      {w > 0 && (
        <svg viewBox={`0 0 ${w} ${H}`}>
          {[...Array(F + 1)].map((_, f) => (
            <g key={f}>
              <line x1={L + f * fw} y1={T} x2={L + f * fw} y2={B} stroke="currentColor" strokeOpacity={f ? 0.25 : 0.8} strokeWidth={f ? 1.5 : 5} />
              {f > 0 && <text x={L + (f - 0.5) * fw} y={H - 8} textAnchor="middle" fontSize="12" fill="currentColor" opacity=".55">{f}</text>}
            </g>
          ))}
          {[3, 5, 7, 9].map((f) => <circle key={f} cx={L + (f - 0.5) * fw} cy={(T + B) / 2} r="5" fill="currentColor" opacity=".12" />)}
          <circle cx={L + 11.5 * fw} cy={T + sh * 1.5} r="5" fill="currentColor" opacity=".12" />
          <circle cx={L + 11.5 * fw} cy={T + sh * 3.5} r="5" fill="currentColor" opacity=".12" />
          {TUNING.map((t, i) => {
            const y = T + i * sh
            return (
              <g key={i}>
                <line x1={L} y1={y} x2={R} y2={y} stroke="currentColor" strokeOpacity=".5" strokeWidth={1 + i * 0.35} />
                {[...Array(F + 1)].map((_, f) => {
                  const p = (t + f) % 12
                  const d = (((p - root) % 12) + 12) % 12
                  if (!scale.iv.includes(d)) return null
                  const x = f ? L + (f - 0.5) * fw : L - 16
                  return (
                    <g key={f}>
                      <circle cx={x} cy={y} r={rr} fill={d === 0 ? '#7360f9' : '#b9d440'} />
                      <text x={x} y={y + 4} textAnchor="middle" fontSize={rr > 11 ? 11 : 9} fontWeight="700" fill={d === 0 ? '#fff' : '#241f4f'}>{noteName(p, flat)}</text>
                    </g>
                  )
                })}
              </g>
            )
          })}
        </svg>
      )}
    </div>
  )
}

export default function Theory({ onCreateSong }) {
  const t = useT()
  const [key, setKey] = useState('G')
  const [si, setSi] = useState(0)
  const [pi, setPi] = useState(1)
  const [dq, setDq] = useState('')
  const scale = SCALES[si]
  const root = pc(key)
  const flat = FLAT_KEYS.includes(key)
  const prog = progressionIn(root, flat, PROGRESSIONS[pi])
  const found = detectKey(dq)

  return (
    <section>
      <div className="row">
        <div style={{ flex: '1 1 140px' }}>
          <label htmlFor="tk">{t('key')}</label>
          <select id="tk" value={key} onChange={(e) => setKey(e.target.value)}>
            {KEYS.map((k) => <option key={k}>{k}</option>)}
          </select>
        </div>
        <div style={{ flex: '2 1 220px' }}>
          <label htmlFor="ts">{t('scale')}</label>
          <select id="ts" value={si} onChange={(e) => setSi(+e.target.value)}>
            {SCALES.map((s, i) => <option key={i} value={i}>{t('scale.' + s.id)}</option>)}
          </select>
        </div>
      </div>
      <p className="big" style={{ margin: '20px 0 4px' }}>{scale.iv.map((i) => noteName(root + i, flat)).join(' · ')}</p>
      <p className="muted">{t(`scale.${scale.id}.desc`)}</p>
      <div className="scroll card" style={{ marginTop: 12, padding: 10 }}>
        <div style={{ minWidth: 640 }}><Fretboard root={root} scale={scale} flat={flat} /></div>
      </div>

      <h3 style={{ marginTop: 28 }}>{t('theory.chordsInKey')}</h3>
      <div className="chips" style={{ marginTop: 10 }}>
        {chordsOf(root, flat, scale.minor).map((c) => (
          <div key={c.roman} className="chip"><b>{c.chord}</b><small>{c.roman}</small></div>
        ))}
      </div>

      <div className="grid" style={{ marginTop: 28 }}>
        <div className="card">
          <h3>{t('theory.progTitle')}</h3>
          <p className="big" style={{ fontSize: 28, margin: '10px 0' }}>{prog.join(' – ')}</p>
          <p className="muted">{t('theory.progMeta', { desc: t('prog.' + PROGRESSIONS[pi]), roman: PROGRESSIONS[pi], key: noteName(root, flat) })}</p>
          <div className="row">
            <button className="ghost" onClick={() => setPi((pi + 1) % PROGRESSIONS.length)}>{t('theory.another')}</button>
            <button className="pick" onClick={() => onCreateSong({
              title: t('theory.newIdea', { roman: PROGRESSIONS[pi] }),
              key: noteName(root, flat),
              capo: 0,
              body: t('theory.songBody', { chords: prog.map((c) => '[' + c + ']').join('     ') }),
            })}>{t('theory.create')}</button>
          </div>
        </div>
        <div className="card">
          <h3>{t('theory.detect')}</h3>
          <p className="muted">{t('theory.detectHelp')}</p>
          <input value={dq} onChange={(e) => setDq(e.target.value)} placeholder={t('theory.detectPh')} />
          <div style={{ marginTop: 12 }}>
            {found.map((x, i) => {
              const f = FLAT_KEYS.includes(noteName(x.k, true))
              return (
                <div key={x.k} className="row" style={{ justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
                  <span><b>{i ? '' : '★ '}{t('majorKey', { k: noteName(x.k, f) })}</b> <span className="muted">/ {t('minorKey', { k: noteName(x.k + 9, f) })}</span></span>
                  <span className="muted">{t('theory.match', { pct: x.pct })}</span>
                </div>
              )
            })}
            {found.length > 0 && <p className="muted">{t('theory.borrowed')}</p>}
          </div>
        </div>
      </div>
    </section>
  )
}
