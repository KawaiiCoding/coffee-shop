/* Story illustrations B: shop_ready, payday, home_evening, dream_bike, dream_mom.
   Inner markup for viewBox 0 0 320 240. Picture-book panels using the shared kit. */
import type { CharacterLook, Mood, StoryArtId } from '../types';
import { INK, CREAM, fl, ln, sh, g, blob, box, shadow, tinyFace } from './kit';
import { character } from './character';
import { n, rng, heart, SPARK, yarn } from './core';

/* ---------------- looks ---------------- */
const MOCHA_APRON: CharacterLook = { species: 'bear', color: '#d9a877', accessory: 'apron', accentColor: '#e58a94', apronColor: '#fff6ea', hat: 'none' };
const MOCHA_SCARF: CharacterLook = { species: 'bear', color: '#d9a877', accessory: 'scarf', accentColor: '#e58a94', hat: 'none' };
const BUTTON: CharacterLook = { species: 'cat', color: '#b9b3c9', accessory: 'apron', accentColor: '#8fb39b', apronColor: '#fff6ea', hat: 'none' };
const MOM: CharacterLook = { species: 'bear', color: '#f1dcc0', accessory: 'flower', accentColor: '#e58a94', hat: 'none' };

/* ---------------- small helpers ---------------- */
const W = 320, H = 240;
const bg = (c: string) => `<rect x="0" y="0" width="${W}" height="${H}" fill="${c}"/>`;
const faint = (d: string, w = 1.4, op = 0.22) =>
  `<path d="${d}" fill="none" stroke="${INK}" stroke-opacity="${op}" stroke-width="${w}" stroke-linecap="round"/>`;
const spark = (x: number, y: number, s: number, c = '#fff3b0') =>
  `<path transform="translate(${x},${y}) scale(${s})" d="${SPARK}" fill="${c}" stroke="${INK}" stroke-width="${n(1.1 / s)}" stroke-linejoin="round"/>`;
const hrt = (x: number, y: number, s: number, c = '#f59fb0') => heart(x, y, s, c, INK);
const glow = (cx: number, cy: number, r: number, c: string, op: number) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${c}" opacity="${op}"/>`;

/** Five-petal flower in two elements (one petal path + centre). */
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

/* character.ts internals we hook into (doll coordinates) */
const DOLL = 'scale(0.88) translate(0,-35)';
const ARM_R = 'M13,-6 C22,-3 26,6 22,10 C18,13 14,6 12,0z';
const ARM_L = 'M-14,-6 C-23,-2 -26,8 -21,11 C-17,13 -14,6 -12,0z';
const BODY_TAG = '<path d="M-11,-15 C-19,-4 -20,18 -12,24 C-5,28 8,28 13,23 C20,16 17,-5 10,-15z"';
const BEAR_EAR_TAG = '<path d="M-18,-42 C-25,-50 -14,-59 -8,-49z"';

/* custom arm poses (right side, doll coords) */
const ARM_UP = 'M8,-11 C14,-18 18,-28 21,-36 C23,-41 30,-40 29,-34 C27,-25 22,-13 14,-4z';
const ARM_FWD = 'M9,-11 C17,-12 26,-12 32,-11 C37,-10 37,-3 32,-3 C25,-3 17,-2 11,-1z';
const ARM_CHEST = 'M12,-9 C18,-3 15,5 7,6 C2,6 1,1 5,0 C8,-1 9,-4 9,-9z';
const ARM_HUG = 'M10,-12 C22,-17 36,-16 44,-10 C48,-6 45,-1 40,-3 C33,-7 22,-6 12,-2z';
const ARM_HUG_LOW = 'M10,-6 C20,-8 30,-6 38,-1 C42,2 39,7 35,5 C28,1 20,1 12,2z';

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
const insertBefore = (svg: string, tag: string, add: string) => {
  const i = svg.indexOf(tag);
  return i < 0 ? svg + `<g transform="${DOLL}">${add}</g>` : svg.slice(0, i) + add + svg.slice(i);
};

