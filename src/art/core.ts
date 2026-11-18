/* Shared drawing helpers: ink line + offset colour fill, hand-shaped (uneven but smooth) outlines,
   a seeded RNG so every crooked shape is crooked the same way on every frame. */

import { INK, EYE, BLUSH, fl, ln, sh } from './kit';
export { INK, EYE, BLUSH, fl, ln, sh };
export const CREAM = '#fff6ea';
export const PAPER = '#fffaf2';
export const GOLD = '#f2c14e';
export const BERRY = '#c4506a';
export const FONT = "'Baloo 2','Nunito','Trebuchet MS',system-ui,sans-serif";

/** Round to 1 decimal for compact markup. */
export const n = (v: number): number => Math.round(v * 10) / 10;

/** mulberry32 */
export function rng(seed: number): () => number {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Round caps/joins for everything inside. */
export const grp = (inner: string, transform?: string, extra = ''): string =>
  `<g${transform ? ` transform="${transform}"` : ''} stroke-linecap="round" stroke-linejoin="round"${extra}>${inner}</g>`;

/** Hand-shaped rounded rectangle path: sides bow very slightly, corners soft. */
export function hrect(x: number, y: number, w: number, h: number, r = 4, wob = 0.8, seed = 1): string {
  const R = rng(seed * 7919 + 13);
  const j = (k = 1) => (R() * 2 - 1) * wob * k;
  const L = x, T = y, Rt = x + w, B = y + h;
  r = Math.min(r, w / 2, h / 2);
  const p = (a: number, b: number) => `${n(a)},${n(b)}`;
  const sy = T + j(0.3);
  return `M${p(L + r, sy)}`
    + ` C${p(L + w * 0.35, T + j())} ${p(L + w * 0.65, T + j())} ${p(Rt - r, T + j(0.3))}`
    + ` Q${p(Rt, T)} ${p(Rt, T + r)}`
    + ` C${p(Rt + j(), T + h * 0.35)} ${p(Rt + j(), T + h * 0.65)} ${p(Rt, B - r)}`
    + ` Q${p(Rt, B)} ${p(Rt - r, B)}`
    + ` C${p(L + w * 0.65, B + j())} ${p(L + w * 0.35, B + j())} ${p(L + r, B)}`
    + ` Q${p(L, B)} ${p(L, B - r)}`
    + ` C${p(L + j(), T + h * 0.65)} ${p(L + j(), T + h * 0.35)} ${p(L, T + r)}`
    + ` Q${p(L, T)} ${p(L + r, sy)}z`;
}

/** Hand-shaped ellipse path (four cubic arcs with slightly uneven radii). */
export function hell(cx: number, cy: number, rx: number, ry: number, wob = 0.04, seed = 1): string {
  const R = rng(seed * 104729 + 7);
  const k = 0.5523;
  const rr = [0, 1, 2, 3].map(() => 1 + (R() * 2 - 1) * wob);
  const pts = [
    [cx + rx * rr[0], cy], [cx, cy + ry * rr[1]], [cx - rx * rr[2], cy], [cx, cy - ry * rr[3]],
  ];
  const p = (a: number, b: number) => `${n(a)},${n(b)}`;
  let d = `M${p(pts[0][0], pts[0][1])}`;
  for (let i = 0; i < 4; i++) {
    const a = pts[i], b = pts[(i + 1) % 4];
    const ra = rr[i], rb = rr[(i + 1) % 4];
    let c1: number[], c2: number[];
    if (i === 0) { c1 = [a[0], a[1] + ry * k * rb]; c2 = [b[0] + rx * k * ra, b[1]]; }
    else if (i === 1) { c1 = [a[0] - rx * k * rb, a[1]]; c2 = [b[0], b[1] + ry * k * ra]; }
    else if (i === 2) { c1 = [a[0], a[1] - ry * k * rb]; c2 = [b[0] - rx * k * ra, b[1]]; }
    else { c1 = [a[0] + rx * k * rb, a[1]]; c2 = [b[0], b[1] - ry * k * ra]; }
    d += ` C${p(c1[0], c1[1])} ${p(c2[0], c2[1])} ${p(b[0], b[1])}`;
  }
  return d + 'z';
}

/** Heart path centred near (0,0), ~18 wide at s=1. */
export const HEART = 'M0,5 C-10,-2 -6,-10 0,-5 C6,-10 10,-2 0,5z';
export const heart = (x: number, y: number, s: number, c: string, stroke = ''): string =>
  `<path transform="translate(${n(x)},${n(y)}) scale(${s})" d="${HEART}" fill="${c}"${stroke ? ` stroke="${stroke}" stroke-width="${n(1.2 / s)}"` : ''}/>`;

/** Five-petal flower path, ~8 across. */
export const FLOWER = 'M0,-1.2 C-1.6,-4.6 1.6,-4.6 0,-1.2 M0,0z';
export function flower(x: number, y: number, s: number, petal: string, centre: string, w = 1.1): string {
  let petals = '';
  for (let i = 0; i < 5; i++) {
    petals += `<path transform="rotate(${i * 72 + 10})" d="M0,-0.8 C-3,-3.4 -2,-6.4 0,-6.4 C2,-6.4 3,-3.4 0,-0.8z"/>`;
  }
  return `<g transform="translate(${n(x)},${n(y)}) scale(${s})"><g fill="${petal}" stroke="${INK}" stroke-width="${n(w / s)}">${petals}</g><circle r="2" fill="${centre}"/></g>`;
}

/** Four-point sparkle. */
export const SPARK = 'M0,-6 Q0.8,-0.8 6,0 Q0.8,0.8 0,6 Q-0.8,0.8 -6,0 Q-0.8,-0.8 0,-6z';

/** Standalone svg wrapper with inline round caps. */
export function svgWrap(inner: string, vb: string, size: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${vb}" stroke-linecap="round" stroke-linejoin="round" fill="none">${inner}</svg>`;
}

/** Mix two #rrggbb colours. */
export function mix(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t);
  return '#' + ((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1);
}

/** Smiley yarn ball. */
export function yarn(x: number, y: number, r: number, c: string, face = true, rot = 0): string {
  const d = hell(0, 0, r, r, 0.03, Math.round(r * 10 + x));
  let s = `<g transform="translate(${n(x)},${n(y)})">` + fl(d, c)
    + `<g transform="rotate(${rot})" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="${n(Math.max(0.8, r / 9))}">`
    + `<path d="M${n(-r * 0.8)},${n(-r * 0.25)} q${n(r * 0.8)},${n(-r * 0.85)} ${n(r * 1.6)},0 M${n(-r * 0.85)},${n(r * 0.3)} q${n(r * 0.85)},${n(-r * 0.85)} ${n(r * 1.7)},0 M${n(-r * 0.25)},${n(-r * 0.85)} q${n(r * 0.85)},${n(r * 0.85)} 0,${n(r * 1.7)}"/></g>`
    + ln(d, n(Math.max(1, r / 7)));
  if (face && r >= 6) {
    const e = n(r * 0.32), ey = n(r * 0.02), er = n(Math.max(0.8, r * 0.11));
    s += `<circle cx="${-e}" cy="${ey}" r="${er}" fill="${EYE}"/><circle cx="${e}" cy="${ey}" r="${er}" fill="${EYE}"/>`
      + `<path d="M${n(-r * 0.15)},${n(r * 0.25)} q${n(r * 0.15)},${n(r * 0.17)} ${n(r * 0.3)},0" stroke="${EYE}" stroke-width="${n(Math.max(0.8, r / 10))}" fill="none"/>`
      + `<ellipse cx="${n(-r * 0.55)}" cy="${n(r * 0.24)}" rx="${n(r * 0.16)}" ry="${n(r * 0.1)}" fill="${BLUSH}" opacity=".85"/><ellipse cx="${n(r * 0.55)}" cy="${n(r * 0.24)}" rx="${n(r * 0.16)}" ry="${n(r * 0.1)}" fill="${BLUSH}" opacity=".85"/>`;
  }
  return s + '</g>';
}

/** Pumpkin centred (0,0), ~30 wide at s=1. */
export function pumpkin(x: number, y: number, s: number, face = true): string {
  const body = 'M0,-11 C-8,-13 -16,-8 -15,1 C-14,10 -6,12 0,11 C6,12 14,10 15,1 C16,-8 8,-13 0,-11z';
  return `<g transform="translate(${n(x)},${n(y)}) scale(${s})">`
    + `<ellipse cy="11" rx="14" ry="3.5" fill="#20102e" opacity=".2"/>`
    + ln('M0,-10 C0,-14 2,-17 5,-17', 3, '#5c7a3a')
    + sh(body, '#f08a3c', 1.8)
    + `<path d="M-7,-10 C-11,-3 -11,5 -6,11 M7,-10 C11,-3 11,5 6,11" fill="none" stroke="#c9641f" stroke-width="1.3"/>`
    + (face ? `<path d="M-8,-2 C-7,-5 -6,-6 -5,-6 C-4,-5 -3,-3 -2,-2z M2,-2 C3,-4 4,-6 5,-6 C6,-5 7,-4 8,-2z M-8,3 C-4,8 4,8 8,3 C5,4.5 -5,4.5 -8,3z" fill="#ffe08a" stroke="#7a3a10" stroke-width=".7"/>` : '')
    + '</g>';
}
