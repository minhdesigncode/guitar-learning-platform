import { useEffect, useMemo, useRef, useState } from 'react'
import { uid, saveMedia, loadMedia, deleteMedia } from '../lib/store.js'

function Media({ id, type }) {
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

function Recorder({ onDone }) {
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
        <button type="button" className="ghost" onClick={start}>● Thu âm ngay</button>
      ) : (
        <button type="button" onClick={() => rec.current.stop()}>■ Dừng thu</button>
      )}
      {error && <p className="note">{error}</p>}
    </div>
  )
}

export default function Journal({ journal, setJournal }) {
  const [title, setTitle] = useState('')
  const [kind, setKind] = useState('s')
  const [note, setNote] = useState('')
  const [file, setFile] = useState(null)
  const [msg, setMsg] = useState('')
  const [filter, setFilter] = useState('')
  const [sure, setSure] = useState(null)
  const fileInput = useRef(null)
  const preview = useMemo(() => (file && !(file instanceof File) ? URL.createObjectURL(file) : null), [file])
  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview])

  const submit = async (e) => {
    e.preventDefault()
    if (!title.trim()) return
    const entry = { id: uid(), title: title.trim(), kind, note: note.trim(), date: Date.now() }
    try {
      if (file) {
        await saveMedia(entry.id, file)
        entry.mediaType = file.type || 'audio/webm'
      }
      setJournal([entry, ...journal])
      setTitle('')
      setNote('')
      setFile(null)
      if (fileInput.current) fileInput.current.value = ''
      setMsg('Đã lưu ✓')
    } catch {
      setMsg('Không lưu được file, có thể bộ nhớ trình duyệt đã đầy.')
    }
  }

  const remove = async (id) => {
    if (sure !== id) return setSure(id)
    setJournal(journal.filter((j) => j.id !== id))
    deleteMedia(id).catch(() => {})
    setSure(null)
  }

  const list = journal.filter((j) => !filter || j.kind === filter)

  return (
    <div className="grid">
      <div className="card">
        <h2>Thêm bản thu</h2>
        <form onSubmit={submit}>
          <label htmlFor="jt">Tên bài</label>
          <input id="jt" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ví dụ: The Art of Disappearing — demo 1" />
          <label htmlFor="jk">Loại</label>
          <select id="jk" value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="s">Sáng tác</option>
            <option value="c">Cover</option>
          </select>
          <label htmlFor="jn">Ghi chú</label>
          <input id="jn" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Tông, capo, cảm xúc hôm thu…" />
          <label htmlFor="ja">File ghi âm hoặc video</label>
          <input id="ja" ref={fileInput} type="file" accept="audio/*,video/*" onChange={(e) => setFile(e.target.files[0] || null)} />
          <Recorder onDone={(blob) => { setFile(blob); setMsg('Đã thu xong, bấm “Lưu vào journal” để giữ lại.') }} />
          {preview && <audio controls src={preview} />}
          <div className="row" style={{ marginTop: 14 }}>
            <button className="pick">Lưu vào journal</button>
          </div>
          <p className="note">{msg}</p>
        </form>
      </div>
      <div>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h2>Các bản thu</h2>
          <select style={{ width: 'auto' }} value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">Tất cả</option>
            <option value="s">Sáng tác</option>
            <option value="c">Cover</option>
          </select>
        </div>
        {!journal.length && <p className="note">Chưa có bản thu nào. Thêm bản đầu tiên ở bên trái.</p>}
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
    </div>
  )
}
