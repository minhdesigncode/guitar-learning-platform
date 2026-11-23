import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { transposeChord } from '../lib/music.js'
import { findShapes, loadChords, parseChord, shapeMidi } from '../lib/chords/index.js'
import { playChord } from '../lib/chords/sound.js'
import { useT } from '../i18n/index.jsx'
import './chord.css'

// Eb Ab Bb read better flat; C# and F# sharp.
const FLAT_ROOTS = [3, 8, 10]
const shiftName = (name, n) => {
  const c = parseChord(name)
  if (!c || !n) return name
  const r = (((c.root + n) % 12) + 12) % 12
  return transposeChord(name, n, FLAT_ROOTS.includes(r))
}

const STR = 6
const FRETS = 4
const GX = 20 // space between strings
const GY = 25 // space between frets
const L = 18 // left edge of the grid
const T = 30 // top edge of the grid (nut)
const W = L + GX * (STR - 1) + 34
const H = T + GY * FRETS + 8

/** A chord box, low E on the left, like a chart taped to the music stand. */
export function ChordDiagram({ shape, label }) {
  const { frets, fingers, baseFret, barres } = shape
  const x = (s) => L + s * GX
  const y = (f) => T + (f - 0.5) * GY
  return (
    <svg className="chord-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
      {/* nut: thick at the first fret, a thin line further up the neck */}
      <rect x={L - 1} y={T - (baseFret === 1 ? 5 : 1)} width={GX * (STR - 1) + 2} height={baseFret === 1 ? 5 : 2} rx="1.5" className="nut" />
      {Array.from({ length: FRETS }, (_, i) => (
        <line key={'f' + i} x1={L} x2={x(STR - 1)} y1={T + (i + 1) * GY} y2={T + (i + 1) * GY} className="fret" />
      ))}
      {Array.from({ length: STR }, (_, s) => (
        <line key={'s' + s} x1={x(s)} x2={x(s)} y1={T} y2={T + FRETS * GY} className="string" />
      ))}
      {Array.from({ length: FRETS }, (_, i) => (
        <text key={'n' + i} x={x(STR - 1) + 12} y={y(i + 1) + 4} className="fr">{baseFret + i}fr</text>
      ))}
      {frets.map((f, s) =>
        f < 0 ? (
          <path key={'m' + s} d={`M${x(s) - 4.5} ${T - 18.5}l9 9m0 -9l-9 9`} className="mute" />
        ) : f === 0 ? (
          <circle key={'o' + s} cx={x(s)} cy={T - 14} r="4.6" className="open" />
        ) : null,
      )}
      {barres.map((b) => {
        const on = frets.map((f, s) => (f === b ? s : -1)).filter((s) => s >= 0)
        if (on.length < 2) return null
        const a = on[0]
        const z = on[on.length - 1]
        return <rect key={'b' + b} x={x(a) - 8.5} y={y(b) - 8.5} width={x(z) - x(a) + 17} height="17" rx="8.5" className="cd-dot" />
      })}
      {frets.map((f, s) =>
        f > 0 ? (
          <g key={'d' + s}>
            <circle cx={x(s)} cy={y(f)} r="8.5" className="cd-dot" />
            {fingers[s] > 0 && <text x={x(s)} y={y(f) + 4} className="finger">{fingers[s]}</text>}
          </g>
        ) : null,
      )}
    </svg>
  )
}

const Speaker = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
    <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" className="wave" />
  </svg>
)
const Tri = ({ left, solid }) => (
  <svg viewBox="0 0 12 12" aria-hidden="true" className={solid ? 'solid' : ''}>
    <path d={left ? 'M9 2 3 6l6 4z' : 'M3 2l6 4-6 4z'} />
  </svg>
)

