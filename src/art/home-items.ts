/* Home decor art: the bear's little room.
   Each item is drawn relative to its HOME_ANCHOR slot (see layout.ts):
   window = centre (curtains frame a ~100x90 window), wall = centre,
   bed = bed anchor (quilt over the mattress), rug = centre flat,
   corner / pet = bottom-centre. */
import type { HomeItemId, HomeSlot, ThemeId } from '../types';
import { INK, EYE, CREAM, fl, ln, sh, blob, box, shadow, tinyFace, standalone, g } from './kit';

const BLUSH = '#f4a9a8', SAGE = '#8fc3a7', MUSTARD = '#f6cf6b', SKY = '#9dbbe6';
const BERRY = '#e2607a', WOOD = '#c98d63', WOOD_D = '#a8714d', GOLD = '#f0c34a';
const LEAF_D = '#7db596', GINGER = '#f4b26b', NAVY = '#56679c';

const r = (n: number) => +n.toFixed(2);
const dot = (x: number, y: number, rad: number, fill: string, op = 1) =>
  `<circle cx="${x}" cy="${y}" r="${rad}" fill="${fill}"${op < 1 ? ` opacity="${op}"` : ''}/>`;

/** Many little circles as one path (for lace holes, pebbles, bubbles...). */
const circles = (pts: [number, number][], rad: number) =>
  pts.map(([x, y]) => `M${r(x - rad)},${y} a${rad},${rad} 0 1,0 ${r(rad * 2)},0 a${rad},${rad} 0 1,0 ${r(-rad * 2)},0`).join(' ');

/** Dashed stitch line (crochet / quilting). */
const stitch = (d: string, color = INK, w = 1.1, op = 0.55) =>
  `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-dasharray="2.6 2.6" stroke-linecap="round" opacity="${op}"/>`;

/** Heart path centred at (cx, cy); s = 1 is about 22 units wide. */
function heartPath(cx: number, cy: number, s: number): string {
  const p = (x: number, y: number) => `${r(cx + x * s)},${r(cy + y * s)}`;
  return `M${p(0, 10.5)} C${p(-10, 4)} ${p(-12.5, -1.5)} ${p(-11, -5.5)} C${p(-9.5, -10)} ${p(-3.5, -11)} ${p(0, -5.5)} `
    + `C${p(3.5, -11)} ${p(9.5, -10)} ${p(11, -5.5)} C${p(12.5, -1.5)} ${p(10, 4)} ${p(0, 10.5)}z`;
}

/** Five-point star with softly rounded tips. */
function starPath(cx: number, cy: number, R: number, ri = R * 0.48): string {
  const pol = (rad: number, deg: number): [number, number] => {
    const a = (deg * Math.PI) / 180;
    return [r(cx + Math.cos(a) * rad), r(cy + Math.sin(a) * rad)];
  };
  const tips = [0, 1, 2, 3, 4].map((k) => pol(R, -90 + 72 * k));
  const ins = [0, 1, 2, 3, 4].map((k) => pol(ri, -54 + 72 * k));
  const lerp = (a: [number, number], b: [number, number], t: number) => `${r(a[0] + (b[0] - a[0]) * t)},${r(a[1] + (b[1] - a[1]) * t)}`;
  let d = `M${ins[4][0]},${ins[4][1]}`;
  for (let k = 0; k < 5; k++) {
    const prev = k === 0 ? ins[4] : ins[k - 1];
    d += ` L${lerp(prev, tips[k], 0.8)} Q${tips[k][0]},${tips[k][1]} ${lerp(tips[k], ins[k], 0.2)} L${ins[k][0]},${ins[k][1]}`;
  }
  return d + 'z';
}
const stars = (pts: [number, number, number][]) => pts.map(([x, y, R]) => starPath(x, y, R)).join(' ');

