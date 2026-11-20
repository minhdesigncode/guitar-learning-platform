# guitar-learning-platform

**Sổ Đàn** — a personal guitar learning web app, built with React + Vite.

## Features

- **Guitar journal** — save cover and original recordings (upload a file or record straight from the mic), with notes and filters.
- **Chord space** — write lyrics with inline chords (`[G]Met you on a [Bm]road`), chords render above the words, transpose up/down by half steps and save the new key, capo field.
- **Nhạc lý** — scales (major, minor, pentatonic, blues) on a 12-fret fretboard, diatonic chords per key, suggested progressions that turn into a new song, and a "find the key" tool from chords you figured out by ear.
- **Kết nối & beat** — a drum machine / metronome (Rock, Pop, Ballad, Bossa nova) plus links to chord sites, AI songwriting and recording tools.
- **Creative space** — an isometric hair-line drawing of an acoustic guitar, made with the [Hairline](https://github.com/lucasmarkes/hairline) skill and engine (MIT). Move the pointer across the body to pluck the strings.

All data stays in your browser: text in `localStorage`, audio/video in `IndexedDB`.

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Deploys to Vercel as a standard Vite project (build command `npm run build`, output `dist`).
