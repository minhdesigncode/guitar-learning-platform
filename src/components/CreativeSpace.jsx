import { useEffect, useRef, useState } from 'react'
import { mountGuitar } from '../creative/hairline.js'

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

  const s = parse(read)

  return (
    <div className="creative">
      <div className="card creative-plate">
        <div className="creative-tags">
          <span className="tag s">hair-line</span>
          <span className={'creative-read' + (s ? ' on' : '')} aria-live="polite">
            {s ? `Dây ${s.n} · ${s.note}` : 'Đang nghỉ'}
          </span>
        </div>
        <div ref={stage} className="creative-stage" />
      </div>

      <div className="card creative-side">
        <h2>Cây đàn nét mảnh</h2>
        <p className="muted">
          Một cây guitar thùng nằm ngửa, vẽ bằng những nét mảnh như bản phác kỹ thuật. Rê chuột (hoặc chạm) ngang qua
          thân đàn để quạt dây: dây nằm dưới con trỏ được kéo lên và sáng lên, mấy dây bên cạnh rung theo sau.
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
          <button type="button" onClick={() => setPlaying((p) => !p)} aria-pressed={playing}>
            {playing ? 'Dừng tự gảy' : 'Tự gảy thử'}
          </button>
        </div>

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
