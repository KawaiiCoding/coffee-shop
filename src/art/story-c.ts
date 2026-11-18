/* Story illustrations C (v3): phone_gift, regular_gift, konbini_open, shooting_star, cooking_first,
   fireplace_night, mom_visits_cafe, friends_party, festival_coming, new_dream.
   Inner markup for viewBox 0 0 320 240. Picture-book panels using the shared kit (same style as story-a/b). */
import type { CharacterLook, Mood, StoryArtId } from '../types';
import { INK, CREAM, fl, ln, sh, g, blob, box, shadow, tinyFace } from './kit';
import { character } from './character';
import { item } from './items';
import { n, rng, heart, SPARK, pumpkin } from './core';

/* ---------------- looks ---------------- */
const MOCHA_APRON: CharacterLook = { species: 'bear', color: '#d9a877', accessory: 'apron', accentColor: '#e58a94', apronColor: '#fff6ea', hat: 'none' };
const MOCHA_SCARF: CharacterLook = { species: 'bear', color: '#d9a877', accessory: 'scarf', accentColor: '#e58a94', hat: 'none' };
const BUTTON: CharacterLook = { species: 'cat', color: '#b9b3c9', accessory: 'apron', accentColor: '#8fb39b', apronColor: '#fff6ea', hat: 'none' };
const MOM: CharacterLook = { species: 'bear', color: '#f1dcc0', accessory: 'none', accentColor: '#e58a94', hat: 'none' };
const POM: CharacterLook = { species: 'bunny', color: '#fbf6f2', accessory: 'bow', accentColor: '#f59fb0', hat: 'none' };
const MAPLE: CharacterLook = { species: 'fox', color: '#e8935a', accessory: 'beret', accentColor: '#c4506a', hat: 'none' };

/* ---------------- small helpers ---------------- */
const bg = (c: string) => `<rect x="0" y="0" width="320" height="240" fill="${c}"/>`;
const faint = (d: string, w = 1.4, op = 0.22) =>
  `<path d="${d}" fill="none" stroke="${INK}" stroke-opacity="${op}" stroke-width="${w}" stroke-linecap="round"/>`;
const spark = (x: number, y: number, s: number, c = '#fff3b0') =>
  `<path transform="translate(${x},${y}) scale(${s})" d="${SPARK}" fill="${c}" stroke="${INK}" stroke-width="${n(1.1 / s)}" stroke-linejoin="round"/>`;
const hrt = (x: number, y: number, s: number, c = '#f59fb0') => heart(x, y, s, c, INK);
const glow = (cx: number, cy: number, r: number, c: string, op: number) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${c}" opacity="${op}"/>`;
const steam = (x: number, y: number, s = 1, c = '#ffffff') =>
  `<path d="M${x},${y} q${-3 * s},${-4 * s} 0,${-8 * s} q${3 * s},${-4 * s} 0,${-8 * s} M${x + 6 * s},${y + 1} q${-3 * s},${-4 * s} 0,${-8 * s} q${3 * s},${-4 * s} 0,${-8 * s}" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round" opacity=".85"/>`;

/** Five-point star path centred (0,0), outer radius r. */
function starPath(r: number, inner = 0.48): string {
  let d = '';
  for (let i = 0; i < 10; i++) {
    const a = (i * 36 - 90) * Math.PI / 180, rr = i % 2 ? r * inner : r;
    d += `${i ? 'L' : 'M'}${n(Math.cos(a) * rr)},${n(Math.sin(a) * rr)} `;
  }
  return d + 'z';
}
const star = (x: number, y: number, r: number, c = '#ffe08a', w = 1.4) =>
  g(`translate(${x},${y})`, sh(starPath(r), c, w));

/** Many tiny dots in one path (stars, snow). */
function dots(seed: number, count: number, x0: number, y0: number, w: number, h: number, r: number, c: string, op = 1): string {
  const R = rng(seed);
  let d = '';
  for (let i = 0; i < count; i++) {
    const x = n(x0 + R() * w), y = n(y0 + R() * h), rr = n(r * (0.6 + R() * 0.6));
    d += `M${n(x - rr)},${y} a${rr},${rr} 0 1,0 ${n(rr * 2)},0 a${rr},${rr} 0 1,0 ${n(-rr * 2)},0z `;
  }
  return `<path d="${d}" fill="${c}"${op < 1 ? ` opacity="${op}"` : ''}/>`;
}

/** Confetti: one path per colour. */
function confetti(seed: number, count: number, x0: number, y0: number, w: number, h: number): string {
  const R = rng(seed), cols = ['#f7b6c8', '#ffe08a', '#bfe3d0', '#c9b6e4', '#9fc3d4'];
  const ds = cols.map(() => '');
  for (let i = 0; i < count; i++) {
    const x = n(x0 + R() * w), y = n(y0 + R() * h), a = R() * Math.PI;
    const dx = n(Math.cos(a) * 3.2), dy = n(Math.sin(a) * 3.2), ox = n(-Math.sin(a) * 1.5), oy = n(Math.cos(a) * 1.5);
    ds[i % cols.length] += `M${n(x - dx - ox)},${n(y - dy - oy)} l${n(dx * 2)},${n(dy * 2)} l${n(ox * 2)},${n(oy * 2)} l${n(-dx * 2)},${n(-dy * 2)}z `;
  }
  return ds.map((d, i) => `<path d="${d}" fill="${cols[i]}" stroke="${INK}" stroke-width=".8" stroke-linejoin="round"/>`).join('');
}

/** Five-petal flower (two elements). */
const PETALS = (() => {
  let d = '';
  for (let i = 0; i < 5; i++) {
    const a = (i * 72 + 10) * Math.PI / 180;
    const p = (ang: number, r: number) => `${n(Math.sin(ang) * r)},${n(-Math.cos(ang) * r)}`;
    d += `M${p(a, 0.8)} C${p(a - 0.75, 4.2)} ${p(a - 0.3, 6.4)} ${p(a, 6.4)} C${p(a + 0.3, 6.4)} ${p(a + 0.75, 4.2)} ${p(a, 0.8)}z `;
  }
  return d.trim();
})();
const flower = (x: number, y: number, s: number, petal: string, mid: string, w = 1.1) =>
  `<g transform="translate(${n(x)},${n(y)}) scale(${s})"><path d="${PETALS}" fill="${petal}" stroke="${INK}" stroke-width="${n(w / s)}" stroke-linejoin="round"/><circle r="2" fill="${mid}"/></g>`;

/** Mirror absolute "x,y" pairs of a path horizontally. */
const mirror = (d: string) => d.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, (_m, x, y) => `${n(-parseFloat(x))},${y}`);

/* ---------------- characters with custom arms ---------------- */
const DOLL_STAND = 'scale(0.88) translate(0,-35)';
const DOLL_SIT = 'scale(0.88) translate(0,-11)';
const ARM_R = 'M13,-6 C22,-3 26,6 22,10 C18,13 14,6 12,0z';
const ARM_L = 'M-14,-6 C-23,-2 -26,8 -21,11 C-17,13 -14,6 -12,0z';
const BODY_TAG = '<path d="M-11,-15 C-19,-4 -20,18 -12,24 C-5,28 8,28 13,23 C20,16 17,-5 10,-15z"';
const EAR_TAG: Record<string, string> = {
  bear: '<path d="M-18,-42 C-25,-50 -14,-59 -8,-49z"',
  cat: '<path d="M-18,-40 C-21,-52 -18,-59 -15,-59 C-11,-57 -7,-52 -5,-49z"',
};

/* custom arm poses (right side, doll coords) */
const ARM_UP = 'M8,-11 C14,-18 18,-28 21,-36 C23,-41 30,-40 29,-34 C27,-25 22,-13 14,-4z';
const ARM_FWD = 'M9,-11 C17,-12 26,-12 32,-11 C37,-10 37,-3 32,-3 C25,-3 17,-2 11,-1z';
const ARM_CHEST = 'M12,-9 C18,-3 15,5 7,6 C2,6 1,1 5,0 C8,-1 9,-4 9,-9z';
const ARM_PRAY = 'M12,-9 C15,-3 11,0 5,-5 C2,-8 0,-14 2,-16 C5,-17 6,-12 7,-10 C8,-9 9,-9 9,-10z';

