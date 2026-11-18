/* Cleanup art: dust bunnies, cobwebs, stray boxes, coffee spills, and dashed
   "place it here" ghosts for setting up. Uses the shared kit; deterministic,
   no filters. Each piece stays well under 20 elements (called every frame). */
import type { MessKind } from '../types';
import { INK, EYE, BLUSH, CREAM, fl, ln, sh, blob, box, shadow, g } from './kit';

const BERRY = '#c4506a';
const r1 = (n: number) => +n.toFixed(1);
const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

/** Little 4-point sparkle star. */
const sparkle = (x: number, y: number, s: number, op: number, color = '#f6d77a') =>
  `<path d="M${r1(x)},${r1(y - 5 * s)} Q${r1(x + 0.9 * s)},${r1(y - 0.9 * s)} ${r1(x + 5 * s)},${r1(y)} Q${r1(x + 0.9 * s)},${r1(y + 0.9 * s)} ${r1(x)},${r1(y + 5 * s)} Q${r1(x - 0.9 * s)},${r1(y + 0.9 * s)} ${r1(x - 5 * s)},${r1(y)} Q${r1(x - 0.9 * s)},${r1(y - 0.9 * s)} ${r1(x)},${r1(y - 5 * s)}z" fill="${color}" stroke="${INK}" stroke-width="1" stroke-linejoin="round" opacity="${r1(op)}"/>`;

/* ------------------------------------------------------------- dust */

function dust(c: number, t: number): string {
  const sc = 1 - c * 0.75, op = 1 - c * 0.9;
  const sq = Math.sin(t * 3.2) * 0.05, tilt = Math.sin(t * 1.7) * 3;
  // fluffy scalloped body ~24 wide, sitting on the floor
  const fluff = 'M-12,-1 C-15,-3 -14,-8 -11,-9 C-12,-13 -8,-16 -5,-14 C-4,-18 2,-18 3,-14 '
    + 'C6,-17 11,-14 10,-10 C14,-10 15,-5 12,-3 C14,0 11,2 8,1 C5,3 -5,3 -8,1 C-11,2 -14,1 -12,-1z';
  const tufts = 'M-13,-6 l-3,-1 M12,-7 l3,-2 M-2,-17 l-1,-3 M2,-17 l1,-2.5';
  const blink = (t % 3.6) < 0.18;
  let body = sh(fluff, '#c9c3cc', 2)
    + fl('M-8,-6 C-6,-12 4,-13 7,-8 C3,-10 -4,-10 -8,-6z', '#e2dde4', 0.9)
    + ln(tufts, 1.4)
    // face: sleepy curved eyes or round dots on blink-open
    + (blink
      ? ln('M-6,-6 q1.5,1.2 3,0 M3,-6 q1.5,1.2 3,0', 1.2, EYE)
      : `<circle cx="-4.5" cy="-6" r="1.3" fill="${EYE}"/><circle cx="4.5" cy="-6" r="1.3" fill="${EYE}"/>`)
    + `<ellipse cx="0" cy="-2.6" rx="1.1" ry="1.4" fill="${EYE}"/>`
    + `<circle cx="-8" cy="-3.5" r="1.6" fill="${BLUSH}" opacity=".8"/><circle cx="8" cy="-3.5" r="1.6" fill="${BLUSH}" opacity=".8"/>`;
  body = g(`scale(${r1(sc * (1 + sq))},${r1(sc * (1 - sq))}) rotate(${r1(tilt)},0,-6)`, body);
  let s = shadow(0, 0, r1(13 * sc), r1(2.6 * sc), 0.14 * op);
  s += `<g opacity="${r1(op)}">${body}</g>`;
  if (c > 0.05) {
    const so = Math.sin(clamp01(c) * Math.PI);
    s += sparkle(-12, -16 - c * 6, 0.8 + c * 0.4, so) + sparkle(11, -10 - c * 8, 0.6 + c * 0.3, so, CREAM);
  }
  return s;
}