interface FigOpts {
  armR?: string | null;   // replace right arm (undefined = keep default)
  armL?: string | null;   // replace left arm (given in right-side coords, mirrored)
  armsFront?: boolean;    // draw custom arms in front of the body
  mid?: string;           // doll-coord markup between body and head (bears only)
  front?: string;         // doll-coord markup on top of everything
}
/** Character at feet (x,y), scale s; custom arms/extras drawn in the doll frame. */
function fig(look: CharacterLook, x: number, y: number, s: number, mood: Mood, facing: 1 | -1, o: FigOpts = {}): string {
  let c = character(look, { pose: 'stand', mood, facing: 1 });
  let arms = '';
  if (o.armR !== undefined) { c = strip(c, ARM_R); if (o.armR) arms += sh(o.armR, look.color); }
  if (o.armL !== undefined) { c = strip(c, ARM_L); if (o.armL) arms += sh(mirror(o.armL), look.color); }
  if (arms && !o.armsFront) c = insertBefore(c, BODY_TAG, arms);
  if (o.mid) c = insertBefore(c, BEAR_EAR_TAG, o.mid);
  let top = '';
  if (o.front) top += o.front;
  if (arms && o.armsFront) top += arms;
  if (top) c += `<g transform="${DOLL}" stroke-linecap="round" stroke-linejoin="round">${top}</g>`;
  return g(`translate(${x},${y}) scale(${n(s * facing)},${s})`, c);
}
/** Extra markup in a figure's doll frame (to layer over other things). */
const overlay = (x: number, y: number, s: number, facing: 1 | -1, inner: string) =>
  g(`translate(${x},${y}) scale(${n(s * facing)},${s})`, g(DOLL, inner));

/* ---------------- props ---------------- */
function envelope(x: number, y: number, w: number, rot = 0): string {
  const h = n(w * 0.66);
  return g(`translate(${x},${y}) rotate(${rot})`,
    sh(box(-w / 2, -h / 2, w, h, 2.5, 0.6), CREAM, 1.8)
    + ln(`M${n(-w / 2 + 1.5)},${n(-h / 2 + 1.5)} L0,${n(h * 0.12)} L${n(w / 2 - 1.5)},${n(-h / 2 + 1.5)}`, 1.4)
    + heart(0, n(h * 0.14), n(w / 34), '#e2607a', INK));
}

function bunting(x1: number, y1: number, x2: number, y2: number, sag: number, cols: string[]): string {
  const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2 + sag;
  let s = ln(`M${x1},${y1} Q${cx},${cy} ${x2},${y2}`, 1.6);
  const N = cols.length;
  for (let i = 0; i < N; i++) {
    const t = (i + 0.5) / N, u = 1 - t;
    const px = n(u * u * x1 + 2 * u * t * cx + t * t * x2), py = n(u * u * y1 + 2 * u * t * cy + t * t * y2);
    s += sh(`M${px - 9},${py} C${px - 3},${py + 1} ${px + 3},${py + 1} ${px + 9},${py} C${px + 5},${py + 6} ${px + 2},${py + 12} ${px},${py + 15} C${px - 2},${py + 12} ${px - 5},${py + 6} ${px - 9},${py}z`, cols[i], 1.6);
  }
  return s;
}

function doily(cx: number, cy: number, rx: number, ry: number, N = 14): string {
  const p = (a: number, k: number) => `${n(cx + Math.cos(a) * rx * k)},${n(cy + Math.sin(a) * ry * k)}`;
  let d = `M${p(0, 1)}`;
  for (let i = 0; i < N; i++) {
    const a0 = (i / N) * Math.PI * 2, a1 = ((i + 1) / N) * Math.PI * 2;
    d += ` Q${p((a0 + a1) / 2, 1.22)} ${p(a1, 1)}`;
  }
  d += 'z';
  return fl(d, '#fffaf2') + ln(d, 1.3)
    + `<ellipse cx="${cx}" cy="${cy}" rx="${n(rx * 0.6)}" ry="${n(ry * 0.6)}" fill="none" stroke="${INK}" stroke-opacity=".35" stroke-width="1" stroke-dasharray="1.5 2.5"/>`;
}