function strip(svg: string, d: string): string {
  const tag = `<path d="${d}"`;
  let i = svg.indexOf(tag);
  while (i >= 0) {
    const e = svg.indexOf('/>', i);
    if (e < 0) break;
    svg = svg.slice(0, i) + svg.slice(e + 2);
    i = svg.indexOf(tag);
  }
  return svg;
}
const insertBefore = (svg: string, tag: string, add: string, frame: string) => {
  const i = svg.indexOf(tag);
  return i < 0 ? svg + `<g transform="${frame}">${add}</g>` : svg.slice(0, i) + add + svg.slice(i);
};

interface FigOpts {
  armR?: string | null;
  armL?: string | null;   // given in right-side coords, mirrored
  armsFront?: boolean;
  mid?: string;           // between body and head (bear / cat)
  front?: string;         // on top of everything (doll coords)
  sit?: boolean;
}
function fig(look: CharacterLook, x: number, y: number, s: number, mood: Mood, facing: 1 | -1, o: FigOpts = {}): string {
  const frame = o.sit ? DOLL_SIT : DOLL_STAND;
  let c = character(look, { pose: o.sit ? 'sit' : 'stand', mood, facing: 1 });
  let arms = '';
  if (o.armR !== undefined) { c = strip(c, ARM_R); if (o.armR) arms += sh(o.armR, look.color); }
  if (o.armL !== undefined) { c = strip(c, ARM_L); if (o.armL) arms += sh(mirror(o.armL), look.color); }
  if (arms && !o.armsFront) c = insertBefore(c, BODY_TAG, arms, frame);
  if (o.mid) c = insertBefore(c, EAR_TAG[look.species] ?? BODY_TAG, o.mid, frame);
  let top = o.front ?? '';
  if (arms && o.armsFront) top += arms;
  if (top) c += `<g transform="${frame}" stroke-linecap="round" stroke-linejoin="round">${top}</g>`;
  return g(`translate(${x},${y}) scale(${n(s * facing)},${s})`, c);
}
/** Screen point of a doll-coord point for a standing figure. */
const at = (x: number, y: number, s: number, facing: 1 | -1, dx: number, dy: number): [number, number] =>
  [n(x + s * 0.88 * dx * facing), n(y + s * 0.88 * (dy - 35))];
const paw = (x: number, y: number, c: string, r = 4.5) => sh(blob(x, y, r, r * 0.9, 0.2), c, 1.8);

const GLASSES = `<circle cx="-8" cy="-31" r="5.6" fill="#ffffff" fill-opacity=".25" stroke="${INK}" stroke-width="1.6"/>`
  + `<circle cx="9" cy="-30.5" r="5.6" fill="#ffffff" fill-opacity=".25" stroke="${INK}" stroke-width="1.6"/>`
  + ln('M-2.4,-31.5 C-0.5,-33 1.5,-33 3.4,-31', 1.5) + ln('M-13.6,-32 L-19,-34 M14.6,-31.5 L20,-33', 1.4);
const SHAWL = 'M-16,-16 C-6,-10 6,-10 16,-16 C21,-9 20,0 15,4 C9,0 4,6 0,12 C-4,6 -9,0 -15,4 C-20,-1 -21,-10 -16,-16z';
const shawlMarks = () => sh(SHAWL, '#f6c9d6', 2)
  + flower(-10, -6, 0.38, CREAM, '#e58a94', 0.9) + flower(9, -5, 0.38, '#ffe08a', '#e58a94', 0.9)
  + faint('M-15,4 l-1,4 M-12,3 l-1,4 M12,3 l1,4 M15,4 l1,4', 1.2, 0.5);

/* ---------------- shared scenery ---------------- */
/** Café wall with heart wallpaper, wainscot and plank floor (floor top at y≈176). */
function cafeRoom(wall = '#f8dccd', dot = '#f2c6b4', dado = '#eebfae', floor = '#e6bf92'): string {
  let hearts = '';
  for (let r = 0; r < 5; r++) for (let c = 0; c < 11; c++) {
    const x = 12 + c * 30 + (r % 2) * 15, y = 14 + r * 26;
    hearts += `M${x},${y + 3} c-5,-3.5 -3,-7 0,-4.5 c3,-2.5 5,1 0,4.5z `;
  }
  return bg(wall) + `<path d="${hearts}" fill="${dot}"/>`
    + `<rect x="0" y="138" width="320" height="38" fill="${dado}"/>`
    + sh(box(-6, 134, 332, 7, 3, 0.5), '#b57a5e', 1.8)
    + `<rect x="0" y="176" width="320" height="64" fill="${floor}"/>`
    + sh(box(-6, 173, 332, 6, 3, 0.5), '#b57a5e', 1.8)
    + faint('M0,194 C100,195 220,193 320,194 M0,212 C100,213 220,211 320,212 M0,230 C100,231 220,229 320,230 M70,179 L66,194 M190,179 L188,194 M130,194 L126,212 M250,194 L248,212', 1.1, 0.18);
}

/** Wooden table seen from the side, top centred at (cx, y), legs reach y+h. */
function table(cx: number, y: number, w: number, h = 54, top = '#d39a72'): string {
  const lx = cx - w / 2 + 14, rx = cx + w / 2 - 22;
  return shadow(cx, y + h, w * 0.55, 4)
    + sh(`M${lx},${y + 6} L${lx - 1},${y + h} l8,0 L${lx + 8},${y + 6}z M${rx},${y + 6} L${rx},${y + h} l8,0 L${rx + 8},${y + 6}z`, '#b57a5e', 2)
    + sh(box(cx - w / 2, y - 4, w, 12, 5, 1), top)
    + ln(`M${cx - w / 2 + 8},${y + 1} C${cx - 10},${y + 2} ${cx + 10},${y} ${cx + w / 2 - 10},${y + 1}`, 1, CREAM);
}

/** Chair back + seat, sitter on the right of the back when f=1. */
function chair(x: number, y: number, f: 1 | -1, c = '#b57a5e'): string {
  const bx = x - 22 * f;
  return sh(`M${bx - 4},${y + 4} C${bx - 5},${y - 30} ${bx - 3},${y - 50} ${bx - 4},${y - 62} C${bx},${y - 68} ${bx + 4},${y - 68} ${bx + 4},${y - 62} C${bx + 3},${y - 40} ${bx + 4},${y - 20} ${bx + 4},${y + 4}z`, c)
    + sh(box(x - 26, y - 2, 52, 8, 4, 0.5), '#d39a72')
    + sh(`M${x - 22},${y + 6} L${x - 22},${y + 34} l6,0 L${x - 16},${y + 6}z M${x + 16},${y + 6} L${x + 16},${y + 34} l6,0 L${x + 22},${y + 6}z`, c, 2);
}

function curtain(x: number, y: number, h: number, side: 1 | -1, c: string): string {
  const k = side;
  const d = `M${x},${y} C${x + 18 * k},${y} ${x + 22 * k},${y + 2} ${x + 22 * k},${y + 6} C${x + 12 * k},${y + h * 0.35} ${x + 6 * k},${y + h * 0.6} ${x + 12 * k},${y + h} C${x + 6 * k},${y + h + 2} ${x + 2 * k},${y + h} ${x},${y + h}z`;
  return sh(d, c, 2);
}

/** Window frame with a sky fill and cross bars; `inside` drawn over the sky before the frame line. */
function windowPane(x: number, y: number, w: number, h: number, sky: string, inside = ''): string {
  return sh(box(x - 7, y - 7, w + 14, h + 14, 5, 1), '#c99a73')
    + fl(box(x, y, w, h, 3, 0.4), sky) + inside
    + ln(box(x, y, w, h, 3, 0.4), 2)
    + ln(`M${x + w / 2},${y} L${x + w / 2},${y + h} M${x},${y + h / 2} L${x + w},${y + h / 2}`, 4.5)
    + ln(`M${x + w / 2},${y} L${x + w / 2},${y + h} M${x},${y + h / 2} L${x + w},${y + h / 2}`, 2.2, '#c99a73')
    + sh(box(x - 10, y + h + 4, w + 20, 7, 3, 0.4), '#d9a07a', 2);
}

