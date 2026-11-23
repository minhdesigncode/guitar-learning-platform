import { useEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import TopNav from './components/TopNav.jsx'
import Journal from './components/Journal.jsx'
import ChordSpace from './components/ChordSpace.jsx'
import Theory from './components/Theory.jsx'
import Tools from './components/Tools.jsx'
import CreativeSpace from './components/CreativeSpace.jsx'
import Explore from './components/Explore.jsx'
import Home from './components/Home.jsx'
import { useStored, uid, saveMedia } from './lib/store.js'
import { SEED_SONGS } from './lib/seed.js'
import { useT } from './i18n/index.jsx'
import Account from './components/Account.jsx'
import { useAuth } from './cloud/auth.jsx'
import { useCloudSync } from './cloud/useCloudSync.js'
import { cloudEnabled } from './cloud/client.js'

// Title and subtitle of each view come from the i18n dictionaries (nav.<id>, sub.<id>).
const VIEWS = ['journal', 'chords', 'explore', 'theory', 'tools', 'creative']

// Some views are sections of one page: one nav item, a segmented switch inside.
// The hash stays per section (#explore/<id> links keep working).
export const PAGES = { chords: ['chords', 'explore'], practice: ['theory', 'tools'] }
export const pageOf = (view) => Object.keys(PAGES).find((p) => PAGES[p].includes(view)) ?? view

function SubTabs({ page, view }) {
  const t = useT()
  const tabs = PAGES[page].filter((v) => v !== 'explore' || cloudEnabled)
  if (tabs.length < 2) return null
  return (
    <nav className="subtabs" aria-label={t('page.' + page)}>
      {tabs.map((v) => (
        <a key={v} href={'#' + v} className={v === view ? 'on' : ''} aria-current={v === view ? 'page' : undefined}>
          {t('tab.' + v)}
        </a>
      ))}
    </nav>
  )
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
          style={{ '--i': i }}
        />
      ))}
    </svg>
  )
}

// #view, or #explore/<public song id> to open one published song (shareable link).
const currentRoute = () => {
  const [v, param = null] = window.location.hash.slice(1).split('/')
  return VIEWS.includes(v) ? { view: v, param } : { view: 'journal', param: null }
}

export default function App() {
  const t = useT()
  const [route, setRoute] = useState(currentRoute)
  const { view } = route
  const page = pageOf(view)
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
      const next = currentRoute()
      const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const sameView = pageOf(next.view) === document.documentElement.dataset.view
      if (!document.startViewTransition || calm || sameView) return setRoute(next)
      document.startViewTransition(() => flushSync(() => setRoute(next)))
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
    document.documentElement.dataset.view = page
    if (view !== 'chords') setOpenId(null)
  }, [view])

  // Copy a published song into your own list (works signed out too: it lands in local storage).
  const saveCopy = (song) => setSongs((list) => [{ ...song, id: uid(), updated: Date.now() }, ...list])

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
      <TopNav page={page} account={<Account sync={user ? sync : null} />} />
      <div className="hero">
        <Waves key={page} />
        <h1>{t('page.' + page)}</h1>
        <p>{t('sub.' + view)}</p>
      </div>
        <main>
          {PAGES[page] && <SubTabs page={page} view={view} />}
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
          {view === 'explore' && <Explore openId={route.param} songs={songs} onSaveCopy={saveCopy} />}
          {view === 'theory' && <Theory onCreateSong={newSongFromProgression} />}
          {view === 'tools' && <Tools />}
          {view === 'creative' && <CreativeSpace />}
        </main>
    </div>
  )
}