function cafeTable(cx: number, ty: number, yarnCol: string): string {
  const wood = '#d9a07a';
  return shadow(cx, ty + 26, 22, 4)
    + sh(blob(cx, ty + 25, 12, 3), wood, 1.8)
    + sh(box(cx - 3, ty + 2, 6, 23, 2, 0.4), wood, 1.8)
    + sh(blob(cx, ty, 28, 7, 0.2), wood)
    + doily(cx, ty - 1.5, 19, 4)
    + yarn(cx - 7, ty - 9, 8, yarnCol, false, 20)
    + sh(box(cx + 6, ty - 13, 10, 10, 3, 0.5), CREAM, 1.6)
    + ln(`M${cx + 16},${ty - 10} c4,0 4,5 0,5`, 1.5)
    + faint(`M${cx + 9},${ty - 16} q-1,-3 1,-5 M${cx + 13},${ty - 16} q-1,-3 1,-5`, 1.2, 0.35);
}

const note = (x: number, y: number, rot: number, c: string) =>
  g(`translate(${x},${y}) rotate(${rot})`, sh(blob(0, 0, 3.8, 2.8, 0.3), c, 1.6) + ln('M3.4,-1 L3.4,-13 q4,2 6,6', 1.8));

function jar(x: number, y: number, s: number, lid: boolean): string {
  const body = 'M-11,-30 C-14,-26 -14,-4 -11,-1 C-6,1 6,1 11,-1 C14,-4 14,-26 11,-30z';
  return g(`translate(${x},${y}) scale(${s})`,
    shadow(0, 0, 13, 2.5)
    + fl(body, '#dff1f4', 0.85) + ln(body, 2)
    + ln('M-7,-24 C-8,-18 -8,-11 -7,-7', 2.4, '#ffffff')
    + sh(box(-6, -19, 12, 9, 2, 0.4), CREAM, 1.2) + heart(0, -14.5, 0.32, '#e58a94')
    + (lid ? sh(box(-11, -36, 22, 7, 2.5, 0.5), '#e58a94', 1.8) : ln('M-11,-30 C-5,-32 5,-32 11,-30', 1.6)));
}

function bike(x: number, y: number, s: number, col: string): string {
  const tube = (d: string) => ln(d, 6.5) + ln(d, 3.6, col);
  const wheel = (wx: number) => {
    const t = blob(wx, 0, 19, 19, 0);
    return ln(t, 6) + ln(t, 2.6, '#a3929c')
      + ln(blob(wx, 0, 14, 14, 0), 1.3, col)
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
    + sh(blob(-2, 2, 6, 6, 0), CREAM, 1.6) + ln('M-2,2 L4,9', 2.2) + sh(box(1, 8, 7, 3, 1, 0.2), '#e58a94', 1.2)
    + ln('M24,-41 L27,-38', 1.6)
    + flower(27, -50, 0.6, '#f7b6c8', '#f6cf6b') + flower(35, -53, 0.65, CREAM, '#e58a94') + flower(42, -49, 0.55, '#f6cf6b', '#e58a94')
    + `<path d="M30,-46 C29,-52 31,-55 33,-56 C32,-52 32,-49 32,-46z" fill="#8fc3a7" stroke="${INK}" stroke-width=".9"/>`
    + sh(box(23, -46, 23, 13, 3, 0.6), '#e7c08f', 1.8)
    + faint('M24,-41 C31,-40 38,-40 45,-41 M29,-45 L28,-34 M35,-46 L35,-33 M41,-45 L42,-34', 1.1, 0.4)
    + ln('M-27,-12 C-25,-16 -22,-19 -19,-21', 1.6, '#ffffff'));
}

function cloud(x: number, y: number, s: number): string {
  return g(`translate(${x},${y}) scale(${s})`,
    sh('M-20,6 C-27,6 -27,-4 -18,-4 C-17,-12 -6,-14 -2,-8 C2,-15 14,-14 15,-5 C22,-6 25,4 18,6z', '#ffffff', 2));
}

function sun(x: number, y: number, r: number): string {
  let rays = '';
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4 + 0.2;
    rays += `M${n(x + Math.cos(a) * (r + 4))},${n(y + Math.sin(a) * (r + 4))} L${n(x + Math.cos(a) * (r + 10))},${n(y + Math.sin(a) * (r + 10))} `;
  }
  return ln(rays, 2, '#f2c14e') + sh(blob(x, y, r, r, 0.1), '#ffe08a') + tinyFace(x, y + 1, 0.9);
}

