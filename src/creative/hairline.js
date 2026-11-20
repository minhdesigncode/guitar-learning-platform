// Runs a Hairline figure (https://github.com/lucasmarkes/hairline, MIT, see HAIRLINE-LICENSE.txt)
// inside the app. kernel.js is the skill's engine, unchanged; guitar.js is the figure, written
// for the skill's bench and checked with its validator. Both are classic scripts, so they are
// loaded as text and run here the way the bench page runs them.
import kernelSrc from './kernel.js?raw'
import guitarSrc from './guitar.js?raw'

let HL = null
const specs = {}

function load(name, src) {
  if (!HL) HL = new Function(`${kernelSrc}\nreturn HL;`)()
  if (!specs[name]) {
    let spec = null
    new Function('HL', 'hairline', src)(HL, (s) => { spec = s })
    specs[name] = spec
  }
  return specs[name]
}

/** Intensity 0..1 to the figure's own number: two straight lines meeting at 0.5, as on the bench. */
const scale = ([lo, mid, hi], i) => (i <= 0.5 ? lo + (i / 0.5) * (mid - lo) : mid + ((i - 0.5) / 0.5) * (hi - mid))

export function mountGuitar(stage, { intensity = 0.5, onRead, label } = {}) {
  const spec = load('guitar', guitarSrc)
  HL.inject(document)
  stage.setAttribute('data-hairline', spec.name)
  stage.setAttribute('role', 'img')
  if (label) stage.setAttribute('aria-label', label)
  const svg = HL.mk('svg', { viewBox: '0 0 400 320', 'aria-hidden': 'true' }, stage)
  const read = {
    set textContent(v) { onRead?.(v == null ? '' : String(v)) },
  }
  const handle = spec.mount({ stage, svg, read }, scale(spec.range, intensity))
  onRead?.('rest')
  let playing = null
  return {
    setIntensity: (i) => handle.set(scale(spec.range, i)),
    play: (on) => {
      playing?.stop()
      playing = on ? HL.tour(stage, spec.tour, () => {}) : null
    },
    destroy: () => {
      playing?.stop()
      handle.destroy()
      svg.remove()
    },
  }
}
