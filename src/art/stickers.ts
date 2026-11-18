/* =====================================================================
   JOURNAL + NEWSPAPER ART — die-cut journal stickers, the journal cover,
   tiny secret-spot reactions, the morning paper on the floor, the
   Gazette masthead and weather icons.
   Style: soft brown ink, offset pastel fills, hand-shaped Bezier outlines,
   tiny faces. Deterministic, no filters.
   ===================================================================== */
import type { SecretSpotId, StickerId } from '../types';
import { INK, EYE, CREAM, BLUSH, fl, ln, sh, blob, box, tinyFace, standalone } from './kit';
import { yarn, pumpkin, SPARK } from './core';

const r = (v: number) => +v.toFixed(2);
const pol = (cx: number, cy: number, rad: number, deg: number): [number, number] => {
  const a = (deg * Math.PI) / 180;
  return [r(cx + Math.cos(a) * rad), r(cy + Math.sin(a) * rad)];
};

const SAGE = '#8fc3a7';
const MINT = '#bfe3d0';
const MUSTARD = '#f6cf6b';
const GOLD = '#f0c34a';
const GOLD_D = '#d9a32f';
const SKY = '#9dbbe6';
const GLASS = '#e3f2fb';
const BERRY = '#e2607a';
const PINK = '#f4a9a8';
const WOOD = '#c98d63';
const ORANGE = '#f08a3c';
const LEAF = '#7fb86a';
const PAPER = '#fffaf2';
const WHITE = '#ffffff';
const FONT = "'Baloo 2', sans-serif";

/* ---------- shape helpers ---------- */
function heartD(cx: number, cy: number, s: number): string {
  const p = (x: number, y: number) => `${r(cx + x * s)},${r(cy + y * s)}`;
  return `M${p(0, 0.95)} C${p(-0.5, 0.55)} ${p(-1.15, 0.05)} ${p(-1.05, -0.45)} C${p(-0.95, -1.05)} ${p(-0.2, -1.1)} ${p(0, -0.5)} `
    + `C${p(0.2, -1.1)} ${p(0.95, -1.05)} ${p(1.05, -0.45)} C${p(1.15, 0.05)} ${p(0.5, 0.55)} ${p(0, 0.95)}z`;
}
function starD(cx: number, cy: number, R: number, ri: number, rot = 0): string {
  const tips = [0, 1, 2, 3, 4].map((k) => pol(cx, cy, R, -90 + rot + 72 * k));
  const ins = [0, 1, 2, 3, 4].map((k) => pol(cx, cy, ri, -90 + rot + 36 + 72 * k));
  const lerp = (a: [number, number], b: [number, number], t: number) => `${r(a[0] + (b[0] - a[0]) * t)},${r(a[1] + (b[1] - a[1]) * t)}`;
  let d = `M${ins[4][0]},${ins[4][1]}`;
  for (let k = 0; k < 5; k++) {
    const prev = k === 0 ? ins[4] : ins[k - 1];
    d += ` L${lerp(prev, tips[k], 0.8)} Q${tips[k][0]},${tips[k][1]} ${lerp(tips[k], ins[k], 0.2)} L${ins[k][0]},${ins[k][1]}`;
  }
  return d + 'z';
}
/** Several dots as one filled path. */
const dots = (pts: [number, number][], rad: number, fill: string, op = 1) =>
  `<path d="${pts.map(([x, y]) => `M${r(x - rad)},${r(y)} a${rad},${rad} 0 1,0 ${r(rad * 2)},0 a${rad},${rad} 0 1,0 ${r(-rad * 2)},0`).join(' ')}" fill="${fill}"${op < 1 ? ` opacity="${op}"` : ''}/>`;
const spark = (x: number, y: number, s: number, c = '#ffe27a', rot = 0) =>
  `<path d="${SPARK}" transform="translate(${r(x)},${r(y)}) rotate(${r(rot)}) scale(${r(s)})" fill="${c}" stroke="${INK}" stroke-width="${r(1 / Math.max(0.2, s))}" stroke-linejoin="round"/>`;
const txt = (x: number, y: number, s: string, size: number, fill = INK, weight = 700, font = FONT, extra = '') =>
  `<text x="${r(x)}" y="${r(y)}" font-family="${font}" font-size="${r(size)}" font-weight="${weight}" fill="${fill}" text-anchor="middle"${extra}>${s}</text>`;
/** Eighth note: head + stem + flag. */
const noteG = (x: number, y: number, s: number, c: string) =>
  sh(blob(x, y, 2.8 * s, 2.1 * s, -0.3), c, 1.4)
  + ln(`M${r(x + 2.5 * s)},${r(y - 0.4 * s)} V${r(y - 9 * s)} q${r(1 * s)},${r(3 * s)} ${r(4 * s)},${r(4.5 * s)}`, 1.5);
const wink = (x: number, y: number, s = 1) => ln(`M${r(x - 2 * s)},${r(y)} q${r(2 * s)},${r(-2.2 * s)} ${r(4 * s)},0`, 1.4 * s, EYE);
const shut = (x: number, y: number, s = 1) => ln(`M${r(x - 2 * s)},${r(y)} q${r(2 * s)},${r(2 * s)} ${r(4 * s)},0`, 1.3 * s, EYE);
const CRESCENT = 'M38,11 C24,12 14,22 14,34 C14,46 24,55 36,55 C44,55 50,51 53,45 C40,47 29,39 29,28 C29,20 33,14 38,11z';

/* =====================================================================
   STICKERS (viewBox 0 0 64 64). b = die-cut silhouette, a = art.
   ===================================================================== */
interface Stk { b: string[]; a: string }