/** Scalloped ellipse outline (crochet edge / cloud puffs). */
function scallop(rx: number, ry: number, n: number, bump: number, phase = 0): string {
  const pt = (a: number, k: number) => `${r(Math.cos(a) * rx * k)},${r(Math.sin(a) * ry * k)}`;
  let d = `M${pt(phase, 1)}`;
  for (let i = 0; i < n; i++) {
    const a = phase + (i * 2 * Math.PI) / n, step = (2 * Math.PI) / n;
    d += ` Q${pt(a + step / 2, 1 + bump)} ${pt(a + step, 1)}`;
  }
  return d + 'z';
}

/** Little leaf from base (bx,by) to tip (tx,ty), w = half width. */
function leaf(bx: number, by: number, tx: number, ty: number, w: number): string {
  const dx = tx - bx, dy = ty - by, len = Math.hypot(dx, dy) || 1;
  const nx = (-dy / len) * w, ny = (dx / len) * w;
  const p = (t: number, s: number) => `${r(bx + dx * t + nx * s)},${r(by + dy * t + ny * s)}`;
  return `M${bx},${by} C${p(0.3, 1.5)} ${p(0.75, 1.1)} ${tx},${ty} C${p(0.7, -1.2)} ${p(0.3, -1.4)} ${bx},${by}z`;
}

/** Small seasonal touch (max 4 elements). */
function accent(theme: ThemeId, x: number, y: number): string {
  if (theme === 'christmas')
    return sh(`M${x},${y} c-3,-4 -7,-3 -8,0 c3,0 5,2 8,0z M${x},${y} c3,-4 7,-3 8,0 c-3,0 -5,2 -8,0z`, SAGE, 1.3)
      + sh(blob(x, y, 1.9, 1.9), BERRY, 1.2);
  if (theme === 'halloween')
    return sh(blob(x, y, 4.4, 3.5, 0.2), '#f2a65a', 1.5) + ln(`M${x},${y - 3.4} q1,-1.6 2.4,-2`, 1.4, '#7a9a5a');
  if (theme === 'spring') return sh(blob(x, y, 3, 3), BLUSH, 1.3) + dot(x, y, 1.1, MUSTARD);
  if (theme === 'summer')
    return sh(`M${x - 5},${y - 1} C${x - 4},${y + 4} ${x + 4},${y + 4} ${x + 5},${y - 1}z`, '#f08a8a', 1.3)
      + ln(`M${x - 4.6},${y - 0.4} C${x - 3},${y + 2.2} ${x + 3},${y + 2.2} ${x + 4.6},${y - 0.4}`, 1.2, '#7cc08f');
  return '';
}

/** Hanging string + nail above a frame. */
const hanger = (y: number, h = 6) => ln(`M-9,${y} L0,${y - h} L9,${y}`, 1.3) + dot(0, y - h, 1.6, INK);

/* -------------------------------- wall -------------------------------- */

function posterCoffee(theme: ThemeId): string {
  let s = hanger(-22);
  s += sh(box(-22, -23, 44, 49, 4, 1), WOOD);
  s += sh(box(-17, -18, 34, 39, 2, 0.6), CREAM, 1.6);
  s += fl(box(-16, -17, 32, 19, 2, 0.4), BLUSH, 0.45);
  s += fl(heartPath(-11, -12, 0.17), BERRY) + fl(heartPath(11, -12, 0.17), BERRY);
  // steam
  s += ln('M-3,-4 c-2,-2.4 1.5,-3.6 0,-7', 1.2) + ln('M3,-4 c-2,-2.4 1.5,-3.6 0,-7', 1.2);
  // latte
  s += sh(blob(0, 12.5, 12, 2.6), SKY, 1.6);
  s += ln('M8.4,2.4 c4.6,-1 5.4,5.4 -0.6,6.2', 1.6);
  s += sh('M-9,0 C-3,-1 3,-1 9,0 C9,7 6,11 0,11 C-6,11 -9,7 -9,0z', BLUSH, 1.8);
  s += sh(blob(0, 0, 8.6, 2.3), '#e9c9a4', 1.3);
  s += fl(heartPath(-0.8, 0.2, 0.17), CREAM);
  s += ln('M-9,17.4 h18', 1.1, WOOD_D);
  s += accent(theme, 17, 21);
  return s;
}