function curtain(x: number, y: number, h: number, side: 1 | -1, c: string): string {
  const d = side === 1
    ? `M${x},${y} C${x + 18},${y} ${x + 22},${y + 2} ${x + 22},${y + 6} C${x + 12},${y + h * 0.35} ${x + 6},${y + h * 0.6} ${x + 12},${y + h} C${x + 6},${y + h + 2} ${x + 2},${y + h} ${x},${y + h}z`
    : `M${x},${y} C${x - 18},${y} ${x - 22},${y + 2} ${x - 22},${y + 6} C${x - 12},${y + h * 0.35} ${x - 6},${y + h * 0.6} ${x - 12},${y + h} C${x - 6},${y + h + 2} ${x - 2},${y + h} ${x},${y + h}z`;
  return sh(d, c, 2) + faint(`M${x + side * 6},${y + 8} C${x + side * 7},${y + h * 0.4} ${x + side * 4},${y + h * 0.7} ${x + side * 5},${y + h - 4}`, 1.2, 0.3);
}

/* ---------------- panels ---------------- */
function shopReady(): string {
  let s = bg('#fbe9dc');
  // wainscot + floor
  s += sh('M-4,150 C80,148 240,151 324,149 L324,180 L-4,180z', '#f3cdb8', 2);
  s += faint('M30,152 L30,178 M70,152 L70,178 M110,152 L110,178 M150,152 L150,178 M190,152 L190,178 M230,152 L230,178', 1.2, 0.2);
  s += sh('M-4,178 C90,176 230,179 324,177 L324,244 L-4,244z', '#e6c39b', 2);
  s += faint('M0,198 C80,197 200,199 320,197 M0,220 C90,219 210,221 320,219 M60,178 L54,198 M170,178 L166,198 M120,198 L114,220 M240,198 L236,220 M40,220 L34,240 M190,220 L186,240', 1.2, 0.2);
  // open door with sunshine
  s += sh(box(248, 60, 58, 120, 4, 1), '#c99a73');
  s += fl(box(255, 67, 44, 112, 3, 0.5), '#cfe9f5');
  s += fl('M255,150 C268,146 286,148 299,145 L299,179 L255,179z', '#bfe3a6');
  s += sun(286, 88, 8) + cloud(266, 108, 0.45);
  s += ln(box(255, 67, 44, 112, 3, 0.5), 2);
  s += sh('M255,68 C248,66 241,63 234,59 C233,100 234,150 235,192 C242,188 249,184 255,179z', '#efa98a');
  s += `<circle cx="250" cy="134" r="2.4" fill="#f2c14e" stroke="${INK}" stroke-width="1.2"/>`;
  s += `<path d="M255,179 L299,179 L326,244 L206,244z" fill="#fff3b8" opacity=".5"/>`;
  s += `<path d="M262,72 L298,72 L226,179 L196,179z" fill="#fff8d6" opacity=".25"/>`;
  // bunting
  s += bunting(-6, 18, 326, 24, 30, ['#f7b6c8', '#bfe3d0', '#ffe08a', '#c9b6e4', '#f7b6c8', '#bfe3d0', '#ffe08a', '#c9b6e4']);
  // record player
  s += shadow(42, 180, 30, 4);
  s += sh(box(16, 128, 54, 50, 5, 1), '#d9a07a');
  s += faint('M22,150 C36,149 50,150 64,149 M43,128 L43,176', 1.3, 0.3);
  s += sh(box(20, 115, 46, 14, 4, 0.6), '#f2b5b5');
  s += sh(blob(40, 117, 15, 3.6, 0), '#5b4a5e', 1.8) + `<ellipse cx="40" cy="117" rx="4" ry="1.2" fill="#ffe08a"/>`;
  s += ln('M60,112 C61,116 58,118 52,118', 2) + `<circle cx="60" cy="112" r="2" fill="${CREAM}" stroke="${INK}" stroke-width="1.2"/>`;
  s += note(70, 98, 8, '#f7b6c8') + note(84, 80, -6, '#bfe3d0') + note(66, 66, 12, '#c9b6e4');
  // tables
  s += cafeTable(94, 196, '#f7b6c8');
  s += cafeTable(272, 206, '#bfe3d0');
  // cheering Button + Mocha
  s += fig(MOCHA_APRON, 152, 216, 1.15, 'happy', 1, { armR: ARM_UP, armL: ARM_UP });
  s += fig(BUTTON, 204, 214, 1.12, 'happy', -1, { armR: ARM_UP, armL: ARM_UP });
  s += hrt(178, 112, 0.7);
  // sparkles
  s += spark(128, 104, 0.9) + spark(232, 120, 0.7, '#ffffff') + spark(118, 166, 0.6, '#ffffff')
    + spark(30, 98, 0.7) + spark(236, 186, 0.9, '#ffffff') + spark(60, 226, 0.7, '#ffffff');
  s += ln('M140,232 l12,-2 M220,236 l10,-2 M24,200 l9,-1.5', 2, '#ffffff');
  return s;
}