function bunting(x1: number, y1: number, x2: number, y2: number, sag: number, cols: string[]): string {
  const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2 + sag;
  let d = '';
  const N = cols.length;
  let s = ln(`M${x1},${y1} Q${cx},${cy} ${x2},${y2}`, 1.6);
  const by: Record<string, string> = {};
  for (let i = 0; i < N; i++) {
    const t = (i + 0.5) / N, u = 1 - t;
    const px = n(u * u * x1 + 2 * u * t * cx + t * t * x2), py = n(u * u * y1 + 2 * u * t * cy + t * t * y2);
    d = `M${px - 9},${py} C${px - 3},${py + 1} ${px + 3},${py + 1} ${px + 9},${py} C${px + 5},${py + 6} ${px + 2},${py + 12} ${px},${py + 15} C${px - 2},${py + 12} ${px - 5},${py + 6} ${px - 9},${py}z `;
    by[cols[i]] = (by[cols[i]] ?? '') + d;
  }
  for (const c of Object.keys(by)) s += sh(by[c], c, 1.6);
  return s;
}

function cloud(x: number, y: number, s: number, c = '#ffffff'): string {
  return g(`translate(${x},${y}) scale(${s})`,
    sh('M-20,6 C-27,6 -27,-4 -18,-4 C-17,-12 -6,-14 -2,-8 C2,-15 14,-14 15,-5 C22,-6 25,4 18,6z', c, 2 / s));
}

/** Gift box centred at (x, bottom y). */
function gift(x: number, y: number, w: number, h: number, c: string, rib: string): string {
  return shadow(x, y, w * 0.6, 2.5)
    + sh(box(x - w / 2, y - h, w, h, 3, 0.6), c, 2)
    + sh(box(x - w / 2 - 2, y - h - 4, w + 4, 7, 2.5, 0.4), c, 2)
    + fl(`M${x - 3},${y - h - 4} L${x + 3},${y - h - 4} L${x + 3},${y} L${x - 3},${y}z`, rib)
    + ln(`M${x - 3},${y - h + 3} L${x - 3},${y - 1} M${x + 3},${y - h + 3} L${x + 3},${y - 1}`, 1.2)
    + sh(`M${x},${y - h - 4} C${x - 6},${y - h - 14} ${x - 14},${y - h - 10} ${x - 10},${y - h - 5}z M${x},${y - h - 4} C${x + 6},${y - h - 14} ${x + 14},${y - h - 10} ${x + 10},${y - h - 5}z`, rib, 1.8);
}

/* ================================================================ panels */

/* --- Button hands Mocha an old pink rotary phone with a bow (café evening) --- */
function rotaryPhone(): string {
  const base = 'M-17,10 C-19,2 -15,-7 -10,-8 L10,-8 C15,-7 19,2 17,10 C6,12 -6,12 -17,10z';
  const hand = 'M-19,-9 C-21,-16 -15,-19 -11,-15 L11,-15 C15,-19 21,-16 19,-9 C16,-7 13,-9 11,-11 L-11,-11 C-13,-9 -16,-7 -19,-9z';
  let holes = '';
  for (let i = 0; i < 8; i++) {
    const a = (i * 34 - 200) * Math.PI / 180;
    holes += `M${n(Math.cos(a) * 4.6 - 1)},${n(2 + Math.sin(a) * 4.6)} a1,1 0 1,0 2,0 a1,1 0 1,0 -2,0z `;
  }
  return sh(base, '#f4a9b8', 2)
    + `<path d="M-14,8 C-8,9 8,9 14,8" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="1.4"/>`
    + sh(blob(0, 2, 7.5, 7, 0), CREAM, 1.6) + `<path d="${holes}" fill="#e58a9c"/>` + `<circle cx="0" cy="2" r="1.6" fill="#e58a9c"/>`
    + sh(hand, '#ee96a8', 2)
    + ln('M17,6 c5,1 4,5 8,5 c4,0 3,4 7,4', 1.4)
    // bow on the handset
    + sh('M0,-15 C-5,-24 -13,-22 -11,-16 C-10,-12 -4,-13 0,-15z M0,-15 C5,-24 13,-22 11,-16 C10,-12 4,-13 0,-15z', '#e2607a', 1.6)
    + sh('M-1,-14 L-5,-6 L-2,-7 L0,-4z M1,-14 L5,-6 L2,-7 L0,-4z', '#e2607a', 1.2)
    + `<circle cx="0" cy="-15" r="2.4" fill="${CREAM}" stroke="${INK}" stroke-width="1.3"/>`;
}

function phoneGift(): string {
  let s = cafeRoom('#efd4cf', '#e6c0bb', '#e3b4a8', '#d9b48c');
  // evening window
  s += windowPane(118, 22, 84, 74, '#c9b6e4',
    fl('M118,66 L202,66 L202,96 L118,96z', '#f5b8c4') + fl('M118,82 L202,82 L202,96 L118,96z', '#ffd39a')
    + fl('M118,96 L118,86 L132,86 L132,80 L146,80 L148,88 L176,88 L176,82 L190,78 L202,84 L202,96z', '#a98aa8', 0.8)
    + star(140, 38, 3.6) + spark(184, 46, 0.4, '#ffffff'));
  s += curtain(110, 14, 84, 1, '#f7b6c8') + curtain(210, 14, 84, -1, '#f7b6c8') + ln('M102,14 C150,11 180,15 218,12', 3);
  // pendant lamps + warm glow
  s += ln('M48,0 V26 M272,0 V26', 1.6) + glow(48, 46, 34, '#ffe6a8', 0.3) + glow(272, 46, 34, '#ffe6a8', 0.3)
    + sh('M34,40 C34,30 40,26 48,26 C56,26 62,30 62,40 C54,42 42,42 34,40z', '#ffd28a')
    + sh('M258,40 C258,30 264,26 272,26 C280,26 286,30 286,40 C278,42 266,42 258,40z', '#ffd28a');
  // counter with a mug on the left
  s += sh(box(-6, 128, 72, 52, 4, 1), '#d9a07a') + sh(box(-8, 122, 78, 9, 3, 0.5), '#b57a5e', 2)
    + sh(box(20, 108, 14, 14, 3, 0.4), CREAM, 1.6) + ln('M34,111 c5,0 5,6 0,6', 1.5);
  s += `<path d="${blob(160, 218, 120, 16, 0)}" fill="#fff3cc" opacity=".35"/>`;
  // Button offers, Mocha receives
  s += fig(BUTTON, 116, 216, 1.25, 'happy', 1, { armR: ARM_FWD });
  s += fig(MOCHA_APRON, 208, 218, 1.25, 'happy', -1, { armR: ARM_FWD });
  s += g('translate(162,160) scale(1.05)', rotaryPhone());
  const [bx, by] = at(116, 216, 1.25, 1, 34, -7), [mx, my] = at(208, 218, 1.25, -1, 34, -7);
  s += paw(bx, by, BUTTON.color) + paw(mx, my, MOCHA_APRON.color);
  s += hrt(150, 128, 0.6) + hrt(176, 120, 0.45, '#f7b6c8') + spark(134, 140, 0.6) + spark(192, 138, 0.7)
    + ln('M232,108 l8,-6 M236,118 l10,-2', 1.8, '#e58a94');
  return s;
}

/* --- Pom the bunny gives Mocha a wrapped gift at a café table --- */
function regularGift(): string {
  let s = cafeRoom();
  s += windowPane(40, 26, 76, 66, '#cfe9f5', cloud(64, 50, 0.6) + cloud(96, 70, 0.4));
  // plant on the sill + frame on the wall
  s += sh('M66,98 C60,86 64,74 72,72 C74,84 72,92 70,98z M76,98 C78,86 86,80 92,80 C90,90 84,96 80,98z', '#8fc3a7', 1.8)
    + sh(box(62, 96, 24, 14, 4, 0.5), '#efa98a', 1.8);
  s += g('translate(250,64) rotate(4)', sh(box(-20, -16, 40, 32, 3, 0.5), '#b57a5e', 2) + fl(box(-14, -10, 28, 20, 2, 0.3), '#fbe2a8')
    + heart(0, -1, 0.7, '#ee8b9c', INK));
  // bunting
  s += bunting(140, 10, 330, 16, 18, ['#f7b6c8', '#ffe08a', '#bfe3d0', '#c9b6e4', '#f7b6c8', '#ffe08a']);
  // Pom seated at the table, Mocha standing
  s += chair(98, 188, 1);
  s += fig(POM, 98, 190, 1.3, 'happy', 1, { sit: true, armR: ARM_FWD });
  s += table(150, 172, 120, 54);
  s += g('translate(118,162) scale(1.1)', item('latte')) + steam(115, 146, 0.8);
  s += gift(160, 168, 28, 20, '#bfe3f5', '#f59fb0');
  s += paw(138, 166, POM.color, 4.2);
  s += fig(MOCHA_APRON, 236, 226, 1.38, 'happy', -1, { armR: ARM_CHEST, armL: ARM_CHEST, armsFront: true });
  s += hrt(196, 112, 0.9) + hrt(178, 96, 0.55, '#f7b6c8') + hrt(214, 88, 0.6) + hrt(160, 128, 0.45, '#f7b6c8') + hrt(256, 110, 0.5)
    + spark(136, 120, 0.6) + spark(286, 140, 0.6, '#ffffff') + spark(184, 140, 0.5, '#ffffff');
  return s;
}

