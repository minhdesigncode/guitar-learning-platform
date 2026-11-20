import { useEffect, useState } from 'react'
import Sidebar from './components/Sidebar.jsx'
import Journal from './components/Journal.jsx'
import ChordSpace from './components/ChordSpace.jsx'
import Theory from './components/Theory.jsx'
import Tools from './components/Tools.jsx'
import { useStored } from './lib/store.js'
import { SEED_SONGS } from './lib/seed.js'

const VIEWS = {
  journal: 'Guitar journal',
  chords: 'Chord space',
  theory: 'Nhạc lý',
  tools: 'Kết nối & beat',
}

const currentView = () => {
  const h = window.location.hash.slice(1)
  return VIEWS[h] ? h : 'journal'
}

export default function App() {
  const [view, setView] = useState(currentView)
  const [songs, setSongs] = useStored('sodan.songs', SEED_SONGS)
  const [journal, setJournal] = useStored('sodan.journal', [])
  const [draft, setDraft] = useState(null)

  useEffect(() => {
    const onHash = () => setView(currentView())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const stats = [
    ['Bản thu', journal.length, 'p1'],
    ['Sáng tác', journal.filter((j) => j.kind !== 'c').length, 'p2'],
    ['Cover', journal.filter((j) => j.kind === 'c').length, 'p3'],
    ['Bài trong Chord space', songs.length, 'p4'],
  ]

  const newSongFromProgression = (song) => {
    setDraft(song)
    window.location.hash = 'chords'
  }

  return (
    <div className="app">
      <Sidebar view={view} />
      <div className="content">
        <div className="topbar">
          <div>
            <h1>{VIEWS[view]}</h1>
            <p>Sổ Đàn · nhật ký guitar của bạn</p>
          </div>
        </div>
        <main>
          {view === 'journal' && (
            <>
              <div className="stats">
                {stats.map(([label, n, c]) => (
                  <div key={label} className={'stat ' + c}>
                    <small>{label}</small>
                    <b>{n}</b>
                  </div>
                ))}
              </div>
              <Journal journal={journal} setJournal={setJournal} />
            </>
          )}
          {view === 'chords' && (
            <ChordSpace songs={songs} setSongs={setSongs} draft={draft} clearDraft={() => setDraft(null)} />
          )}
          {view === 'theory' && <Theory onCreateSong={newSongFromProgression} />}
          {view === 'tools' && <Tools />}
        </main>
      </div>
    </div>
  )
}
