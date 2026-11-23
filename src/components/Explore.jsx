import { useEffect, useState } from 'react'
import { transposeBody, transposeKey } from '../lib/music.js'
import { cloudEnabled } from '../cloud/client.js'
import { useAuth } from '../cloud/auth.jsx'
import { searchPublic, getPublic } from '../cloud/publish.js'
import { useI18n } from '../i18n/index.jsx'
import { Sheet } from './ChordSpace.jsx'
import { ARTISTS, LIBRARY, LIBRARY_VISIBLE, getLibrarySong, searchLibrary } from '../lib/library/songs.js'

const LIB = 'lib-'

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
  const [artist, setArtist] = useState('')
  const libId = openId?.startsWith(LIB) ? openId.slice(LIB.length) : null
  const libList = searchLibrary(q, artist)

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
    if (libId) return setCur(getLibrarySong(libId) || 'missing')
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
  }, [openId, libId])

  const open = (id) => {
    window.location.hash = 'explore/' + id
  }
  const song = cur && cur !== 'missing' ? cur : null
  const view = song ? transposeKey(song.key || 'C', offset) : null
  const body = song ? transposeBody(song.body || '', offset, view.flat) : ''
  const lib = song && !!libId
  const mine = song && !lib && user && song.user_id === user.id
  const copyOf = song ? (lib ? LIB + song.id : song.id) : null
  const saved = song && songs.some((s) => s.copyOf === copyOf)
  const date = (iso) => new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })

  const copyLink = async () => {
    const url = window.location.origin + window.location.pathname + '#explore/' + (lib ? LIB : '') + song.id
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
        {!cloudEnabled && <p className="note">{t('ex.off')}</p>}
        {cloudEnabled && err && <p className="note">{t('ex.error')}</p>}
        {cloudEnabled && !err && list === null && <p className="note">{t('ex.loading')}</p>}
        {cloudEnabled && !err && list && !list.length && !q && <p className="note">{t('ex.empty')}</p>}
        {cloudEnabled && !artist && (list || []).length > 0 && (
          <ul className="list">
            {list.map((s) => (
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
        )}
        {LIBRARY_VISIBLE && (
          <>
        <h3 className="lib-h">{t('ex.lib', { n: LIBRARY.length })}</h3>
        <div className="arts" role="group" aria-label={t('ex.artist')}>
          <button className={'art' + (!artist ? ' on' : '')} aria-pressed={!artist} onClick={() => setArtist('')}>{t('ex.all')}</button>
          {ARTISTS.map((a) => (
            <button key={a} className={'art' + (artist === a ? ' on' : '')} aria-pressed={artist === a} onClick={() => setArtist(artist === a ? '' : a)}>{a}</button>
          ))}
        </div>
        {q && !libList.length && !(list || []).length && <p className="note">{t('ex.noMatch', { q })}</p>}
        <ul className="list lib-list">
          {libList.map((s) => (
            <li key={s.id} className={LIB + s.id === openId ? 'on' : ''} onClick={() => open(LIB + s.id)} tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && open(LIB + s.id)}>
              <b>{s.title}</b>
              <div className="muted">
                {s.artist} · {t('keyOf', { key: s.key })}{s.capo ? ' · ' + t('capoOf', { n: s.capo }) : ''}
                {' · '}<span className={'tag ' + (s.sure ? 'chk' : 'draft')}>{t(s.sure ? 'ex.check' : 'ex.draft')}</span>
              </div>
            </li>
          ))}
        </ul>
          </>
        )}
        {!LIBRARY_VISIBLE && q && list && !list.length && <p className="note">{t('ex.noMatch', { q })}</p>}
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
                {lib ? (
                  <p className="muted" style={{ margin: '4px 0 0' }}>
                    {song.artist} · {song.feel} · <span className={'tag ' + (song.sure ? 'chk' : 'draft')}>{t(song.sure ? 'ex.check' : 'ex.draft')}</span>
                  </p>
                ) : (
                <p className="muted" style={{ margin: '4px 0 0' }}>
                  {song.author_name ? t('ex.by', { name: song.author_name }) + ' · ' : ''}
                  {t('ex.updated', { date: date(song.updated_at) })}
                  {mine && <> · <span className="tag pub">{t('ex.yours')}</span></>}
                </p>
                )}
              </div>
              <div className="row">
                {lib && <a className="btn ghost" href={song.youtube} target="_blank" rel="noopener noreferrer">{t('ex.listen')}</a>}
                <button className="ghost" onClick={copyLink}>{t('ex.copyLink')}</button>
                {!mine && (
                  <button className={saved ? 'ghost' : 'pick'} disabled={saved} onClick={() => {
                    onSaveCopy({ title: lib ? song.title + ' – ' + song.artist : song.title, key: song.key, capo: song.capo, body: song.body, copyOf })
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
            {lib && <p className="note">{t(song.sure ? 'ex.checkNote' : 'ex.draftNote')}</p>}
            <Sheet body={body} zoom={1} cols={1} />
          </div>
        )}
      </div>
    </div>
  )
}