/* --- Hoshi Mart: a cute little convenience store at dusk --- */
function konbiniOpen(): string {
  let s = bg('#a99ad0');
  s += `<rect x="0" y="70" width="320" height="50" fill="#d9a9c9"/><rect x="0" y="110" width="320" height="40" fill="#f5c3b4"/>`;
  s += dots(31, 18, 0, 0, 320, 64, 1.3, '#fff6d8') + star(36, 26, 4) + star(292, 18, 3.4);
  s += `<path d="M-4,150 L-4,118 L18,118 L18,102 L40,102 L40,124 L56,124 L56,150z M262,150 L262,112 L280,104 L298,112 L298,96 L324,96 L324,150z" fill="#8f7fb0" opacity=".7"/>`;
  // pavement
  s += sh('M-4,186 C90,184 230,187 324,185 L324,244 L-4,244z', '#d8c7c4', 2);
  s += faint('M0,206 C100,205 220,207 320,205 M0,226 C100,225 220,227 320,225 M60,186 L56,206 M150,186 L148,206 M240,186 L238,206 M100,206 L98,226 M200,206 L198,226', 1.1, 0.2);
  // store body
  s += shadow(140, 188, 104, 5);
  s += sh(box(44, 70, 192, 118, 5, 1), '#fff4e4');
  // sign board with star
  s += sh(box(56, 40, 168, 34, 7, 1), '#7fb7d9');
  s += star(140, 57, 13, '#ffe08a', 1.8) + tinyFace(140, 58, 0.6);
  s += star(100, 57, 6, '#fff6d8') + star(180, 57, 6, '#fff6d8') + star(78, 52, 3, '#ffe08a', 1.1) + star(202, 62, 3, '#ffe08a', 1.1);
  s += glow(140, 57, 46, '#fff3b0', 0.18);
  // awning stripes
  let stripes = '';
  for (let i = 0; i < 8; i++) {
    const x = 44 + i * 24;
    if (i % 2 === 0) stripes += `M${x},76 L${x + 24},76 L${x + 24},88 C${x + 18},94 ${x + 6},94 ${x},88z `;
  }
  s += sh('M40,74 L240,74 L240,88 C230,96 50,96 40,88z', '#f7b6c8', 2) + fl(stripes, '#ffffff', 0.85) + ln('M40,88 C50,96 230,96 240,88', 1.6);
  // glowing windows with shelves
  s += glow(140, 140, 90, '#fff3b0', 0.22);
  s += sh(box(56, 102, 56, 62, 3, 0.6), '#fff1b8', 2) + sh(box(168, 102, 56, 62, 3, 0.6), '#fff1b8', 2);
  s += ln('M58,122 L110,122 M58,142 L110,142 M170,122 L222,122 M170,142 L222,142', 1.3);
  const goods: Array<[number, number, string]> = [[62, 112, '#f4a9a8'], [74, 114, '#9fc3d4'], [86, 112, '#f6cf6b'], [98, 114, '#bfe3d0'],
    [64, 133, '#c9b6e4'], [80, 132, '#f6cf6b'], [96, 133, '#f4a9a8'], [174, 112, '#bfe3d0'], [188, 114, '#f4a9a8'], [202, 112, '#9fc3d4'],
    [214, 114, '#f6cf6b'], [178, 133, '#f6cf6b'], [194, 132, '#c9b6e4'], [210, 133, '#bfe3d0']];
  const gd: Record<string, string> = {};
  for (const [x, y, c] of goods) gd[c] = (gd[c] ?? '') + box(x, y, 9, 10, 2, 0.3) + ' ';
  for (const c of Object.keys(gd)) s += sh(gd[c], c, 1.1);
  // onigiri-ish triangle snacks in the bottom shelf
  s += sh('M64,160 L70,150 L76,160z M190,160 L196,150 L202,160z', '#ffffff', 1.2) + fl('M66,157 L74,157 L74,160 L66,160z M192,157 L200,157 L200,160 L192,160z', '#5b4a5e');
  // sliding glass door
  s += sh(box(118, 104, 44, 84, 3, 0.6), '#fff8d6', 2) + ln('M140,104 L140,188', 2) + ln('M134,140 L134,152 M146,140 L146,152', 2.2);
  s += `<path d="M124,112 L132,108 M124,124 L136,114 M150,112 L156,108" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>`;
  s += sh(box(122, 92, 36, 9, 3, 0.4), '#ffe08a', 1.4) + star(140, 96.5, 3, '#f59fb0', 1);
  s += `<path d="M118,188 L162,188 L190,240 L94,240z" fill="#fff3b0" opacity=".4"/>`;
  // potted plant + sign stand
  s += sh(box(46, 170, 18, 16, 3, 0.4), '#efa98a', 1.6) + sh('M50,170 C44,160 48,152 55,150 C58,158 57,165 55,170z M56,170 C58,160 64,156 70,156 C68,164 64,168 59,170z', '#8fc3a7', 1.6);
  // street lamp
  s += ln('M22,200 L22,108', 5) + ln('M22,200 L22,108', 2.4, '#9fc3d4') + ln('M22,110 C22,100 30,96 36,98', 3)
    + sh('M30,98 C30,92 42,92 42,98 C40,101 32,101 30,98z', '#ffe08a', 1.6) + glow(36, 104, 22, '#fff3b0', 0.35);
  // Mocha waving with a red-and-white basket
  const basket = g('translate(-26,10)',
    ln('M-9,-4 C-8,-14 8,-14 9,-4', 2.2)
    + sh('M-11,-4 L11,-4 L9,10 L-9,10z', '#e2607a', 2)
    + fl('M-10.4,1 L10.4,1 L10,4 L-10,4z', '#ffffff')
    + ln('M-10.4,1 L10.4,1 M-10,4 L10,4', 1)
    + sh(box(-5, -9, 7, 6, 1.5, 0.2), '#bfe3d0', 1.2) + sh(blob(5, -6, 3.4, 3, 0), '#f6cf6b', 1.2));
  s += fig(MOCHA_SCARF, 272, 226, 1.32, 'happy', -1, { armR: ARM_UP, front: basket });
  s += ln('M250,104 l-6,-4 M248,114 l-8,0', 1.8, '#ffffff');
  s += spark(232, 30, 0.6) + spark(56, 18, 0.5) + spark(300, 150, 0.6, '#ffffff');
  return s;
}

