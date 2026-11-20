import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../cloud/auth.jsx'
import { useI18n } from '../i18n/index.jsx'

const G = (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.7z" />
    <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24z" />
    <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8z" />
    <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9z" />
  </svg>
)

function statusText(status, t, locale) {
  if (status.state === 'syncing') return t('sync.syncing')
  if (status.state === 'error') return t('sync.error')
  if (status.state === 'offline') return t('sync.offline')
  if (status.at) return t('sync.ok', { time: new Date(status.at).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }) })
  return ''
}

// Sits at the right end of the top bar: Google sign-in when signed out, avatar + menu when signed in.
export default function Account({ sync }) {
  const { enabled, user, ready, signIn, signOut } = useAuth()
  const { t, locale } = useI18n()
  const [open, setOpen] = useState(false)
  const box = useRef(null)

  useEffect(() => {
    if (!open) return
    const close = (e) => !box.current?.contains(e.target) && setOpen(false)
    const esc = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('keydown', esc)
    }
  }, [open])

  // No Supabase config yet: keep the old badge so nothing changes visually.
  if (!enabled) return <span className="dot" aria-hidden="true">M</span>
  if (!ready) return <span className="dot" aria-hidden="true" />

  if (!user) {
    return (
      <button type="button" className="signin" onClick={signIn} title={t('auth.why')} aria-label={t('auth.signInGoogle')}>
        {G}
        <span>{t('auth.signIn')}</span>
      </button>
    )
  }

  const meta = user.user_metadata || {}
  const name = meta.full_name || meta.name || user.email
  const initial = (name || '?').trim().charAt(0).toUpperCase()

  return (
    <div className="account" ref={box}>
      <button
        type="button"
        className="dot avatar"
        aria-label={t('auth.menu')}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {meta.avatar_url ? <img src={meta.avatar_url} alt="" referrerPolicy="no-referrer" /> : initial}
        {sync?.status.state === 'syncing' && <i className="sync-ring" aria-hidden="true" />}
      </button>
      {open && (
        <div className="account-menu" role="menu">
          <b>{name}</b>
          {user.email && name !== user.email && <small>{user.email}</small>}
          {sync && <p className={'sync-state ' + sync.status.state}>{statusText(sync.status, t, locale)}</p>}
          <div className="row">
            {sync && (
              <button type="button" className="ghost" onClick={() => sync.syncNow()} disabled={sync.status.state === 'syncing'}>
                {t('sync.now')}
              </button>
            )}
            <button
              type="button"
              className="ghost"
              onClick={() => {
                setOpen(false)
                signOut()
              }}
            >
              {t('auth.signOut')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
