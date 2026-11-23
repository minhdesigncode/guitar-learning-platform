import test from 'node:test'
import assert from 'node:assert/strict'
import { SEED_SONGS, dropRetiredSeeds } from '../src/lib/seed.js'

test('no seeded songs', () => assert.deepEqual(SEED_SONGS, []))

test('drops an untouched retired seed, keeps everything else', () => {
  const mine = { id: 'x', title: 'Mine', updated: 1 }
  const old = { id: 'art-of-disappearing', title: 'The Art of Disappearing', updated: 1795194500000 }
  assert.deepEqual(dropRetiredSeeds([old, mine]), [mine])
  const same = [mine]
  assert.equal(dropRetiredSeeds(same), same)
})

test('keeps a retired seed the user edited', () => {
  const edited = { id: 'art-of-disappearing', title: 'Edited', updated: 1795194999999 }
  assert.deepEqual(dropRetiredSeeds([edited]), [edited])
})
