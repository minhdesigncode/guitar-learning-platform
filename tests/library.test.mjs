import test from 'node:test'
import assert from 'node:assert/strict'
import { LIBRARY, LIBRARY_VISIBLE, searchLibrary, getLibrarySong } from '../src/lib/library/songs.js'
import { parseChord } from '../src/lib/chords/index.js'

test('library ids are unique and every chord parses', () => {
  assert.equal(new Set(LIBRARY.map((s) => s.id)).size, LIBRARY.length)
  for (const s of LIBRARY) {
    for (const [, chords] of s.sections)
      for (const c of chords.replace(/\|/g, ' ').trim().split(/\s+/)) assert.ok(parseChord(c), `${s.title}: ${c}`)
  }
})

test('cards carry no lyrics: only section headers and chords', () => {
  for (const s of LIBRARY)
    for (const line of s.body.split('\n'))
      if (line && !line.startsWith('#')) assert.equal(line.replace(/\[[^\]]+\]/g, '').trim(), '', s.title)
})

test('search ignores Vietnamese accents and filters by artist', { skip: !LIBRARY_VISIBLE && 'library hidden' }, () => {
  assert.ok(searchLibrary('em dao nay').some((s) => s.title === 'Em dạo này'))
  assert.ok(searchLibrary('', 'The Beatles').every((s) => s.artist === 'The Beatles'))
  assert.equal(getLibrarySong('let-it-be-the-beatles').title, 'Let It Be')
})

test('hidden library returns nothing to Explore', { skip: LIBRARY_VISIBLE && 'library shown' }, () => {
  assert.equal(searchLibrary('').length, 0)
  assert.equal(getLibrarySong('let-it-be-the-beatles'), null)
})