const STICKERS: Record<StickerId, () => Stk> = {
  clock_wink: () => ({
    b: [blob(32, 36, 18, 17), 'M15,27 L17,8 L30,19z', 'M49,27 L47,8 L34,19z'],
    a: sh('M16,25 L18,9 L29,18z', '#f2b880') + sh('M48,25 L46,9 L35,18z', '#f2b880')
      + ln('M19,20 L19.5,13 L24,17 M45,20 L44.5,13 L40,17', 1.3, '#e98f9a')
      + sh(blob(32, 36, 17, 16), '#f2b880')
      + `<circle cx="25" cy="27" r="1.6" fill="${EYE}"/>` + wink(39, 27)
      + dots([[20.5, 31], [43.5, 31]], 1.8, BLUSH, 0.8)
      + sh(blob(32, 41, 9.5, 8.5), CREAM, 1.6)
      + ln('M32,33.8 v1.6 M32,46.6 v1.6 M24.8,41 h1.6 M37.6,41 h1.6', 1.3)
      + ln('M32,41 L32,36.5 M32,41 L35.5,43', 1.7),
  }),
  moon_smile: () => ({
    b: [CRESCENT, blob(46, 22, 8, 10)],
    a: sh(CRESCENT, '#f6d86b') + tinyFace(21.5, 34, 0.75)
      + spark(46, 18, 0.75) + spark(50, 29, 0.45, '#fff3b0', 20) + dots([[42, 30]], 1.1, '#fff3b0'),
  }),
  kettle_song: () => ({
    b: [blob(31, 36, 19, 19), 'M45,40 L56,28 L52,18 L55,10'],
    a: ln('M22,27 C21,13 41,13 40,27', 2.6)
      + `<g transform="translate(0.5,0.5)">${ln('M45,41 C51,37 53,31 56,28', 5.2, '#7fa9bf')}</g>` + ln('M45,41 C51,37 53,31 56,28', 2.2)
      + sh('M17,50 C13,42 15,30 23,26 L39,26 C47,30 49,42 45,50z', '#a9cfe0')
      + sh(blob(31, 25, 8.5, 3), '#7fa9bf', 1.8) + sh(blob(31, 20.5, 2.6, 2.2), GOLD, 1.5)
      + tinyFace(31, 39, 0.85)
      + noteG(49, 21, 0.75, BERRY) + noteG(55, 13, 0.6, SAGE),
  }),
  duck_quack: () => ({
    b: [blob(30, 42, 21, 14), blob(39, 24, 13, 12), blob(51, 26, 6, 6)],
    a: ln('M10,53 q4,-3 8,0 t8,0 t8,0 t8,0 t8,0', 1.5, '#7fa9bf')
      + sh('M11,38 C9,33 12,31 15,34 C20,30 30,31 34,32 L46,34 C50,40 46,52 30,52 C18,52 11,46 11,38z', '#f9d65c')
      + sh(blob(38, 24, 10, 9.5), '#f9d65c')
      + sh('M46,23 C52,21 56,24 53,27.5 C51,30 47,29 46,27z', ORANGE, 1.8)
      + ln('M22,40 C26,45 33,45 36,40', 1.6)
      + `<circle cx="40" cy="21.5" r="1.6" fill="${EYE}"/>` + dots([[42, 26.5]], 1.8, BLUSH, 0.85),
  }),
  box_cat: () => ({
    b: [box(10, 30, 44, 26, 5), blob(32, 23, 15, 14)],
    a: sh('M21,19 L22,10 L28,16z', '#b4b8c2', 1.8) + sh('M43,19 L42,10 L36,16z', '#b4b8c2', 1.8)
      + sh(blob(32, 25, 12, 10), '#b4b8c2')
      + tinyFace(32, 24, 0.8)
      + sh(box(14, 33, 36, 21, 3), '#d9a86c')
      + sh('M14,33 L9,28 L25,28 L29,33z', '#e8bd85', 1.8) + sh('M50,33 L55,28 L39,28 L35,33z', '#e8bd85', 1.8)
      + sh(blob(26, 33, 3.4, 2.4) + ' ' + blob(38, 33, 3.4, 2.4), '#b4b8c2', 1.5)
      + ln('M24,42 h16 M28,46 h8', 1.3, '#a9773f'),
  }),
  pillow_fort: () => ({
    b: [blob(32, 43, 23, 14), blob(32, 29, 20, 10), 'M32,24 V12 L42,15'],
    a: ln('M32,24 V11', 1.8) + sh('M32,11 L42,14 L32,17z', BERRY, 1.6)
      + sh(blob(19, 44, 9, 10.5), '#f7b9c9') + sh(blob(45, 44, 9, 10.5), SKY)
      + sh('M25,54 C25,43 39,43 39,54z', '#6e5246', 1.8)
      + dots([[29.5, 49], [34.5, 49]], 1.2, '#fff3b0')
      + sh(blob(32, 30, 18, 6.5), MUSTARD)
      + ln('M20,30 h1 M43,30 h1 M15,40 v1 M49,40 v1', 2, WHITE),
  }),
  jar_sparkle: () => ({
    b: [box(13, 11, 38, 47, 10), blob(49, 15, 7, 7)],
    a: sh(box(18, 21, 28, 33, 8), GLASS)
      + sh(blob(26, 46, 5, 3.5), GOLD, 1.5) + sh(blob(37, 47, 5, 3.5), GOLD, 1.5) + sh(blob(31, 41, 5, 3.5), GOLD, 1.5)
      + sh(box(20, 15, 24, 7, 3), WOOD, 1.8)
      + tinyFace(32, 30, 0.75)
      + ln('M22,26 v6', 1.8, WHITE)
      + spark(49, 15, 0.7) + spark(14, 32, 0.45, '#fff3b0'),
  }),
  mom_photo: () => ({
    b: [box(11, 12, 40, 43, 6), blob(48, 15, 8, 8)],
    a: sh(box(13, 14, 36, 39, 4), WOOD)
      + sh(box(18, 19, 26, 29, 2), '#ffe9d6', 1.6)
      + sh(blob(24.5, 28, 3.2, 3.2), '#b97d55', 1.4) + sh(blob(37.5, 28, 3.2, 3.2), '#b97d55', 1.4)
      + sh(blob(31, 35, 9, 8), '#b97d55', 1.8) + sh(blob(31, 38, 4, 3), '#f3d9bf', 1.2)
      + tinyFace(31, 34, 0.65)
      + `<path d="${starD(38, 27, 3, 1.3)}" fill="${PINK}" stroke="${INK}" stroke-width="1"/>`
      + sh(heartD(48, 15, 6), BERRY, 1.6),
  }),
  fire_heart: () => {
    const flame = 'M32,55 C18,47 11,37 13,28 C14,22 18,18 22,16 C22,21 24,23 26,23 C25,17 28,12 33,8 C33,14 36,18 40,19 C41,17 41,15 40,12 C47,16 53,24 51,32 C49,40 42,48 32,55z';
    return {
      b: [flame],
      a: sh(flame, ORANGE) + fl(heartD(32, 39, 11), '#ffd36b') + ln(heartD(32, 39, 11), 1.4, '#e0742a')
        + tinyFace(32, 37.5, 0.75) + dots([[22, 22], [44, 22]], 1, '#fff3b0'),
    };
  },
  star_wish: () => ({
    b: [blob(27, 36, 20, 19), 'M38,24 L55,9'],
    a: ln('M39,27 C45,22 49,16 55,10 M42,31 C47,28 52,26 57,22 M35,23 C37,18 40,14 43,9', 1.6, '#c9a0dc')
      + sh(starD(27, 36, 18, 8.5, -8), MUSTARD) + tinyFace(26.5, 37, 0.8)
      + spark(55, 9, 0.4, '#fff3b0') + spark(57, 22, 0.32, '#fff3b0'),
  }),
  record_note: () => ({
    b: [blob(28, 37, 20, 20), blob(48, 17, 9, 12)],
    a: sh(blob(28, 37, 18, 18), '#3d3540')
      + ln(blob(28, 37, 13.5, 13.5), 0.9, '#6a5f6e') + ln(blob(28, 37, 9.5, 9.5), 0.9, '#6a5f6e')
      + ln('M15,30 C17,25 21,22 25,21', 1.6, '#8a8090')
      + sh(blob(28, 37, 5.5, 5.5), BERRY, 1.4) + dots([[28, 37]], 1, CREAM)
      + noteG(46, 22, 0.95, SKY),
  }),
  plant_sprout: () => ({
    b: [box(15, 31, 34, 26, 4), blob(32, 19, 17, 10)],
    a: ln('M32,35 C32,29 32,25 32,20', 2)
      + sh('M32,22 C26,13 17,15 17,20 C21,25 28,25 32,22z', LEAF, 1.8) + sh('M32,22 C38,13 47,15 47,20 C43,25 36,25 32,22z', LEAF, 1.8)
      + sh('M20,38 L44,38 L41,54 L23,54z', '#e0875a')
      + sh(box(17.5, 33, 29, 6.5, 2), '#ea9a6e', 1.8)
      + tinyFace(32, 45, 0.8),
  }),
  bell_ring: () => ({
    b: [blob(32, 33, 17, 21), 'M12,27 q-3,7 0,14 M52,27 q3,7 0,14'],
    a: ln('M13,28 q-3,6 0,12 M51,28 q3,6 0,12 M8,25 q-4,9 0,18 M56,25 q4,9 0,18', 1.7)
      + sh(blob(32, 16, 3, 3), GOLD_D, 1.5)
      + sh(blob(32, 50, 3.4, 3.2), GOLD_D, 1.5)
      + sh('M20,44 C20,34 22,20 32,18.5 C42,20 44,34 44,44 C46.5,45.5 46.5,48.5 44,48.5 L20,48.5 C17.5,48.5 17.5,45.5 20,44z', GOLD)
      + ln('M21,44 h22', 1.2, GOLD_D) + ln('M26,25 C25,28 24,32 24,35', 1.6, WHITE)
      + tinyFace(32, 35, 0.8),
  }),
  menu_doodle: () => ({
    b: [box(8, 10, 48, 43, 6), 'M20,50 L16,58 M44,50 L48,58'],
    a: ln('M20,50 L16,57 M44,50 L48,57', 2.4)
      + sh(box(10, 12, 44, 38, 5), WOOD)
      + fl(box(14.5, 16.5, 35, 29, 3), '#3e5a4c')
      + ln(starD(23, 28, 6, 2.8), 1.3, WHITE)
      + ln('M33,25 h10 v6 q0,4 -5,4 q-5,0 -5,-4z M43,27 q3,0 3,2 q0,2 -3,2 M36,22 q-1,-2 0,-4 M40,22 q-1,-2 0,-4', 1.3, WHITE)
      + ln('M19,41 h9 M31,41 h14', 1.3, '#f7b9c9'),
  }),
  button_paw: () => ({
    b: [blob(31, 35, 21, 20), blob(50, 50, 8, 8)],
    a: sh('M31,52 C21,52 17,46 19,41 C21,36 26,35 31,35 C36,35 41,36 43,41 C45,46 41,52 31,52z', '#e98f9a')
      + sh(blob(17, 29, 4.5, 5.5, -0.3), '#e98f9a', 1.8) + sh(blob(25, 21, 4.5, 5.8), '#e98f9a', 1.8)
      + sh(blob(37, 21, 4.5, 5.8), '#e98f9a', 1.8) + sh(blob(45, 29, 4.5, 5.5, 0.3), '#e98f9a', 1.8)
      + ln('M25,42 C26,39 28,38 30,38', 1.5, WHITE)
      + sh(blob(50, 50, 6.5, 6.5), SKY, 1.6) + dots([[48, 48], [52, 48], [48, 52], [52, 52]], 0.9, INK),
  }),
  konbini_star: () => ({
    b: [blob(32, 32, 23, 23)],
    a: sh(blob(32, 32, 21, 21), MINT)
      + fl('M13,42 C20,47 44,47 51,42 C50,46 44,52 32,52 C20,52 14,46 13,42z', '#f9d3df')
      + ln(blob(32, 32, 17.5, 17.5), 1, WHITE)
      + sh(starD(32, 30, 14, 6.6), '#f6cf6b') + tinyFace(32, 31, 0.75)
      + spark(48, 15, 0.4, WHITE),
  }),
  clerk_bow: () => ({
    b: [blob(32, 38, 21, 19), blob(50, 15, 8, 9)],
    a: sh('M17,55 C17,43 22,36 32,36 C42,36 47,43 47,55z', SAGE)
      + sh('M25,55 C25,46 27,42 32,42 C37,42 39,46 39,55z', CREAM, 1.6)
      + `<g transform="rotate(22,32,36)">`
      + sh(blob(26, 21, 3.5, 3.5), '#e7c39d', 1.6) + sh(blob(38, 21, 3.5, 3.5), '#e7c39d', 1.6)
      + sh(blob(32, 28, 11, 9.5), '#e7c39d')
      + sh('M21,24 C22,17 42,17 43,24 C36,22 28,22 21,24z', MINT, 1.6)
      + shut(28, 29, 0.9) + shut(36, 29, 0.9) + dots([[24.5, 32], [39.5, 32]], 1.6, BLUSH, 0.8) + '</g>'
      + txt(50, 21, '♪', 15, BERRY),
  }),
  coffee_cup: () => ({
    b: [blob(32, 42, 23, 15), blob(32, 17, 10, 10)],
    a: ln('M27,25 q-2,-3 0,-6 M37,25 q2,-3 0,-6', 1.5, '#c8b6a6')
      + ln(heartD(32, 15, 4.5), 1.6, BERRY)
      + sh(blob(32, 53, 20, 4), '#f7b9c9', 1.8)
      + ln('M44,32 C53,31 53,43 43,43', 2.6)
      + sh('M18,28 L46,28 L43,47 C42,51 38,53 32,53 C26,53 22,51 21,47z', CREAM)
      + fl(blob(32, 29, 13, 2.4), '#9a6a4a')
      + tinyFace(32, 39, 0.85),
  }),
  umbrella_frog: () => {
    const canopy = 'M9,32 C11,18 21,11 32,11 C43,11 53,18 55,32 C51,29 47,29 43.5,32 C40,29 35.5,29 32,32 C28.5,29 24,29 20.5,32 C17,29 13,29 9,32z';
    return {
      b: [blob(32, 24, 25, 15), blob(32, 44, 15, 13)],
      a: sh(canopy, '#f7b9c9') + ln('M32,11 C27,16 24,24 20.5,32 M32,11 C37,16 40,24 43.5,32', 1.2, '#e08aa0')
        + ln('M32,11 V8', 2)
        + sh(blob(26, 37, 3.8, 3.8), '#8cc66d', 1.6) + sh(blob(38, 37, 3.8, 3.8), '#8cc66d', 1.6)
        + sh(blob(32, 45, 12, 8.5), '#8cc66d')
        + ln('M32,32 V52 q0,3 -3,3', 1.8)
        + dots([[26, 37], [38, 37]], 1.3, EYE)
        + ln('M27,46 q5,4 10,0', 1.3, EYE) + dots([[23, 46], [41, 46]], 1.6, BLUSH, 0.85),
    };
  },
  perfect_day: () => ({
    b: [blob(32, 35, 27, 19)],
    a: sh(starD(14, 40, 10, 4.6, -12), GOLD) + sh(starD(50, 40, 10, 4.6, 12), GOLD)
      + sh(starD(32, 30, 14, 6.6), MUSTARD) + tinyFace(32, 31, 0.75)
      + dots([[14, 41], [50, 41]], 1.2, '#fff3b0')
      + ln('M18,52 q14,5 28,0', 1.5, GOLD_D),
  }),
  chef_hat: () => {
    const puff = 'M20,40 C12,38 10,26 18,23 C18,14 28,10 32,16 C36,10 46,14 46,23 C54,26 52,38 44,40z';
    return {
      b: [blob(32, 32, 23, 21)],
      a: sh(puff, WHITE) + ln('M25,30 C25,34 25,37 26,40 M39,30 C39,34 39,37 38,40', 1.2, '#d8cfc6')
        + sh(box(19, 38, 26, 11, 3), CREAM)
        + ln('M20,42 h24', 1, '#e6d3bf')
        + sh(heartD(32, 44, 3.4), BERRY, 1.2) + ln('M22,22 C23,20 25,19 27,19', 1.5, '#e6dfd6'),
    };
  },
  snack_bag: () => {
    const bag = 'M18,16 L46,16 L44,22 C47,30 47,42 44,48 L46,54 L18,54 L20,48 C17,42 17,30 20,22z';
    return {
      b: [box(14, 12, 36, 46, 4)],
      a: sh(bag, MUSTARD) + ln('M19,19 l3,-3 l3,3 l3,-3 l3,3 l3,-3 l3,3 l3,-3 l3,3 l3,-3 M19,51 l3,3 l3,-3 l3,3 l3,-3 l3,3 l3,-3 l3,3 l3,-3 l3,3', 1.1, '#d9a32f')
        + sh(blob(32, 37, 10, 9), '#f7b9c9', 1.6)
        + sh(blob(36, 42, 4.5, 3, 0.4), '#f2b45a', 1.3)
        + tinyFace(30.5, 35, 0.65)
        + ln('M23,26 v14', 1.8, '#fff3c4'),
    };
  },
  bubble_bath: () => ({
    b: [blob(32, 39, 25, 17), blob(32, 25, 18, 11)],
    a: ln('M17,50 l-2,5 M47,50 l2,5', 2.4)
      + sh(blob(22, 30, 7, 6), WHITE, 1.6) + sh(blob(33, 26, 8, 7), WHITE, 1.6) + sh(blob(44, 30, 7, 6), WHITE, 1.6)
      + sh(blob(47, 21, 3, 3), GLASS, 1.2) + sh(blob(17, 21, 2.4, 2.4), GLASS, 1.2)
      + sh('M9,34 L55,34 C55,46 47,52 32,52 C17,52 9,46 9,34z', SKY)
      + ln('M8,34 h48', 2.6) + tinyFace(32, 42, 0.85)
      + sh(blob(13, 28, 3.6, 3), '#f9d65c', 1.3),
  }),
  phone_heart: () => ({
    b: [box(15, 7, 34, 50, 8), blob(48, 15, 8, 8)],
    a: sh(box(19, 10, 25, 44, 5), SKY)
      + sh(box(22.5, 15, 18, 30, 2), CREAM, 1.5)
      + sh(heartD(31.5, 29, 6.5), BERRY, 1.6) + ln('M28,26 q1,-1.5 2.5,-1.5', 1.2, WHITE)
      + dots([[31.5, 49.5]], 1.5, INK)
      + sh(heartD(48, 15, 4), PINK, 1.3) + sh(heartD(52, 24, 2.6), PINK, 1.1),
  }),
  book_stack: () => ({
    b: [box(10, 18, 44, 37, 5)],
    a: sh(box(13, 43, 38, 9, 2), BERRY) + ln('M16,47.5 h4 M44,47.5 h4', 1.3, '#fde0e6')
      + sh(box(16, 34, 33, 9, 2), SAGE) + ln('M19,38.5 h28', 1.2, '#dff1e6')
      + sh(box(19, 25, 27, 9, 2), SKY) + ln('M41,25 v5', 1.8, MUSTARD)
      + `<g transform="translate(-1,0)">${tinyFace(33, 29.5, 0.55)}</g>`
      + sh(blob(26, 21, 3.5, 3.3), '#e8606f', 1.4) + ln('M26,18 q1,-2 3,-2', 1.3, LEAF),
  }),
  sleepy_moon: () => ({
    b: [CRESCENT, blob(48, 18, 9, 11)],
    a: sh(CRESCENT, '#fbe7a1') + shut(18.5, 33) + shut(24.5, 34)
      + dots([[17, 38], [26, 39]], 1.6, BLUSH, 0.8)
      + ln('M20,42 q2,1 4,0', 1.1, EYE)
      + txt(45, 24, 'z', 9, '#8f86c4') + txt(51, 15, 'z', 7, '#8f86c4')
      + spark(40, 33, 0.35, '#fff3b0'),
  }),
  big_basket: () => ({
    b: [blob(32, 36, 25, 22)],
    a: ln('M17,31 C17,13 47,13 47,31', 2.6)
      + sh(box(17, 17, 9, 15, 3), SKY, 1.6)
      + sh(blob(36, 24, 9, 6, 0.3), '#e8bd85', 1.6) + ln('M32,22 l2,3 M36,21 l2,3 M40,22 l2,3', 1, '#b98a52')
      + sh(blob(46, 27, 5, 4.6), '#e8606f', 1.5) + ln('M46,22.5 q1,-2 3,-2', 1.2, LEAF)
      + sh('M11,30 L53,30 L48,52 C47,54 45,55 43,55 L21,55 C19,55 17,54 16,52z', BERRY)
      + ln('M18,37 h28 M19.5,44 h25 M24,31 v22 M32,31 v23 M40,31 v22', 1.1, '#f6a9b6')
      + tinyFace(32, 41, 0.7),
  }),
  festival_lantern: () => ({
    b: [blob(32, 34, 18, 23)],
    a: ln('M32,9 V15 M32,52 V59', 1.6) + ln('M30,59 l-1,3 M34,59 l1,3', 1.4, BERRY)
      + sh(blob(32, 34, 15, 16), '#ef7a5c')
      + ln('M19,27 h26 M18,34 h28 M19,41 h26', 1, '#c9563f')
      + fl(blob(32, 30, 8, 7), '#ffd36b', 0.45)
      + sh(box(25, 14, 14, 5, 2), '#5b4a42', 1.6) + sh(box(25, 49, 14, 5, 2), '#5b4a42', 1.6)
      + tinyFace(32, 35, 0.8),
  }),
  friend_circle: () => {
    const cols = ['#b97d55', '#f2b880', '#b4b8c2', '#f7b9c9', '#e7c39d', '#a8c7e8'];
    let heads = '';
    const eyes: [number, number][] = [];
    let mouths = '';
    for (let i = 0; i < 6; i++) {
      const [x, y] = pol(32, 33, 16, -90 + i * 60);
      heads += sh(blob(x, y, 6.3, 5.8, i % 2 ? 0.2 : -0.2), cols[i], 1.6);
      eyes.push([x - 2.2, y - 0.5], [x + 2.2, y - 0.5]);
      mouths += `M${r(x - 1.2)},${r(y + 1.6)} q1.2,1.3 2.4,0 `;
    }
    return {
      b: [blob(32, 33, 25, 25)],
      a: fl(blob(32, 33, 18, 18), '#fff3e2') + heads + dots(eyes, 0.9, EYE) + ln(mouths, 0.9, EYE)
        + sh(heartD(32, 33, 6), BERRY, 1.5),
    };
  },
  night_owl: () => {
    const body = 'M18,22 L16,12 L26,18 C30,17 34,17 38,18 L48,12 L46,22 C50,30 50,46 44,52 C38,56 26,56 20,52 C14,46 14,30 18,22z';
    return {
      b: [blob(32, 34, 20, 23), blob(51, 13, 7, 7)],
      a: sh(body, '#a98bc4') + fl(blob(32, 43, 9, 9), '#dccdea')
        + ln('M28,40 l2,2 l2,-2 l2,2 l2,-2 M28,45 l2,2 l2,-2 l2,2 l2,-2', 1, '#8f74ab')
        + sh(blob(25.5, 29, 6, 6), CREAM, 1.6) + sh(blob(38.5, 29, 6, 6), CREAM, 1.6)
        + dots([[25.5, 29.5], [38.5, 29.5]], 2.3, EYE) + dots([[26.3, 28.6], [39.3, 28.6]], 0.8, WHITE)
        + sh('M30,34 L34,34 L32,38z', MUSTARD, 1.3)
        + ln('M17,36 C15,42 17,47 21,49 M47,36 C49,42 47,47 43,49', 1.6)
        + sh(blob(51, 13, 5, 5), '#fbe7a1', 1.4),
    };
  },
  early_bird: () => ({
    b: [blob(32, 37, 25, 19)],
    a: ln('M32,14 v4 M16,22 l3,3 M48,22 l-3,3 M9,36 h4 M51,36 h4', 1.8, ORANGE)
      + sh('M11,47 C11,32 20,24 32,24 C44,24 53,32 53,47z', '#ffd36b')
      + ln('M8,47 h48', 2.2, '#7fb86a')
      + sh('M18,44 C17,36 22,31 29,31 C34,31 37,34 38,38 C42,37 46,36 48,34 C47,41 42,46 34,46 C28,47 21,47 18,44z', '#e8786a')
      + sh('M18,36 L13,37 L18,39z', MUSTARD, 1.3)
      + `<circle cx="23" cy="35.5" r="1.4" fill="${EYE}"/>` + dots([[25, 39]], 1.4, BLUSH, 0.9)
      + ln('M30,39 C33,42 37,42 39,40', 1.4)
      + ln('M24,47 v4 M30,47 v4', 1.6),
  }),
  golden_coin: () => ({
    b: [blob(32, 32, 22, 22)],
    a: `<g transform="translate(1.4,2)"><path d="${blob(32, 32, 19, 19)}" fill="${GOLD_D}"/></g>`
      + sh(blob(32, 32, 19, 19), GOLD)
      + ln(blob(32, 32, 14, 14), 1.3, GOLD_D)
      + fl(starD(32, 32, 8, 3.8), '#ffe27a') + ln(starD(32, 32, 8, 3.8), 1.3, GOLD_D)
      + ln('M20,24 C21,21 23,19 26,18', 2, '#fff3c4')
      + spark(50, 14, 0.5, WHITE),
  }),
  rainy_window: () => ({
    b: [box(9, 9, 46, 48, 6)],
    a: sh(box(12, 12, 40, 40, 4), WOOD)
      + fl(box(16, 16, 32, 31, 2), '#cfe2f3')
      + sh(blob(26, 24, 7, 4.2), WHITE, 1.4) + dots([[24, 24], [28, 24]], 0.8, EYE)
      + ln('M32,16 V47 M16,31.5 H48', 2.2)
      + ln('M37,20 q-1,3 0,4 M44,24 q-1,3 0,4 M21,36 q-1,3 0,4 M28,40 q-1,3 0,4 M38,37 q-1,3 0,4 M44,41 q-1,2 0,3', 1.4, '#6f9fd0')
      + sh(box(10, 50, 44, 5, 2), '#b97d55', 1.8),
  }),
  sunflower: () => {
    let pet = '';
    for (let i = 0; i < 12; i++) {
      const a = i * 30;
      const [x1, y1] = pol(32, 27, 9, a - 12), [tx, ty] = pol(32, 27, 19, a), [x2, y2] = pol(32, 27, 9, a + 12);
      const [c1x, c1y] = pol(32, 27, 17, a - 14), [c2x, c2y] = pol(32, 27, 17, a + 14);
      pet += `M${x1},${y1} Q${c1x},${c1y} ${tx},${ty} Q${c2x},${c2y} ${x2},${y2}z `;
    }
    return {
      b: [blob(32, 27, 21, 21), blob(32, 51, 11, 9)],
      a: ln('M32,40 C33,46 32,52 32,58', 2.6, '#5f9a58')
        + sh('M32,50 C27,44 20,46 19,49 C23,53 29,53 32,50z', LEAF, 1.6) + sh('M32,53 C37,47 44,49 45,52 C41,56 35,56 32,53z', LEAF, 1.6)
        + sh(pet, '#f9d14a', 1.6)
        + sh(blob(32, 27, 9.5, 9.5), '#9a6a4a', 1.8)
        + tinyFace(32, 27, 0.7),
    };
  },
  snowflake: () => {
    let arms = '';
    for (let i = 0; i < 6; i++) {
      const a = -90 + i * 60;
      const [ex, ey] = pol(32, 32, 20, a), [mx, my] = pol(32, 32, 13, a);
      const [l1x, l1y] = pol(mx, my, 5.5, a - 45), [l2x, l2y] = pol(mx, my, 5.5, a + 45);
      arms += `M${pol(32, 32, 9, a).join(',')} L${ex},${ey} M${mx},${my} L${l1x},${l1y} M${mx},${my} L${l2x},${l2y} `;
    }
    return {
      b: [blob(32, 32, 24, 24)],
      a: `<g transform="translate(1.1,1)">${ln(arms, 5.2, '#cfe6f7')}</g>` + ln(arms, 2)
        + sh(blob(32, 32, 9.5, 9.5), '#e6f3fc', 1.8) + tinyFace(32, 32, 0.7),
    };
  },
  pumpkin_grin: () => ({
    b: [blob(32, 36, 23, 18), blob(37, 13, 5, 6)],
    a: pumpkin(32, 37, 1.35, true) + spark(52, 16, 0.4, '#fff3b0'),
  }),
};

