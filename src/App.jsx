import { useEffect, useState } from 'react'
import TopNav from './components/TopNav.jsx'
import Journal from './components/Journal.jsx'
import ChordSpace from './components/ChordSpace.jsx'
import Theory from './components/Theory.jsx'
import Tools from './components/Tools.jsx'
import CreativeSpace from './components/CreativeSpace.jsx'
import { useStored } from './lib/store.js'
import { SEED_SONGS } from './lib/seed.js'

const VIEWS = {
  journal: 'Guitar journal',
  chords: 'Chord space',
  theory: 'Nhạc lý',
  tools: 'Beat & kết nối',
  creative: 'Creative space',
}

const SUB = {
  journal: 'Lưu lại mọi bản cover và sáng tác, nghe lại mình đã tiến bộ tới đâu.',
  chords: 'Hợp âm bạn tự mò ra, đổi tông chỉ với một chạm.',
  theory: 'Âm giai, ngũ cung, hợp âm theo key, dò key từ tai nghe.',
  tools: 'Máy nhịp, beat trống và các công cụ sáng tác yêu thích.',
  creative: 'Góc vẽ nét mảnh: một cây guitar phác bằng hair-line, rê chuột qua để gảy dây.',
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
              <Journal journal={journal} setJournal={setJournal} />
            </>
          )}
          {view === 'chords' && (
            <ChordSpace songs={songs} setSongs={setSongs} draft={draft} clearDraft={() => setDraft(null)} />
          )}
          {view === 'theory' && <Theory onCreateSong={newSongFromProgression} />}
          {view === 'tools' && <Tools />}
          {view === 'creative' && <CreativeSpace />}
        </main>
    </div>
  )
}
