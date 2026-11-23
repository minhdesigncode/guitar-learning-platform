// Plays a chord shape on a synthesized acoustic guitar (Karplus-Strong plucks, the same voice as the
// Creative space guitar). One shared AudioContext; each note is rendered once and cached.
// Browsers only start audio after a click or tap, so call play() from one.
import { render } from '../../creative/pluck.js'

let ac = null
let input = null
const cache = new Map()
let ringing = []

const freq = (midi) => 440 * 2 ** ((midi - 69) / 12)

async function ready() {
  if (!ac) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return false
    ac = new AC()
    // a low-pass and a little gain stand in for the guitar's body
    const tone = ac.createBiquadFilter()
    tone.type = 'lowpass'
    tone.frequency.value = 3600
    const body = ac.createBiquadFilter()
    body.type = 'peaking'
    body.frequency.value = 220
    body.gain.value = 4
    const out = ac.createGain()
    out.gain.value = 0.42
    tone.connect(body).connect(out).connect(ac.destination)
    input = tone
  }
  if (ac.state !== 'running') await ac.resume()
  return ac.state === 'running'
}

const buffer = (midi) => {
  if (!cache.has(midi)) cache.set(midi, render(ac, freq(midi), 3))
  return cache.get(midi)
}

/**
 * Sounds the notes, low to high. mode 'strum' is a down stroke (notes ~22 ms apart),
 * 'arp' picks them one by one. A chord still ringing is damped first, like a palm on the strings.
 */
export async function playChord(midis, mode = 'strum') {
  if (!midis.length || !(await ready())) return
  const t0 = ac.currentTime + 0.02
  for (const v of ringing) {
    v.g.gain.setTargetAtTime(0, t0, 0.02)
    v.src.stop(t0 + 0.15)
  }
  const gap = mode === 'arp' ? 0.17 : 0.022
  ringing = midis.map((m, i) => {
    const src = ac.createBufferSource()
    src.buffer = buffer(m)
    const g = ac.createGain()
    // in a strum the first strings hit a little harder
    g.gain.value = mode === 'arp' ? 0.8 : 0.95 - i * 0.05
    src.connect(g).connect(input)
    src.start(t0 + i * gap)
    return { src, g }
  })
}
