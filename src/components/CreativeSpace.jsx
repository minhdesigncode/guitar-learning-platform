import { useEffect, useRef, useState } from 'react'
import { mountGuitar } from '../creative/hairline.js'
import { createPluck } from '../creative/pluck.js'

// "6·E" -> { n: '6', note: 'E' }
const parse = (r) => {
  const [n, note] = (r || '').split('·')
  return note ? { n, note } : null
}

export default function CreativeSpace() {
  const stage = useRef(null)
  const fig = useRef(null)
  const [read, setRead] = useState('rest')
  const [intensity, setIntensity] = useState(0.5)
  const [playing, setPlaying] = useState(false)
  const [sound, setSound] = useState(false)
  const pluck = useRef(null)
  if (!pluck.current) pluck.current = createPluck()

  useEffect(() => {
    const f = mountGuitar(stage.current, { intensity, onRead: setRead })
    fig.current = f
    return () => {
      f.destroy()
      fig.current = null
    }
    // the figure mounts once; intensity and play are pushed to it below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
          <span className="tag s">Vọc guitar cùng Min</span>
          <span className={'creative-read' + (s ? ' on' : '')} aria-live="polite">
            {s ? `Dây ${s.n} · ${s.note}` : 'Đang nghỉ'}
          </span>
        </div>
        <div ref={stage} className="creative-stage" onPointerDown={onDown} />
      </div>

      <div className="card creative-side">
        <h2>Cây đàn nét mảnh</h2>
        <p className="muted">
          Một cây guitar thùng nằm ngửa, vẽ bằng những nét mảnh như bản phác kỹ thuật. Rê chuột (hoặc chạm) ngang qua
          thân đàn để quạt dây: dây nằm dưới con trỏ được kéo lên, sáng lên và kêu đúng nốt dây buông, mấy dây bên cạnh rung theo sau.
        </p>

        <div className="creative-now">
          <small>Dây đang gảy</small>
          <b>{s ? s.note : '—'}</b>
          <span className="muted">{s ? `Dây số ${s.n}` : 'Chưa chạm vào dây nào'}</span>
        </div>

        <label htmlFor="cs-spread">Độ trễ giữa các dây</label>
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
          <span className="muted">Gảy cùng lúc</span>
          <span className="muted">Rải từng dây</span>
        </div>

        <div className="row" style={{ marginTop: 18 }}>
          <button type="button" className={sound ? '' : 'ghost'} onClick={toggleSound} aria-pressed={sound}>
            {sound ? 'Tiếng: bật' : 'Bật tiếng đàn'}
          </button>
          <button type="button" onClick={() => setPlaying((p) => !p)} aria-pressed={playing}>
            {playing ? 'Dừng tự gảy' : 'Tự gảy thử'}
          </button>
        </div>
        <p className="muted" style={{ margin: '8px 0 0' }}>
          Trình duyệt chỉ cho phát tiếng sau một cú bấm: bấm “Bật tiếng đàn” hoặc chạm vào cây đàn một lần.
        </p>

        <p className="muted creative-credit">
          Vẽ theo phong cách và engine của{' '}
          <a href="https://github.com/lucasmarkes/hairline" target="_blank" rel="noopener noreferrer">
            Hairline
          </a>{' '}
          (Lucas Marques, MIT).
        </p>
      </div>
    </div>
  )
}