function stickerFrame(b: string[], inner: string): string {
  const paths = b.map((d) => `<path d="${d}"/>`).join('');
  return `<g transform="translate(1.4,2.2)" fill="${INK}" stroke="${INK}" stroke-width="9" stroke-linejoin="round" stroke-linecap="round" opacity=".18">${paths}</g>`
    + `<g fill="#fff" stroke="#fff" stroke-width="8" stroke-linejoin="round" stroke-linecap="round">${paths}</g>`
    + inner;
}

/** A round-ish die-cut sticker (white border, soft shadow) for a journal page. Standalone svg. */
export function stickerSvg(id: StickerId, size: number): string {
  const make = STICKERS[id] ?? STICKERS.coffee_cup;
  const s = make();
  return standalone('0 0 64 64', size, stickerFrame(s.b, s.a), id.replace(/_/g, ' '));
}

/** A locked sticker silhouette (soft grey, dashed outline, tiny "?"). Standalone svg. */
export function lockedStickerSvg(size: number): string {
  const d = blob(32, 32, 22, 21, 0.2);
  return standalone('0 0 64 64', size,
    `<g transform="translate(1.2,1.8)"><path d="${d}" fill="#000" opacity=".06"/></g>`
    + `<path d="${d}" fill="#ebe6df" stroke="#b9afa5" stroke-width="2" stroke-dasharray="4 4" stroke-linecap="round"/>`
    + fl(blob(32, 33, 12, 11), '#ddd6cd')
    + txt(32, 40, '?', 22, '#a69a8f', 800)
    + dots([[48, 18], [16, 46]], 1.4, '#cfc6bc'),
    'locked sticker');
}

