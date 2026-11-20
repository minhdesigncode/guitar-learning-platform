// Small drawn icons for transport buttons, in place of ▶ ■ ● text glyphs.
const PATHS = {
  play: <path d="M7 4.5v15l12.5-7.5z" />,
  stop: <rect x="6" y="6" width="12" height="12" rx="2.5" />,
  rec: <circle cx="12" cy="12" r="6.5" />,
}

export default function Icon({ name }) {
  return (
    <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">
      {PATHS[name]}
    </svg>
  )
}