/** Popup with the shapes of one chord: flip through shapes, move it up or down, hear it. */
export default function ChordPopover({ name, anchor, onClose }) {
  const t = useT()
  const [ready, setReady] = useState(false)
  const [shift, setShift] = useState(0)
  const [idx, setIdx] = useState(0)
  const [pos, setPos] = useState(null)
  const box = useRef(null)

  useEffect(() => {
    let live = true
    loadChords().then(() => live && setReady(true))
    return () => { live = false }
  }, [])
  useEffect(() => { setShift(0); setIdx(0) }, [name])

  const shown = shiftName(name, shift)
  const { shapes, exact, base } = ready ? findShapes(shown, false) : { shapes: [], exact: true, base: shown }
  const shape = shapes[Math.min(idx, shapes.length - 1)]

  // Escape closes; a click outside closes.
  useEffect(() => {
    const key = (e) => e.key === 'Escape' && onClose(true)
    const down = (e) => {
      if (box.current && !box.current.contains(e.target) && !e.target.closest?.('[data-chord]')) onClose(false)
    }
    document.addEventListener('keydown', key)
    document.addEventListener('pointerdown', down)
    return () => {
      document.removeEventListener('keydown', key)
      document.removeEventListener('pointerdown', down)
    }
  }, [onClose])

  // Sit under the chord (above it when there is no room) and follow it on scroll;
  // on a phone it is a sheet at the bottom instead.
  useLayoutEffect(() => {
    const place = () => {
      const el = box.current
      if (!el || !anchor) return
      if (window.matchMedia('(max-width: 640px)').matches) return setPos(null)
      const r = anchor.getBoundingClientRect()
      const w = el.offsetWidth
      const h = el.offsetHeight
      const left = Math.max(12, Math.min(window.innerWidth - w - 12, r.left + r.width / 2 - w / 2))
      const below = r.bottom + 10
      const top = below + h > window.innerHeight - 12 && r.top - h - 10 > 12 ? r.top - h - 10 : below
      setPos({ left, top })
    }
    place()
    window.addEventListener('scroll', place, true)
    window.addEventListener('resize', place)
    return () => {
      window.removeEventListener('scroll', place, true)
      window.removeEventListener('resize', place)
    }
  }, [anchor, ready, shapes.length])

  useEffect(() => { box.current?.focus() }, [])

  const play = (mode) => shape && playChord(shapeMidi(shape), mode)
  const n = shapes.length

  return createPortal(
    <>
      <div className="chord-scrim" aria-hidden="true" />
      <div
        ref={box}
        className={'chord-pop' + (pos ? ' floating' : ' sheet-mode')}
        style={pos ? { left: pos.left, top: pos.top } : undefined}
        role="dialog"
        aria-label={t('chord.dialog', { name: shown })}
        tabIndex={-1}
      >
        <button className="chord-x" onClick={() => onClose(true)} aria-label={t('chord.close')}>×</button>
        <div className="chord-head">
          <b className="chord-name">{shown}</b>
          <button className="chord-play" onClick={() => play('strum')} disabled={!shape} aria-label={t('chord.play', { name: shown })} title={t('chord.play', { name: shown })}>
            <Speaker />
          </button>
        </div>
        {!ready ? (
          <p className="muted chord-msg">{t('chord.loading')}</p>
        ) : !shape ? (
          <p className="muted chord-msg">{t('chord.none')}</p>
        ) : (
          <>
            <button className="chord-diag" onClick={() => play('arp')} title={t('chord.arp')} aria-label={t('chord.arp')}>
              <ChordDiagram shape={shape} label={t('chord.diagram', { name: base })} />
            </button>
            {!exact && <p className="muted chord-msg">{t('chord.simpler', { name: shown, base })}</p>}
          </>
        )}
        <div className="chord-step">
          <button className="ghost" onClick={() => setIdx((i) => (i - 1 + n) % n)} disabled={n < 2} aria-label={t('chord.prevShape')}><Tri left /></button>
          <span>{t('chord.shape')} <small>{n ? `${Math.min(idx, n - 1) + 1}/${n}` : ''}</small></span>
          <button className="ghost" onClick={() => setIdx((i) => (i + 1) % n)} disabled={n < 2} aria-label={t('chord.nextShape')}><Tri /></button>
        </div>
        <div className="chord-step">
          <button className="ghost" onClick={() => { setShift((s) => s - 1); setIdx(0) }} aria-label={t('cs.down')}><Tri left solid /></button>
          <span>{t('chord.transpose')}</span>
          <button className="ghost" onClick={() => { setShift((s) => s + 1); setIdx(0) }} aria-label={t('cs.up')}><Tri solid /></button>
        </div>
        {shift % 12 !== 0 && (
          <button className="chord-reset" onClick={() => { setShift(0); setIdx(0) }}>{t('chord.reset', { name })}</button>
        )}
      </div>
    </>,
    document.body,
  )
}