/** The journal cover (cute notebook with a bear-paw clasp). Standalone svg. */
export function journalCoverSvg(size: number): string {
  const cover = box(32, 12, 132, 176, 14);
  const pad = 'M168,108 C161,108 158,104 159,100 C160,96 164,95 168,95 C172,95 176,96 177,100 C178,104 175,108 168,108z';
  return standalone('0 0 200 200', size,
    `<ellipse cx="100" cy="192" rx="72" ry="5" fill="${INK}" opacity=".14"/>`
    // page edges peeking out
    + sh(box(38, 16, 132, 174, 12), PAPER)
    + ln('M166,30 v150 M162,24 v160', 1, '#e6d3bf')
    // fabric cover + spine
    + sh(cover, '#e9a8a2', 2.6)
    + fl(box(32, 12, 22, 176, 10), '#d98d88')
    + ln('M54,16 V184', 1.6)
    + ln(box(60, 20, 98, 160, 10), 1.3, '#fff3ee').replace('stroke-linecap', 'stroke-dasharray="4 4" stroke-linecap')
    // tiny fabric dots
    + dots([[72, 40], [140, 36], [68, 150], [146, 160], [112, 172], [84, 172]], 1.6, '#f7c9c4')
    + `<path d="${heartD(140, 150, 6)}" fill="#f7c9c4" stroke="${INK}" stroke-width="1.2"/>`
    // label
    + sh(box(66, 56, 84, 58, 8), CREAM, 2)
    + ln('M74,63 h68 M74,107 h68', 1, '#e6d3bf')
    + txt(108, 82, 'Mocha’s', 18, INK, 700) + txt(108, 101, 'Journal', 18, '#c4506a', 700)
    + yarn(108, 134, 9, '#a9cfe0', true, 20)
    // ribbon bookmark
    + sh('M120,186 L120,198 L125,194 L130,198 L130,186z', '#c4506a', 1.8)
    // bear-paw clasp strap
    + sh('M150,86 L184,86 Q190,86 190,92 L190,118 Q190,124 184,124 L150,124z', '#a7744f', 2.2)
    + ln('M152,90 H182 M152,120 H182', 1, '#d8ad84')
    + sh(pad, '#f4c9a8', 1.8)
    + sh(blob(160.5, 91, 2.6, 3), '#f4c9a8', 1.4) + sh(blob(166, 88, 2.6, 3), '#f4c9a8', 1.4)
    + sh(blob(171.5, 88, 2.6, 3), '#f4c9a8', 1.4) + sh(blob(176.5, 91, 2.6, 3), '#f4c9a8', 1.4)
    + ln('M40,22 C42,19 45,17 48,17', 1.8, '#f6c6c1'),
    'Mocha’s Journal');
}