function photoMom(theme: ThemeId): string {
  const FUR = '#f3e1c6';
  let s = hanger(-21);
  s += sh(box(-17, -22, 34, 44, 6, 1), WOOD_D);
  s += sh(box(-13, -17, 26, 34, 3, 0.6), '#d6e6f5', 1.6);
  // cardigan shoulders + pearls
  s += sh('M-12.4,16.4 C-12,9 -6,7.6 0,7.6 C6,7.6 12,9 12.4,16.4z', BLUSH, 1.8);
  s += fl(circles([[-4, 10], [-1.4, 11], [1.4, 11], [4, 10]], 1), CREAM);
  // ears, head, muzzle
  s += sh(blob(-7.4, -9, 3.2, 3.2), FUR, 1.6) + sh(blob(7.4, -9, 3.2, 3.2), FUR, 1.6);
  s += sh(blob(0, -1.5, 10, 8.8, 0.1), FUR, 1.8);
  s += sh(blob(0, 3.2, 3.6, 2.5), CREAM, 1.2);
  s += dot(0, 2.2, 1.1, EYE) + ln('M-1.6,4.4 q1.6,1.4 3.2,0', 1, EYE);
  // glasses + eyes
  s += dot(-4, -2.2, 1, EYE) + dot(4, -2.2, 1, EYE);
  s += ln(`${blob(-4, -2.2, 3, 2.6)} ${blob(4, -2.2, 3, 2.6)} M-1,-2.6 h2`, 1.1);
  s += dot(-7.4, 1.6, 1.4, BLUSH, 0.8) + dot(7.4, 1.6, 1.4, BLUSH, 0.8);
  // little heart on the frame
  s += sh(heartPath(0, 19.6, 0.17), BERRY, 1.1);
  s += accent(theme, -14, -19);
  return s;
}

/* ------------------------------- window ------------------------------- */

const CURTAIN = 'M-72,-49 C-60,-50 -48,-49 -38,-49 C-40,-24 -50,-2 -57,10 C-51,24 -46,42 -46,57 C-55,59 -64,58 -73,57 C-71,40 -69,24 -67,10 C-70,-10 -72,-30 -72,-49z';
const FOLDS = 'M-63,-47 C-63,-28 -63,-10 -63,6 M-52,-47 C-55,-28 -58,-10 -60,6 M-64,14 C-65,30 -67,44 -68,55 M-60,14 C-58,30 -56,44 -55,55';

function hem(): string {
  let d = 'M-73,57.4';
  for (let i = 0; i < 6; i++) d += ' q2.25,3.6 4.5,0';
  return d;
}

function bow(x: number, y: number, color: string): string {
  return sh(`M${x},${y} C${x - 4},${y - 6} ${x - 10},${y - 4} ${x - 8},${y} C${x - 7},${y + 3} ${x - 3},${y + 2} ${x},${y}z `
    + `M${x},${y} C${x + 4},${y - 6} ${x + 10},${y - 4} ${x + 8},${y} C${x + 7},${y + 3} ${x + 3},${y + 2} ${x},${y}z`, color, 1.5)
    + sh(`M${x - 1},${y + 1} L${x - 4},${y + 9} L${x - 1.4},${y + 8}z M${x + 1},${y + 1} L${x + 4},${y + 9} L${x + 1.4},${y + 8}z`, color, 1.3)
    + sh(blob(x, y, 1.9, 1.9), color, 1.3);
}

