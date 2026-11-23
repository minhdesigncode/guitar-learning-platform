import { forwardRef, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { transposeBody, transposeKey } from '../lib/music.js'
import { uid } from '../lib/store.js'
import { Media, Recorder } from './Journal.jsx'
import { useI18n, useT } from '../i18n/index.jsx'
import { useAuth } from '../cloud/auth.jsx'
import { publishSong, unpublishSong } from '../cloud/publish.js'

// draft: never published · live: public copy matches · changed: edited since the last publish
export const pubState = (song) =>
  !song.published ? 'draft' : (song.updated || 0) > (song.published.updated || 0) ? 'changed' : 'live'

// Publish / update / take down the public copy of a song. Needs an account; signed out it offers sign-in.
function PublishBox({ song, onPatch }) {
  const { enabled, user, signIn } = useAuth()
  const t = useT()
  const [busy, setBusy] = useState(false)
  const [ask, setAsk] = useState(false)
  const [sure, setSure] = useState(false)
  const [err, setErr] = useState('')
  useEffect(() => {
    setAsk(false)
    setSure(false)
    setErr('')
  }, [song.id])
  if (!enabled) return null
  const state = pubState(song)

  const publish = async () => {
    if (!user) return setAsk(true)
    setBusy(true)
    setErr('')
    try {
      const { id, at } = await publishSong(user, song)
      onPatch({ ...song, published: { id, at, updated: song.updated || 0 } })
    } catch (e) {
      console.warn('[publish]', e)
      setErr(t('pub.error'))
    } finally {
      setBusy(false)
    }
  }
  const unpublish = async () => {
    if (!sure) return setSure(true)
    setBusy(true)
    setErr('')
    try {
      await unpublishSong(user, song.id)
      onPatch({ ...song, published: undefined })
    } catch (e) {
      console.warn('[publish]', e)
      setErr(t('pub.error'))
    } finally {
      setBusy(false)
      setSure(false)
    }
  }

  return (
    <div className={'pub-box ' + state}>
      <div>
        <span className={'tag ' + (state === 'draft' ? 'draft' : 'pub')}>{t('pub.state.' + state)}</span>
        <p className="muted">{t('pub.help.' + state)}</p>
      </div>
      <div className="row">
        {state !== 'live' && (
          <button className="pick" onClick={publish} disabled={busy}>
            {busy ? t('pub.working') : state === 'draft' ? t('pub.publish') : t('pub.update')}
          </button>
        )}
        {state !== 'draft' && (
          <>
            <a className="btn ghost" href={'#explore/' + song.published.id}>{t('pub.view')}</a>
            {user && (
              <button className="ghost" onClick={unpublish} disabled={busy}>{sure ? t('pub.unpublishSure') : t('pub.unpublish')}</button>
            )}
          </>
        )}
      </div>
      {ask && !user && (
        <div className="row pub-ask">
          <p className="muted">{t('pub.needSignIn')}</p>
          <button className="ghost" onClick={signIn}>{t('auth.signInGoogle')}</button>
        </div>
      )}
      {err && <p className="note" role="alert">{err}</p>}
    </div>
  )
}

// Split the body into sections (a # heading starts a new one) so columns never cut a heading off its lines.
function sections(body) {
  const out = [[]]
  body.split('\n').forEach((line) => {
    if (/^\s*#/.test(line) && out[out.length - 1].length) out.push([])
    out[out.length - 1].push(line)
  })
  return out
}

function Line({ line }) {
  if (/^\s*#/.test(line)) return <div className="sec">{line.replace(/^\s*#+\s*/, '')}</div>
  if (!line.trim()) return <div className="ln">&nbsp;</div>
  if (!line.includes('[')) return <div className="ln">{line}</div>
  const parts = line.split(/\[([^\]]+)\]/)
  const segs = []
  if (parts[0]) segs.push(['', parts[0]])
  for (let p = 1; p < parts.length; p += 2) segs.push([parts[p], parts[p + 1] || ' '])
  return (
    <div className="ln">
      {segs.map(([c, t], j) => (
        <span key={j} className="sg">
          <i>{c}</i>
          {t}
        </span>
      ))}
    </div>
  )
}

export const Sheet = forwardRef(function Sheet({ body, zoom, cols }, ref) {
  return (
    <div ref={ref} className="sheet" style={{ '--z': zoom, columnCount: cols }}>
      {sections(body).map((sec, i) => (
        <div key={i} className="blk">
          {sec.map((line, j) => <Line key={j} line={line} />)}
        </div>
      ))}
    </div>
  )
})

const ZMIN = 0.5
const ZMAX = 1.8
const clampZ = (z) => Math.round(Math.min(ZMAX, Math.max(ZMIN, z)) * 100) / 100

const Mag = ({ plus }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="M15.5 15.5 21 21M7.5 10.5h6" />
    {plus && <path d="M10.5 7.5v6" />}
  </svg>
)

function useView() {
  const [v, setV] = useState(() => {
    try {
      return { zoom: 1, cols: 1, fit: false, wide: false, ...JSON.parse(localStorage.getItem('sodan.view') || '{}') }
    } catch {
      return { zoom: 1, cols: 1, fit: false, wide: false }
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem('sodan.view', JSON.stringify(v))
    } catch {
      /* ignore */
    }
  }, [v])
  const update = useCallback(
    (patch) => setV((old) => (Object.keys(patch).every((k) => old[k] === patch[k]) ? old : { ...old, ...patch })),
    []
  )
  return [v, update]
}

// Find the biggest zoom (and column count) at which the whole sheet fits below the toolbar.
function fitSheet(el, bar) {
  if (!el || !bar) return null
  const nav = document.querySelector('.topnav')
  const navBottom = nav && getComputedStyle(nav).position === 'sticky' ? nav.getBoundingClientRect().height + 14 : 0
  const gap = el.getBoundingClientRect().top - bar.getBoundingClientRect().top
  const avail = window.innerHeight - navBottom - 12 - gap - 16
  const width = el.clientWidth
  const keep = { z: el.style.getPropertyValue('--z'), c: el.style.columnCount }
  const heightAt = (z, c) => {
    el.style.setProperty('--z', z)
    el.style.columnCount = c
    return el.scrollHeight
  }
  let best = null
  for (let c = 1; c <= 3; c++) {
    let lo = ZMIN
    let hi = 1.4
    if (c > 1 && width / c < 250 * lo) break
    if (heightAt(lo, c) > avail) {
      if (!best) best = { zoom: lo, cols: c }
      continue
    }
    for (let k = 0; k < 8; k++) {
      const mid = (lo + hi) / 2
      const fits = heightAt(mid, c) <= avail && (c === 1 || width / c >= 250 * mid)
      if (fits) lo = mid
      else hi = mid
    }
    const z = Math.floor(lo * 20) / 20
    // An extra column must buy at least 10% more text size to be worth it.
    if (!best || z > best.zoom * 1.1) best = { zoom: z, cols: c }
  }
  el.style.setProperty('--z', keep.z)
  el.style.columnCount = keep.c
  return best
}

function Editor({ song, onSave, onCancel }) {
  const t = useT()
  const [f, setF] = useState(song)
  const [file, setFile] = useState(null)
  const [kind, setKind] = useState('s')
  const [recMsg, setRecMsg] = useState('')
  const fileInput = useRef(null)
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])
  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview])
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  return (
    <div className="card">
      <h2>{song.id ? t('editor.edit') : t('editor.new')}</h2>
      <label htmlFor="et">{t('editor.title')}</label>
      <input id="et" value={f.title} onChange={set('title')} />
      <div className="row">
        <div style={{ flex: 1 }}>
          <label htmlFor="ek">{t('key')}</label>
          <input id="ek" value={f.key} onChange={set('key')} />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="ec">{t('editor.capo')}</label>
          <input id="ec" type="number" min="0" max="12" value={f.capo} onChange={set('capo')} />
        </div>
      </div>
      <label htmlFor="eb">{t('editor.body')}</label>
      <p className="muted" style={{ margin: '0 0 6px' }}>
        {t('editor.helpA')}<code>[G]Met you on a [Bm]road</code>{t('editor.helpB')}<code>#</code>{t('editor.helpC')}
      </p>
      <textarea id="eb" value={f.body} onChange={set('body')} />
      <div className="rec-box">
        <h3>{t('editor.recTitle')} <span className="muted" style={{ fontWeight: 400, fontSize: 14 }}>{t('editor.optional')}</span></h3>
        <p className="muted" style={{ margin: '2px 0 0' }}>{t('editor.recHelp')}</p>
        <div className="row" style={{ marginTop: 6 }}>
          <div style={{ flex: '1 1 140px' }}>
            <label htmlFor="rk">{t('editor.kind')}</label>
            <select id="rk" value={kind} onChange={(e) => setKind(e.target.value)}>
              <option value="s">{t('kind.s')}</option>
              <option value="c">{t('kind.c')}</option>
            </select>
          </div>
          <div style={{ flex: '2 1 220px' }}>
            <label htmlFor="rf">{t('editor.file')}</label>
            <input id="rf" ref={fileInput} type="file" accept="audio/*,video/*" onChange={(e) => { setFile(e.target.files[0] || null); setRecMsg('') }} />
          </div>
        </div>
        <Recorder onDone={(blob) => { setFile(blob); if (fileInput.current) fileInput.current.value = ''; setRecMsg(t('editor.recDone')) }} />
        {preview && (String(file.type).startsWith('video') ? <video controls src={preview} /> : <audio controls src={preview} />)}
        {file && <button className="ghost" style={{ marginTop: 8, minHeight: 36, padding: '6px 14px' }} onClick={() => { setFile(null); if (fileInput.current) fileInput.current.value = ''; setRecMsg('') }}>{t('editor.removeRec')}</button>}
        {recMsg && <p className="note">{recMsg}</p>}
      </div>
      <div className="row" style={{ marginTop: 12 }}>
        <button
          className="pick"
          onClick={() =>
            onSave(
              { ...f, title: f.title.trim() || t('editor.untitled'), key: f.key.trim() || 'C', capo: +f.capo || 0 },
              file && { file, kind },
            )
          }
        >
          {t('editor.save')}
        </button>
        <button className="ghost" onClick={onCancel}>{t('cancel')}</button>
      </div>
    </div>
  )
}

