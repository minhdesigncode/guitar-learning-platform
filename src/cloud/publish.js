import { supabase } from './client.js'

// Public songs: a snapshot of a song that its owner chose to publish.
// Anyone (signed in or not) can read them; only the owner can publish, update or take one down.
const TABLE = 'public_songs'
const LIST_COLS = 'id,user_id,song_id,title,key,capo,author_name,published_at,updated_at'

export const authorName = (user) => {
  const m = user?.user_metadata || {}
  return (m.full_name || m.name || (user?.email || '').split('@')[0] || '').slice(0, 100) || null
}

// Upserts the public copy and returns { id, at } to remember on the local song.
export async function publishSong(user, song) {
  const row = {
    user_id: user.id,
    song_id: song.id,
    title: (song.title || '').trim().slice(0, 200) || 'Untitled',
    key: String(song.key || 'C').slice(0, 8),
    capo: Math.min(12, Math.max(0, +song.capo || 0)),
    body: song.body || '',
    author_name: authorName(user),
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await supabase.from(TABLE).upsert(row, { onConflict: 'user_id,song_id' }).select('id').single()
  if (error) throw error
  return { id: data.id, at: Date.now() }
}

export async function unpublishSong(user, songId) {
  const { error } = await supabase.from(TABLE).delete().eq('user_id', user.id).eq('song_id', songId)
  if (error) throw error
}

// Escape the LIKE wildcards so "100%" searches for the text, not a pattern.
const like = (q) => '%' + q.toLowerCase().replace(/[\\%_]/g, (c) => '\\' + c) + '%'

export async function searchPublic(q = '', limit = 60) {
  let req = supabase.from(TABLE).select(LIST_COLS).order('updated_at', { ascending: false }).limit(limit)
  const term = q.trim()
  if (term) req = req.ilike('search', like(term))
  const { data, error } = await req
  if (error) throw error
  return data
}

export async function getPublic(id) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null
  const { data, error } = await supabase.from(TABLE).select(LIST_COLS + ',body').eq('id', id).maybeSingle()
  if (error) throw error
  return data
}