function valance(fill: string): string {
  let d = 'M-74,-58 C-30,-60 30,-56 74,-58 L74,-46';
  for (let i = 0; i < 12; i++) d += ' q-6.17,7 -12.33,0';
  return sh(d + 'z', fill, 2.2);
}

function curtainsLace(theme: ThemeId): string {
  const rib = theme === 'christmas' ? BERRY : theme === 'halloween' ? '#f2a65a' : theme === 'summer' ? '#7cc4dc' : BLUSH;
  const LACE = '#fffdf8';
  const side = sh(CURTAIN, LACE, 2.2) + ln(FOLDS, 1.1, '#cdb8a8')
    + fl(circles([[-66, -40], [-56, -30], [-64, -18], [-57, -6], [-66, 26], [-58, 36], [-64, 46], [-54, 48]], 1.3), '#e6d6c8')
    + ln(hem(), 1.4) + bow(-61, 10, rib);
  let s = side + g('scale(-1,1)', side);
  s += valance(LACE);
  s += fl(circles([-68, -56, -44, -32, -20, -8, 4, 16, 28, 40, 52, 64].map((x) => [x + 2, -47.5] as [number, number]), 1.4), '#e6d6c8');
  s += ln('M-72,-53 C-30,-54.4 30,-51.4 72,-53', 2.4, rib);
  s += bow(0, -53, rib);
  return s;
}

function curtainsStars(theme: ThemeId): string {
  const star = theme === 'christmas' ? '#f7f1e3' : GOLD;
  const side = sh(CURTAIN, NAVY, 2.2) + ln(FOLDS, 1.1, '#3d4a78')
    + sh(stars([[-62, -38, 3.4], [-50, -26, 2.6], [-64, -14, 2.8], [-58, 26, 3.2], [-66, 42, 2.6], [-54, 48, 2.4]]), star, 1.1)
    + ln('M-73,9 C-67,14 -60,14 -55,9', 3.8) + ln('M-73,9 C-67,14 -60,14 -55,9', 2, GOLD)
    + sh('M-62,13 C-64,16 -65,20 -65,23 C-63,24 -59,24 -57,23 C-57,20 -58,16 -60,13z', GOLD, 1.4);
  let s = side + g('scale(-1,1)', side);
  s += valance(NAVY);
  s += sh(stars([[-52, -52, 2.6], [-30, -51, 2.2], [30, -51, 2.2], [52, -52, 2.6]]), star, 1);
  s += sh('M3,-58.4 C-3,-58 -6,-53 -4.6,-49.6 C-3,-46.4 1.6,-45.2 4.6,-47 C1,-47.4 -1.4,-50.6 -0.4,-54 C0.2,-56 1.4,-57.6 3,-58.4z', GOLD, 1.4);
  return s;
}

/* -------------------------------- bed --------------------------------- */

const QUILT = 'M-46,-38 C-20,-41 30,-40 66,-37 C70,-30 71,-18 69,-9 C50,-6 30,-10 10,-7 C-10,-5 -30,-9 -46,-7 C-47,-18 -47,-28 -46,-38z';
const FOLD = 'M-58,-37 C-54,-39 -48,-39 -44,-38 C-45,-28 -45,-18 -44,-7 C-49,-6 -54,-6 -58,-8 C-59,-18 -59,-28 -58,-37z';

