// Plucked-string sound for the Creative space guitar: Karplus-Strong, one buffer per open string,
// rendered once when sound is switched on. Browsers only start audio after a click or tap,
// so `enable()` must run inside one.

const FREQ = { 6: 82.41, 5: 110.0, 4: 146.83, 3: 196.0, 2: 246.94, 1: 329.63 }

export function render(ac, f, seconds = 2.6) {
  const sr = ac.sampleRate
  const n = Math.round(sr / f)
  const len = Math.round(sr * seconds)
  const buf = ac.createBuffer(1, len, sr)
  const out = buf.getChannelData(0)
  const line = new Float32Array(n)
  // a pick is a burst of noise, a bit smoothed so it is not too bright
  let prev = 0
  for (let i = 0; i < n; i++) {
    const r = Math.random() * 2 - 1
    prev = prev * 0.5 + r * 0.5
    line[i] = prev
  }
  // low strings ring longer
  const decay = 0.996 + Math.min(0.0035, 0.3 / f)
  let p = 0
  for (let i = 0; i < len; i++) {
    const next = (p + 1) % n
    const v = line[p]
    line[p] = decay * 0.5 * (v + line[next])
    out[i] = v
    p = next
  }
  // short fade in and out against clicks
  const fin = Math.round(sr * 0.002)
  for (let i = 0; i < fin; i++) out[i] *= i / fin
  const fout = Math.round(sr * 0.3)
  for (let i = 0; i < fout; i++) out[len - 1 - i] *= i / fout
  return buf
}

export function createPluck() {
  let ac = null
  let bus = null
  const bufs = {}
  const voices = {}

  return {
    async enable() {
      if (!ac) {
        const AC = window.AudioContext || window.webkitAudioContext
        if (!AC) return false
        ac = new AC()
        // a soft low-pass and a little gain stand in for the guitar's body
        const tone = ac.createBiquadFilter()
        tone.type = 'lowpass'
        tone.frequency.value = 3800
        bus = ac.createGain()
        bus.gain.value = 0.55
        tone.connect(bus).connect(ac.destination)
        bus.input = tone
        for (const s of Object.keys(FREQ)) bufs[s] = render(ac, FREQ[s])
      }
      if (ac.state !== 'running') await ac.resume()
      return true
    },
    /** Plays open string s (1 = high e, 6 = low E). A string that is still ringing is damped first, as on a real one. */
    play(s) {
      if (!ac || ac.state !== 'running' || !bufs[s]) return
      const t = ac.currentTime
      const old = voices[s]
      if (old) {
        old.g.gain.setTargetAtTime(0, t, 0.015)
        old.src.stop(t + 0.1)
      }
      const src = ac.createBufferSource()
      src.buffer = bufs[s]
      const g = ac.createGain()
      g.gain.value = 0.9
      src.connect(g).connect(bus.input)
      src.start(t)
      voices[s] = { src, g }
      src.onended = () => { if (voices[s]?.src === src) delete voices[s] }
    },
    close() {
      ac?.close()
      ac = null
    },
  }
}
