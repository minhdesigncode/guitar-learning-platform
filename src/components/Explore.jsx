import { useEffect, useState } from 'react'
import { transposeBody, transposeKey } from '../lib/music.js'
import { cloudEnabled } from '../cloud/client.js'
import { useAuth } from '../cloud/auth.jsx'
import { searchPublic, getPublic } from '../cloud/publish.js'
import { useI18n } from '../i18n/index.jsx'
import { Sheet } from './ChordSpace.jsx'

// Songs other people published. Open to everyone: signed out you can search, read and transpose;
// "Save to my songs" copies one into your own (local) list.
export default function Explore({ openId, songs, onSaveCopy }) {
  const { t, locale } = useI18n()
  const { user } = useAuth()
  const [q, setQ] = useState('')
  const [list, setList] = useState(null)
  const [err, setErr] = useState(false)
  const [cur, setCur] = useState(null)
  const [loadingSong, setLoadingSong] = useState(false)
  const [offset, setOffset] = useState(0)
  const [msg, setMsg] = useState('')

  // Search as you type, after a short pause.
  useEffect(() => {
    if (!cloudEnabled) return
    let live = true
    const timer = setTimeout(() => {
      searchPublic(q)
        .then((rows) => live && (setList(rows), setErr(false)))
        .catch(() => live && setErr(true))
    }, q ? 250 : 0)
    return () => {
      live = false
      clearTimeout(timer)
    }
  }, [q])

  useEffect(() => {
    setOffset(0)
    setMsg('')
    if (!openId || !cloudEnabled) return setCur(null)
    let live = true
    setLoadingSong(true)
    getPublic(openId)
      .then((s) => live && setCur(s || 'missing'))
      .catch(() => live && setCur('missing'))
      .finally(() => live && setLoadingSong(false))
    return () => {
      live = false
    }
  }, [openId])

  if (!cloudEnabled) return <div className="card"><p className="muted">{t('ex.off')}</p></div>

  const open = (id) => {
    window.location.hash = 'explore/' + id
  }
  const song = cur && cur !== 'missing' ? cur : null
  const view = song ? transposeKey(song.key || 'C', offset) : null
  const body = song ? transposeBody(song.body || '', offset, view.flat) : ''
  const mine = song && user && song.user_id === user.id
  const saved = song && songs.some((s) => s.copyOf === song.id)
  const date = (iso) => new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })

  const copyLink = async () => {
    const url = window.location.origin + window.location.pathname + '#explore/' + song.id
    try {
      await navigator.clipboard.writeText(url)
      setMsg(t('ex.linkCopied'))
    } catch {
      setMsg(url)
    }
  }

  return (
    <div className="grid">
      <div className="card">
        <h2>{t('ex.title')}</h2>
        <input type="search" placeholder={t('ex.search')} aria-label={t('ex.search')} style={{ margin: '12px 0' }} value={q} onChange={(e) => setQ(e.target.value)} />
        {err && <p className="note">{t('ex.error')}</p>}
        {!err && list === null && <p className="note">{t('ex.loading')}</p>}
        {!err && list && !list.length && <p className="note">{q ? t('ex.noMatch', { q }) : t('ex.empty')}</p>}
        <ul className="list">
          {(list || []).map((s) => (
            <li key={s.id} className={s.id === openId ? 'on' : ''} onClick={() => open(s.id)} tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && open(s.id)}>
              <b>{s.title}</b>
              <div className="muted">
                {s.author_name ? t('ex.by', { name: s.author_name }) + ' · ' : ''}
                {t('keyOf', { key: s.key })}{s.capo ? ' · ' + t('capoOf', { n: s.capo }) : ''}
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div>
        {!openId ? (
          <div className="card">
            <p className="muted">{t('ex.pick')}</p>
            {!user && <p className="muted">{t('ex.signedOutHint')}</p>}
          </div>
        ) : loadingSong && !song ? (
          <div className="card"><p className="note">{t('ex.loading')}</p></div>
        ) : !song ? (
          <div className="card"><p className="muted">{t('ex.missing')}</p></div>
        ) : (
          <div className="card">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <div>
                <h2>{song.title}</h2>
                <p className="muted" style={{ margin: '4px 0 0' }}>
                  {song.author_name ? t('ex.by', { name: song.author_name }) + ' · ' : ''}
                  {t('ex.updated', { date: date(song.updated_at) })}
                  {mine && <> · <span className="tag pub">{t('ex.yours')}</span></>}
                </p>
              </div>
              <div className="row">
                <button className="ghost" onClick={copyLink}>{t('ex.copyLink')}</button>
                {!mine && (
                  <button className={saved ? 'ghost' : 'pick'} disabled={saved} onClick={() => {
                    onSaveCopy({ title: song.title, key: song.key, capo: song.capo, body: song.body, copyOf: song.id })
                    setMsg(t('ex.savedMsg'))
                  }}>{saved ? t('ex.saved') : t('ex.save')}</button>
                )}
              </div>
            </div>
            {msg && <p className="note" role="status">{msg}</p>}
            <div className="row" style={{ margin: '12px 0 4px' }}>
              <button className="ghost" onClick={() => setOffset((o) => (Math.abs(o - 1) > 11 ? 0 : o - 1))} aria-label={t('cs.down')}>− ½</button>
              <span className="big" style={{ fontSize: 28, minWidth: '3ch', textAlign: 'center' }}>{view.key}</span>
              <button className="ghost" onClick={() => setOffset((o) => (Math.abs(o + 1) > 11 ? 0 : o + 1))} aria-label={t('cs.up')}>+ ½</button>
              {offset !== 0 && <button className="ghost" onClick={() => setOffset(0)}>{t('cs.resetKey')}</button>}
            </div>
            <p className="muted">
              {offset !== 0 && t('cs.shifted', { offset, from: song.key })}
              {song.capo ? t('cs.capo', { n: song.capo }) : ''}
            </p>
            <Sheet body={body} zoom={1} cols={1} />
          </div>
        )}
      </div>
    </div>
  )
}
