import { useEffect, useRef, useState } from 'react'
import { mountGuitar } from '../creative/hairline.js'
import { createPluck } from '../creative/pluck.js'
import { useT } from '../i18n/index.jsx'

// "6·E" -> { n: '6', note: 'E' }
const parse = (r) => {
  const [n, note] = (r || '').split('·')
  return note ? { n, note } : null
}

export default function CreativeSpace() {
  const t = useT()
  const stage = useRef(null)
  const fig = useRef(null)
  const [read, setRead] = useState('rest')
  const [intensity, setIntensity] = useState(0.5)
  const [playing, setPlaying] = useState(false)
  const [sound, setSound] = useState(false)
  const pluck = useRef(null)
  if (!pluck.current) pluck.current = createPluck()

  useEffect(() => {
    const f = mountGuitar(stage.current, { intensity, onRead: setRead, label: t('cr.aria') })
    fig.current = f
    return () => {
      f.destroy()
      fig.current = null
    }
    // the figure mounts once; intensity and play are pushed to it below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { stage.current?.setAttribute('aria-label', t('cr.aria')) }, [t])
  useEffect(() => { fig.current?.setIntensity(intensity) }, [intensity])
  useEffect(() => { fig.current?.play(playing) }, [playing])
  useEffect(() => () => pluck.current?.close(), [])

  const s = parse(read)

  // each time the pointer reaches a new string, that string sounds
  useEffect(() => {
    if (sound && s) pluck.current.play(s.n)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [read])

  const turnOn = async () => {
    const ok = await pluck.current.enable()
    setSound(ok)
    return ok
  }
  const toggleSound = () => (sound ? setSound(false) : turnOn())
  // a tap or click on the guitar switches sound on (browsers need one) and plucks the string again
  const onDown = async () => {
    if (!sound && !(await turnOn())) return
    if (s) pluck.current.play(s.n)
  }

  return (
    <div className="creative">
      <div className="card creative-plate">
        <div className="creative-tags">
          <span className="tag s">{t('cr.tag')}</span>
          <span className={'creative-read' + (s ? ' on' : '')} aria-live="polite">
            {s ? t('cr.string', { n: s.n, note: s.note }) : t('cr.rest')}
          </span>
        </div>
        <div ref={stage} className="creative-stage" onPointerDown={onDown} />
      </div>

      <div className="card creative-side">
        <h2>{t('cr.title')}</h2>
        <p className="muted">{t('cr.intro')}</p>

        <div className="creative-now">
          <small>{t('cr.now')}</small>
          <b>{s ? s.note : '—'}</b>
          <span className="muted">{s ? t('cr.stringNo', { n: s.n }) : t('cr.none')}</span>
        </div>

        <label htmlFor="cs-spread">{t('cr.spread')}</label>
        <input
          id="cs-spread"
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={intensity}
          onChange={(e) => setIntensity(Number(e.target.value))}
        />
        <div className="row" style={{ justifyContent: 'space-between', marginTop: 4 }}>
          <span className="muted">{t('cr.together')}</span>
          <span className="muted">{t('cr.arpeggio')}</span>
        </div>

        <div className="row" style={{ marginTop: 18 }}>
          <button type="button" className={sound ? '' : 'ghost'} onClick={toggleSound} aria-pressed={sound}>
            {sound ? t('cr.soundOn') : t('cr.enableSound')}
          </button>
          <button type="button" onClick={() => setPlaying((p) => !p)} aria-pressed={playing}>
            {playing ? t('cr.stopAuto') : t('cr.auto')}
          </button>
        </div>
        <p className="muted" style={{ margin: '8px 0 0' }}>
          {t('cr.soundHint')}
        </p>

        <p className="muted creative-credit">
          {t('cr.creditA')}{' '}
          <a href="https://github.com/lucasmarkes/hairline" target="_blank" rel="noopener noreferrer">
            Hairline
          </a>{' '}
          {t('cr.creditB')}
        </p>
      </div>
    </div>
  )
}