/* =====================================================================
   SECRET REACTIONS — origin = the hotspot centre, t 0..1
   ===================================================================== */
const ease = (t: number) => 1 - Math.pow(1 - t, 3);
const pop = (t: number) => { const c = 1.70158, x = Math.min(1, t) - 1; return 1 + (c + 1) * x * x * x + c * x * x; };

/** Tiny playful reaction animation drawn at a secret hotspot (scene coords origin = SECRET_SPOTS[spot]); t 0..1. */
export function secretReaction(spot: SecretSpotId, t: number): string {
  t = Math.max(0, Math.min(1, t));
  const alpha = r(Math.min(1, t / 0.15, (1 - t) / 0.25));
  if (alpha <= 0) return '';
  const rise = r(ease(t) * 14);
  const p = r(Math.max(0.01, pop(Math.min(1, t / 0.35))));
  const sway = r(Math.sin(t * Math.PI * 4) * 3);
  let s = '';
  switch (spot) {
    case 'cafe_clock':
      s = `<g transform="scale(${p})">${sh(blob(0, -2, 7, 5), WHITE, 1.4)}${wink(0, -1, 1.4)}</g>`
        + `<g transform="translate(16,${-18 - rise}) rotate(-8)">${txt(0, 0, 'tick!', 10, INK, 800)}</g>`;
      break;
    case 'cafe_window': {
      const x = r(-46 + t * 92), y = r(-6 - Math.sin(t * Math.PI) * 16), up = Math.floor(t * 16) % 2 === 0;
      s = `<g transform="translate(${x},${y})">`
        + sh(blob(0, 0, 5.5, 4.2), SKY, 1.4) + sh('M5,-1 L8.5,0 L5,1.5z', MUSTARD, 1)
        + dots([[2.6, -1.2]], 0.8, EYE)
        + sh(up ? 'M-2,-1 C-4,-8 1,-9 2,-2z' : 'M-2,0 C-5,5 0,7 2,1z', '#c9dcf3', 1.2) + '</g>';
      break;
    }
    case 'cafe_record':
      for (let i = 0; i < 3; i++) {
        const tt = Math.max(0, Math.min(1, t * 1.4 - i * 0.18));
        const x = r(-14 + i * 14 + Math.sin(tt * 9 + i) * 4), y = r(-24 - tt * 26);
        s += `<g transform="translate(${x},${y}) rotate(${r(Math.sin(tt * 10 + i * 2) * 15)})">${noteG(0, 0, 0.8, [BERRY, SKY, SAGE][i])}</g>`;
      }
      break;
    case 'cafe_plant':
      s = `<g transform="translate(0,${-r(14 + ease(t) * 4)}) scale(${p})">`
        + ln('M0,6 V-4', 1.8, '#5f9a58')
        + sh('M0,-3 C-5,-10 -11,-8 -11,-5 C-8,-1 -3,-1 0,-3z', LEAF, 1.4) + sh('M0,-3 C5,-10 11,-8 11,-5 C8,-1 3,-1 0,-3z', LEAF, 1.4)
        + dots([[-6, -5], [6, -5]], 0.7, EYE) + '</g>' + spark(12, -26, 0.4, '#fff3b0');
      break;
    case 'cafe_barista':
      s = `<g transform="translate(0,${-36 - rise}) scale(${p})">${sh(heartD(0, 0, 7), BERRY, 1.6)}${ln('M-3,-3 q1,-1.5 2.5,-1.5', 1.2, WHITE)}</g>`
        + `<g transform="translate(${-11 + sway},${-30 - rise * 1.4}) scale(${r(p * 0.6)})">${sh(heartD(0, 0, 5), PINK, 1.6)}</g>`;
      break;
    case 'cafe_door_bell': {
      const sw = r(Math.sin(t * Math.PI * 6) * 18 * (1 - t));
      s = `<g transform="rotate(${sw},0,-8)">${sh('M-5,6 C-5,0 -4,-6 0,-7 C4,-6 5,0 5,6z', GOLD, 1.4)}</g>`
        + `<g transform="scale(${p})">${ln('M-10,-6 q-3,6 0,12 M10,-6 q3,6 0,12 M-15,-9 q-4,9 0,18 M15,-9 q4,9 0,18', 1.6)}</g>`;
      break;
    }
    case 'cafe_menu_board': {
      const prog = r(Math.min(1, t / 0.6) * 60);
      s = `<path d="${starD(0, 0, 11, 5)}" fill="none" stroke="#fff" stroke-width="1.8" stroke-linejoin="round" pathLength="60" stroke-dasharray="${prog} 60"/>`
        + (t > 0.55 ? spark(13, -11, 0.35, WHITE) + spark(-12, 9, 0.28, WHITE) : '');
      break;
    }
    case 'home_moon':
      s = `<g transform="scale(${p})">${shut(-4, -2, 0.9)}${shut(4, -2, 0.9)}${ln('M-3,3 q3,3 6,0', 1.3, EYE)}${dots([[-7, 2.5], [7, 2.5]], 1.6, BLUSH, 0.85)}</g>`
        + spark(14, -14, r(0.5 + Math.sin(t * Math.PI * 3) * 0.15), '#fff3b0', t * 90)
        + spark(-15, -10, 0.3, '#fff3b0', -t * 60);
      break;
    case 'home_kettle':
      for (let i = 0; i < 3; i++) {
        const tt = Math.max(0, Math.min(1, t * 1.4 - i * 0.2));
        s += `<g transform="translate(${r(12 + tt * 18 + Math.sin(tt * 8 + i) * 3)},${r(-10 - tt * 30)}) scale(${r(0.5 + tt * 0.3)})">${noteG(0, 0, 1, [SKY, BERRY, MUSTARD][i])}</g>`;
      }
      s += ln(`M8,-6 q3,-3 6,-2 t6,-3`, 1.4, '#c8b6a6');
      break;
    case 'home_duck_sign':
      s = `<g transform="translate(14,${-20 - rise * 0.5}) scale(${p})">`
        + sh('M-16,-9 C-16,-14 16,-14 16,-9 L16,1 C16,5 -2,5 -6,5 L-11,10 L-10,5 C-16,5 -16,4 -16,1z', WHITE, 1.4)
        + txt(0, -1.5, 'quack!', 8.5, '#d98a2a', 800) + '</g>';
      break;
    case 'home_box': {
      const up = r(10 - ease(Math.min(1, t / 0.4)) * 16);
      s = `<defs><clipPath id="sr-box"><rect x="-30" y="-40" width="60" height="38"/></clipPath></defs>`
        + `<g clip-path="url(#sr-box)"><g transform="translate(0,${up})">`
        + sh('M-8,-6 L-7,-14 L-2,-9z', '#b4b8c2', 1.3) + sh('M8,-6 L7,-14 L2,-9z', '#b4b8c2', 1.3)
        + sh(blob(0, -2, 9, 7.5), '#b4b8c2', 1.5) + tinyFace(0, -3, 0.6) + '</g></g>';
      break;
    }
    case 'home_pillow': {
      const fx = r(Math.sin(t * Math.PI * 3) * 8), fy = r(-12 - t * 30);
      s = `<g transform="translate(${fx},${fy}) rotate(${r(Math.sin(t * Math.PI * 3 + 1) * 30)})">`
        + sh('M0,-8 C5,-6 5,4 0,8 C-5,4 -5,-6 0,-8z', WHITE, 1.3) + ln('M0,-6 V10', 1.1) + '</g>';
      break;
    }
    case 'home_jar':
      s = `<g transform="translate(0,${-14 - rise}) scale(${p})">${sh(blob(0, 0, 5.5, 5.5), GOLD, 1.4)}${ln('M0,-2.5 v5', 1.2, GOLD_D)}</g>`
        + spark(-11, -22 - rise * 0.6, r(0.35 + 0.15 * Math.sin(t * 12)), '#fff3b0')
        + spark(11, -16 - rise * 0.8, r(0.3 + 0.12 * Math.cos(t * 12)), '#fff3b0');
      break;
    case 'home_photo':
      s = `<g transform="translate(${sway},${-28 - rise}) scale(${p})">${sh(heartD(0, 0, 7), BERRY, 1.6)}${ln('M-3,-3 q1,-1.5 2.5,-1.5', 1.2, WHITE)}</g>`;
      break;
    case 'home_fireplace':
      s = `<g transform="translate(${r(sway * 1.5)},${r(-20 - ease(t) * 34)}) scale(${r(p * (1 - t * 0.4))})">`
        + sh(heartD(0, 0, 6), ORANGE, 1.4) + fl(heartD(0, 0.5, 3), '#ffd36b') + '</g>'
        + dots([[r(-8 - sway), r(-16 - rise * 1.8)], [r(9 + sway), r(-12 - rise * 1.4)]], 1.2, '#ffb35a');
      break;
    case 'konbini_star_sign': {
      let rays = '';
      const len = r(8 + ease(t) * 14), in0 = r(18 + ease(t) * 6);
      for (let i = 0; i < 8; i++) {
        const a = i * 45 + 22;
        const [x1, y1] = pol(0, 0, in0, a), [x2, y2] = pol(0, 0, in0 + len * (i % 2 ? 0.6 : 1), a);
        rays += `M${x1},${y1} L${x2},${y2} `;
      }
      s = ln(rays, 2, '#f6cf6b') + spark(-26, -14, r(p * 0.55), '#fff3b0', t * 120) + spark(27, 10, r(p * 0.45), '#fff3b0', -t * 120)
        + spark(8, -30, r(p * 0.35), WHITE);
      break;
    }
    case 'konbini_clerk':
      s = `<g transform="scale(${p})">${ln('M-10,-34 C-6,-40 6,-40 10,-34', 1.6)}${ln('M8,-37 l3,3 l-4,1', 1.6)}</g>`
        + `<g transform="translate(${20 + sway},${-32 - rise})">${txt(0, 0, '♪', 14, BERRY)}</g>`;
      break;
    case 'konbini_coffee_machine':
      s = `<g transform="translate(${sway * 0.6},${-24 - rise}) scale(${p})">`
        + ln('M-3,10 q-2,-3 0,-6 M3,10 q2,-3 0,-6', 1.4, '#c8b6a6')
        + `<path d="${heartD(0, -4, 7)}" fill="#fff" fill-opacity=".7" stroke="#c8b6a6" stroke-width="1.6"/>` + '</g>';
      break;
    case 'konbini_umbrella': {
      const up = r(12 - ease(Math.min(1, t / 0.4)) * 18);
      s = `<g transform="translate(0,${up}) scale(${p})">`
        + sh(blob(-4.5, -7, 3, 3), '#8cc66d', 1.2) + sh(blob(4.5, -7, 3, 3), '#8cc66d', 1.2)
        + sh(blob(0, -1, 8.5, 6), '#8cc66d', 1.4)
        + dots([[-4.5, -7], [4.5, -7]], 1.1, EYE) + ln('M-3,0 q3,2.5 6,0', 1.1, EYE) + '</g>'
        + (t > 0.3 ? `<g transform="translate(14,${-14 - rise})">${txt(0, 0, 'ribbit', 7, '#5f9a58', 800)}</g>` : '');
      break;
    }
  }
  return `<g opacity="${alpha}" stroke-linecap="round" stroke-linejoin="round">${s}</g>`;
}

