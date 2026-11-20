import { supabase, MEDIA_BUCKET, currentUserId } from './client.js'
import { loadMedia, saveMedia } from '../lib/store.js'

const path = (uid, id) => `${uid}/${id}`

export async function uploadMedia(uid, id, blob) {
  const { error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path(uid, id), blob, { upsert: true, contentType: blob.type || 'audio/webm' })
  if (error) throw error
}

export async function removeMedia(uid, ids) {
  if (!ids.length) return
  await supabase.storage.from(MEDIA_BUCKET).remove(ids.map((id) => path(uid, id)))
}

// Local first; when the file only lives in the cloud (recorded on another device), download and cache it.
export async function fetchMedia(id) {
  const local = await loadMedia(id).catch(() => null)
  if (local || !supabase) return local
  const uid = await currentUserId()
  if (!uid) return null
  const { data, error } = await supabase.storage.from(MEDIA_BUCKET).download(path(uid, id))
  if (error || !data) return null
  saveMedia(id, data).catch(() => {})
  return data
}