function payday(): string {
  let s = bg('#f6dcc8');
  // window with sunset
  s += sh(box(96, 24, 128, 108, 6, 1), '#c99a73');
  s += fl('M104,32 L216,32 L216,58 L104,58z', '#c9b6e4');
  s += fl('M104,58 L216,58 L216,84 L104,84z', '#f5b8c4');
  s += fl('M104,84 L216,84 L216,124 L104,124z', '#ffd39a');
  s += fl('M150,124 C150,112 158,104 168,104 C178,104 186,112 186,124z', '#ffeaa8');
  s += fl('M104,124 L104,110 L116,110 L116,102 L128,102 L130,112 L144,112 L144,116 L196,116 L196,104 L206,98 L216,104 L216,124z', '#e9a3a3', 0.8);
  s += ln(box(104, 32, 112, 92, 3, 0.4), 2);
  s += ln('M160,32 L160,124 M104,78 L216,78', 5, INK) + ln('M160,32 L160,124 M104,78 L216,78', 2.6, '#c99a73');
  s += sh(box(90, 128, 140, 8, 3, 0.5), '#d9a07a', 2);
  s += curtain(90, 18, 92, 1, '#f7b6c8') + curtain(230, 18, 92, -1, '#f7b6c8');
  s += ln('M82,18 C140,15 190,19 238,16', 3);
  // shelf with mugs
  s += sh(box(246, 76, 66, 6, 2, 0.4), '#d9a07a', 2);
  s += sh(box(252, 62, 12, 13, 3, 0.4), '#bfe3d0', 1.6) + sh(box(270, 60, 12, 15, 3, 0.4), CREAM, 1.6) + sh(box(288, 62, 12, 13, 3, 0.4), '#f7b6c8', 1.6);
  // lamp
  s += ln('M48,0 L48,30', 1.6) + glow(48, 42, 30, '#ffe6a8', 0.35);
  s += sh('M34,44 C34,34 40,29 48,29 C56,29 62,34 62,44 C54,46 42,46 34,44z', '#ffd28a');
  // plant
  s += sh('M20,150 C14,138 18,124 26,120 C28,132 26,142 24,150z M28,150 C30,136 38,128 46,128 C44,140 38,146 32,150z', '#8fc3a7', 1.8);
  s += sh(box(14, 148, 28, 22, 5, 0.6), '#efa98a');
  // floor
  s += sh('M-4,170 C90,168 230,171 324,169 L324,244 L-4,244z', '#d6ac85', 2);
  s += faint('M0,192 C90,191 210,193 320,191 M0,216 C90,215 210,217 320,215 M80,170 L74,192 M200,170 L196,192 M140,192 L134,216 M260,192 L256,216 M50,216 L44,240 M220,216 L216,240', 1.2, 0.2);
  s += `<path d="M104,170 L216,170 L280,244 L44,244z" fill="#ffd59a" opacity=".35"/>`;
  s += `<path d="M104,124 L216,124 L216,170 L104,170z" fill="#ffd59a" opacity=".12"/>`;
  // Button gives, Mocha takes
  s += fig(BUTTON, 128, 214, 1.2, 'happy', 1, { armR: ARM_FWD });
  s += fig(MOCHA_APRON, 200, 216, 1.2, 'happy', -1, { armR: ARM_FWD });
  s += envelope(164, 170, 26, -4);
  s += sh(blob(153, 172, 4.5, 4, 0.2), BUTTON.color, 1.8) + sh(blob(176, 173, 4.5, 4, 0.2), MOCHA_APRON.color, 1.8);
  s += hrt(164, 146, 0.75) + hrt(150, 132, 0.45, '#f7b6c8') + hrt(178, 126, 0.5, '#f7b6c8');
  // sparkles float in the air above the two heads, never over a face
  s += spark(104, 96, 0.6) + spark(228, 92, 0.7) + spark(164, 104, 0.45);
  return s;
}

