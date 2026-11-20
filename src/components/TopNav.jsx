const ITEMS = [
  {
    id: 'journal',
    label: 'Trang chủ',
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
    label: 'Beat này beat kia',
    icon: (
      <>
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="2.5" />
        <path d="M12 4v3M12 17v3M4 12h3M17 12h3" />
      </>
    ),
  },
  {
    id: 'creative',
    label: 'Creative space',
    icon: (
      <>
        <path d="M13.5 10.5 20 4" />
        <path d="m18.5 2.5 3 3" />
        <path d="M10.6 8.2a3.6 3.6 0 0 0-5 1.2 3.2 3.2 0 0 0-2.3 4.4 3.4 3.4 0 0 0 1.4 4.4 3.4 3.4 0 0 0 4.4 1.4 3.2 3.2 0 0 0 4.4-2.3 3.6 3.6 0 0 0 1.2-5z" />
        <circle cx="9.5" cy="14.5" r="1.5" />
      </>
    ),
  },
]

// Floating pill menu across the top (moves to the bottom of the screen on phones).
export default function TopNav({ view }) {
  return (
    <header className="topnav">
      <a className="brand" href="#journal">
        <span className="logo" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="#b9d440" strokeWidth="2.4" strokeLinecap="round">
            <path d="M9 18V5l11-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="17" cy="16" r="3" />
          </svg>
        </span>
        Sổ Đàn
      </a>
      <nav className="pills">
        {ITEMS.map((it) => (
          <a key={it.id} href={'#' + it.id} title={it.label} className={view === it.id ? 'on' : ''}>
            <svg viewBox="0 0 24 24">{it.icon}</svg>
            <span>{it.label}</span>
          </a>
        ))}
      </nav>
      <span className="dot" aria-hidden="true">M</span>
    </header>
  )
}
