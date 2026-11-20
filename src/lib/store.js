import { useEffect, useState } from 'react'

// Text data (songs, journal entries) lives in localStorage.
export function useStored(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? JSON.parse(raw) : initial
    } catch {
      return initial
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* storage full or unavailable */
    }
  }, [key, value])
  return [value, setValue]
}

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7)

// Audio/video files live in IndexedDB, which holds large blobs.
const DB = 'sodan-media'
const open = () =>
  new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1)
    req.onupgradeneeded = () => req.result.createObjectStore('files')
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })

const tx = async (mode, fn) => {
  const db = await open()
  return new Promise((resolve, reject) => {
    const t = db.transaction('files', mode)
    const req = fn(t.objectStore('files'))
    t.oncomplete = () => resolve(req && req.result)
    t.onerror = () => reject(t.error)
  })
}

export const saveMedia = (id, blob) => tx('readwrite', (s) => s.put(blob, id))
export const loadMedia = (id) => tx('readonly', (s) => s.get(id))
export const deleteMedia = (id) => tx('readwrite', (s) => s.delete(id))
