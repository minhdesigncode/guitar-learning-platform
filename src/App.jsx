import { useEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import TopNav from './components/TopNav.jsx'
import Journal from './components/Journal.jsx'
import ChordSpace from './components/ChordSpace.jsx'
import Theory from './components/Theory.jsx'
import Tools from './components/Tools.jsx'
import CreativeSpace from './components/CreativeSpace.jsx'
import Home from './components/Home.jsx'
import { useStored, uid, saveMedia } from './lib/store.js'
import { SEED_SONGS } from './lib/seed.js'
import { useT } from './i18n/index.jsx'
import Account from './components/Account.jsx'
import { useAuth } from './cloud/auth.jsx'
import { useCloudSync } from './cloud/useCloudSync.js'

// Title and subtitle of each view come from the i18n dictionaries (nav.<id>, sub.<id>).
const VIEWS = ['journal', 'chords', 'theory', 'tools', 'creative']

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
          style={{ '--i': i }}
        />
      ))}
    </svg>
  )
}

const currentView = () => {
  const h = window.location.hash.slice(1)
  return VIEWS.includes(h) ? h : 'journal'
}

export default function App() {
  const t = useT()
  const [view, setView] = useState(currentView)
  const [songs, setSongs] = useStored('sodan.songs', SEED_SONGS)
  const [journal, setJournal] = useStored('sodan.journal', [])
  const [draft, setDraft] = useState(null)
  const [openId, setOpenId] = useState(null)
  const { user } = useAuth()
  const sync = useCloudSync(user, songs, setSongs, journal, setJournal)

  useEffect(() => {
    // Tab changes run inside a view transition where the browser has one:
    // the violet nav pill slides to the new tab and the page content crossfades.
    const onHash = () => {
      const next = currentView()
      const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (!document.startViewTransition || calm) return setView(next)
      document.startViewTransition(() => flushSync(() => setView(next)))
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const stats = [
    [t('stat.recordings'), journal.length, 'p1'],
    [t('stat.originals'), journal.filter((j) => j.kind !== 'c').length, 'p2'],
    [t('stat.covers'), journal.filter((j) => j.kind === 'c').length, 'p3'],
    [t('stat.songs'), songs.length, 'p4'],
  ]

  const newSongFromProgression = (song) => {
    setDraft(song)
    window.location.hash = 'chords'
  }

  useEffect(() => {
    if (view !== 'chords') setOpenId(null)
  }, [view])

  const addRecording = async (song, { file, kind }) => {
    // Store the key itself, not a translated label, so the note follows the current language.
    const entry = { id: uid(), songId: song.id, title: song.title, kind, key: song.key, date: Date.now() }
    try {
      await saveMedia(entry.id, file)
      entry.mediaType = file.type || 'audio/webm'
    } catch {
      entry.saveFailed = true
    }
    setJournal((j) => [entry, ...j])
  }

  const openSong = (id) => {
    setOpenId(id)
    window.location.hash = 'chords'
  }

  return (
    <div className="app">
      <TopNav view={view} account={<Account sync={user ? sync : null} />} />
      <div className="hero">
        <Waves key={view} />
        <h1>{t('nav.' + view)}</h1>
        <p>{t('sub.' + view)}</p>
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
                onNewSong={() => newSongFromProgression({ title: '', key: 'C', capo: 0, body: t('song.template') })}
              />
              <Journal journal={journal} setJournal={setJournal} />
            </>
          )}
          {view === 'chords' && (
            <ChordSpace openId={openId} journal={journal} onAddRecording={addRecording} songs={songs} setSongs={setSongs} draft={draft} clearDraft={() => setDraft(null)} />
          )}
          {view === 'theory' && <Theory onCreateSong={newSongFromProgression} />}
          {view === 'tools' && <Tools />}
          {view === 'creative' && <CreativeSpace />}
        </main>
    </div>
  )
}