function quiltHearts(theme: ThemeId): string {
  const heartCol = theme === 'halloween' ? '#f2a65a' : theme === 'christmas' ? '#d94c5c' : BERRY;
  const cols = [-44, -26, -6, 14, 34, 54, 68];
  let s = fl(QUILT, '#f7cbc8');
  const patch = ['#f9dc94', '#b9dcc6', '#c3d5f0', CREAM];
  let k = 0;
  for (let c = 0; c < 6; c++) {
    const top = c % 2 === 1;
    const x0 = cols[c] + 1, w = cols[c + 1] - cols[c] - 1;
    s += fl(top ? `M${x0},-38 h${w} v14 h${-w}z` : `M${x0},-23 h${w} v13 h${-w}z`, patch[k++ % 4]);
  }
  s += sh([heartPath(-35, -31, 0.28), heartPath(4, -31, 0.28), heartPath(44, -31, 0.28), heartPath(-16, -16, 0.28), heartPath(24, -16, 0.28), heartPath(61, -16, 0.24)].join(' '), heartCol, 1.2);
  s += ln('M-26,-39 C-26,-28 -26,-18 -26,-8 M-6,-39 V-6 M14,-39 V-7 M34,-39 V-8 M54,-38 V-8 M-46,-23.5 C-10,-24.5 30,-23 69,-23.5', 1.2, '#c99a92');
  s += stitch('M-44,-36 C-10,-38.6 30,-37.6 64,-35.4 M-44,-10 C-20,-11.4 30,-12 66,-11.6');
  s += ln(QUILT);
  s += ln('M-46,-7 C-30,-9 -10,-5 10,-7 C30,-10 50,-6 69,-9', 1);
  s += sh(FOLD, CREAM, 2.2);
  s += fl(heartPath(-51, -22, 0.2), BLUSH);
  s += stitch('M-55.5,-35 C-56.5,-24 -56.5,-16 -55.5,-10');
  return s;
}

function quiltStars(theme: ThemeId): string {
  const star = theme === 'halloween' ? '#f2a65a' : theme === 'summer' ? '#ffe28a' : MUSTARD;
  let s = fl(QUILT, '#a9c4ea');
  s += fl('M-45,-28 C-20,-31 20,-26 68,-30 L69,-22 C30,-18 -10,-24 -46,-20z', '#c3d5f0');
  s += fl('M-46,-15 C-10,-18 30,-12 69,-16 L69,-11 C40,-8 0,-12 -46,-9z', '#c3d5f0', 0.8);
  s += stitch('M-40,-38 L-14,-8 M-14,-39 L12,-7 M12,-39 L38,-9 M38,-39 L62,-8 M-40,-8 L-14,-39 M-14,-7 L12,-39 M12,-8 L38,-39 M38,-8 L64,-37', '#4a5a8c', 1, 0.4);
  s += sh(stars([[-30, -30, 4.6], [-6, -18, 3.6], [18, -31, 4.2], [42, -18, 4.6], [60, -30, 3.4], [-36, -14, 3], [28, -14, 2.6]]), star, 1.2);
  s += ln(QUILT);
  s += ln('M-46,-7 C-30,-9 -10,-5 10,-7 C30,-10 50,-6 69,-9', 1);
  s += sh(FOLD, CREAM, 2.2);
  s += fl(circles([[-53, -32], [-49, -26], [-53, -20], [-49, -14]], 1.2), SKY);
  s += sh('M8,-38 C3,-37.6 1,-34 2,-31 C3,-28.4 6.4,-27.6 9,-28.8 C6,-29.4 4.8,-32 5.6,-34.6 C6,-36 7,-37.4 8,-38z', '#fbe39a', 1.2);
  return s;
}

/* -------------------------------- rug --------------------------------- */

function rugRound(theme: ThemeId): string {
  const centre = theme === 'christmas' ? BERRY : theme === 'halloween' ? '#f2a65a' : theme === 'spring' ? '#c7e6c0' : theme === 'summer' ? '#bfe3ef' : SKY;
  let s = shadow(0, 3, 72, 6, 0.1);
  s += sh(scallop(68, 24, 24, 0.09), BLUSH);
  s += fl(circles([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => {
    const a = (i * Math.PI) / 6 + 0.13;
    return [r(Math.cos(a) * 66), r(Math.sin(a) * 23.2)] as [number, number];
  }), 1.5), CREAM);
  s += sh(blob(0, 0, 57, 19.5), CREAM, 2);
  s += stitch(blob(0, 0, 51, 17.2), WOOD_D);
  s += sh(blob(0, 0, 44, 15, -0.1), SAGE, 1.8);
  s += stitch(blob(0, 0, 38.5, 13), '#4f7d63');
  s += sh(blob(0, 0, 31, 10.6, 0.1), MUSTARD, 1.8);
  s += stitch(blob(0, 0, 25, 8.4), WOOD_D);
  s += sh(blob(0, 0, 17, 5.8), centre, 1.6);
  s += sh(heartPath(0, 0, 0.26), CREAM, 1.2);
  return s;
}

