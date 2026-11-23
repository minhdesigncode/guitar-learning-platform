// Sổ Đàn library: chord cards for well-known songs, shown in Explore for everyone.
// Chords only, never lyrics (lyrics are copyrighted; chord progressions are not).
// Written from memory, so every card carries a confidence level:
//   sure: true  → "Cần kiểm tra": the usual chords people play, may differ from the recording in places.
//   sure: false → "Phác thảo": a rough sketch, expect to fix it by ear.
// Sections: [name, 'C G Am F | C G F C'] where "|" starts a new line.
// `key` is the key the shapes are written in; with a capo the song sounds higher.

const S = (title, artist, key, capo, feel, sure, sections) => ({ title, artist, key, capo, feel, sure, sections })

export const LIBRARY_RAW = [
  // ── The Beatles ──
  S('Let It Be', 'The Beatles', 'C', 0, 'Ballad piano, 4/4 chậm', true, [
    ['Intro', 'C G Am F | C G F C'],
    ['Verse', 'C G Am F | C G F C | C G Am F | C G F C'],
    ['Chorus', 'Am G F C | C G F C'],
  ]),
  S('Hey Jude', 'The Beatles', 'F', 0, 'Ballad 4/4', true, [
    ['Verse', 'F C | C7 F | Bb F | C7 F'],
    ['Bridge', 'F7 Bb Bb/A Gm | Gm7/C C7 F'],
    ['Outro', 'F Eb | Bb F'],
  ]),
  S('Yesterday', 'The Beatles', 'F', 0, 'Fingerstyle 4/4 chậm', true, [
    ['Verse', 'F Em7 A7 Dm | Dm/C Bb C7 F'],
    ['Bridge', 'Em7 A7 Dm C Bb | Gm C7 F'],
  ]),
  S('Here Comes the Sun', 'The Beatles', 'D', 7, 'Fingerpick sáng, 4/4', true, [
    ['Intro', 'D G A7 | D G A7'],
    ['Verse', 'D G E7 | D G A7'],
    ['Chorus', 'D G E7 | D G A7 D'],
    ['Bridge', 'F C G D A7'],
  ]),
  S('Blackbird', 'The Beatles', 'G', 0, 'Fingerstyle, 3/4 và 4/4 đan xen', true, [
    ['Verse', 'G Am7 G/B G | C C#dim D D#dim Em | D C#dim C Cm | G A7 C G'],
    ['Bridge', 'F C Dm C Bb | F C Dm C Bb | C D'],
  ]),
  S('Something', 'The Beatles', 'C', 0, 'Ballad 4/4', true, [
    ['Intro', 'F Eb G'],
    ['Verse', 'C Cmaj7 | C7 F | D G Am Am/G | D F Eb G'],
    ['Bridge', 'A C#m F#m A | D G A'],
  ]),
  S('Yellow Submarine', 'The Beatles', 'G', 0, 'Strum vui, 4/4', true, [
    ['Verse', 'G D C G | Em Am C D'],
    ['Chorus', 'G D | D G'],
  ]),
  S('Come Together', 'The Beatles', 'Dm', 0, 'Groove chậm, 4/4', true, [
    ['Verse', 'Dm | Dm | A | G A'],
    ['Chorus', 'Bm A | G A'],
  ]),
  S('Twist and Shout', 'The Beatles', 'D', 0, 'Rock & roll, 4/4 nhanh', true, [
    ['Verse', 'D G A | D G A'],
    ['Build', 'A | A7'],
  ]),
  S('In My Life', 'The Beatles', 'A', 0, 'Ballad 4/4', true, [
    ['Intro', 'A E | A E'],
    ['Verse', 'A E F#m A7 | D Dm A'],
    ['Chorus', 'F#m D G A | F#m B Dm A'],
  ]),
  S('All You Need Is Love', 'The Beatles', 'G', 0, '7/4 ở verse, 4/4 ở chorus', true, [
    ['Verse', 'G D/F# Em | G D/F# Em | D7 G D/F# Em | D7 G'],
    ['Chorus', 'G A7 D7 | G A7 D7 | G B7 Em G | C D7 G'],
  ]),
  S('Norwegian Wood', 'The Beatles', 'D', 2, 'Waltz 3/4', true, [
    ['Verse', 'D | C G D | D | C G D'],
    ['Bridge', 'Dm G | Dm Em A'],
  ]),
  S('Help!', 'The Beatles', 'A', 0, 'Rock nhanh 4/4', true, [
    ['Intro', 'Bm G | E A'],
    ['Verse', 'A C#m | F#m D | G A'],
    ['Chorus', 'Bm G | E A'],
  ]),
  S('Ob-La-Di, Ob-La-Da', 'The Beatles', 'C', 0, 'Ska vui, 4/4', true, [
    ['Verse', 'C G | G7 C | C F | C G C'],
    ['Chorus', 'C Em Am | C G C'],
    ['Bridge', 'F C | F C G'],
  ]),
  S('Love Me Do', 'The Beatles', 'G', 0, 'Strum 4/4', true, [
    ['Verse', 'G C | G C | G C | C G'],
    ['Bridge', 'D C G | D C G'],
  ]),
  S('I Want to Hold Your Hand', 'The Beatles', 'G', 0, 'Rock & roll 4/4', true, [
    ['Verse', 'G D Em B7 | G D Em B7 | C D G Em | C D G'],
    ['Bridge', 'Dm G C Am | Dm G C | C D C D'],
  ]),
  S('Across the Universe', 'The Beatles', 'D', 0, 'Ballad 4/4', true, [
    ['Verse', 'D Bm F#m | Em7 A | D Bm F#m | Em7 Gm'],
    ['Chorus', 'D A7 | A7 | G D | G D'],
  ]),
  S('Eleanor Rigby', 'The Beatles', 'Em', 0, 'Strum chặt, 4/4', true, [
    ['Intro', 'C Em | C Em'],
    ['Verse', 'Em C | Em C | Em'],
    ['Chorus', 'Em7 Em6 | C Em'],
  ]),
  S('Get Back', 'The Beatles', 'A', 0, 'Rock shuffle 4/4', true, [
    ['Verse', 'A | A | D A'],
    ['Chorus', 'A | D A'],
  ]),

  // ── Taylor Swift ──
  S('Love Story', 'Taylor Swift', 'C', 2, 'Country pop 4/4', true, [
    ['Verse', 'C G Am F | C G Am F'],
    ['Pre-chorus', 'F G Am F | F G'],
    ['Chorus', 'C G Am F | C G F | C G Am F | C G F'],
  ]),
  S('You Belong With Me', 'Taylor Swift', 'G', 4, 'Country pop 4/4', false, [
    ['Verse', 'G D Am C | G D Am C'],
    ['Pre-chorus', 'Am C G D'],
    ['Chorus', 'C D Em C | C D G'],
  ]),
  S('Shake It Off', 'Taylor Swift', 'G', 0, 'Pop 4/4, ~160 bpm', true, [
    ['Verse', 'Am C | G'],
    ['Chorus', 'Am C | G'],
  ]),
  S('Blank Space', 'Taylor Swift', 'F', 0, 'Pop 4/4, ~96 bpm', true, [
    ['Verse', 'F | Dm | Gm | Bb'],
    ['Chorus', 'F Dm | Gm Bb'],
  ]),
  S('All Too Well', 'Taylor Swift', 'C', 0, 'Ballad 4/4', true, [
    ['Verse', 'C G Am F | C G Am F'],
    ['Chorus', 'C G Am F | C G F'],
  ]),
  S('Back to December', 'Taylor Swift', 'D', 0, 'Ballad 4/4', true, [
    ['Verse', 'D A Bm G | D A Bm G'],
    ['Chorus', 'D A Bm G | D A G'],
  ]),
  S('We Are Never Ever Getting Back Together', 'Taylor Swift', 'G', 0, 'Pop 4/4', false, [
    ['Verse', 'C G D Em | C G D'],
    ['Chorus', 'C G D Em | C G D'],
  ]),
  S('Mine', 'Taylor Swift', 'C', 0, 'Country pop 4/4', false, [
    ['Verse', 'C G Am F | C G Am F'],
    ['Chorus', 'C G Am F | C G F'],
  ]),
  S('22', 'Taylor Swift', 'G', 0, 'Pop 4/4', false, [
    ['Verse', 'G D C | G D C'],
    ['Chorus', 'G D C | Em D C'],
  ]),
  S('Anti-Hero', 'Taylor Swift', 'E', 0, 'Synth pop 4/4', false, [
    ['Verse', 'E B C#m A'],
    ['Chorus', 'E B C#m A | E B A'],
  ]),
  S('Cruel Summer', 'Taylor Swift', 'A', 0, 'Synth pop 4/4', false, [
    ['Verse', 'A E F#m D'],
    ['Chorus', 'A E F#m D | A E D'],
  ]),

  // ── Niall Horan ──
  S('This Town', 'Niall Horan', 'C', 0, 'Acoustic fingerpick 4/4', false, [
    ['Verse', 'C G Am F | C G F'],
    ['Chorus', 'Am F C G | Am F C'],
  ]),
  S('Slow Hands', 'Niall Horan', 'Am', 0, 'Groove 4/4', false, [
    ['Verse', 'Am | Am | F | F'],
    ['Chorus', 'Am C | F E'],
  ]),
  S('Too Much to Ask', 'Niall Horan', 'C', 0, 'Ballad 6/8', false, [
    ['Verse', 'C G Am F | C G F'],
    ['Chorus', 'F G Am | F G C'],
  ]),
  S('Nice to Meet Ya', 'Niall Horan', 'Em', 0, 'Pop rock 4/4', false, [
    ['Verse', 'Em | C | G | D'],
    ['Chorus', 'Em C G D'],
  ]),
  S('Heaven', 'Niall Horan', 'G', 0, 'Pop ballad 4/4', false, [
    ['Verse', 'G D Em C'],
    ['Chorus', 'C G D Em | C G D'],
  ]),
  S('Flicker', 'Niall Horan', 'G', 0, 'Acoustic ballad 4/4', false, [
    ['Verse', 'G Em C D | G Em C'],
    ['Chorus', 'C D Em | C D G'],
  ]),

  // ── Ngọt ──
  S('Em dạo này', 'Ngọt', 'C', 0, 'Indie rock 4/4', false, [
    ['Verse', 'C Em Am F | C Em F G'],
    ['Chorus', 'F G Em Am | F G C'],
  ]),
  S('Thấy chưa', 'Ngọt', 'G', 0, 'Indie pop 4/4', false, [
    ['Verse', 'G Bm Em C | G Bm C D'],
    ['Chorus', 'C D Bm Em | C D G'],
  ]),
  S('Cho tôi đi theo', 'Ngọt', 'D', 0, 'Indie rock 4/4', false, [
    ['Verse', 'D A Bm G | D A G'],
    ['Chorus', 'G A F#m Bm | G A D'],
  ]),
  S('Lần cuối (đi bên em xót xa người ơi)', 'Ngọt', 'Am', 0, 'Rock ballad 4/4', false, [
    ['Verse', 'Am F C G | Am F G'],
    ['Chorus', 'F G C Am | F G Am'],
  ]),
  S('Xin lỗi', 'Ngọt', 'C', 0, 'Ballad 4/4', false, [
    ['Verse', 'C G Am Em | F C Dm G'],
    ['Chorus', 'F G Em Am | Dm G C'],
  ]),
  S('Em trong đầu', 'Ngọt', 'E', 0, 'Indie pop 4/4', false, [
    ['Verse', 'E G#m C#m A | E G#m A B'],
    ['Chorus', 'A B G#m C#m | A B E'],
  ]),
  S('Chuyện dở dang', 'Ngọt', 'G', 0, 'Ballad 4/4', false, [
    ['Verse', 'G D Em C | G D C'],
    ['Chorus', 'C D Bm Em | Am D G'],
  ]),
  S('Cá hồi', 'Ngọt', 'Dm', 0, 'Indie rock 4/4', false, [
    ['Verse', 'Dm Bb F C | Dm Bb C'],
    ['Chorus', 'Bb C F Dm | Bb C Dm'],
  ]),

  // ── Cá Hồi Hoang ──
  S('5AM', 'Cá Hồi Hoang', 'D', 0, 'Indie rock 4/4', false, [
    ['Verse', 'D Bm G A | D Bm G'],
    ['Chorus', 'G A F#m Bm | G A D'],
  ]),
  S('Điền vào ô trống (250)', 'Cá Hồi Hoang', 'Am', 0, 'Indie rock 4/4', false, [
    ['Verse', 'Am F C G | Am F G'],
    ['Chorus', 'F G Am | F G C'],
  ]),

  // ── Wren Evans ──
  S('Thích em hơi nhiều', 'Wren Evans', 'F', 0, 'R&B pop 4/4', false, [
    ['Verse', 'Fmaj7 Em7 Dm7 C'],
    ['Chorus', 'Bbmaj7 C Am7 Dm7 | Gm7 C F'],
  ]),
  S('Từng quen', 'Wren Evans', 'G', 0, 'Pop 4/4', false, [
    ['Verse', 'Gmaj7 Bm7 Em7 Cmaj7'],
    ['Chorus', 'Cmaj7 D Bm7 Em7 | Am7 D G'],
  ]),
  S('Bé ơi từ từ', 'Wren Evans', 'C', 0, 'Funk pop 4/4', false, [
    ['Verse', 'Cmaj7 Am7 Dm7 G7'],
    ['Chorus', 'Fmaj7 Em7 Am7 | Dm7 G7 C'],
  ]),
  S('Cầu Vĩnh Tuy', 'Wren Evans', 'Bb', 0, 'Pop 4/4', false, [
    ['Verse', 'Bbmaj7 Gm7 Cm7 F'],
    ['Chorus', 'Ebmaj7 F Dm7 Gm7 | Cm7 F Bb'],
  ]),
  S('Phóng zìn zìn', 'Wren Evans', 'Am', 0, 'Dance pop 4/4', false, [
    ['Verse', 'Am7 Dm7 | G7 Cmaj7'],
    ['Chorus', 'Fmaj7 G Em7 Am7'],
  ]),

  // ── Thịnh Suy ──
  S('Một đêm say', 'Thịnh Suy', 'C', 0, 'Ballad 4/4', false, [
    ['Verse', 'C Em Am F | C G F G'],
    ['Chorus', 'F G Em Am | Dm G C'],
  ]),
  S('Chết trong em', 'Thịnh Suy', 'Am', 0, 'Ballad 4/4', false, [
    ['Verse', 'Am F C G | Am F G'],
    ['Chorus', 'F G Em Am | Dm E Am'],
  ]),
  S('Mai mình xa', 'Thịnh Suy', 'G', 0, 'Ballad 4/4', false, [
    ['Verse', 'G Bm Em C | G D C D'],
    ['Chorus', 'C D Bm Em | Am D G'],
  ]),

  // ── Phương Mỹ Chi ──
  S('Vũ trụ cò bay', 'Phương Mỹ Chi', 'Am', 0, 'Pop dân gian đương đại 4/4', false, [
    ['Verse', 'Am G F G | Am G Am'],
    ['Chorus', 'F G C Am | F G Am'],
  ]),
  S('Đẩy xe bò', 'Phương Mỹ Chi', 'Dm', 0, 'Pop dân gian 4/4', false, [
    ['Verse', 'Dm C Bb A | Dm C Dm'],
    ['Chorus', 'Bb C F Dm | Bb A Dm'],
  ]),
  S('Bóng phù hoa', 'Phương Mỹ Chi', 'Em', 0, 'Ballad 4/4', false, [
    ['Verse', 'Em C G D | Em C D'],
    ['Chorus', 'C D G Em | C B7 Em'],
  ]),
  S('Duyên phận', 'Phương Mỹ Chi', 'Am', 0, 'Bolero 4/4', false, [
    ['Verse', 'Am Dm | G C | F Dm | E Am'],
    ['Chorus', 'Dm G | C Am | Dm E | Am'],
  ]),

  // ── Quái Vật Tí Hon ──
  S('Đường về', 'Quái Vật Tí Hon', 'D', 0, 'Indie folk 4/4', false, [
    ['Verse', 'D A Bm G | D A G'],
    ['Chorus', 'G A D Bm | G A D'],
  ]),

  // ── Bức Tường ──
  S('Tâm hồn của đá', 'Bức Tường', 'Em', 0, 'Rock ballad 4/4', false, [
    ['Verse', 'Em C G D | Em C D'],
    ['Chorus', 'C D G Em | C D Em'],
  ]),
  S('Bông hồng thủy tinh', 'Bức Tường', 'Am', 0, 'Rock ballad 4/4', false, [
    ['Verse', 'Am Dm G C | F Dm E Am'],
    ['Chorus', 'Dm G C Am | Dm E Am'],
  ]),
  S('Đèn đỏ', 'Bức Tường', 'Em', 0, 'Hard rock 4/4', false, [
    ['Verse', 'Em G | A Em'],
    ['Chorus', 'C D Em | C D B7'],
  ]),
  S('Con đường không tên', 'Bức Tường', 'Am', 0, 'Rock 4/4', false, [
    ['Verse', 'Am G F E | Am G F E'],
    ['Chorus', 'F G C Am | F G E'],
  ]),
  S('Cha và con', 'Bức Tường', 'G', 0, 'Rock ballad 4/4', false, [
    ['Verse', 'G D Em C | G D C D'],
    ['Chorus', 'C D G Em | C D G'],
  ]),
  S('Tiến về Sài Gòn', 'Bức Tường', 'D', 0, 'Rock hành khúc 4/4', false, [
    ['Verse', 'D G A D | D G A'],
    ['Chorus', 'G A D Bm | G A D'],
  ]),
]