/* =====================================================================
   NEWSPAPER
   ===================================================================== */
/** Rolled newspaper lying on the home floor by the door, with a sparkle when unread. (0,0) = its centre on the floor. */
export function newspaperOnFloor(unread: boolean, time: number): string {
  if (!unread) {
    // read: lying open-ish and flat, folded once
    const sheet = 'M-17,-6 L13,-8 L18,5 L-13,7z';
    return `<g stroke-linecap="round" stroke-linejoin="round">`
      + `<ellipse cx="1" cy="7" rx="19" ry="3" fill="${INK}" opacity=".14"/>`
      + sh(sheet, '#f3ead8', 1.8)
      + ln('M-2,-7 L2,6', 1.1, '#cbb9a2')
      + ln('M-13,-3 h8 M-12,0 h8 M-11,3 h7 M4,-4.5 h8 M5,-1.5 h8 M6,1.5 h7', 1, '#a89584')
      + '</g>';
  }
  const bob = r(-Math.abs(Math.sin(time * 2.2)) * 2);
  const sp = r(0.45 + 0.18 * Math.sin(time * 4));
  return `<g stroke-linecap="round" stroke-linejoin="round">`
    + `<ellipse cx="0" cy="7" rx="${r(18 + bob * 0.6)}" ry="3" fill="${INK}" opacity=".16"/>`
    + `<g transform="translate(0,${bob})">`
    + sh('M-15,-6 C-6,-7 6,-7 14,-6 L14,6 C6,7 -6,7 -15,6 C-18,4 -18,-4 -15,-6z', '#f3ead8', 1.8)
    + ln('M-10,-3 h18 M-10,0 h14 M-10,3 h17', 0.9, '#b9a690')
    + sh(blob(14, 0, 3.6, 6, 0), '#fbf5e9', 1.6)
    + ln('M14,-3.4 C16,-2.8 16,2.8 14,2.6 C12.5,2.4 12.5,-1 14,-1', 0.9, '#a89584')
    // string tied around with a bow
    + ln('M-2,-6.8 V6.8 M2,-6.8 V6.8', 1.2, '#c4506a')
    + ln('M0,-7 C-4,-12 -8,-10 -5,-7.5 C-3,-6.5 -1,-7 0,-7 C4,-12 8,-10 5,-7.5 C3,-6.5 1,-7 0,-7', 1.2, '#c4506a')
    + '</g>'
    + spark(17, -12 + bob, sp, '#fff3b0', time * 40)
    + `<circle cx="-15" cy="${r(-11 + bob)}" r="${r(1 + 0.5 * Math.sin(time * 3 + 1))}" fill="#fff3b0" stroke="${INK}" stroke-width=".6"/>`
    + '</g>';
}