/* ------------------------------------------------------------- cobweb */

function cobweb(c: number, t: number): string {
  const op = 1 - clamp01(c);
  if (op <= 0.01) return '';
  const R = 22, N = 8;
  let spokes = '', rings = '';
  const pt = (i: number, rr: number) => {
    const a = (i / N) * Math.PI * 2 + 0.2;
    return { x: Math.cos(a) * rr, y: Math.sin(a) * rr };
  };
  for (let i = 0; i < N; i++) {
    const p = pt(i, R * (i % 2 ? 0.92 : 1));
    spokes += `M0,0 L${r1(p.x)},${r1(p.y)} `;
  }
  for (const rr of [7, 13.5, 19]) {
    for (let i = 0; i < N; i++) {
      const a = pt(i, rr), b = pt(i + 1, rr), m = pt(i + 0.5, rr * 0.82); // sag toward centre
      rings += `${i === 0 ? `M${r1(a.x)},${r1(a.y)} ` : ''}Q${r1(m.x)},${r1(m.y)} ${r1(b.x)},${r1(b.y)} `;
    }
  }
  const sway = Math.sin(t * 1.4) * 1.5, drop = 26 + Math.sin(t * 0.9) * 2;
  const sx = 6 + sway, sy = 4 + drop;
  let s = `<g opacity="${r1(op)}">`
    + `<path d="${spokes}${rings}" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" opacity=".55"/>`
    + ln(spokes + rings, 1, '#a99ea6')
    + ln(`M6,4 L${r1(sx)},${r1(sy - 5)}`, 0.8, '#a99ea6')
    // tiny spider
    + ln(`M${r1(sx - 4)},${r1(sy - 2)} l-3,-2 M${r1(sx - 4)},${r1(sy + 1)} l-3.5,1 M${r1(sx + 4)},${r1(sy - 2)} l3,-2 M${r1(sx + 4)},${r1(sy + 1)} l3.5,1`, 1.1)
    + sh(blob(sx, sy, 5, 4.6, 0.1), '#8c7a86', 1.5)
    + `<circle cx="${r1(sx - 1.8)}" cy="${r1(sy - 0.6)}" r="0.9" fill="${CREAM}"/><circle cx="${r1(sx + 1.8)}" cy="${r1(sy - 0.6)}" r="0.9" fill="${CREAM}"/>`
    + ln(`M${r1(sx - 1.2)},${r1(sy + 1.4)} q1.2,1.1 2.4,0`, 0.8, CREAM)
    + `</g>`;
  if (c > 0.05) s += sparkle(-10, 10, 0.7, Math.sin(clamp01(c) * Math.PI), CREAM);
  return s;
}

/* ------------------------------------------------------------- box */

function cardboard(c: number, t: number): string {
  const cc = clamp01(c), op = 1 - cc;
  if (op <= 0.01) return '';
  const lift = cc * 22, wob = Math.sin(t * 2) * 0.6;
  let s = shadow(0, 0, r1(20 - cc * 8), r1(4 - cc * 1.5), 0.15 * op);
  let b = '';
  // yarn poking out behind the flap
  b += sh(blob(7, -31, 6, 5.5, 0.2), '#f2a7b8', 1.8) + ln('M3,-34 q4,-2 8,1 M3,-30 q4,-2 9,0', 1, '#c97a8c');
  b += ln('M12,-28 C18,-26 17,-20 21,-18', 1.4, '#c97a8c');
  // body + front face shading
  b += sh(box(-18, -30, 36, 30, 3, 0.8), '#e3b98a');
  b += fl('M-17,-6 L17,-6 L17,-1 L-17,-1z', '#cf9f6e', 0.6);
  // open flaps
  b += sh('M-18,-30 L-24,-37 C-15,-38 -8,-37 -2,-36 L-1,-30z', '#edc89c', 2);
  b += sh('M18,-30 L22,-38 C17,-39 12,-38 9,-37 L8,-30z', '#edc89c', 2);
  // tape strip
  b += sh('M-3,-30 L3,-30 L3,-14 L-3,-14z', '#f7e7c1', 1.4);
  // little "fragile" heart doodle + cute face
  b += ln('M-12,-19 c-1.5,-2.5 -4.5,-0.5 -2.2,1.8 l2.2,2 l2.2,-2 c2.3,-2.3 -0.7,-4.3 -2.2,-1.8z', 1.2, BERRY);
  b += `<circle cx="7" cy="-19" r="1.2" fill="${EYE}"/><circle cx="13" cy="-19" r="1.2" fill="${EYE}"/>` + ln('M8.6,-16.6 q1.4,1.2 2.8,0', 1, EYE);
  s += `<g opacity="${r1(op)}" transform="translate(0,${r1(-lift)}) rotate(${r1(wob + cc * 6)},0,-15)">${b}</g>`;
  if (cc > 0.05) s += sparkle(-20, -26 - lift, 0.8, Math.sin(cc * Math.PI));
  return s;
}

