import { useI18n } from '../i18n/index.jsx'

const ITEMS = [
  {
    id: 'journal',
    href: 'journal',
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
    href: 'chords',
    icon: (
      <>
        <path d="M2 6h20M2 10h20M2 14h20M2 18h20" />
        <circle cx="8" cy="10" r="1.8" fill="currentColor" />
        <circle cx="15" cy="14" r="1.8" fill="currentColor" />
      </>
    ),
  },
  {
    id: 'practice',
    href: 'theory',
    icon: (
      <>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z" />
        <path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5" />
      </>
    ),
  },
  {
    id: 'creative',
    href: 'creative',
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
// Explore lives inside the Chords page and Beats inside Self practice, so they have no item of their own.
export default function TopNav({ page, account }) {
  const { t, lang, setLang } = useI18n()
  const other = lang === 'vi' ? 'en' : 'vi'
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
          <a key={it.id} href={'#' + it.href} title={t('page.' + it.id)} aria-label={t('page.' + it.id)} className={page === it.id ? 'on' : ''}
            aria-current={page === it.id ? 'page' : undefined}>
            <svg viewBox="0 0 24 24">{it.icon}</svg>
            <span>{t('page.' + it.id)}</span>
            {/* Shorter name for the phone tab bar, where every item shows its label under the icon. */}
            <em aria-hidden="true">{t('pageShort.' + it.id)}</em>
          </a>
        ))}
      </nav>
      <div className="nav-end">
        <button type="button" className="lang" onClick={() => setLang(other)} title={t('lang.switch')} aria-label={t('lang.switch')}>
          {t('lang.short')}
        </button>
        {account ?? <span className="dot" aria-hidden="true">M</span>}
      </div>
    </header>
  )
}
