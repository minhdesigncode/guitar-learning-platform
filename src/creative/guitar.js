/**
 * Guitar: an acoustic guitar lying on its back, headstock away from the
 * viewer. The pointer, read on the plane of the strings, picks a string: it is
 * pulled up at the picking spot and takes the bright stroke, and its
 * neighbours follow less and less, staggered outwards from it. Over the body
 * the six strings share the body's width, so a hand drawn across it strums.
 * At rest the soundhole holds the bright stroke. The slider is the stagger.
 *
 * Local frame: a runs along the guitar from the bottom of the body (0) to the
 * tip of the headstock, b across it. World x = b, y = -a, so the headstock is
 * the far end and +b is the near side.
 */
const {
  Cam, clamp, facing, fillet, fit, hull, open, poly, proj, rrect, run, seg, unproj,
  tween, tset, tval, tdone, disposer, flatDot, mk, place, pointer, register,
} = HL;

const TOP = 24, BOARD = 26, NUT = 262, SADDLE = 38, TIP = 300, PICK = 66, LIFT = 18, STR = 27.5;
const FALL = [1, 0.55, 0.28, 0.12, 0.04, 0];
const NAMES = ["6·E", "5·A", "4·D", "3·G", "2·B", "1·e"];
const nutB = (i) => (i - 2.5) * 2.3, sadB = (i) => (i - 2.5) * 3.2;
const neckHW = (a) => 9 - ((a - 150) / (NUT - 150)) * 1.6;

/** Local [a, b] points (a closed loop) as ring samples in world space, each with its outward normal. */
function ring(pts) {
  const n = pts.length;
  let area = 0;
  for (let i = 0; i < n; i++) { const p = pts[i], q = pts[(i + 1) % n]; area += p[0] * q[1] - q[0] * p[1]; }
  const sg = area > 0 ? 1 : -1;
  return pts.map((p, i) => {
    const q = pts[(i + 1) % n], o = pts[(i + n - 1) % n];
    let na = sg * (q[1] - o[1]), nb = -sg * (q[0] - o[0]);
    const l = Math.hypot(na, nb) || 1; na /= l; nb /= l;
    return { u: p[1], v: -p[0], nu: nb, nv: -na, a: p[0], b: p[1] };
  });
}
/** A ring of a rounded rectangle in the local frame. */
const lrect = (a0, b0, a1, b1, r) => ring(rrect(a0, b0, a1, b1, r, 4).map((q) => [q.u, q.v]));
/** Pushes each sample of a ring in by d, along its normal. */
const inset = (rg, d) => ring(rg.map((q) => [q.a + d * q.nv, q.b - d * q.nu]));

/** The body's outline: an hourglass of cubics, lower bout, waist, upper bout. */
function bodyOutline() {
  const s = 0.337, at = (x, y) => [(840 - y) * s, (x - 200) * s];
  const cubics = [
    [[200, 395], [255, 395], [318, 410], [318, 470]], [[318, 470], [318, 520], [285, 540], [285, 575]],
    [[285, 575], [285, 615], [350, 640], [350, 720]], [[350, 720], [350, 800], [285, 840], [200, 840]],
  ];
  const half = [];
  for (const [p0, p1, p2, p3] of cubics) for (let k = 0; k < 14; k++) {
    const t = k / 14, u = 1 - t, w = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
    half.push(at(w[0] * p0[0] + w[1] * p1[0] + w[2] * p2[0] + w[3] * p3[0], w[0] * p0[1] + w[1] * p1[1] + w[2] * p2[1] + w[3] * p3[1]));
  }
  const other = half.slice(1).reverse().map(([a, b]) => [a, -b]);
  return half.concat([[0, 0]], other.slice(0, -1)).filter((p, i, arr) => i === 0 || Math.hypot(p[0] - arr[i - 1][0], p[1] - arr[i - 1][1]) > 0.2);
}