// URL-safe id from title + artist, accents stripped ("Em dạo này" → "em-dao-nay-ngot").
export const fold = (s) =>
  String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase()
const slug = (s) => fold(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

const GAP = '\u00a0'.repeat(6)
// "C G Am F | C G F C" → chord-only lines the Sheet can render, one tappable chord per slot.
const toBody = (sections) =>
  sections
    .map(([name, chords]) => '# ' + name + '\n' + chords.split('|').map((ln) => ln.trim().split(/\s+/).map((c) => `[${c}]${GAP}`).join('')).join('\n'))
    .join('\n\n')

export const LIBRARY = LIBRARY_RAW.map((s) => ({
  ...s,
  id: slug(s.title + ' ' + s.artist),
  body: toBody(s.sections),
  youtube: 'https://www.youtube.com/results?search_query=' + encodeURIComponent(s.artist + ' ' + s.title),
}))

export const ARTISTS = [...new Set(LIBRARY.map((s) => s.artist))]

export const getLibrarySong = (id) => LIBRARY.find((s) => s.id === id) || null

export const searchLibrary = (q = '', artist = '') => {
  const term = fold(q.trim())
  return LIBRARY.filter(
    (s) => (!artist || s.artist === artist) && (!term || fold(s.title + ' ' + s.artist).includes(term)),
  )
}
