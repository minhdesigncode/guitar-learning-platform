import { useEffect, useRef, useState } from 'react'
import TheoryOfWeek from './CircleOfFifths.jsx'
import './home.css'

const chordsIn = (body = '') => {
  const seen = []
  for (const m of body.matchAll(/\[([^\]]+)\]/g)) {
    const c = m[1].trim()
    if (!seen.includes(c)) seen.push(c)
    if (seen.length === 5) break
  }
  return seen
}

const ago = (t) => {
  const d = Math.floor((Date.now() - t) / 86400000)
  if (d <= 0) return 'hôm nay'
  if (d === 1) return 'hôm qua'
  if (d < 30) return `${d} ngày trước`
  return new Date(t).toLocaleDateString('vi-VN')
}

function RecentSongs({ songs, onOpen, onNew }) {
  const recent = [...songs].sort((a, b) => (b.updated || 0) - (a.updated || 0)).slice(0, 5)
  return (
    <div className="card w-songs">
      <div className="w-head">
        <div>
          <span className="w-kicker">Chord space</span>
          <h2>Bài mới nhất</h2>
        </div>
        <button className="ghost w-sm" onClick={onNew}>+ Bài mới</button>
      </div>
      {!recent.length && <p className="note">Chưa có bài nào trong Chord space.</p>}
      <ul className="w-list">
        {recent.map((s) => (
          <li key={s.id}>
            <button className="w-row" onClick={() => onOpen(s.id)}>
              <span className="w-key">{s.key || '?'}</span>
              <span className="w-main">
                <b>{s.title}</b>
                <span className="w-chords">{chordsIn(s.body).join(' · ') || 'Chưa có hợp âm'}</span>
              </span>
              <span className="muted w-when">{s.updated ? ago(s.updated) : ''}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function MiniMetronome() {
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
          <span className="w-kicker">Beat nhanh</span>
          <h2>Máy nhịp</h2>
        </div>
        <a className="w-link" href="#tools">Beat trống ›</a>
      </div>
      <div className="w-bpm">
        <button className="ghost w-round" aria-label="Giảm tempo" onClick={() => set(bpm - 1)}>−</button>
        <div><b>{bpm}</b><small>bpm</small></div>
        <button className="ghost w-round" aria-label="Tăng tempo" onClick={() => set(bpm + 1)}>+</button>
      </div>
      <input type="range" min="40" max="220" value={bpm} aria-label="Tempo" onChange={(e) => set(+e.target.value)} />
      <div className="w-beats" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => <span key={i} className={on && beat === i ? 'now' : ''} />)}
      </div>
      <div className="row">
        <button className="pick" style={{ flex: 1 }} onClick={toggle}>{on ? '■ Dừng' : '▶ Chạy'}</button>
        <button className="ghost" style={{ flex: 1 }} onClick={tap}>Gõ nhịp</button>
      </div>
    </div>
  )
}

const dayKey = (t) => new Date(t).toDateString()

function PracticeWeek({ journal }) {
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
  const DOW = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

  return (
    <div className="card w-practice">
      <div className="w-head">
        <div>
          <span className="w-kicker">Journal</span>
          <h2>7 ngày qua</h2>
        </div>
        <span className="w-streak" title="Số ngày liên tiếp có bản thu">🔥 {streak} ngày</span>
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
        {week ? `${week} bản thu tuần này.` : 'Tuần này chưa thu bài nào.'}
        {last ? ` Lần cuối: ${ago(last)}.` : ''}
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