/** The width of the body at a, read from its outline. */
function widthAt(pts) {
  const w = new Float32Array(151);
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], q = pts[(i + 1) % pts.length];
    for (let a = Math.ceil(Math.min(p[0], q[0])); a <= Math.floor(Math.max(p[0], q[0])) && a <= 150; a++) {
      const t = q[0] === p[0] ? 0 : (a - p[0]) / (q[0] - p[0]);
      w[a] = Math.max(w[a], Math.abs(p[1] + t * (q[1] - p[1])));
    }
  }
  return (a) => (a < 0 || a > 150 ? 0 : w[Math.round(a)]);
}

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let stag = value;

  const C = Cam(45, 0.5, 1.3);
  const body = bodyOutline(), bw = widthAt(body);
  const ext = body.flatMap(([a, b]) => [[b, -a, 0], [b, -a, TOP]]).concat([[11, -TIP, 26], [-11, -TIP, 20], [0, -PICK, STR + LIFT]]);
  fit(C, ext, 200, 166);
  const P = proj(C), front = facing(C), W = (a, b, z) => P(b, -a, z);
  const at = (rg, z) => rg.map((q) => W(q.a, q.b, typeof z === "function" ? z(q.a) : z));
  const g = mk("g", {}, svg), path = (d, cls, parent = g) => mk("path", { d, class: cls }, parent);

  // the headstock, angled back from the nut, and its tuners: far pegs behind it, near pegs in front
  const headZ = (a) => BOARD - ((a - NUT) / (TIP - NUT)) * 5;
  const head = ring(fillet([[NUT - 2, -8], [TIP, -11], [TIP, 11], [NUT - 2, 8]], [1, 4, 4, 1]));
  const posts = [0, 1, 2].map((k) => NUT + 10 + k * 10);
  const peg = (a, sd) => {
    const z = headZ(a) - 1.8;
    path(seg(W(a, sd * 11, z), W(a, sd * 15, z)), "nf");
    path(poly(at(lrect(a - 2.6, Math.min(sd * 15, sd * 19), a + 2.6, Math.max(sd * 15, sd * 19), 1.4), z)), "");
  };
  posts.forEach((a) => peg(a, -1));
  path(poly(hull(at(head, headZ).concat(at(head, (a) => headZ(a) - 3.5)))), "sil");
  path(open(at(run(inset(head, 1.2), front), headZ)), "nf lo");
  posts.forEach((a) => peg(a, 1));
  const postDots = [-1, 1].flatMap((sd) => posts.map((a) => ({ a, b: sd * 5 })));
  postDots.forEach((q) => place(flatDot(g, C, 1, "dot off"), W(q.a, q.b, headZ(q.a))));

  // the neck, then the body over its heel, then the fingerboard running on over the body
  const neck = ring([[150, -9], [NUT, -7.4], [NUT, 7.4], [150, 9]]);
  path(poly(hull(at(neck, 15).concat(at(neck, BOARD)))), "sil");
  path(open(at(run(inset(neck, 0.8), front), BOARD)), "nf lo");
  path(seg(W(NUT, -7.4, BOARD + 1), W(NUT, 7.4, BOARD + 1)), "nf");

  const br = ring(body), near = run(br, front), far = run(br, (q) => !front(q));
  path(poly(at(far, TOP).concat(at(near, 0))), "sil");
  path(open(at(run(inset(br, 1.6), front), TOP)), "nf lo");

  const board = ring([[118, -9.4], [151, -9], [151, 9], [118, 9.4]]);
  path(poly(hull(at(board, TOP).concat(at(board, BOARD)))), "");
  const fret = (n) => NUT - (NUT - SADDLE) * (1 - 2 ** (-n / 12));
  let frets = "";
  for (let n = 1; n <= 18; n++) { const a = fret(n), hw = a < 150 ? 9 : neckHW(a); frets += seg(W(a, -hw, BOARD), W(a, hw, BOARD)); }
  path(frets, "nf lo");
  for (const [n, b] of [[3, 0], [5, 0], [7, 0], [9, 0], [12, -3.4], [12, 3.4], [15, 0]])
    place(flatDot(g, C, 0.9, "dot off"), W((fret(n) + fret(n - 1)) / 2, b, BOARD));

  // the top: soundhole and rosette, a pickguard, the bridge with its saddle and pins
  const circle = (r) => ring(Array.from({ length: 48 }, (_, k) => [101 + r * Math.cos((k / 48) * 2 * Math.PI), r * Math.sin((k / 48) * 2 * Math.PI)]));
  path(poly(at(circle(18), TOP)), "nf lo");
  const hole = path(poly(at(circle(14), TOP)), "nf");
  path(poly(at(ring(fillet([[80, 15], [113, 16], [109, 29], [90, 33], [78, 25]], [3, 6, 8, 8, 6])), TOP)), "nf lo");
  const bridge = lrect(32, -17, 46, 17, 4);
  path(poly(hull(at(bridge, TOP).concat(at(bridge, TOP + 3)))), "sil");
  path(open(at(run(inset(bridge, 1), front), TOP + 3)), "nf lo");
  path(seg(W(SADDLE, -9.5, TOP + 3.5), W(SADDLE, 9.5, TOP + 3.5)), "nf");
  for (let i = 0; i < 6; i++) place(flatDot(g, C, 0.8, "dot m"), W(43, sadB(i), TOP + 3));

  // the strings: post to nut stays put; nut to saddle bends up at the picking spot
  const tails = [0, 1, 2, 3, 4, 5].map((i) => { const q = postDots[i < 3 ? 2 - i : i]; return seg(W(q.a, q.b, headZ(q.a)), W(NUT, nutB(i), BOARD + 1)); });
  path(tails.join(""), "nf lo");
  const strings = [0, 1, 2, 3, 4, 5].map((i) => ({
    drop: path("", "dash"), line: path("", "nf"), tw: tween(0), drawn: NaN,
    b: (a) => sadB(i) + ((a - SADDLE) / (NUT - SADDLE)) * (nutB(i) - sadB(i)),
  }));
  const draw = (s, lift) => {
    if (lift === s.drawn) return;
    s.drawn = lift;
    const pb = s.b(PICK), z = (a) => STR - ((a - SADDLE) / (NUT - SADDLE)) * (STR - BOARD - 1);
    s.line.setAttribute("d", open([W(SADDLE, s.b(SADDLE), STR), W(PICK, pb, z(PICK) + lift), W(NUT, s.b(NUT), BOARD + 1)]));
    s.drop.setAttribute("d", lift > 0.5 ? seg(W(PICK, pb, z(PICK) + lift), W(PICK, pb, TOP)) : "");
  };

  const B = register(stage, (_dt, now) => {
    let moving = false;
    for (const s of strings) { draw(s, tval(s.tw, now)); if (!tdone(s.tw, now)) moving = true; }
    return moving;
  });
  bag.add(B.unregister);

  /** The string under a viewBox point, read on the resting plane of the strings: -1 off the guitar. */
  function hit(p) {
    const [x, y] = unproj(C, p[0], p[1], STR), a = -y, b = x;
    const hw = a >= 0 && a <= 150 ? Math.max(bw(a), 9) : a > 150 && a <= NUT + 4 ? neckHW(a) + 2 : 0;
    if (!hw || Math.abs(b) > hw) return -1;
    return clamp(Math.round(((b / hw + 1) / 2) * 5), 0, 5);
  }

  let act = -1;
  hole.classList.add("hi");
  function setActive(i) {
    if (i === act) return;
    const now = performance.now(), from = i >= 0 ? i : act;
    act = i;
    strings.forEach((s, k) => {
      tset(s.tw, i < 0 ? 0 : LIFT * FALL[Math.abs(k - i)], now, Math.abs(k - from) * stag);
      s.line.classList.toggle("hi", k === i);
    });
    hole.classList.toggle("hi", i < 0);
    read.textContent = i < 0 ? "rest" : NAMES[i];
    B.wake();
  }

  bag.add(pointer(stage, { move: (p) => setActive(hit(p)), leave: () => setActive(-1) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { stag = v; }, destroy: bag.dispose };
}

hairline({
  name: "guitar",
  means: "An acoustic guitar on its back: the string under the pointer is plucked, and its neighbours ring after it.",
  rules: [1, 2, 4, 6],
  range: [0, 40, 90],
  tour: [[107, 170], [130, 181], [153, 193], null],
  mount,
});