/* ------------------------------------------------------------- spill */

function spill(c: number, t: number): string {
  const cc = clamp01(c), op = 1 - cc * 0.85, sc = 1 - cc * 0.8;
  if (sc <= 0.02) return '';
  const shine = 0.55 + Math.sin(t * 2.2) * 0.15;
  const puddle = 'M-30,1 C-32,-4 -24,-8 -16,-7 C-12,-10 -2,-9 4,-8 C12,-10 24,-9 28,-5 '
    + 'C33,-3 31,3 25,4 C20,8 10,7 4,6 C-4,9 -14,8 -18,5 C-25,6 -30,4 -30,1z';
  let s = `<g opacity="${r1(op)}" transform="scale(${r1(sc)})">`
    + sh(puddle, '#c69c74', 2)
    + fl('M-24,0 C-22,-4 -12,-5 -6,-3 C-12,-2 -20,-1 -24,0z', '#f6e2c8', shine)
    + `<ellipse cx="12" cy="-1" rx="3" ry="1.3" fill="#f6e2c8" opacity="${r1(shine)}"/>`
    + `<ellipse cx="34" cy="2" rx="2" ry="1.2" fill="#c69c74" stroke="${INK}" stroke-width="1.2"/>`
    + `</g>`;
  // tipped cup at the left edge (fades faster)
  const cop = 1 - clamp01(cc * 1.6);
  if (cop > 0.01) {
    const cup = sh('M-6,-7 C-2,-8 8,-7 10,-6 L9,5 C6,6 -2,6 -6,5z', CREAM, 2)
      + fl('M-5,-1 L9,-1 L9,2 L-5,2z', '#9fd3c7', 0.8)
      + sh(blob(-6, -1, 2.4, 6, 0.1), '#8a5a3e', 1.8)
      + ln('M10,-3 c5,-1 5,6 0,5', 1.8);
    s += `<g opacity="${r1(cop)}" transform="translate(-36,-5) rotate(-8)">${cup}</g>`;
  }
  if (cc > 0.05) s += sparkle(18, -12, 0.8, Math.sin(cc * Math.PI), CREAM);
  return s;
}

/** A piece of mess centred at (0,0) (box/dust/spill sit on the floor: (0,0) is their floor centre;
 *  cobweb hangs in a wall corner: (0,0) is its centre). cleaned = 0 (fully messy) .. 1 (gone): shrink/fade as it's cleaned.
 *  time for a little idle wiggle (dust bunnies have tiny faces and jiggle). */
export function mess(kind: MessKind, cleaned: number, time: number): string {
  const c = clamp01(cleaned);
  if (c >= 1) return '';
  switch (kind) {
    case 'dust': return dust(c, time);
    case 'cobweb': return cobweb(c, time);
    case 'box': return cardboard(c, time);
    case 'spill': return spill(c, time);
  }
  return '';
}

