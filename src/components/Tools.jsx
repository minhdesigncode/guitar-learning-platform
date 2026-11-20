import { useEffect, useRef, useState } from 'react'
import { useT } from '../i18n/index.jsx'
import Icon from './Icon.jsx'

const toBool = (s) => [...s].map((c) => c === 'x')
// Style names: i18n keys style.<id>
const STYLES = {
  rock: { k: 'x.......x.x.....', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.' },
  ballad: { k: 'x.....x.........', s: '........x.......', h: 'x.x.x.x.x.x.x.x.' },
  pop: { k: 'x......x..x.....', s: '....x.......x...', h: 'xxxxxxxxxxxxxxxx' },
  bossa: { k: 'x..xx..xx..xx..x', s: 'x..x..x...x..x..', h: 'x.x.x.x.x.x.x.x.' },
  click: { k: 'x...............', s: '....x...x...x...', h: '................' },
}
const MARK = { k: 'B', s: 'S', h: 'H', '': '' }
const load = (name) => {
  const p = STYLES[name]
  return { k: toBool(p.k), s: toBool(p.s), h: toBool(p.h) }
}

function BeatMachine() {
  const t = useT()
  const [style, setStyle] = useState('rock')
  const [pat, setPat] = useState(() => load('rock'))
  const [bpm, setBpm] = useState(88)
  const [playing, setPlaying] = useState(false)
  const [now, setNow] = useState(-1)
  const a = useRef({ ac: null, noise: null, step: 0, next: 0, timer: null })
  const live = useRef({ pat, bpm })
  live.current = { pat, bpm }

  const hit = (type, t, accent) => {
    const { ac, noise } = a.current
    const g = ac.createGain()
    g.connect(ac.destination)
    if (type === 'k') {
      const o = ac.createOscillator()
      o.frequency.setValueAtTime(140, t)
      o.frequency.exponentialRampToValueAtTime(45, t + 0.12)
      g.gain.setValueAtTime(0.9, t)
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.3)
      o.connect(g)
      o.start(t)
      o.stop(t + 0.3)
    } else {
      const n = ac.createBufferSource()
      n.buffer = noise
      const f = ac.createBiquadFilter()
      f.type = type === 'h' ? 'highpass' : 'bandpass'
      f.frequency.value = type === 'h' ? 7000 : 1800
      const v = type === 'h' ? 0.18 : accent ? 0.6 : 0.45
      const d = type === 'h' ? 0.05 : 0.18
      g.gain.setValueAtTime(v, t)
      g.gain.exponentialRampToValueAtTime(0.001, t + d)
      n.connect(f)
      f.connect(g)
      n.start(t)
      n.stop(t + d + 0.02)
    }
  }

  const tick = () => {
    const s = a.current
    const dur = 60 / live.current.bpm / 4
    while (s.next < s.ac.currentTime + 0.12) {
      const p = live.current.pat
      ;['k', 's', 'h'].forEach((x) => p[x][s.step] && hit(x, s.next, s.step === 0))
      const st = s.step
      setTimeout(() => setNow(st), Math.max(0, (s.next - s.ac.currentTime) * 1000))
      s.next += dur
      s.step = (s.step + 1) % 16
    }
  }

  const toggle = async () => {
    const s = a.current
    if (!s.ac) {
      s.ac = new (window.AudioContext || window.webkitAudioContext)()
      const b = s.ac.createBuffer(1, s.ac.sampleRate * 0.3, s.ac.sampleRate)
      const d = b.getChannelData(0)
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
      s.noise = b
    }
    await s.ac.resume()
    if (playing) {
      clearInterval(s.timer)
      setNow(-1)
    } else {
      s.step = 0
      s.next = s.ac.currentTime + 0.05
      s.timer = setInterval(tick, 25)
    }
    setPlaying(!playing)
  }

  useEffect(() => () => clearInterval(a.current.timer), [])

  const cycle = (i) => {
    const p = { k: [...pat.k], s: [...pat.s], h: [...pat.h] }
    if (p.k[i]) { p.k[i] = false; p.s[i] = true }
    else if (p.s[i]) { p.s[i] = false; p.h[i] = true }
    else if (p.h[i]) p.h[i] = false
    else p.k[i] = true
    setPat(p)
  }

  return (
    <div className="card">
      <h2>{t('beat.title')}</h2>
      <div className="row" style={{ marginTop: 12 }}>
        <div style={{ flex: '1 1 160px' }}>
          <label htmlFor="bs">{t('beat.style')}</label>
          <select id="bs" value={style} onChange={(e) => { setStyle(e.target.value); setPat(load(e.target.value)) }}>
            {Object.keys(STYLES).map((k) => <option key={k} value={k}>{t('style.' + k)}</option>)}
          </select>
        </div>
        <div style={{ flex: '2 1 220px' }}>
          <label htmlFor="bb">{t('beat.tempo', { bpm })}</label>
          <input id="bb" type="range" min="50" max="180" value={bpm} onChange={(e) => setBpm(+e.target.value)} />
        </div>
        <button className="pick" style={{ alignSelf: 'end' }} onClick={toggle}>{playing ? <><Icon name="stop" />{t('stop')}</> : <><Icon name="play" />{t('beat.play')}</>}</button>
      </div>
      <div className="steps" role="group" aria-label={t('beat.steps')}>
        {[...Array(16)].map((_, i) => {
          const hit = pat.k[i] ? 'k' : pat.s[i] ? 's' : pat.h[i] ? 'h' : ''
          return (
            <button key={i} type="button" onClick={() => cycle(i)}
              aria-label={t('beat.step', { n: i + 1, hit: t('hit.' + (hit || 'rest')) })}
              className={hit + (playing && i === now ? ' now' : '')}>
              {MARK[hit]}
            </button>
          )
        })}
      </div>
      <p className="muted" style={{ marginTop: 8 }}>{t('beat.legend')}</p>
    </div>
  )
}

export default function Tools() {
  return (
    <section>
      <BeatMachine />
    </section>
  )
}