function homeEvening(): string {
  let s = bg('#c9c3e0');
  // lamp glow
  s += glow(200, 70, 90, '#ffe6a8', 0.25) + glow(200, 70, 50, '#ffe6a8', 0.3);
  // window with moon
  s += sh(box(24, 36, 80, 74, 5, 1), '#a07e66');
  s += fl(box(31, 43, 66, 60, 3, 0.4), '#5a6699');
  s += fl('M74,60 C66,62 62,72 66,80 C70,88 80,90 86,84 C78,84 70,78 70,70 C70,65 72,62 74,60z', '#fff1b8');
  s += ln('M74,60 C66,62 62,72 66,80 C70,88 80,90 86,84 C78,84 70,78 70,70 C70,65 72,62 74,60z', 1.6);
  s += spark(44, 56, 0.45) + spark(52, 86, 0.35) + spark(88, 50, 0.4);
  s += ln(box(31, 43, 66, 60, 3, 0.4), 2);
  s += ln('M64,43 L64,103', 4.5) + ln('M64,43 L64,103', 2.2, '#a07e66');
  s += sh(box(20, 108, 88, 7, 3, 0.4), '#b98f72', 2);
  s += curtain(104, 30, 70, -1, '#9cc7a8');
  // floor + rug
  s += sh('M-4,180 C90,178 230,181 324,179 L324,244 L-4,244z', '#b59478', 2);
  s += faint('M0,204 C90,203 210,205 320,203 M0,226 C90,225 210,227 320,225 M90,180 L86,204 M220,180 L216,204 M150,204 L146,226 M40,204 L36,226 M270,204 L266,226', 1.2, 0.22);
  s += sh(blob(150, 216, 50, 11, 0.2), '#e8b4b8', 2) + `<ellipse cx="150" cy="216" rx="38" ry="7" fill="none" stroke="#fff6ea" stroke-width="1.6" stroke-dasharray="3 3"/>`;
  // stove + kettle
  s += shadow(44, 198, 28, 4);
  s += sh(box(18, 138, 52, 60, 5, 1), '#9fc3d4');
  s += sh(box(25, 160, 38, 28, 4, 0.5), '#cfe3ec', 1.8) + ln('M34,165 L54,165', 2);
  s += `<ellipse cx="32" cy="141" rx="7" ry="2" fill="${INK}" opacity=".45"/><ellipse cx="56" cy="141" rx="7" ry="2" fill="${INK}" opacity=".45"/>`;
  s += sh('M48,140 C46,130 50,124 57,124 C64,124 68,130 66,140z', '#f2a7a7', 2) + ln('M66,132 C70,130 72,128 74,124', 2.2) + ln('M52,124 C53,119 61,119 62,124', 1.8);
  s += faint('M73,118 q-2,-4 1,-8 q3,-4 0,-8', 1.4, 0.35);
  // shelf + empty jar
  s += sh(box(118, 88, 64, 6, 2, 0.4), '#b98f72', 2) + ln('M126,94 L130,102 L134,94 M166,94 L170,102 L174,94', 1.6);
  s += jar(150, 88, 0.95, true);
  s += spark(170, 62, 0.5, '#ffffff');
  // bare wall: one nail
  s += `<circle cx="236" cy="54" r="1.8" fill="${INK}" opacity=".6"/>`;
  // bed
  s += shadow(256, 200, 54, 4);
  s += sh(box(288, 118, 22, 80, 5, 1), '#d9a07a');
  s += sh(box(204, 158, 102, 36, 5, 1), '#d9a07a');
  s += sh(box(206, 148, 98, 16, 6, 0.6), CREAM, 2);
  s += sh(blob(282, 147, 15, 7, 0.3), '#fffaf2', 2);
  s += sh('M206,154 C226,151 252,152 272,155 C274,165 273,176 270,184 C250,186 226,185 206,184z', '#9cc7a8', 2);
  s += faint('M220,154 L219,184 M236,153 L236,185 M252,154 L253,185', 1.4, 0.3);
  s += sh(box(208, 192, 6, 8, 1.5, 0.2), '#b98f72', 1.6) + sh(box(296, 192, 6, 8, 1.5, 0.2), '#b98f72', 1.6);
  // hanging lamp
  s += ln('M200,0 L200,52', 1.6) + sh('M184,68 C184,58 190,52 200,52 C210,52 216,58 216,68 C208,70 192,70 184,68z', '#ffd28a');
  s += `<ellipse cx="200" cy="70" rx="6" ry="2.5" fill="#fff3b8"/>`;
  // Mocha with envelope
  s += fig(MOCHA_SCARF, 150, 214, 1.2, 'happy', 1, {
    armR: ARM_CHEST, armL: ARM_CHEST, armsFront: true,
    front: envelope(0, -1, 20, -6),
  });
  s += hrt(176, 118, 0.55) + spark(124, 128, 0.55);
  return s;
}

