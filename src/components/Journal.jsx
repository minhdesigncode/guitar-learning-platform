import { useEffect, useRef, useState } from 'react'
import { loadMedia, deleteMedia } from '../lib/store.js'
import Icon from './Icon.jsx'

export function Media({ id, type }) {
  const [url, setUrl] = useState(null)
  useEffect(() => {
    let u = null
    loadMedia(id)
      .then((blob) => {
        if (blob) {
          u = URL.createObjectURL(blob)
          setUrl(u)
        }
      })
      .catch(() => {})
    return () => u && URL.revokeObjectURL(u)
  }, [id])
  if (!url) return null
  return String(type).startsWith('video') ? <video controls src={url} /> : <audio controls src={url} />
}

export function Recorder({ onDone }) {
  const [state, setState] = useState('idle')
  const [error, setError] = useState('')
  const rec = useRef(null)
  const chunks = useRef([])

  const start = async () => {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const r = new MediaRecorder(stream)
      chunks.current = []
      r.ondataavailable = (e) => e.data.size && chunks.current.push(e.data)
      r.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        onDone(new Blob(chunks.current, { type: r.mimeType || 'audio/webm' }))
        setState('idle')
      }
      r.start()
      rec.current = r
      setState('rec')
    } catch {
      setError('Không mở được micro. Kiểm tra quyền micro của trình duyệt.')
    }
  }

  return (
    <div style={{ marginTop: 12 }}>
      {state === 'idle' ? (
        <button type="button" className="ghost rec-start" onClick={start}><Icon name="rec" />Thu âm ngay</button>
      ) : (
        <button type="button" className="rec-live" onClick={() => rec.current.stop()}><Icon name="stop" />Dừng thu</button>
      )}
      {error && <p className="note">{error}</p>}
    </div>
  )
}

export default function Journal({ journal, setJournal }) {
  const [filter, setFilter] = useState('')
  const [sure, setSure] = useState(null)

  const remove = async (id) => {
    if (sure !== id) return setSure(id)
    setJournal(journal.filter((j) => j.id !== id))
    deleteMedia(id).catch(() => {})
    setSure(null)
  }

  const list = journal.filter((j) => !filter || j.kind === filter)

  return (
    <div>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h2>Các bản thu</h2>
        <select style={{ width: 'auto' }} value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">Tất cả</option>
          <option value="s">Sáng tác</option>
          <option value="c">Cover</option>
        </select>
      </div>
      {!journal.length && (
        <p className="note">Chưa có bản thu nào. Đính kèm hoặc thu âm ngay khi thêm hay sửa bài trong <a href="#chords">Chord space</a>.</p>
      )}
      <ul className="list" id="jlist" style={{ marginTop: 10 }}>
        {list.map((j) => (
          <li key={j.id} style={{ cursor: 'default' }}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <b>{j.title}</b>
              <span className={'tag ' + (j.kind === 'c' ? 'c' : 's')}>{j.kind === 'c' ? 'Cover' : 'Sáng tác'}</span>
            </div>
            <div className="muted">
              {new Date(j.date).toLocaleDateString('vi-VN')}
              {j.note ? ' · ' + j.note : ''}
            </div>
            {j.mediaType && <Media id={j.id} type={j.mediaType} />}
            <div className="row" style={{ marginTop: 8 }}>
              <button className="ghost" style={{ minHeight: 36, padding: '6px 14px' }} onClick={() => remove(j.id)}>
                {sure === j.id ? 'Bấm lần nữa để xoá' : 'Xoá'}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
