import { test } from 'node:test'
import assert from 'node:assert/strict'
import { loadChords, findShapes, parseChord, shapeMidi } from '../src/lib/chords/index.js'

await loadChords()

test('reads chord names', () => {
  assert.deepEqual(parseChord('F#m7/C#'), { root: 6, quality: 'm7', bass: 1 })
  assert.equal(parseChord('N.C.'), null)
})

test('finds the open C shape first', () => {
  const { shapes, exact } = findShapes('C')
  assert.ok(exact)
  assert.deepEqual(shapes[0].frets, [-1, 3, 2, 0, 1, 0])
  assert.deepEqual(shapeMidi(shapes[0]), [48, 52, 55, 60, 64])
})

test('understands common spellings and slash chords', () => {
  for (const n of ['Am', 'Bb', 'Ebm', 'G7', 'CM7', 'Dsus', 'Bø', 'Gm(maj7)', 'C/E', 'D/F#', 'Am/G', 'Cadd2'])
    assert.ok(findShapes(n).exact, n)
})

test('falls back to the plain chord when a spelling is unknown', () => {
  const r = findShapes('C7#11')
  assert.equal(r.exact, false)
  assert.equal(r.base, 'C')
  assert.ok(r.shapes.length)
})