function dreamBike(): string {
  let s = bg('#cfe8f6');
  s += sun(272, 40, 18);
  s += cloud(70, 40, 1) + cloud(176, 28, 0.7);
  // hedge + houses far
  s += sh('M-4,150 C20,134 40,140 56,132 C76,124 92,140 112,132 C136,124 150,138 172,130 C196,122 214,138 236,132 C260,124 290,136 324,128 L324,170 L-4,170z', '#a8d49a', 2);
  s += flower(30, 146, 0.5, '#f7b6c8', '#f6cf6b') + flower(98, 142, 0.5, CREAM, '#e58a94') + flower(160, 144, 0.5, '#c9b6e4', '#f6cf6b') + flower(250, 142, 0.5, '#f7b6c8', '#f6cf6b') + flower(300, 140, 0.5, CREAM, '#e58a94');
  // ground
  s += sh('M-4,166 C90,162 230,166 324,162 L324,244 L-4,244z', '#bfe3a6', 2);
  s += sh('M-4,196 C80,190 220,194 324,188 L324,232 C220,236 80,232 -4,238z', '#f3e3c3', 2);
  s += faint('M14,176 l3,-5 M40,182 l2,-5 M130,174 l3,-5 M200,178 l2,-5 M290,172 l3,-5', 1.4, 0.35);
  // confetti
  const r = rng(77);
  const cols = ['#f7b6c8', '#ffe08a', '#bfe3d0', '#c9b6e4', '#9fc3d4', '#efa98a'];
  for (let i = 0; i < 15; i++) {
    const x = n(10 + r() * 300), y = n(8 + r() * 150), c = cols[i % cols.length], rot = Math.round(r() * 180);
    s += i % 3 === 0
      ? `<circle cx="${x}" cy="${y}" r="2.6" fill="${c}" stroke="${INK}" stroke-width=".9"/>`
      : `<rect x="${n(x - 3)}" y="${n(y - 1.6)}" width="6" height="3.2" rx="1" fill="${c}" stroke="${INK}" stroke-width=".9" transform="rotate(${rot} ${x} ${y})"/>`;
  }
  // jar (empty, lid off) + Mocha + bike
  s += jar(38, 214, 1.05, false);
  s += sh(box(52, 208, 20, 7, 2.5, 0.4), '#e58a94', 1.8);
  s += fig(MOCHA_SCARF, 104, 216, 1.18, 'happy', 1, { armR: ARM_UP });
  s += bike(212, 196, 1.15, '#8fd3c1');
  s += spark(174, 148, 0.8) + spark(262, 170, 0.6, '#ffffff') + spark(150, 186, 0.6, '#ffffff') + spark(246, 140, 0.7);
  return s;
}

