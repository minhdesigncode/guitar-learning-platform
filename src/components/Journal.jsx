import { useEffect, useRef, useState } from 'react'
import { loadMedia, deleteMedia } from '../lib/store.js'
import Icon from './Icon.jsx'
import { useI18n, useT } from '../i18n/index.jsx'

// Note under a recording. Older entries stored a ready-made 'Key G' text; newer ones store the key.
export function recNote(j, t) {
  const parts = []
  if (j.key) parts.push(t('keyOf', { key: j.key }))
  if (j.note) parts.push(j.note.replace(/^Key (\S+)/, (m, k) => t('keyOf', { key: k })))
  if (j.saveFailed) parts.push(t('rec.saveFailed'))
  return parts.join(' · ')
}

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
  const t = useT()
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
      setError(t('rec.micError'))
    }
  }

  return (
    <div style={{ marginTop: 12 }}>
      {state === 'idle' ? (
        <button type="button" className="ghost rec-start" onClick={start}><Icon name="rec" />{t('rec.start')}</button>
      ) : (
        <button type="button" className="rec-live" onClick={() => rec.current.stop()}><Icon name="stop" />{t('rec.stop')}</button>
      )}
      {error && <p className="note">{error}</p>}
    </div>
  )
}

export default function Journal({ journal, setJournal }) {
  const { t, locale } = useI18n()
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
        <h2>{t('journal.title')}</h2>
        <select style={{ width: 'auto' }} value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">{t('all')}</option>
          <option value="s">{t('kind.s')}</option>
          <option value="c">{t('kind.c')}</option>
        </select>
      </div>
      {!journal.length && (
        <p className="note">{t('journal.emptyA')}<a href="#chords">{t('nav.chords')}</a>{t('journal.emptyB')}</p>
      )}
      <ul className="list" id="jlist" style={{ marginTop: 10 }}>
        {list.map((j) => (
          <li key={j.id} style={{ cursor: 'default' }}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <b>{j.title}</b>
              <span className={'tag ' + (j.kind === 'c' ? 'c' : 's')}>{t(j.kind === 'c' ? 'kind.c' : 'kind.s')}</span>
            </div>
            <div className="muted">
              {new Date(j.date).toLocaleDateString(locale)}
              {recNote(j, t) ? ' · ' + recNote(j, t) : ''}
            </div>
            {j.mediaType && <Media id={j.id} type={j.mediaType} />}
            <div className="row" style={{ marginTop: 8 }}>
              <button className="ghost" style={{ minHeight: 36, padding: '6px 14px' }} onClick={() => remove(j.id)}>
                {sure === j.id ? t('confirmDelete') : t('delete')}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
