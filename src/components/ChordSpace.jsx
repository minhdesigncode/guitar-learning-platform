import { useEffect, useState } from 'react'
import { transposeBody, transposeKey } from '../lib/music.js'
import { uid } from '../lib/store.js'

function Sheet({ body }) {
  return (
    <div className="sheet scroll">
      {body.split('\n').map((line, i) => {
        if (/^\s*#/.test(line)) return <div key={i} className="sec">{line.replace(/^\s*#+\s*/, '')}</div>
        if (!line.trim()) return <div key={i} className="ln">&nbsp;</div>
        if (!line.includes('[')) return <div key={i} className="ln">{line}</div>
        const parts = line.split(/\[([^\]]+)\]/)
        const segs = []
        if (parts[0]) segs.push(['', parts[0]])
        for (let p = 1; p < parts.length; p += 2) segs.push([parts[p], parts[p + 1] || ' '])
        return (
          <div key={i} className="ln">
            {segs.map(([c, t], j) => (
              <span key={j} className="sg">
                <i>{c}</i>
                {t}
              </span>
            ))}
          </div>
        )
      })}
    </div>
  )
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

export default function ChordSpace({ songs, setSongs, draft, clearDraft }) {
  const sorted = [...songs].sort((a, b) => b.updated - a.updated)
  const [curId, setCurId] = useState(sorted[0]?.id || null)
  const [editing, setEditing] = useState(null)
  const [offset, setOffset] = useState(0)
  const [q, setQ] = useState('')
  const [sure, setSure] = useState(false)

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

  return (
    <div className="grid">
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
            <Sheet body={transposeBody(cur.body || '', offset, view.flat)} />
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