/* ------------------------------------------------------------- ghosts */

const dashed = (d: string, w = 2.2, op = 0.85) =>
  `<path d="${d}" fill="none" stroke="${BERRY}" stroke-width="${w}" stroke-dasharray="6 5" stroke-linecap="round" stroke-linejoin="round" opacity="${r1(op)}"/>`;

/** Round "+" badge. */
const plusBadge = (x: number, y: number, s: number) =>
  `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(9 * s)}" fill="${CREAM}" stroke="${BERRY}" stroke-width="2"/>`
  + ln(`M${r1(x - 4 * s)},${r1(y)} h${r1(8 * s)} M${r1(x)},${r1(y - 4 * s)} v${r1(8 * s)}`, 2.2, BERRY);

/** Dashed "place it here" outline for setting up: 'table' at a table floor point, 'decor_ceiling' (full-width bunting outline
 *  from (0,0), drawn ~28 lower like the real bunting), 'decor_back' (record-player-sized box, bottom-centre at (0,0)). pulse 0..1. */
export function placeGhost(kind: 'table' | 'decor_ceiling' | 'decor_back', pulse: number): string {
  const q = clamp01(pulse), op = 0.55 + 0.4 * q, bs = 1 + q * 0.12;
  if (kind === 'table') {
    const top = blob(0, -36, 36, 9, 0.15);
    return `<ellipse cx="0" cy="0" rx="${r1(38 + q * 3)}" ry="7" fill="${BERRY}" opacity="${r1(0.08 + q * 0.06)}"/>`
      + dashed(blob(0, 0, 38 + q * 3, 7.5, 0.2), 1.8, op * 0.8)
      + fl(top, '#ffffff', 0.35 + q * 0.15)
      + `<path d="M-6,-28 L-5,-4 L5,-4 L6,-28z" fill="#ffffff" opacity=".25"/>`
      + dashed(top, 2.2, op)
      + dashed('M-6,-28 L-5,-4 M6,-28 L5,-4 M-16,-1 Q0,-6 16,-1', 2, op)
      + plusBadge(0, -36, bs);
  }
  if (kind === 'decor_ceiling') {
    let str = '', flags = '';
    for (const [x0, x1] of [[-6, 180], [180, 366]] as [number, number][]) {
      str += `M${x0},12 Q${(x0 + x1) / 2},44 ${x1},12 `;
      for (let k = 0; k < 6; k++) {
        const t = (k + 0.75) / 6.5, x = x0 + (x1 - x0) * t, y = 12 + 32 * t * (1 - t) + 1;
        flags += `M${r1(x - 11)},${r1(y)} L${r1(x + 11)},${r1(y)} L${r1(x)},${r1(y + 25)}z `;
      }
    }
    return `<g transform="translate(0,28)">`
      + `<path d="${flags}" fill="#ffffff" opacity="${r1(0.22 + q * 0.12)}"/>`
      + dashed(str, 2, op) + dashed(flags, 1.8, op)
      + plusBadge(180, 34, bs)
      + `</g>`;
  }
  // decor_back: record-player-sized box
  const outline = box(-36, -90, 72, 90, 10, 1);
  return shadow(0, 0, 36, 5, 0.1)
    + fl(outline, '#ffffff', 0.25 + q * 0.12)
    + dashed(outline, 2.2, op)
    + `<g opacity="${r1(0.35 + q * 0.2)}">`
    + `<ellipse cx="-11" cy="-30" rx="5" ry="3.8" fill="${BERRY}" transform="rotate(-18,-11,-30)"/>`
    + `<ellipse cx="11" cy="-34" rx="5" ry="3.8" fill="${BERRY}" transform="rotate(-18,11,-34)"/>`
    + ln('M-6.5,-31 V-56 L15.5,-60 V-35', 2.4, BERRY) + ln('M-6.5,-50 L15.5,-54', 2.4, BERRY)
    + `</g>`
    + plusBadge(0, -72, bs);
}