/* --- Mocha makes a wish on a shooting star at his window --- */
function shootingStar(): string {
  let s = bg('#7a6c98');
  s += faint('M0,40 L320,40 M0,80 L320,80 M0,120 L320,120 M0,160 L320,160', 1, 0.08);
  // big window with the night sky
  const sky = fl(box(72, 22, 176, 132, 3, 0.4), '#3e4a82')
    + dots(5, 26, 76, 26, 168, 90, 1.2, '#fff6d8', 0.9)
    + fl('M226,32 C216,34 211,46 216,56 C221,65 233,67 240,60 C230,60 222,54 222,45 C222,39 223,35 226,32z', '#fff1b8') + glow(228, 48, 20, '#fff1b8', 0.15)
    // shooting star and trail
    + `<path d="M84,36 C120,52 150,62 182,72 L180,78 C146,70 118,60 84,36z" fill="#fff3b0" opacity=".55"/>`
    + `<path d="M104,46 C130,58 150,64 176,72" fill="none" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>`
    + star(186, 76, 9, '#ffe08a', 1.6) + glow(186, 76, 18, '#fff3b0', 0.3)
    + spark(166, 62, 0.45, '#ffffff') + spark(140, 56, 0.35, '#ffffff') + spark(204, 90, 0.4)
    // sleepy town roofs
    + fl('M72,154 L72,128 L90,116 L108,128 L108,122 L126,122 L126,134 L148,134 L148,118 L162,108 L176,118 L176,130 L198,130 L198,120 L218,112 L236,120 L248,120 L248,154z', '#2e3866')
    + fl('M84,134 h5 v5 h-5z M154,124 h5 v5 h-5z M206,126 h5 v5 h-5z M116,130 h4 v4 h-4z', '#ffe08a');
  s += sh(box(64, 14, 192, 148, 6, 1), '#a07e66') + sky
    + ln(box(72, 22, 176, 132, 3, 0.4), 2)
    + ln('M160,22 L160,154', 5) + ln('M160,22 L160,154', 2.4, '#a07e66');
  s += sh(box(56, 156, 208, 9, 3, 0.5), '#b98f72', 2);
  // star curtains
  s += curtain(64, 8, 120, 1, '#9cc7a8') + curtain(256, 8, 120, -1, '#9cc7a8') + ln('M52,8 C120,5 200,9 268,6', 3);
  s += star(70, 50, 3, '#ffe08a', 1) + star(78, 90, 3, '#ffe08a', 1) + star(250, 46, 3, '#ffe08a', 1) + star(244, 96, 3, '#ffe08a', 1);
  // floor + moonlight
  s += sh('M-4,200 C90,198 230,201 324,199 L324,244 L-4,244z', '#a08aa0', 2);
  s += `<path d="M72,165 L248,165 L290,240 L30,240z" fill="#c9d4ff" opacity=".18"/>`;
  s += sh(blob(160, 222, 54, 10, 0.2), '#e8b4b8', 2);
  // plant + lamp on the side
  s += sh(box(18, 176, 26, 26, 5, 0.6), '#efa98a') + sh('M24,176 C16,164 20,150 28,146 C30,158 30,168 28,176z M32,176 C34,162 42,156 50,156 C48,166 42,172 36,176z', '#8fc3a7', 1.8);
  s += sh(box(278, 150, 30, 52, 4, 0.8), '#b98f72') + sh('M282,150 C282,136 304,136 304,150z', '#ffd28a') + ln('M293,136 L293,126', 1.6) + glow(293, 146, 30, '#ffe6a8', 0.2);
  // Mocha wishing
  s += fig(MOCHA_SCARF, 160, 226, 1.45, 'sleepy', 1, { armR: ARM_PRAY, armL: ARM_PRAY, armsFront: true });
  s += hrt(196, 120, 0.5, '#f7b6c8') + spark(124, 118, 0.6) + spark(200, 104, 0.5, '#ffffff');
  return s;
}

/* --- Mocha's first cooking: honey toast in a pan --- */
function cookingFirst(): string {
  let s = bg('#e3f1ea');
  // tiles
  let tiles = '';
  for (let y = 20; y < 150; y += 20) tiles += `M0,${y} L320,${y} `;
  for (let x = 20; x < 320; x += 20) tiles += `M${x},0 L${x},150 `;
  s += faint(tiles, 1, 0.1);
  // small window
  s += windowPane(220, 22, 70, 56, '#cfe9f5', cloud(246, 40, 0.5) + fl('M220,70 C240,64 262,68 290,62 L290,78 L220,78z', '#bfe3a6'));
  s += curtain(214, 14, 44, 1, '#f7b6c8') + curtain(296, 14, 44, -1, '#f7b6c8') + ln('M208,14 C240,12 270,15 302,12', 2.6);
  // shelf with jars
  s += sh(box(20, 58, 120, 6, 2, 0.4), '#d9a07a', 2) + ln('M30,64 L34,72 L38,64 M122,64 L126,72 L130,64', 1.6);
  s += sh(box(30, 38, 16, 20, 4, 0.4), '#f6cf6b', 1.6) + sh(box(29, 34, 18, 6, 2, 0.3), '#e58a94', 1.4)
    + sh(box(54, 42, 14, 16, 4, 0.4), '#dff1f4', 1.6) + sh(box(76, 36, 18, 22, 4, 0.4), CREAM, 1.6) + heart(85, 47, 0.4, '#e58a94')
    + sh(box(102, 44, 12, 14, 3, 0.4), '#bfe3d0', 1.6) + sh(blob(126, 50, 8, 8, 0.2), '#f4a9a8', 1.6);
  // hanging utensils
  s += ln('M164,10 L200,10', 2.4) + ln('M172,10 L172,40 M184,10 L184,36 M194,10 L194,42', 1.6)
    + sh(blob(172, 44, 4, 5, 0), '#c9b6e4', 1.4) + sh('M181,36 L187,36 L186,48 L182,48z', '#9fc3d4', 1.4) + sh(blob(194, 46, 3, 4, 0), '#f6cf6b', 1.4);
  // counter + stove at the back
  s += sh(box(-6, 140, 332, 12, 4, 0.6), '#d9a07a', 2);
  s += sh(box(-6, 150, 332, 60, 4, 1), '#f3cdb8', 2) + faint('M70,152 L70,208 M150,152 L150,208 M230,152 L230,208', 1.2, 0.3)
    + `<circle cx="110" cy="180" r="2.4" fill="${INK}" opacity=".5"/><circle cx="190" cy="180" r="2.4" fill="${INK}" opacity=".5"/>`;
  s += sh(box(236, 126, 66, 16, 4, 0.6), '#9fc3d4', 2) + `<ellipse cx="254" cy="128" rx="9" ry="2.4" fill="${INK}" opacity=".4"/><ellipse cx="284" cy="128" rx="9" ry="2.4" fill="${INK}" opacity=".4"/>`;
  s += sh('M276,126 C274,116 278,110 285,110 C292,110 296,116 294,126z', '#f2a7a7', 2) + ln('M294,118 C298,116 300,114 302,110', 2.2);
  // floor
  s += sh('M-4,206 C90,204 230,207 324,205 L324,244 L-4,244z', '#e6c39b', 2);
  s += faint('M0,224 C90,223 210,225 320,223 M80,206 L76,224 M200,206 L196,224 M140,224 L136,240', 1.2, 0.2);
  // Mocha with the pan
  s += fig(MOCHA_APRON, 126, 230, 1.45, 'happy', 1, { armR: ARM_FWD });
  const [hx, hy] = at(126, 230, 1.45, 1, 34, -7);
  const px = 214, py = hy - 6;
  s += ln(`M${hx},${hy} L${px - 26},${py + 2}`, 6) + ln(`M${hx},${hy} L${px - 26},${py + 2}`, 3, '#8a6a5a');
  s += sh(`M${px - 30},${py} C${px - 30},${py + 12} ${px + 30},${py + 12} ${px + 30},${py} C${px + 20},${py + 4} ${px - 20},${py + 4} ${px - 30},${py}z`, '#6d6577', 2);
  s += sh(blob(px, py, 30, 5, 0), '#8a8296', 2);
  // honey toast
  s += sh(`M${px - 16},${py + 1} C${px - 18},${py - 14} ${px - 14},${py - 22} ${px - 4},${py - 22} C${px + 4},${py - 26} ${px + 16},${py - 22} ${px + 16},${py - 12} L${px + 16},${py + 1}z`, '#d9a05a', 2);
  s += fl(`M${px - 12},${py} C${px - 13},${py - 12} ${px - 10},${py - 18} ${px - 3},${py - 18} C${px + 3},${py - 21} ${px + 12},${py - 18} ${px + 12},${py - 11} L${px + 12},${py}z`, '#f6d79a');
  s += faint(`M${px - 8},${py - 12} l14,8 M${px - 8},${py - 4} l8,4 M${px + 2},${py - 16} l8,5`, 1.1, 0.35);
  s += sh(`M${px - 12},${py - 16} C${px - 4},${py - 20} ${px + 8},${py - 18} ${px + 12},${py - 14} C${px + 12},${py - 8} ${px + 8},${py - 4} ${px + 7},${py - 9} C${px + 6},${py - 12} ${px},${py - 10} ${px - 2},${py - 13} C${px - 4},${py - 9} ${px - 8},${py - 8} ${px - 8},${py - 12}z`, '#f2c14e', 1.4);
  s += sh(box(px - 4, py - 22, 9, 6, 1.5, 0.2), '#fff3b8', 1.3);
  s += paw(hx, hy, MOCHA_APRON.color);
  s += steam(px - 10, py - 26, 1.1) + steam(px + 8, py - 28, 0.9);
  s += spark(px - 28, py - 34, 0.8) + spark(px + 30, py - 24, 0.7) + spark(px + 14, py - 56, 0.6, '#ffffff') + spark(96, 104, 0.6)
    + hrt(150, 98, 0.55);
  return s;
}

