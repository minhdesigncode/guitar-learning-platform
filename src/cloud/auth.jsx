import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase, cloudEnabled } from './client.js'
import { useT } from '../i18n/index.jsx'

const Ctx = createContext({ enabled: false, user: null, ready: true })

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(!cloudEnabled)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setReady(true)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      // Drop the ?code= left by the OAuth redirect, keep the #view.
      if (window.location.search.includes('code=')) {
        window.history.replaceState(null, '', window.location.pathname + window.location.hash)
      }
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const signIn = useCallback(async () => {
    if (!supabase) return
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + window.location.pathname + window.location.hash },
    })
  }, [])

  const signOut = useCallback(async () => {
    if (!supabase) return
    await supabase.auth.signOut()
  }, [])

  const value = useMemo(() => ({ enabled: cloudEnabled, user, ready, signIn, signOut }), [user, ready, signIn, signOut])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useAuth = () => useContext(Ctx)

// Wrap anything that needs an account: shows the sign-in prompt instead when signed out.
export function RequireAuth({ children, fallback }) {
  const { user, enabled, signIn } = useAuth()
  const t = useT()
  if (user) return children
  if (fallback !== undefined) return fallback
  return enabled ? (
    <div>
      <p className="note">{t('auth.required')}</p>
      <button type="button" onClick={signIn}>{t('auth.signInGoogle')}</button>
    </div>
  ) : null
}