/** The Gazette masthead banner (standalone svg, ~320x70): "The Yarn Street Gazette" with a little yarn ball + coffee cup. */
export function gazetteMastheadSvg(size: number): string {
  const h = r(size * 70 / 320);
  const inner = ln('M10,6 H310', 2) + ln('M10,10 H310', 1)
    + ln('M10,60 H310', 1) + ln('M10,64 H310', 2)
    + yarn(30, 34, 13, '#f7b9c9', true, 15) + ln('M40,44 C46,50 52,46 56,52', 1.3, '#e08aa0')
    // coffee cup
    + ln('M298,30 q-2,-3 0,-6 M291,30 q-2,-3 0,-6', 1.3, '#c8b6a6')
    + ln('M300,36 C307,36 307,45 299,45', 2)
    + sh('M281,33 L302,33 L300,48 C299,51 296,52 291.5,52 C287,52 284,51 283,48z', CREAM, 2)
    + fl(blob(291.5, 33.6, 9.6, 1.8), '#9a6a4a')
    + `<g transform="translate(-1,0)">${tinyFace(292.5, 41, 0.55)}</g>`
    + `<text x="160" y="41" font-family="'Baloo 2', Georgia, serif" font-size="27" font-weight="800" fill="${INK}" text-anchor="middle" letter-spacing=".4">The Yarn Street Gazette</text>`
    + txt(160, 54, '★ cozy news, fresh every morning ★', 8, '#a07a66', 600, "'Baloo 2', Georgia, serif", ' letter-spacing="1"')
    + spark(64, 18, 0.35, '#fff3b0') + spark(258, 20, 0.3, '#fff3b0');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 70" width="${size}" height="${h}" role="img" aria-label="The Yarn Street Gazette">`
    + `<g stroke-linecap="round" stroke-linejoin="round">${inner}</g></svg>`;
}