function rugCloud(theme: ThemeId): string {
  let s = shadow(0, 3, 70, 6, 0.1);
  s += sh(scallop(60, 20, 11, 0.2, 0.2), '#f2f5fc');
  s += fl(scallop(46, 14.5, 10, 0.16, 0.5), '#e2eaf8');
  s += stitch(scallop(52, 17, 11, 0.16, 0.2), '#8ea4cf', 1.1, 0.7);
  s += ln('M-44,-3 q2.5,-2.4 5,0 M34,5 q2.5,-2.4 5,0 M-26,9 q2.5,-2.4 5,0 M22,-10 q2.5,-2.4 5,0', 1.2, '#a9b8d8');
  s += tinyFace(0, -1, 1.4);
  s += sh(heartPath(-30, -6, 0.22), BLUSH, 1.1) + sh(starPath(32, -4, 3.6), theme === 'halloween' ? '#f2a65a' : MUSTARD, 1.1);
  return s;
}

/* ------------------------------- corner ------------------------------- */

function plantBig(theme: ThemeId): string {
  let s = shadow(0, 0, 16, 3);
  const leaves: [number, number, number, number, number][] = [
    [-1, -40, -19, -50, 4.5], [1, -44, 19, -56, 4.5], [0, -30, -17, -72, 5.5], [0, -32, 17, -76, 5.5],
    [0, -50, -10, -84, 4.5], [0, -28, 1, -89, 6], [0, -54, 12, -86, 4],
  ];
  s += ln('M0,-28 C-1,-50 1,-70 0,-86', 1.8);
  leaves.forEach(([bx, by, tx, ty, w], i) => { s += sh(leaf(bx, by, tx, ty, w), i % 2 ? LEAF_D : SAGE, 2); });
  s += ln(leaves.map(([bx, by, tx, ty]) => `M${bx},${by} Q${r((bx + tx) / 2 + (tx > bx ? -2 : 2))},${r((by + ty) / 2)} ${r(bx + (tx - bx) * 0.85)},${r(by + (ty - by) * 0.85)}`).join(' '), 1, '#4f7d63');
  s += sh('M-13,-24 h26 l-3,22 C5,0 -5,0 -10,-2z', '#e9a58f');
  s += sh(box(-15, -29, 30, 6, 2, 0.4), '#f2bba8', 2);
  s += tinyFace(0, -13, 0.85);
  s += accent(theme, -12, -60);
  return s;
}

function lampMoon(theme: ThemeId): string {
  const moon = theme === 'halloween' ? '#f7c27a' : '#fbe39a';
  let s = dot(0, -74, 20, MUSTARD, 0.2) + dot(2, -74, 13, '#ffe7a8', 0.4);
  s += shadow(0, 0, 14, 3);
  s += sh(blob(0, -3, 11, 3.2), WOOD_D, 2);
  s += ln('M0,-5 L0,-60', 4.2) + ln('M0,-6 L0,-60', 2, WOOD);
  s += ln('M-2,-32 q2,2 4,0', 1.2, BERRY);
  s += sh(blob(3.6, -73.5, 4.4, 5.2), '#fff6d4', 1.6);
  s += sh('M5,-89 C-8,-90 -16,-80 -15,-72 C-14,-63 -6,-58 4,-59 C-4,-62 -8,-68 -8,-74 C-8,-81 -3,-87 5,-89z', moon);
  s += ln('M-13.4,-76 q2,2 4,0', 1.4, EYE) + dot(-11, -71, 1.5, BLUSH, 0.8);
  s += ln('M5,-89 Q12,-88.6 12,-83', 1);
  s += sh(starPath(12, -79.4, 3.8), theme === 'christmas' ? BERRY : GOLD, 1.2);
  s += ln('M15,-66 v4 M13,-64 h4 M-17,-88 v3 M-18.5,-86.5 h3', 1.2, '#e8b85a');
  return s;
}

