// New users start with an empty library.
export const SEED_SONGS = []

// Songs that used to be seeded. A device that still holds an untouched copy
// (same id, never edited since it was seeded) drops it on load.
const RETIRED_SEEDS = [{ id: 'art-of-disappearing', updated: 1795194500000 }]

export function dropRetiredSeeds(songs) {
  if (!Array.isArray(songs)) return songs
  const out = songs.filter((s) => !RETIRED_SEEDS.some((r) => r.id === s?.id && r.updated === s?.updated))
  return out.length === songs.length ? songs : out
}
