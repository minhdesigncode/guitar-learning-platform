import { useEffect, useState } from 'react'
import TopNav from './components/TopNav.jsx'
import Journal from './components/Journal.jsx'
import ChordSpace from './components/ChordSpace.jsx'
import Theory from './components/Theory.jsx'
import Tools from './components/Tools.jsx'
import Home from './components/Home.jsx'
import { useStored, uid, saveMedia } from './lib/store.js'
import { SEED_SONGS } from './lib/seed.js'

const VIEWS = {
  journal: 'Trang chủ',
  chords: 'Chord space',
  theory: 'Nhạc lý',
  tools: 'Beat này beat kia',
}

const SUB = {
  journal: 'Nhạc lý tuần này, bài mới nhất và mọi bản thu, nghe lại mình đã tiến bộ tới đâu.',
  chords: 'Hợp âm bạn tự mò ra, đổi tông chỉ với một chạm.',
  theory: 'Âm giai, ngũ cung, hợp âm theo key, dò key từ tai nghe.',
  tools: 'Máy nhịp và beat trống để tập cùng.',
}

function Waves() {
  const colors = ['#b9d440', '#bc9bf3', '#b9d440', '#bc9bf3', '#ffffff']
  return (
    <svg className="waves" viewBox="0 0 520 200" preserveAspectRatio="xMaxYMid slice" aria-hidden="true">
      {colors.map((c, i) => (
        <path
          key={i}
          d={`M0 ${30 + i * 36} C 60 ${0 + i * 36}, 100 ${70 + i * 36}, 160 ${30 + i * 36} S 260 ${0 + i * 36}, 320 ${30 + i * 36} S 420 ${70 + i * 36}, 520 ${30 + i * 36}`}
          fill="none"
          stroke={c}
          strokeWidth={i === 4 ? 3 : 10}
          strokeLinecap="round"
          opacity={i === 4 ? 0.5 : 1}
        />
      ))}
    </svg>
  )
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
  const [openId, setOpenId] = useState(null)

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

  useEffect(() => {
    if (view !== 'chords') setOpenId(null)
  }, [view])

  const addRecording = async (song, { file, kind }) => {
    const entry = { id: uid(), songId: song.id, title: song.title, kind, note: 'Key ' + song.key, date: Date.now() }
    try {
      await saveMedia(entry.id, file)
      entry.mediaType = file.type || 'audio/webm'
    } catch {
      entry.note += ' · không lưu được file, bộ nhớ trình duyệt có thể đã đầy'
    }
    setJournal((j) => [entry, ...j])
  }

  const openSong = (id) => {
    setOpenId(id)
    window.location.hash = 'chords'
  }

  return (
    <div className="app">
      <TopNav view={view} />
      <div className="hero">
        <Waves />
        <h1>{VIEWS[view]}</h1>
        <p>{SUB[view]}</p>
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
              <Home
                songs={songs}
                journal={journal}
                onOpenSong={openSong}
                onNewSong={() => newSongFromProgression({ title: '', key: 'C', capo: 0, body: '# Verse 1\n[C]' })}
              />
              <Journal journal={journal} setJournal={setJournal} />
            </>
          )}
          {view === 'chords' && (
            <ChordSpace openId={openId} journal={journal} onAddRecording={addRecording} songs={songs} setSongs={setSongs} draft={draft} clearDraft={() => setDraft(null)} />
          )}
          {view === 'theory' && <Theory onCreateSong={newSongFromProgression} />}
          {view === 'tools' && <Tools />}
        </main>
    </div>
  )
}