/* --- Cozy night by the fireplace with cocoa, snow outside --- */
function fireplaceNight(): string {
  let s = bg('#8a6f86');
  s += glow(96, 160, 130, '#ffb877', 0.18) + glow(96, 170, 80, '#ffd28a', 0.22);
  // window with snow
  s += windowPane(214, 34, 76, 70, '#4a5690',
    dots(12, 22, 216, 36, 72, 66, 1.5, '#ffffff', 0.9)
    + fl('M214,104 L214,92 C232,86 260,90 290,86 L290,104z', '#f4f6ff')
    + fl('M228,92 L240,82 L252,92z', '#3a4478') + fl('M262,90 L272,80 L282,90z', '#3a4478'));
  s += fl('M206,110 C226,104 280,104 298,110 L298,113 L206,113z', '#ffffff') + ln('M206,110 C226,104 280,104 298,110', 1.4);
  s += dots(44, 8, 200, 20, 110, 10, 1.6, '#ffffff', 0.5);
  // fireplace
  s += shadow(96, 212, 70, 5);
  s += sh(box(34, 92, 124, 120, 6, 1), '#c98e7a');
  s += faint('M34,116 L158,116 M34,140 L158,140 M34,164 L158,164 M34,188 L158,188 M60,92 L60,116 M110,92 L110,116 M84,116 L84,140 M134,116 L134,140 M58,164 L58,188 M134,164 L134,188 M84,188 L84,212', 1.3, 0.3);
  s += sh(box(26, 84, 140, 12, 4, 0.6), '#b57a5e', 2);
  s += sh('M58,212 L58,140 C58,124 72,116 96,116 C120,116 134,124 134,140 L134,212z', '#4a3540', 2);
  s += glow(96, 186, 34, '#ffb877', 0.4);
  // logs + flames
  s += sh('M66,206 C64,198 90,196 108,200 C126,202 130,210 124,212 C104,214 74,214 66,206z', '#9a6a4a', 1.8);
  s += sh('M72,202 C66,186 76,170 80,156 C86,166 84,174 90,166 C94,156 92,148 96,138 C104,150 110,162 106,174 C112,168 116,162 116,156 C124,170 122,190 118,202z', '#f28c50', 2);
  s += fl('M82,200 C78,188 86,180 88,172 C92,180 94,184 98,176 C104,184 108,192 106,200z', '#ffd06a');
  s += fl('M90,200 C88,194 92,190 94,186 C98,192 100,196 98,200z', '#fff3b0');
  s += spark(70, 130, 0.4) + spark(122, 128, 0.35) + spark(104, 112, 0.3, '#ffd06a');
  // mantel decor
  s += sh(box(40, 66, 14, 18, 3, 0.4), '#bfe3d0', 1.6) + sh('M116,84 L116,70 C116,62 130,62 130,70 L130,84z', '#f6cf6b', 1.6) + heart(123, 73, 0.4, '#e58a94')
    + sh(box(140, 70, 10, 14, 2, 0.3), CREAM, 1.4) + ln('M145,70 L145,64', 1.2) + `<path d="M145,64 c-2,-3 0,-6 0,-6 c0,0 2,3 0,6z" fill="#ffd06a"/>`
    + ln('M30,92 C40,100 50,100 60,92 M60,92 C70,100 80,100 90,92', 1.6, '#8fc3a7');
  // floor + rug
  s += sh('M-4,212 C90,210 230,213 324,211 L324,244 L-4,244z', '#a98a7a', 2);
  s += sh(blob(206, 226, 70, 11, 0.2), '#e8b4b8', 2) + `<ellipse cx="206" cy="226" rx="54" ry="7" fill="none" stroke="${CREAM}" stroke-width="1.6" stroke-dasharray="3 3"/>`;
  // Mocha wrapped in a blanket with cocoa
  const blanket = sh('M-21,-16 C-10,-22 10,-22 21,-16 C27,-4 27,6 23,12 C8,15 -8,15 -23,12 C-27,4 -27,-6 -21,-16z', '#9cc7a8', 2)
    + `<path d="M-14,-18 L-16,12 M14,-18 L16,12 M-24,-2 L24,-2" fill="none" stroke="#f7b6c8" stroke-width="2.2" opacity=".85"/>`
    + sh('M-21,-16 C-10,-24 10,-24 21,-16 C14,-12 -14,-12 -21,-16z', '#b9dcc2', 1.8)
    + sh(box(-6, -8, 12, 11, 3, 0.4), '#f2a7a7', 1.6) + ln('M6,-6 c4,0 4,6 0,6', 1.4)
    + `<ellipse cx="0" cy="-7.6" rx="5" ry="1.3" fill="#8a5a3a"/>`
    + sh(blob(-8, -2, 3.8, 3.4, 0), MOCHA_SCARF.color, 1.6) + sh(blob(8, -2, 3.8, 3.4, 0), MOCHA_SCARF.color, 1.6);
  s += fig(MOCHA_SCARF, 210, 226, 1.45, 'happy', -1, { sit: true, armR: null, armL: null, front: blanket });
  s += steam(205, 162, 0.9);
  // slippers + yarn basket
  s += sh(blob(262, 230, 9, 4, 0.2), '#f7b6c8', 1.6) + sh(blob(278, 232, 9, 4, 0.2), '#f7b6c8', 1.6);
  s += hrt(236, 150, 0.5) + spark(178, 150, 0.5, '#ffffff');
  return s;
}

/* --- Mom visits the café --- */
function momVisitsCafe(): string {
  let s = cafeRoom();
  s += windowPane(40, 28, 76, 66, '#cfe9f5', `<circle cx="100" cy="44" r="8" fill="#ffe08a"/>`);
  s += bunting(-6, 8, 200, 14, 20, ['#f7b6c8', '#ffe08a', '#bfe3d0', '#f7b6c8', '#ffe08a', '#bfe3d0']);
  // counter with Button behind it
  s += fig(BUTTON, 282, 196, 1.15, 'happy', -1, { armR: ARM_UP });
  s += sh(box(236, 140, 90, 90, 4, 1), '#d9a07a') + sh(box(232, 134, 96, 10, 3, 0.5), '#b57a5e', 2) + heart(277, 186, 0.8, '#ee8b9c', INK);
  s += sh(box(300, 112, 14, 22, 4, 0.4), '#dff1f4', 1.6);
  // Mom seated with latte
  s += chair(92, 190, 1);
  s += fig(MOM, 92, 192, 1.32, 'happy', 1, { sit: true, mid: shawlMarks(), front: GLASSES, armR: ARM_FWD });
  s += table(132, 174, 104, 52);
  s += g('translate(120,164) scale(1.15)', item('latte')) + steam(117, 148, 0.8);
  s += paw(128, 168, MOM.color, 4.2);
  // Mocha serves cake proudly
  s += fig(MOCHA_APRON, 206, 228, 1.38, 'happy', -1, { armR: ARM_FWD });
  const [hx, hy] = at(206, 228, 1.38, -1, 34, -7);
  s += sh(blob(hx - 6, hy - 2, 14, 3.5, 0), '#ffffff', 1.6) + g(`translate(${hx - 6},${hy - 6}) scale(1.05)`, item('cake'));
  s += paw(hx, hy, MOCHA_APRON.color);
  s += spark(214, 100, 0.8) + spark(232, 120, 0.5, '#ffffff') + ln('M196,106 l-4,-8 M206,102 l2,-9', 1.8, '#e58a94');
  s += hrt(120, 104, 0.6) + hrt(104, 92, 0.4, '#f7b6c8') + hrt(300, 92, 0.5);
  return s;
}

