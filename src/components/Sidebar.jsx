const ITEMS = [
  {
    id: 'journal',
    label: 'Guitar journal',
    icon: (
      <>
        <rect x="4" y="3" width="16" height="18" rx="3" />
        <path d="M12 7v6" />
        <path d="M9 11a3 3 0 0 0 6 0" />
        <path d="M12 14v3" />
      </>
    ),
  },
  {
    id: 'chords',
    label: 'Chord space',
    icon: (
      <>
        <path d="M2 6h20M2 10h20M2 14h20M2 18h20" />
        <circle cx="8" cy="10" r="1.8" fill="currentColor" />
        <circle cx="15" cy="14" r="1.8" fill="currentColor" />
      </>
    ),
  },
  {
    id: 'theory',
    label: 'Nhạc lý',
    icon: (
      <>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z" />
        <path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5" />
      </>
    ),
  },
  {
    id: 'tools',
    label: 'Kết nối và beat',
    icon: (
      <>
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="2.5" />
        <path d="M12 4v3M12 17v3M4 12h3M17 12h3" />
      </>
    ),
  },
]

export default function Sidebar({ view }) {
  return (
    <aside className="rail">
      <div className="logo" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="#1c2142" strokeWidth="2" strokeLinecap="round">
          <path d="M9 18V5l11-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="17" cy="16" r="3" />
        </svg>
      </div>
      <nav>
        {ITEMS.map((it) => (
          <a key={it.id} href={'#' + it.id} title={it.label} className={view === it.id ? 'on' : ''}>
            <svg viewBox="0 0 24 24">{it.icon}</svg>
            <span>{it.label}</span>
          </a>
        ))}
      </nav>
    </aside>
  )
}
