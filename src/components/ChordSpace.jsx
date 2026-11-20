import { forwardRef, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { transposeBody, transposeKey } from '../lib/music.js'
import { uid } from '../lib/store.js'

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

const Sheet = forwardRef(function Sheet({ body, zoom, cols }, ref) {
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
  const [f, setF] = useState(song)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  return (
    <div className="card">
      <h2>{song.id ? 'Sửa bài' : 'Bài mới'}</h2>
      <label htmlFor="et">Tên bài</label>
      <input id="et" value={f.title} onChange={set('title')} />
      <div className="row">
        <div style={{ flex: 1 }}>
          <label htmlFor="ek">Key</label>
          <input id="ek" value={f.key} onChange={set('key')} />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="ec">Capo</label>
          <input id="ec" type="number" min="0" max="12" value={f.capo} onChange={set('capo')} />
        </div>
      </div>
      <label htmlFor="eb">Lời và hợp âm</label>
      <p className="muted" style={{ margin: '0 0 6px' }}>
        Đặt hợp âm trong ngoặc vuông ngay trước chữ: <code>[G]Met you on a [Bm]road</code>. Dòng bắt đầu bằng <code>#</code> là tên đoạn.
      </p>
      <textarea id="eb" value={f.body} onChange={set('body')} />
      <div className="row" style={{ marginTop: 12 }}>
        <button
          className="pick"
          onClick={() =>
            onSave({ ...f, title: f.title.trim() || 'Bài chưa đặt tên', key: f.key.trim() || 'C', capo: +f.capo || 0 })
          }
        >
          Lưu bài
        </button>
        <button className="ghost" onClick={onCancel}>Huỷ</button>
      </div>
    </div>
  )
}

export default function ChordSpace({ songs, setSongs, draft, clearDraft, openId }) {
  const sorted = [...songs].sort((a, b) => b.updated - a.updated)
  const [curId, setCurId] = useState((songs.some((s) => s.id === openId) && openId) || sorted[0]?.id || null)
  const [editing, setEditing] = useState(null)
  const [offset, setOffset] = useState(0)
  const [q, setQ] = useState('')
  const [sure, setSure] = useState(false)
  const [v, setView] = useView()
  const sheetRef = useRef(null)
  const barRef = useRef(null)

  useEffect(() => {
    if (draft) {
      setEditing(draft)
      clearDraft()
    }
  }, [draft, clearDraft])

  const cur = songs.find((s) => s.id === curId)
  const select = (id) => {
    setCurId(id)
    setOffset(0)
    setEditing(null)
    setSure(false)
  }

  const save = (song) => {
    const s = { ...song, id: song.id || uid(), updated: Date.now() }
    setSongs(songs.some((x) => x.id === s.id) ? songs.map((x) => (x.id === s.id ? s : x)) : [s, ...songs])
    setCurId(s.id)
    setEditing(null)
  }

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
          <h2>Bài của bạn</h2>
          <button className="ghost" onClick={() => setEditing({ title: '', key: 'C', capo: 0, body: '# Verse 1\n[C]' })}>
            + Bài mới
          </button>
        </div>
        <input placeholder="Tìm bài…" style={{ margin: '12px 0' }} value={q} onChange={(e) => setQ(e.target.value)} />
        {!songs.length && <p className="note">Chưa có bài nào. Bấm “+ Bài mới”.</p>}
        <ul className="list">
          {sorted
            .filter((s) => !q || s.title.toLowerCase().includes(q.toLowerCase()))
            .map((s) => (
              <li key={s.id} className={s.id === curId && !editing ? 'on' : ''} onClick={() => select(s.id)} tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && select(s.id)}>
                <b>{s.title}</b>
                <div className="muted">Key {s.key}{s.capo ? ' · capo ' + s.capo : ''}</div>
              </li>
            ))}
        </ul>
      </div>
      <div>
        {editing ? (
          <Editor key={editing.id || 'new' + editing.title} song={editing} onSave={save} onCancel={() => setEditing(null)} />
        ) : !cur ? (
          <div className="card"><p className="muted">Chọn một bài ở danh sách, hoặc tạo bài mới.</p></div>
        ) : (
          <div className="card">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <h2>{cur.title}</h2>
              <button className="ghost" onClick={() => setEditing(cur)}>Sửa</button>
            </div>
            <div className="row" style={{ margin: '12px 0 4px' }}>
              <button className="ghost" onClick={() => shift(-1)} aria-label="Hạ nửa cung">− ½</button>
              <span className="big" style={{ fontSize: 28, minWidth: '3ch', textAlign: 'center' }}>{view.key}</span>
              <button className="ghost" onClick={() => shift(1)} aria-label="Nâng nửa cung">+ ½</button>
              {offset !== 0 && (
                <>
                  <button className="pick" onClick={() => {
                    save({ ...cur, key: view.key, body: transposeBody(cur.body, offset, view.flat) })
                    setOffset(0)
                  }}>Lưu tông {view.key}</button>
                  <button className="ghost" onClick={() => setOffset(0)}>Về tông gốc</button>
                </>
              )}
            </div>
            <p className="muted">
              {offset !== 0 && `Đã ${offset > 0 ? 'nâng' : 'hạ'} ${Math.abs(offset) / 2} cung từ ${cur.key}. `}
              {cur.capo ? `Capo ${cur.capo}.` : ''}
            </p>
            <div ref={barRef} className="zoombar" role="toolbar" aria-label="Cỡ chữ và bố cục lời">
              <div className="seg">
                <button className="ghost icon" onClick={() => zoomBy(-0.1)} disabled={v.zoom <= ZMIN} aria-label="Thu nhỏ chữ" title="Thu nhỏ">
                  <Mag />
                </button>
                <button className="ghost pct" onClick={() => setView({ fit: false, zoom: 1 })} title="Về 100%">
                  {Math.round(v.zoom * 100)}%
                </button>
                <button className="ghost icon" onClick={() => zoomBy(0.1)} disabled={v.zoom >= ZMAX} aria-label="Phóng to chữ" title="Phóng to">
                  <Mag plus />
                </button>
              </div>
              <button className={v.fit ? 'pick' : 'ghost'} onClick={fitNow} aria-pressed={v.fit} title="Tự co chữ và chia cột để thấy trọn bài">
                Vừa màn hình
              </button>
              <div className="seg" role="group" aria-label="Số cột">
                {[1, 2, 3].map((n) => (
                  <button key={n} className={v.cols === n ? 'pick' : 'ghost'} aria-pressed={v.cols === n}
                    onClick={() => setView({ fit: false, cols: n })}>{n} cột</button>
                ))}
              </div>
              <button className="ghost" onClick={() => setView({ wide: !v.wide })} aria-pressed={v.wide}>
                {v.wide ? 'Hiện danh sách' : 'Ẩn danh sách'}
              </button>
            </div>
            <Sheet ref={sheetRef} body={body} zoom={v.zoom} cols={v.cols} />
            <div className="row" style={{ marginTop: 16 }}>
              <button className="ghost" onClick={() => {
                if (!sure) return setSure(true)
                setSongs(songs.filter((s) => s.id !== cur.id))
                setCurId(null)
                setSure(false)
              }}>{sure ? 'Bấm lần nữa để xoá' : 'Xoá bài'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