/* --- After-hours party with friends --- */
function friendsParty(): string {
  let s = cafeRoom('#efd4cf', '#e6c0bb', '#e3b4a8', '#d9b48c');
  s += glow(160, 120, 130, '#ffe6a8', 0.22);
  s += bunting(-6, 10, 326, 14, 34, ['#f7b6c8', '#ffe08a', '#bfe3d0', '#f7b6c8', '#ffe08a', '#bfe3d0', '#f7b6c8', '#ffe08a', '#bfe3d0', '#f7b6c8']);
  // friends standing behind the table
  s += fig(MAPLE, 40, 210, 1.1, 'happy', 1, { armR: ARM_UP });
  s += fig(BUTTON, 98, 210, 1.1, 'happy', 1, { armR: ARM_UP });
  s += fig(MOCHA_APRON, 232, 210, 1.18, 'happy', -1, { armR: ARM_UP, armL: ARM_UP });
  s += fig(POM, 288, 212, 1.08, 'happy', -1, { armR: ARM_UP });
  // big table with cloth
  s += sh('M-6,180 C80,176 240,176 326,180 L326,244 L-6,244z', '#fffaf2', 2);
  s += `<path d="M-6,190 C80,186 240,186 326,190" fill="none" stroke="#f7b6c8" stroke-width="3" stroke-dasharray="6 6"/>`;
  s += faint('M40,196 L36,240 M120,192 L118,240 M200,192 L202,240 M280,196 L284,240', 1.3, 0.2);
  // cake
  s += shadow(174, 182, 44, 4) + sh(blob(174, 180, 42, 6, 0), '#ffffff', 1.8);
  s += sh('M140,178 L140,148 C150,144 198,144 208,148 L208,178 C198,182 150,182 140,178z', '#f7d4dc', 2);
  s += sh('M140,148 C150,144 198,144 208,148 C208,156 202,158 198,154 C194,160 186,160 184,154 C180,160 170,160 168,154 C164,160 156,160 152,154 C148,160 140,158 140,148z', CREAM, 1.8);
  s += sh('M150,148 L150,128 C158,124 190,124 198,128 L198,148 C190,150 158,150 150,148z', '#fbe7a1', 2);
  s += sh('M150,128 C158,124 190,124 198,128 C198,134 192,135 189,132 C186,137 178,137 176,132 C172,137 164,137 162,132 C158,136 150,134 150,128z', CREAM, 1.6);
  s += sh(blob(160, 124, 4, 3.6, 0), '#e2607a', 1.4) + sh(blob(174, 122, 4, 3.6, 0), '#e2607a', 1.4) + sh(blob(188, 124, 4, 3.6, 0), '#e2607a', 1.4);
  s += sh('M166,122 L166,108 L170,108 L170,122z M180,122 L180,106 L184,106 L184,122z', '#9fc3d4', 1.2)
    + `<path d="M168,107 c-3,-4 0,-8 0,-8 c0,0 3,4 0,8z M182,105 c-3,-4 0,-8 0,-8 c0,0 3,4 0,8z" fill="#ffd06a" stroke="${INK}" stroke-width=".9"/>`;
  s += heart(174, 165, 0.9, '#e2607a', INK);
  // treats on the table
  s += g('translate(70,190) scale(.95)', item('latte'));
  s += confetti(17, 26, 6, 60, 308, 100);
  s += spark(150, 96, 0.8) + spark(204, 94, 0.7);
  return s;
}

/* --- Calendar on the wall with a circled date and season stickers --- */
function festivalComing(): string {
  let s = cafeRoom('#fbe9dc', '#f3d6c3', '#f3cdb8', '#e6c39b');
  // calendar
  const cx = 30, cy = 26, cw = 150, ch = 128;
  s += ln(`M${cx + cw / 2},${cy - 14} L${cx + 30},${cy + 2} M${cx + cw / 2},${cy - 14} L${cx + cw - 30},${cy + 2}`, 1.4)
    + `<circle cx="${cx + cw / 2}" cy="${cy - 14}" r="2.2" fill="${INK}"/>`;
  s += shadow(cx + cw / 2 + 4, cy + ch + 4, cw * 0.5, 3, 0.1);
  s += sh(box(cx, cy, cw, ch, 5, 1), '#fffaf2');
  s += sh(box(cx, cy, cw, 24, 5, 0.6), '#e58a94');
  s += `<path d="M${cx + 20},${cy + 3} a3,3 0 1,0 0.1,0z M${cx + 50},${cy + 3} a3,3 0 1,0 0.1,0z M${cx + 100},${cy + 3} a3,3 0 1,0 0.1,0z M${cx + 130},${cy + 3} a3,3 0 1,0 0.1,0z" fill="${INK}" opacity=".5"/>`;
  s += ln(`M${cx + 20},${cy - 4} L${cx + 20},${cy + 5} M${cx + 50},${cy - 4} L${cx + 50},${cy + 5} M${cx + 100},${cy - 4} L${cx + 100},${cy + 5} M${cx + 130},${cy - 4} L${cx + 130},${cy + 5}`, 2.2);
  s += sh(box(cx + 52, cy + 9, 46, 8, 3, 0.3), '#fff3b8', 1.2);
  // grid
  let grid = '';
  const gx = cx + 8, gy = cy + 32, cellW = (cw - 16) / 7, cellH = (ch - 40) / 5;
  for (let i = 0; i <= 7; i++) grid += `M${n(gx + i * cellW)},${gy} L${n(gx + i * cellW)},${n(gy + 5 * cellH)} `;
  for (let j = 0; j <= 5; j++) grid += `M${gx},${n(gy + j * cellH)} L${n(gx + 7 * cellW)},${n(gy + j * cellH)} `;
  s += faint(grid, 1.1, 0.35);
  // tiny day marks
  let marks = '';
  for (let j = 0; j < 5; j++) for (let i = 0; i < 7; i++) {
    if (j * 7 + i < 2 || j * 7 + i > 31) continue;
    marks += `M${n(gx + i * cellW + 3)},${n(gy + j * cellH + 4)} l4,0 `;
  }
  s += faint(marks, 1.6, 0.45);
  // past days crossed
  s += ln(`M${n(gx + 2 * cellW + 4)},${n(gy + 4)} l${n(cellW - 8)},${n(cellH - 8)} M${n(gx + 3 * cellW + 4)},${n(gy + 4)} l${n(cellW - 8)},${n(cellH - 8)} M${n(gx + 4 * cellW + 4)},${n(gy + 4)} l${n(cellW - 8)},${n(cellH - 8)}`, 1.4, '#9fc3d4');
  // the circled date
  const dx = n(gx + 4.5 * cellW), dy = n(gy + 2.5 * cellH);
  s += fl(blob(dx, dy, cellW * 0.42, cellH * 0.38, 0.2), '#fff3b8');
  s += ln(`M${n(dx - 11)},${n(dy - 2)} C${n(dx - 11)},${n(dy - 12)} ${n(dx + 12)},${n(dy - 12)} ${n(dx + 12)},${n(dy)} C${n(dx + 12)},${n(dy + 10)} ${n(dx - 10)},${n(dy + 11)} ${n(dx - 12)},${n(dy + 1)} C${n(dx - 12)},${n(dy - 6)} ${n(dx - 6)},${n(dy - 10)} ${n(dx + 2)},${n(dy - 11)}`, 2.4, '#e2607a');
  s += heart(dx, dy, 0.45, '#e2607a');
  s += star(n(dx + 14), n(dy - 12), 4, '#ffe08a', 1.1);
  // season stickers
  const sticker = (x: number, y: number, r: number, rot: number, inner: string) =>
    g(`translate(${x},${y}) rotate(${rot})`, sh(blob(0, 0, r, r, 0.2), '#ffffff', 1.4) + inner);
  s += sticker(cx + 6, cy + 40, 13, -10, pumpkin(0, 1, 0.62, true));
  s += sticker(cx + cw - 4, cy + 36, 13, 12,
    sh('M0,-10 L8,2 L4,2 L9,9 L-9,9 L-4,2 L-8,2z', '#8fc3a7', 1.4) + sh(box(-2, 9, 4, 3, 0.8, 0.1), '#b57a5e', 1) + star(0, -10, 3, '#ffe08a', 0.9)
    + `<circle cx="-3" cy="3" r="1.2" fill="#e2607a"/><circle cx="3" cy="6" r="1.2" fill="#ffe08a"/>`);
  s += sticker(cx + 10, cy + ch - 8, 13, 8, flower(0, 0, 1.25, '#f7c6d6', '#e58a94', 1.1));
  s += sticker(cx + cw - 10, cy + ch - 6, 13, -8,
    ln('M0,-11 L0,-8 M0,8 L0,11 M-11,0 L-8,0 M8,0 L11,0 M-8,-8 L-6,-6 M6,6 L8,8 M-8,8 L-6,6 M6,-6 L8,-8', 1.6, '#f2c14e')
    + sh(blob(0, 0, 6, 6, 0.1), '#ffe08a', 1.3) + tinyFace(0, 0.5, 0.4));
  // pencil on a string
  s += ln(`M${cx + cw},${cy + 70} C${cx + cw + 10},${cy + 80} ${cx + cw + 8},${cy + 96} ${cx + cw + 14},${cy + 104}`, 1.2)
    + g(`translate(${cx + cw + 16},${cy + 112}) rotate(-20)`, sh('M-2.5,-12 L2.5,-12 L2.5,6 L0,11 L-2.5,6z', '#ffe08a', 1.4) + fl('M-2.5,-12 L2.5,-12 L2.5,-9 L-2.5,-9z', '#e58a94'));
  // plant on floor left
  s += sh(box(14, 196, 26, 24, 5, 0.6), '#efa98a') + sh('M20,196 C12,184 16,170 24,166 C26,178 26,188 24,196z M28,196 C30,182 38,176 46,176 C44,186 38,192 32,196z', '#8fc3a7', 1.8);
  // excited Mocha
  s += fig(MOCHA_SCARF, 248, 226, 1.5, 'happy', -1, { armR: ARM_UP, armL: ARM_UP });
  s += ln('M206,92 l-10,-6 M202,104 l-12,-1 M290,86 l8,-8 M296,100 l11,-3', 2, '#e58a94');
  s += spark(214, 72, 0.8) + spark(286, 64, 0.7) + spark(196, 130, 0.5, '#ffffff') + hrt(250, 54, 0.6) + hrt(300, 130, 0.45, '#f7b6c8');
  return s;
}