/* --------------------------------- pet -------------------------------- */

function fishbowl(theme: ThemeId): string {
  const BOWL = 'M-8,-37 C-20,-34 -20,-12 -10,-10 C-4,-8.6 4,-8.6 10,-10 C20,-12 20,-34 8,-37';
  let s = shadow(0, 0, 16, 2.6);
  s += ln('M-10,-6 L-12,-0.6', 3.2) + ln('M10,-6 L12,-0.6', 3.2);
  s += sh(box(-14, -10, 28, 4.4, 2, 0.4), WOOD, 1.8);
  s += fl(BOWL, '#e3f2fb', 0.85);
  s += fl('M-16.2,-28 C-8,-30.4 8,-26.4 16.2,-28 C17,-20 12.6,-11 0,-10.4 C-12.6,-11 -17,-20 -16.2,-28z', '#a9d3ee', 0.85);
  s += fl(circles([[-8, -12.6], [-4, -11.6], [5, -11.8], [9, -13]], 1.7), '#e9c9a4');
  s += ln('M-9,-12 C-10,-16 -7,-19 -9,-22 M-9,-15 q2,-1.4 2.4,-3.4', 1.4, '#4f9a72');
  // fish
  s += sh('M-2.4,-21 L-8,-25 C-7,-22 -7,-20 -8,-16.6z', '#f6a05a', 1.5);
  s += sh(blob(2.6, -21, 6, 4, 0.2), '#f6a05a', 1.6);
  s += ln('M1.6,-24.4 q1.4,-2 3,-1.6', 1.2) + dot(5.6, -22, 1, EYE) + dot(3.6, -19.4, 1, BLUSH);
  s += ln(circles([[10, -29], [11.6, -33.2]], 1.2) + ' ' + circles([[8.6, -25.6]], 0.8), 1);
  s += ln('M-16.2,-28 C-8,-30.4 8,-26.4 16.2,-28', 1.2, '#6aa6cf');
  s += ln(BOWL);
  s += sh(blob(0, -37.2, 8.6, 2), '#eef7fd', 1.6);
  s += ln('M-12.6,-26 C-12.6,-31 -10,-33 -7.6,-33.6', 1.6, '#ffffff');
  s += accent(theme, 13, -7);
  return s;
}

