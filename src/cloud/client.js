import { createClient } from '@supabase/supabase-js'

// Cloud is optional: without these env vars the app stays local-only, exactly as before.
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const cloudEnabled = Boolean(url && key)

export const supabase = cloudEnabled
  ? createClient(url, key, {
      auth: {
        // PKCE puts ?code= in the query string, so it never collides with our #view hash routing.
        flowType: 'pkce',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null

export const MEDIA_BUCKET = 'recordings'

export async function currentUserId() {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data.session?.user?.id ?? null
}