/** Weather icon for the paper (standalone svg). */
export function weatherSvg(w: 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'windy' | 'starry', size: number): string {
  const cloud = (x: number, y: number, s: number, c = WHITE) => {
    const d = `M${r(x - 10 * s)},${r(y + 5 * s)} C${r(x - 15 * s)},${r(y + 5 * s)} ${r(x - 15 * s)},${r(y - 2 * s)} ${r(x - 10 * s)},${r(y - 2 * s)} `
      + `C${r(x - 10 * s)},${r(y - 8 * s)} ${r(x - 2 * s)},${r(y - 10 * s)} ${r(x + 1 * s)},${r(y - 5 * s)} `
      + `C${r(x + 4 * s)},${r(y - 9 * s)} ${r(x + 11 * s)},${r(y - 6 * s)} ${r(x + 10 * s)},${r(y - 1 * s)} `
      + `C${r(x + 15 * s)},${r(y - 1 * s)} ${r(x + 15 * s)},${r(y + 5 * s)} ${r(x + 10 * s)},${r(y + 5 * s)}z`;
    return sh(d, c, 1.8);
  };
  const sun = (x: number, y: number, rad: number, face = true) => {
    let rays = '';
    for (let i = 0; i < 8; i++) {
      const [x1, y1] = pol(x, y, rad + 2.2, i * 45), [x2, y2] = pol(x, y, rad + 5, i * 45);
      rays += `M${x1},${y1} L${x2},${y2} `;
    }
    return ln(rays, 1.8, '#f0a63a') + sh(blob(x, y, rad, rad), '#ffd36b', 1.8) + (face ? tinyFace(x, y, rad / 9) : '');
  };
  let s = '';
  switch (w) {
    case 'sunny': s = sun(16, 16, 8); break;
    case 'cloudy': s = sun(21, 11, 5.5, false) + cloud(15, 18, 0.9) + tinyFace(14.5, 19, 0.5); break;
    case 'rainy':
      s = cloud(16, 13, 0.9, '#e6eef7') + tinyFace(15.5, 14, 0.5)
        + ln('M10,23 l-1.5,3.5 M16,23 l-1.5,3.5 M22,23 l-1.5,3.5', 1.8, '#6f9fd0');
      break;
    case 'snowy':
      s = cloud(16, 13, 0.9, '#f2f6fb') + tinyFace(15.5, 14, 0.5)
        + ln('M10,23 v4 M8,25 h4 M16,25 v4 M14,27 h4 M22,23 v4 M20,25 h4', 1.3, '#7fb0dc');
      break;
    case 'windy':
      s = ln('M4,11 H18 C22,11 23,6 20,5 C18,4.5 16.5,6 17.5,7.5', 2)
        + ln('M3,17 H24 C28,17 29,22 26,23.5 C24,24 22.5,22.5 23.5,21', 2)
        + ln('M6,23 H14', 2)
        + sh('M24,8 C28,6 30,9 29,12 C26,13 23,12 24,8z', LEAF, 1.4);
      break;
    case 'starry':
      s = sh('M14,5 C8,6 5,11 5,16 C5,22 10,27 16,27 C20,27 23,25 25,22 C18,23 13,18 13,12 C13,9 13.5,7 14,5z', '#fbe7a1', 1.8)
        + shut(9, 16, 0.6) + shut(13, 17.5, 0.6)
        + `<path d="${starD(23, 8, 3.6, 1.6)}${starD(27, 16, 2.4, 1.1, 10)}" fill="${MUSTARD}" stroke="${INK}" stroke-width="1" stroke-linejoin="round"/>`;
      break;
  }
  return standalone('0 0 32 32', size, `<g stroke-linecap="round" stroke-linejoin="round">${s}</g>`, w);
}