function dreamMom(): string {
  let s = bg('#dff1f8');
  s += sun(46, 40, 16);
  s += cloud(150, 34, 0.8) + cloud(270, 22, 0.6);
  // hills
  s += sh('M-4,122 C40,94 90,98 130,112 C170,126 210,86 260,84 C290,83 310,90 324,96 L324,244 L-4,244z', '#c6e4b4', 2);
  s += sh('M-4,154 C50,130 110,136 160,150 C200,160 250,124 324,132 L324,244 L-4,244z', '#addb9c', 2);
  s += fl('M258,104 C248,122 282,130 270,150 C262,166 230,180 214,244 L246,244 C254,196 292,172 288,150 C298,128 270,120 272,104z', '#f6e7c8');
  s += sh('M-4,190 C60,172 130,176 190,184 C240,190 280,176 324,180 L324,244 L-4,244z', '#cdeab8', 2);
  // cottage
  s += shadow(258, 104, 30, 3);
  s += sh(box(236, 74, 46, 30, 3, 0.6), '#fff1e0');
  s += sh(box(270, 46, 8, 16, 2, 0.4), '#d9a07a', 1.8);
  s += sh('M228,78 C236,66 248,54 259,48 C270,54 282,66 290,78 C270,80 248,80 228,78z', '#e58a8a');
  s += sh(box(254, 86, 11, 18, 4, 0.3), '#b98a6a', 1.8);
  s += sh(box(241, 82, 9, 9, 2, 0.3), '#bfe3f5', 1.6) + sh(box(270, 82, 9, 9, 2, 0.3), '#bfe3f5', 1.6);
  s += faint('M276,40 q-3,-4 0,-8 q3,-4 0,-8', 1.4, 0.3);
  // flowers on hills
  s += flower(30, 168, 0.55, '#f7b6c8', '#f6cf6b') + flower(84, 150, 0.5, CREAM, '#e58a94') + flower(212, 150, 0.5, '#c9b6e4', '#f6cf6b')
    + flower(16, 222, 0.6, '#ffe08a', '#e58a94') + flower(300, 214, 0.65, '#f7b6c8', '#f6cf6b');
  // parked bicycle
  s += bike(62, 200, 0.95, '#8fd3c1') + ln('M60,202 L54,219', 2.2);
  // Mocha + Mom hugging
  const shawl = 'M-16,-16 C-6,-10 6,-10 16,-16 C21,-9 20,0 15,4 C9,0 4,6 0,12 C-4,6 -9,0 -15,4 C-20,-1 -21,-10 -16,-16z';
  const shawlMarks = sh(shawl, '#f6c9d6', 2)
    + flower(-10, -6, 0.38, CREAM, '#e58a94', 0.9) + flower(9, -5, 0.38, '#ffe08a', '#e58a94', 0.9) + flower(0, 4, 0.34, '#c9b6e4', '#f6cf6b', 0.9)
    + faint('M-15,4 l-1,4 M-12,3 l-1,4 M12,3 l1,4 M15,4 l1,4', 1.2, 0.5);
  const glasses = `<circle cx="-8" cy="-31" r="5.6" fill="#ffffff" fill-opacity=".25" stroke="${INK}" stroke-width="1.6"/>`
    + `<circle cx="9" cy="-30.5" r="5.6" fill="#ffffff" fill-opacity=".25" stroke="${INK}" stroke-width="1.6"/>`
    + ln('M-2.4,-31.5 C-0.5,-33 1.5,-33 3.4,-31', 1.5) + ln('M-13.6,-32 L-19,-34 M14.6,-31.5 L20,-33', 1.4);
  s += fig(MOCHA_SCARF, 146, 216, 1.1, 'happy', 1, { armR: null });
  s += fig(MOM, 182, 214, 1.22, 'happy', -1, { armR: ARM_HUG, armsFront: true, mid: shawlMarks, front: glasses });
  s += overlay(146, 216, 1.1, 1, sh(ARM_HUG_LOW, MOCHA_SCARF.color));
  s += hrt(164, 108, 0.8) + hrt(146, 92, 0.5, '#f7b6c8') + hrt(186, 88, 0.55, '#f7b6c8') + hrt(124, 120, 0.4) + hrt(206, 112, 0.45);
  s += spark(110, 150, 0.6) + spark(226, 160, 0.6, '#ffffff');
  return s;
}

export function storyArtB(id: StoryArtId): string {
  switch (id) {
    case 'shop_ready': return shopReady();
    case 'payday': return payday();
    case 'home_evening': return homeEvening();
    case 'dream_bike': return dreamBike();
    case 'dream_mom': return dreamMom();
    default: return '';
  }
}
