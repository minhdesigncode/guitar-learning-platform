import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mergeTable, stable } from '../src/cloud/merge.js'

const snap = (...xs) => Object.fromEntries(xs.map((x) => [x.id, stable(x)]))
const row = (x, deleted = false) => ({ id: x.id, data: x, deleted })
const a = { id: 'a', title: 'A', updated: 1 }
const b = { id: 'b', title: 'B', updated: 1 }

test('first sign-in uploads local items and pulls remote ones', () => {
  const r = mergeTable([a], [row(b)], {})
  assert.deepEqual(r.items.map((x) => x.id), ['a', 'b'])
  assert.deepEqual(r.push.map((x) => x.id), ['a'])
})

test('jsonb key order does not count as a change', () => {
  const reordered = { updated: 1, title: 'A', id: 'a' }
  const r = mergeTable([a], [row(reordered)], snap(a))
  assert.equal(r.push.length, 0)
})

test('local delete becomes a tombstone', () => {
  const r = mergeTable([], [row(a)], snap(a))
  assert.deepEqual(r.items, [])
  assert.deepEqual(r.push, [{ id: 'a', data: a, deleted: true }])
})

test('remote delete removes the local copy', () => {
  const r = mergeTable([a], [row(a, true)], snap(a))
  assert.deepEqual(r.items, [])
  assert.equal(r.push.length, 0)
})

test('remote edit replaces unchanged local copy', () => {
  const a2 = { ...a, title: 'A2', updated: 2 }
  const r = mergeTable([a], [row(a2)], snap(a))
  assert.equal(r.items[0].title, 'A2')
})

test('edit on both sides: newer wins', () => {
  const mine = { ...a, title: 'mine', updated: 5 }
  const theirs = { ...a, title: 'theirs', updated: 3 }
  const r = mergeTable([mine], [row(theirs)], snap(a))
  assert.equal(r.items[0].title, 'mine')
  assert.equal(r.push.length, 1)
})

test('edit survives a delete from the other side', () => {
  const mine = { ...a, title: 'mine', updated: 5 }
  const r = mergeTable([mine], [row(a, true)], snap(a))
  assert.equal(r.items[0].title, 'mine')
  assert.equal(r.push[0].deleted, false)
})

test('untouched seed song does not overwrite the edited cloud copy on a new device', () => {
  const edited = { ...a, title: 'edited', updated: 9 }
  const r = mergeTable([a], [row(edited)], {})
  assert.equal(r.items[0].title, 'edited')
  assert.equal(r.push.length, 0)
})