/* --- A new dream: hilltop at sunset with the bike, thinking of a cozy house --- */
function bike(x: number, y: number, s: number, col: string): string {
  const tube = (d: string) => ln(d, 6.5) + ln(d, 3.6, col);
  const wheel = (wx: number) => {
    const t = blob(wx, 0, 19, 19, 0);
    return ln(t, 6) + ln(t, 2.6, '#a3929c')
      + faint(`M${wx - 13},0 L${wx + 13},0 M${wx},-13 L${wx},13 M${wx - 9},-9 L${wx + 9},9 M${wx - 9},9 L${wx + 9},-9`, 0.9, 0.4)
      + `<circle cx="${wx}" cy="0" r="2.4" fill="${CREAM}" stroke="${INK}" stroke-width="1.3"/>`;
  };
  return g(`translate(${x},${y}) scale(${s})`,
    shadow(0, 20, 52, 4)
    + wheel(-32) + wheel(32)
    + tube('M-32,0 L-2,2') + tube('M-32,0 L-12,-27') + tube('M-2,2 L-13,-32')
    + tube('M-12,-27 L20,-29') + tube('M-2,2 L20,-27') + tube('M20,-31 L25,-14 C27,-6 30,-2 32,0')
    + ln('M20,-30 L18,-41', 3) + ln('M9,-42 C13,-45 20,-43 25,-41', 3.2)
    + sh('M-23,-35 C-19,-39 -8,-38 -5,-35 C-8,-32 -19,-32 -23,-35z', '#e58a94', 1.6)
    + sh(box(23, -46, 23, 13, 3, 0.6), '#e7c08f', 1.8)
    + flower(30, -50, 0.6, '#f7b6c8', '#f6cf6b') + flower(39, -51, 0.6, CREAM, '#e58a94'));
}

function newDream(): string {
  let s = bg('#c9a6d8');
  s += `<rect x="0" y="50" width="320" height="40" fill="#f0a9bf"/><rect x="0" y="86" width="320" height="40" fill="#ffc79a"/><rect x="0" y="118" width="320" height="30" fill="#ffe0a0"/>`;
  s += glow(236, 128, 40, '#fff3b0', 0.45) + sh('M212,132 C212,118 222,108 236,108 C250,108 260,118 260,132z', '#ffd06a', 2);
  s += cloud(200, 70, 0.7, '#ffe3ec') + cloud(286, 40, 0.5, '#ffe3ec');
  s += spark(300, 20, 0.5, '#ffffff') + spark(180, 24, 0.4, '#ffffff');
  // distant hills + town in the valley
  s += sh('M-4,140 C40,128 90,134 130,138 C170,142 220,126 260,130 C290,133 310,136 324,134 L324,170 L-4,170z', '#c3a6c9', 2);
  const houses: Array<[number, number, string]> = [[150, 152, '#f7d4dc'], [172, 150, '#fff1e0'], [194, 154, '#f6cf6b'], [216, 150, '#bfe3d0'], [240, 154, '#f7d4dc'], [264, 150, '#fff1e0'], [288, 154, '#c9b6e4']];
  for (const [x, y, c] of houses) {
    s += sh(`M${x - 8},${y + 12} L${x - 8},${y} L${x},${y - 8} L${x + 8},${y} L${x + 8},${y + 12}z`, c, 1.4);
  }
  s += `<path d="M146,154 h4 v4 h-4z M168,152 h4 v4 h-4z M190,156 h4 v4 h-4z M212,152 h4 v4 h-4z M236,156 h4 v4 h-4z M260,152 h4 v4 h-4z M284,156 h4 v4 h-4z" fill="#ffd06a"/>`;
  s += sh('M228,142 L228,118 L234,112 L240,118 L240,142z', '#fff1e0', 1.4) + `<path d="M232,126 h4 v4 h-4z" fill="#ffd06a"/>`;
  s += sh('M140,170 C180,160 260,162 324,158 L324,184 L120,184z', '#a8c99a', 2);
  // hilltop foreground
  s += sh('M-4,170 C40,160 100,160 150,172 C180,180 200,196 214,244 L-4,244z', '#9fd08f', 2);
  s += sh('M180,244 C200,214 250,200 324,198 L324,244z', '#b7dfa6', 2);
  s += faint('M20,190 l3,-5 M60,200 l2,-5 M110,186 l3,-5 M40,224 l2,-5 M140,214 l3,-5 M260,222 l3,-5 M300,214 l2,-5', 1.4, 0.35);
  s += flower(28, 206, 0.55, '#f7b6c8', '#f6cf6b') + flower(150, 200, 0.5, CREAM, '#e58a94') + flower(286, 226, 0.6, '#ffe08a', '#e58a94');
  // bike + Mocha
  s += bike(104, 206, 1.05, '#8fd3c1');
  s += fig(MOCHA_SCARF, 162, 228, 1.3, 'calm', 1, { armL: ARM_FWD });
  // thought bubble with a cozy house and fireplace
  s += sh(blob(122, 94, 4, 3.6, 0), '#ffffff', 1.6) + sh(blob(108, 80, 6, 5.4, 0), '#ffffff', 1.8);
  s += sh('M24,58 C10,56 8,36 22,32 C20,16 40,8 52,16 C62,4 86,4 94,16 C108,8 128,16 124,32 C138,36 136,58 122,60 C118,74 98,76 90,68 C80,78 58,78 50,68 C40,76 22,72 24,58z', '#ffffff', 2);
  s += sh('M48,62 L48,38 L72,22 L96,38 L96,62z', '#fff1e0', 1.8)
    + sh('M42,40 L72,18 L102,40 C96,42 92,40 90,38 L72,26 L54,38 C52,40 48,42 42,40z', '#e58a8a', 1.6)
    + sh(box(84, 18, 7, 12, 1.5, 0.3), '#d9a07a', 1.4)
    + faint('M88,14 q-3,-3 0,-6 q3,-3 0,-6', 1.3, 0.35);
  // window into the house: a crackling fireplace
  s += sh(box(54, 40, 26, 20, 3, 0.4), '#ffe6a8', 1.4)
    + sh('M60,60 L60,50 C60,46 74,46 74,50 L74,60z', '#4a3540', 1.2)
    + fl('M63,59 C62,55 65,52 66,50 C67,53 68,54 69,52 C71,55 71,57 70,59z', '#f28c50')
    + sh(box(82, 46, 10, 16, 3, 0.3), '#b98a6a', 1.2) + glow(67, 52, 14, '#ffd06a', 0.35);
  s += heart(110, 40, 0.55, '#ee8b9c', INK) + spark(34, 46, 0.4) + spark(112, 56, 0.35, '#ffffff');
  return s;
}

export function storyArtC(id: StoryArtId): string {
  switch (id) {
    case 'phone_gift': return phoneGift();
    case 'regular_gift': return regularGift();
    case 'konbini_open': return konbiniOpen();
    case 'shooting_star': return shootingStar();
    case 'cooking_first': return cookingFirst();
    case 'fireplace_night': return fireplaceNight();
    case 'mom_visits_cafe': return momVisitsCafe();
    case 'friends_party': return friendsParty();
    case 'festival_coming': return festivalComing();
    case 'new_dream': return newDream();
    default: return '';
  }
}
