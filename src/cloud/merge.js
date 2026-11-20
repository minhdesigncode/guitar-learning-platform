// Pure merge logic for one table (songs or journal), kept free of Supabase so it can be tested.
//
// local:    items currently on this device
// remote:   rows from the cloud: { id, data, deleted }
// snapshot: { [id]: stableJson } of each item as it was at the last successful sync ({} if never)
//
// Returns the merged local list, the rows to push, and the new snapshot.

export function stable(v) {
  if (Array.isArray(v)) return '[' + v.map(stable).join(',') + ']'
  if (v && typeof v === 'object') {
    return '{' + Object.keys(v).sort().filter((k) => v[k] !== undefined).map((k) => JSON.stringify(k) + ':' + stable(v[k])).join(',') + '}'
  }
  return JSON.stringify(v)
}

const stamp = (item) => item?.updated ?? item?.date ?? 0

export function mergeTable(local, remote, snapshot = {}) {
  const L = new Map(local.map((x) => [x.id, x]))
  const R = new Map(remote.map((r) => [r.id, r]))
  const ids = new Set([...L.keys(), ...R.keys()])
  const keep = new Map()
  const push = []

  for (const id of ids) {
    const l = L.get(id)
    const r = R.get(id)
    const s = snapshot[id]
    const lJson = l ? stable(l) : undefined
    const rJson = r && !r.deleted ? stable(r.data) : undefined

    const localChanged = l ? lJson !== s : s !== undefined // missing but synced before = deleted here
    const remoteChanged = r ? (r.deleted ? s !== undefined : rJson !== s) : false

    let result // the item we end up with, or undefined for "gone"
    if (localChanged && !remoteChanged) {
      result = l
      if (l) push.push({ id, data: l, deleted: false })
      else if (r && !r.deleted) push.push({ id, data: r.data, deleted: true })
    } else if (!localChanged && remoteChanged) {
      result = r.deleted ? undefined : r.data
    } else if (localChanged && remoteChanged) {
      // Both sides moved. Never lose an edit to a delete; otherwise the newer edit wins.
      if (!l) result = r.deleted ? undefined : r.data
      else if (r.deleted) {
        result = l
        push.push({ id, data: l, deleted: false })
      } else if (lJson === rJson) result = l
      else if (stamp(l) > stamp(r.data)) {
        result = l
        push.push({ id, data: l, deleted: false })
      } else result = r.data
    } else {
      result = l
    }
    if (result) keep.set(id, result)
  }

  // Keep the device's order, then append items that arrived from the cloud.
  const items = [...local.filter((x) => keep.has(x.id)).map((x) => keep.get(x.id))]
  for (const [id, v] of keep) if (!L.has(id)) items.push(v)

  const next = {}
  for (const v of items) next[v.id] = stable(v)
  return { items, push, snapshot: next }
}

export function hasLocalChanges(local, snapshot = {}) {
  if (local.length !== Object.keys(snapshot).length) return true
  return local.some((x) => snapshot[x.id] !== stable(x))
}
