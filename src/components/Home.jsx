import { useEffect, useRef, useState } from 'react'
import TheoryOfWeek from './CircleOfFifths.jsx'
import Icon from './Icon.jsx'
import './home.css'
import { useI18n, useT } from '../i18n/index.jsx'

const chordsIn = (body = '') => {
  const seen = []
  for (const m of body.matchAll(/\[([^\]]+)\]/g)) {
    const c = m[1].trim()
    if (!seen.includes(c)) seen.push(c)
    if (seen.length === 5) break
  }
  return seen
}

const ago = (time, t, locale) => {
  const d = Math.floor((Date.now() - time) / 86400000)
  if (d <= 0) return t('ago.today')
  if (d === 1) return t('ago.yesterday')
  if (d < 30) return t('ago.days', { n: d })
  return new Date(time).toLocaleDateString(locale)
}

function RecentSongs({ songs, onOpen, onNew }) {
  const { t, locale } = useI18n()
  const recent = [...songs].sort((a, b) => (b.updated || 0) - (a.updated || 0)).slice(0, 5)
  return (
    <div className="card w-songs">
      <div className="w-head">
        <div>
          <span className="w-kicker">{t('nav.chords')}</span>
          <h2>{t('home.latest')}</h2>
        </div>
        <button className="ghost w-sm" onClick={onNew}>{t('home.newSong')}</button>
      </div>
      {!recent.length && <p className="note">{t('home.noSongs')}</p>}
      <ul className="w-list">
        {recent.map((s) => (
          <li key={s.id}>
            <button className="w-row" onClick={() => onOpen(s.id)}>
              <span className="w-key">{s.key || '?'}</span>
              <span className="w-main">
                <b>{s.title}</b>
                <span className="w-chords">{chordsIn(s.body).join(' · ') || t('home.noChords')}</span>
              </span>
              <span className="muted w-when">{s.updated ? ago(s.updated, t, locale) : ''}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function MiniMetronome() {
  const t = useT()
  const [bpm, setBpm] = useState(88)
  const [on, setOn] = useState(false)
  const [beat, setBeat] = useState(-1)
  const taps = useRef([])
  const a = useRef({ ac: null, timer: null, next: 0, n: 0 })
  const live = useRef(bpm)
  live.current = bpm

  const click = (t, accent) => {
    const { ac } = a.current
    const o = ac.createOscillator()
    const g = ac.createGain()
    o.frequency.value = accent ? 1600 : 1000
    g.gain.setValueAtTime(accent ? 0.5 : 0.3, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.05)
    o.connect(g).connect(ac.destination)
    o.start(t)
    o.stop(t + 0.06)
  }

  const tick = () => {
    const s = a.current
    while (s.next < s.ac.currentTime + 0.12) {
      const b = s.n % 4
      click(s.next, b === 0)
      setTimeout(() => setBeat(b), Math.max(0, (s.next - s.ac.currentTime) * 1000))
      s.next += 60 / live.current
      s.n++
    }
  }

  const toggle = async () => {
    const s = a.current
    if (!s.ac) s.ac = new (window.AudioContext || window.webkitAudioContext)()
    await s.ac.resume()
    if (on) {
      clearInterval(s.timer)
      setBeat(-1)
    } else {
      s.n = 0
      s.next = s.ac.currentTime + 0.05
      s.timer = setInterval(tick, 25)
    }
    setOn(!on)
  }

  const tap = () => {
    const now = performance.now()
    const t = taps.current.filter((x) => now - x < 2500)
    t.push(now)
    taps.current = t.slice(-5)
    if (t.length > 1) {
      const avg = (t[t.length - 1] - t[0]) / (t.length - 1)
      setBpm(Math.max(40, Math.min(220, Math.round(60000 / avg))))
    }
  }

  useEffect(() => () => clearInterval(a.current.timer), [])
  const set = (v) => setBpm(Math.max(40, Math.min(220, v)))

  return (
    <div className="card w-metro">
      <div className="w-head">
        <div>
          <span className="w-kicker">{t('metro.kicker')}</span>
          <h2>{t('metro.title')}</h2>
        </div>
        <a className="w-link" href="#tools">{t('metro.drums')}</a>
      </div>
      <div className="w-bpm">
        <button className="ghost w-round" aria-label={t('metro.slower')} onClick={() => set(bpm - 1)}>−</button>
        <div><b>{bpm}</b><small>bpm</small></div>
        <button className="ghost w-round" aria-label={t('metro.faster')} onClick={() => set(bpm + 1)}>+</button>
      </div>
      <input type="range" min="40" max="220" value={bpm} aria-label={t('metro.tempo')} onChange={(e) => set(+e.target.value)} />
      <div className="w-beats" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => <span key={i} className={on && beat === i ? 'now' : ''} />)}
      </div>
      <div className="row">
        <button className="pick" style={{ flex: 1 }} onClick={toggle}>{on ? <><Icon name="stop" />{t('stop')}</> : <><Icon name="play" />{t('metro.start')}</>}</button>
        <button className="ghost" style={{ flex: 1 }} onClick={tap}>{t('metro.tap')}</button>
      </div>
    </div>
  )
}

const dayKey = (t) => new Date(t).toDateString()

function PracticeWeek({ journal }) {
  const { t, locale } = useI18n()
  const days = [...Array(7)].map((_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d
  })
  const count = {}
  journal.forEach((j) => { count[dayKey(j.date)] = (count[dayKey(j.date)] || 0) + 1 })
  let streak = 0
  const d = new Date()
  if (!count[dayKey(d)]) d.setDate(d.getDate() - 1)
  while (count[dayKey(d)]) {
    streak++
    d.setDate(d.getDate() - 1)
  }
  const week = days.reduce((n, x) => n + (count[dayKey(x)] || 0), 0)
  const last = journal.reduce((m, j) => Math.max(m, j.date || 0), 0)
  const DOW = t('practice.dow')

  return (
    <div className="card w-practice">
      <div className="w-head">
        <div>
          <span className="w-kicker">{t('stat.recordings')}</span>
          <h2>{t('practice.title')}</h2>
        </div>
        <span className="w-streak" title={t('practice.streakTitle')}>{t('practice.streak', { n: streak })}</span>
      </div>
      <div className="w-days">
        {days.map((x) => {
          const c = count[dayKey(x)] || 0
          return (
            <div key={x.toDateString()} className={'w-day' + (c ? ' on' : '') + (c > 1 ? ' more' : '')}>
              <span>{c || ''}</span>
              <small>{DOW[x.getDay()]}</small>
            </div>
          )
        })}
      </div>
      <p className="muted" style={{ margin: '10px 0 0' }}>
        {t('practice.week', { n: week })}
        {last ? t('practice.last', { when: ago(last, t, locale) }) : ''}
      </p>
    </div>
  )
}

export default function Home({ songs, journal, onOpenSong, onNewSong }) {
  return (
    <div className="home">
      <TheoryOfWeek />
      <div className="home-side">
        <RecentSongs songs={songs} onOpen={onOpenSong} onNew={onNewSong} />
        <MiniMetronome />
        <PracticeWeek journal={journal} />
      </div>
    </div>
  )
}