function kitten(theme: ThemeId): string {
  const BASKET = '#e2b27e';
  let s = shadow(0, 0, 24, 3);
  s += fl(blob(0, -18, 23, 4.5), '#b98552');
  // curled body + stripes
  s += sh('M-6,-20 C-8,-30 6,-33 14,-31 C21,-29 23,-22 20,-18 C12,-15 -2,-16 -6,-20z', GINGER);
  s += ln('M5,-31.4 q2,3 0,6 M11,-31 q2,3 0,6 M16.6,-29 q1.6,2.4 0,5', 1.3, '#d98a45');
  // head with ears
  s += sh('M-18,-23 C-19,-29 -16,-33 -13,-33 L-14,-38 L-9,-34 C-7,-34.5 -5,-34 -4,-33.5 L-1,-37.5 L-0.5,-31 C1,-27 -1,-21 -7,-20 C-12,-19 -17,-19.5 -18,-23z', GINGER);
  s += fl('M-12.6,-34 l-0.6,-2.4 l2.2,1.6z M-3.4,-34 l1.2,-2 l0.2,2.4z', BLUSH);
  s += ln('M-10,-33.4 l0.6,2.4 M-7.4,-33.6 l-0.4,2.4', 1.1, '#d98a45');
  s += ln('M-14.6,-26 q1.5,1.5 3,0 M-7.4,-26 q1.5,1.5 3,0', 1.3, EYE);
  s += ln('M-10,-23.6 q0.9,0.9 1.8,0', 1, EYE);
  s += dot(-16, -23.4, 1.5, BLUSH, 0.85) + dot(-2.6, -23.4, 1.5, BLUSH, 0.85);
  // basket front
  s += sh('M-23,-13 C-12,-9 12,-9 23,-13 C21,-5 15,-1 0,-1 C-15,-1 -21,-5 -23,-13z', BASKET, 2);
  s += ln('M-14,-10.4 C-14,-6 -12,-3 -11,-1.8 M-5,-9.4 V-1.2 M5,-9.4 V-1.2 M14,-10.4 C14,-6 12,-3 11,-1.8 M-20,-7 C-8,-3.4 8,-3.4 20,-7', 1.1, '#b98552');
  s += sh('M-25,-19 C-15,-14 15,-14 25,-19 C25,-16 24,-14 23,-13 C12,-9 -12,-9 -23,-13 C-24,-14 -25,-16 -25,-19z', '#d39c66', 2);
  // tail draped over the rim
  s += sh('M20,-19 C24,-14 22,-10 16,-9.6 C12,-9.4 10,-11 11,-12.4 C12,-13.4 14,-12.4 16,-12.6 C18.6,-13 19,-15.6 18,-18z', GINGER, 1.8);
  s += ln('M17,-37 h4 l-4,4.6 h4 M23,-45 h3 l-3,3.4 h3', 1.4);
  s += accent(theme, -21, -20);
  return s;
}

/* ------------------------------ exports ------------------------------- */

const SLOT: Record<HomeItemId, HomeSlot> = {
  poster_coffee: 'wall', photo_mom: 'wall',
  curtains_lace: 'window', curtains_stars: 'window',
  quilt_hearts: 'bed', quilt_stars: 'bed',
  rug_round: 'rug', rug_cloud: 'rug',
  plant_big: 'corner', lamp_moon: 'corner',
  fishbowl: 'pet', kitten: 'pet',
};

const DRAW: Record<HomeItemId, (t: ThemeId) => string> = {
  poster_coffee: posterCoffee, photo_mom: photoMom,
  curtains_lace: curtainsLace, curtains_stars: curtainsStars,
  quilt_hearts: quiltHearts, quilt_stars: quiltStars,
  rug_round: rugRound, rug_cloud: rugCloud,
  plant_big: plantBig, lamp_moon: lampMoon,
  fishbowl, kitten,
};

const VIEWBOX: Record<HomeSlot, string> = {
  wall: '-30 -32 60 62',
  window: '-78 -62 156 124',
  bed: '-62 -46 136 44',
  rug: '-76 -30 152 60',
  corner: '-30 -94 60 98',
  pet: '-29 -47 58 50',
};

/** Drawn relative to its HOME_ANCHOR slot (same conventions as café decor). */
export function homeItem(id: HomeItemId, theme: ThemeId): string {
  const draw = DRAW[id];
  if (!draw) return '';
  // quilts lie ON the mattress (top surface x -62..74, y -64..-20 from the bed anchor), right of the pillow
  if (SLOT[id] === 'bed') return `<g transform="translate(22,-22) scale(.78,1)">${draw(theme)}</g>`;
  return draw(theme);
}

/** Standalone <svg> card picture for the home shop. */
export function homeItemSvg(id: HomeItemId, size: number): string {
  const slot = SLOT[id] ?? 'wall';
  return standalone(VIEWBOX[slot], size, DRAW[id]?.('everyday') ?? '', id.replace(/_/g, ' '));
}
