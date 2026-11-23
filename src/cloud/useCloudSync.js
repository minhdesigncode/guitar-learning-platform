import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from './client.js'
import { mergeTable, hasLocalChanges } from './merge.js'
import { uploadMedia, removeMedia } from './media.js'
import { loadMedia } from '../lib/store.js'

const SNAP_KEY = 'sodan.cloud.snap'
const TABLES = { songs: 'songs', journal: 'journal_entries' }

const readSnap = () => {
  try {
    return JSON.parse(localStorage.getItem(SNAP_KEY)) || null
  } catch {
    return null
  }
}
const writeSnap = (s) => {
  try {
    localStorage.setItem(SNAP_KEY, JSON.stringify(s))
  } catch {
    /* ignore */
  }
}

async function pull(table, uid) {
  const { data, error } = await supabase.from(table).select('id,data,deleted').eq('user_id', uid)
  if (error) throw error
  return data
}

async function pushRows(table, uid, rows) {
  if (!rows.length) return
  const now = new Date().toISOString()
  const { error } = await supabase
    .from(table)
    .upsert(rows.map((r) => ({ user_id: uid, id: r.id, data: r.data, deleted: r.deleted, updated_at: now })))
  if (error) throw error
}

// Keeps localStorage as the working copy (works offline / signed out) and mirrors it to Supabase
// while signed in. The first sign-in on a device uploads whatever is already on it.
export function useCloudSync(user, songs, setSongs, journal, setJournal) {
  const [status, setStatus] = useState({ state: 'idle', at: null })
  const latest = useRef({ songs, journal })
  latest.current = { songs, journal }
  const running = useRef(null)
  const again = useRef(false)

  const run = useCallback(async () => {
    if (!supabase || !user) return
    if (running.current) {
      again.current = true
      return running.current
    }
    const job = (async () => {
      setStatus((s) => ({ ...s, state: 'syncing' }))
      try {
        const uid = user.id
        let snap = readSnap()
        // Another account used this device last: start from that account's cloud copy only.
        const foreign = snap && snap.owner && snap.owner !== uid
        if (!snap || snap.owner !== uid) snap = { owner: uid, songs: {}, journal: {} }

        const [rSongs, rJournal] = await Promise.all([pull(TABLES.songs, uid), pull(TABLES.journal, uid)])
        // Merge against the newest local state (edits made while we were fetching are included).
        const cur = latest.current
        const ms = mergeTable(foreign ? [] : cur.songs, rSongs, snap.songs)
        const mj = mergeTable(foreign ? [] : cur.journal, rJournal, snap.journal)
        setSongs(ms.items)
        setJournal(mj.items)
        latest.current = { songs: ms.items, journal: mj.items }

        await Promise.all([pushRows(TABLES.songs, uid, ms.push), pushRows(TABLES.journal, uid, mj.push)])
        writeSnap({ owner: uid, songs: ms.snapshot, journal: mj.snapshot })

        // Recordings: drop files of deleted entries, upload ones that only live on this device.
        await removeMedia(uid, mj.push.filter((r) => r.deleted).map((r) => r.id)).catch(() => {})
        const pending = mj.items.filter((j) => j.mediaType && !j.cloudMedia)
        const done = []
        for (const j of pending) {
          const blob = await loadMedia(j.id).catch(() => null)
          if (!blob) continue
          try {
            await uploadMedia(uid, j.id, blob)
            done.push(j.id)
          } catch {
            /* retry next sync */
          }
        }
        if (done.length) {
          setJournal((list) => list.map((j) => (done.includes(j.id) ? { ...j, cloudMedia: true } : j)))
          again.current = true // push the cloudMedia flag
        }
        setStatus({ state: 'ok', at: Date.now() })
      } catch (e) {
        console.warn('[cloud] sync failed', e)
        setStatus((s) => ({ ...s, state: navigator.onLine ? 'error' : 'offline' }))
      } finally {
        running.current = null
        if (again.current) {
          again.current = false
          setTimeout(run, 300)
        }
      }
    })()
    running.current = job
    return job
  }, [user, setSongs, setJournal])

  // Sign-in (and first load while signed in).
  useEffect(() => {
    if (user) run()
    else setStatus({ state: 'idle', at: null })
  }, [user, run])

  // Local edits: push after a short pause.
  useEffect(() => {
    if (!user) return
    const snap = readSnap()
    if (snap && snap.owner === user.id && !hasLocalChanges(songs, snap.songs) && !hasLocalChanges(journal, snap.journal)) return
    const t = setTimeout(run, 1200)
    return () => clearTimeout(t)
  }, [user, songs, journal, run])

  // Pick up changes from other devices when coming back to the tab or back online.
  useEffect(() => {
    if (!user) return
    const onFocus = () => document.visibilityState === 'visible' && run()
    window.addEventListener('online', run)
    document.addEventListener('visibilitychange', onFocus)
    return () => {
      window.removeEventListener('online', run)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [user, run])

  return { status, syncNow: run }
}