export default function ChordSpace({ songs, setSongs, draft, clearDraft, openId, journal = [], onAddRecording }) {
  const sorted = [...songs].sort((a, b) => b.updated - a.updated)
  const [curId, setCurId] = useState((songs.some((s) => s.id === openId) && openId) || sorted[0]?.id || null)
  const [editing, setEditing] = useState(null)
  const [offset, setOffset] = useState(0)
  const [q, setQ] = useState('')
  const [sure, setSure] = useState(false)
  const [only, setOnly] = useState('all')
  const { enabled: cloudOn, user } = useAuth()
  const [v, setView] = useView()
  const { t, locale } = useI18n()
  const sheetRef = useRef(null)
  const barRef = useRef(null)

  useEffect(() => {
    if (draft) {
      setEditing(draft)
      clearDraft()
    }
  }, [draft, clearDraft])

  const cur = songs.find((s) => s.id === curId)
  const recs = cur ? journal.filter((j) => j.songId === cur.id) : []
  const select = (id) => {
    setCurId(id)
    setOffset(0)
    setEditing(null)
    setSure(false)
  }

  const save = (song, rec) => {
    const s = { ...song, id: song.id || uid(), updated: Date.now() }
    if (rec && onAddRecording) onAddRecording(s, rec)
    setSongs(songs.some((x) => x.id === s.id) ? songs.map((x) => (x.id === s.id ? s : x)) : [s, ...songs])
    setCurId(s.id)
    setEditing(null)
  }

  // Replace a song without touching its "updated" time (used for publish state).
  const patch = (song) => setSongs((list) => list.map((x) => (x.id === song.id ? song : x)))

  const shift = (d) => setOffset((o) => (Math.abs(o + d) > 11 ? 0 : o + d))
  const view = cur ? transposeKey(cur.key || 'C', offset) : null
  const body = cur ? transposeBody(cur.body || '', offset, view.flat) : ''

  const refit = useCallback(() => {
    const r = fitSheet(sheetRef.current, barRef.current)
    if (r) setView(r)
  }, [setView])

  // In fit mode, refit whenever the song, key, layout or window size changes.
  useLayoutEffect(() => {
    if (v.fit && !editing) refit()
  }, [v.fit, v.wide, body, editing, refit])
  useEffect(() => {
    if (!v.fit) return
    const on = () => refit()
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [v.fit, refit])

  const zoomBy = (d) => setView({ fit: false, zoom: clampZ(v.zoom + d) })
  const fitNow = () => {
    const bar = barRef.current
    const nav = document.querySelector('.topnav')
    if (bar) {
      const navH = nav && getComputedStyle(nav).position === 'sticky' ? nav.getBoundingClientRect().height + 14 : 0
      window.scrollTo({ top: bar.getBoundingClientRect().top + window.scrollY - navH - 12 })
    }
    if (v.fit) refit()
    else setView({ fit: true })
  }

  return (
    <div className={v.wide && cur && !editing ? 'grid solo' : 'grid'}>
      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h2>{t('cs.yourSongs')}</h2>
          <button className="ghost" onClick={() => setEditing({ title: '', key: 'C', capo: 0, body: t('song.template') })}>
            {t('home.newSong')}
          </button>
        </div>
        <input placeholder={t('cs.search')} style={{ margin: '12px 0' }} value={q} onChange={(e) => setQ(e.target.value)} />
        {cloudOn && songs.length > 0 && (
          <div className="seg filter" role="group" aria-label={t('pub.filter')}>
            {['all', 'draft', 'pub'].map((k) => (
              <button key={k} className={only === k ? 'pick' : 'ghost'} aria-pressed={only === k} onClick={() => setOnly(k)}>
                {t('pub.only.' + k)} <small>{k === 'all' ? songs.length : songs.filter((s) => (pubState(s) === 'draft') === (k === 'draft')).length}</small>
              </button>
            ))}
          </div>
        )}
        {!songs.length && <p className="note">{t('cs.empty')}</p>}
        <ul className="list">
          {sorted
            .filter((s) => !q || s.title.toLowerCase().includes(q.toLowerCase()))
            .filter((s) => only === 'all' || (pubState(s) === 'draft') === (only === 'draft'))
            .map((s) => (
              <li key={s.id} className={s.id === curId && !editing ? 'on' : ''} onClick={() => select(s.id)} tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && select(s.id)}>
                <b>{s.title}</b>
                <div className="muted">
                  {t('keyOf', { key: s.key })}{s.capo ? ' · ' + t('capoOf', { n: s.capo }) : ''}
                  {cloudOn && <span className={'tag ' + (s.published ? 'pub' : 'draft')}>{t('pub.state.' + pubState(s))}</span>}
                </div>
              </li>
            ))}
        </ul>
      </div>
      <div>
        {editing ? (
          <Editor key={editing.id || 'new' + editing.title} song={editing} onSave={save} onCancel={() => setEditing(null)} />
        ) : !cur ? (
          <div className="card"><p className="muted">{t('cs.pick')}</p></div>
        ) : (
          <div className="card">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <h2>{cur.title}</h2>
              <button className="ghost" onClick={() => setEditing(cur)}>{t('cs.edit')}</button>
            </div>
            <div className="row" style={{ margin: '12px 0 4px' }}>
              <button className="ghost" onClick={() => shift(-1)} aria-label={t('cs.down')}>− ½</button>
              <span className="big" style={{ fontSize: 28, minWidth: '3ch', textAlign: 'center' }}>{view.key}</span>
              <button className="ghost" onClick={() => shift(1)} aria-label={t('cs.up')}>+ ½</button>
              {offset !== 0 && (
                <>
                  <button className="pick" onClick={() => {
                    save({ ...cur, key: view.key, body: transposeBody(cur.body, offset, view.flat) })
                    setOffset(0)
                  }}>{t('cs.saveKey', { key: view.key })}</button>
                  <button className="ghost" onClick={() => setOffset(0)}>{t('cs.resetKey')}</button>
                </>
              )}
            </div>
            <p className="muted">
              {offset !== 0 && t('cs.shifted', { offset, from: cur.key })}
              {cur.capo ? t('cs.capo', { n: cur.capo }) : ''}
            </p>
            <PublishBox song={cur} onPatch={patch} />
            <div ref={barRef} className="zoombar" role="toolbar" aria-label={t('cs.toolbar')}>
              <div className="seg">
                <button className="ghost icon" onClick={() => zoomBy(-0.1)} disabled={v.zoom <= ZMIN} aria-label={t('cs.zoomOut')} title={t('cs.zoomOutTitle')}>
                  <Mag />
                </button>
                <button className="ghost pct" onClick={() => setView({ fit: false, zoom: 1 })} title={t('cs.zoomReset')}>
                  {Math.round(v.zoom * 100)}%
                </button>
                <button className="ghost icon" onClick={() => zoomBy(0.1)} disabled={v.zoom >= ZMAX} aria-label={t('cs.zoomIn')} title={t('cs.zoomInTitle')}>
                  <Mag plus />
                </button>
              </div>
              <button className={v.fit ? 'pick' : 'ghost'} onClick={fitNow} aria-pressed={v.fit} title={t('cs.fitTitle')}>
                {t('cs.fit')}
              </button>
              <div className="seg" role="group" aria-label={t('cs.cols')}>
                {[1, 2, 3].map((n) => (
                  <button key={n} className={v.cols === n ? 'pick' : 'ghost'} aria-pressed={v.cols === n}
                    onClick={() => setView({ fit: false, cols: n })}>{t('cs.colN', { n })}</button>
                ))}
              </div>
              <button className="ghost" onClick={() => setView({ wide: !v.wide })} aria-pressed={v.wide}>
                {v.wide ? t('cs.showList') : t('cs.hideList')}
              </button>
            </div>
            <Sheet ref={sheetRef} body={body} zoom={v.zoom} cols={v.cols} />
            {recs.length > 0 && (
              <div className="rec-box">
                <h3>{t('cs.recs')}</h3>
                {recs.map((r) => (
                  <div key={r.id} style={{ marginTop: 10 }}>
                    <span className="muted">{new Date(r.date).toLocaleDateString(locale)} · {t(r.kind === 'c' ? 'kind.c' : 'kind.s')}</span>
                    {r.mediaType && <Media id={r.id} type={r.mediaType} />}
                  </div>
                ))}
              </div>
            )}
            <div className="row" style={{ marginTop: 16 }}>
              <button className="ghost" onClick={() => {
                if (!sure) return setSure(true)
                // A deleted song should not stay public.
                if (cur.published && user) unpublishSong(user, cur.id).catch((e) => console.warn('[publish]', e))
                setSongs(songs.filter((s) => s.id !== cur.id))
                setCurId(null)
                setSure(false)
              }}>{sure ? t('confirmDelete') : t('cs.deleteSong')}</button>
              {sure && cur.published && <span className="muted">{user ? t('pub.deleteAlso') : t('pub.deleteSignedOut')}</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
