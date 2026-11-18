/* KONBINI ART — "Hoshi Mart", an original, cosy little pastel convenience store (360x720 portrait).
   Own star motif + own name only (no real chain's name, logo or colour stripes).
   Fixed furniture sits exactly on the KONBINI_* rects from layout.ts; products are drawn by the engine.
   Keep these exports and signatures. */
import type { CharacterLook, ThemeId } from '../types';
import {
  KONBINI_WALL_BOTTOM, KONBINI_DOOR, KONBINI_SHELF, KONBINI_FRIDGE, KONBINI_TABLE, KONBINI_COUNTER,
  KONBINI_AISLE, KONBINI_COFFEE, KONBINI_SLOTS,
} from '../layout';
import { INK, CREAM, fl, ln, sh, shadow, tinyFace, standalone } from './kit';
import { n, rng, hrect, hell, mix, pumpkin, SPARK, FONT, GOLD } from './core';

const W = 360, H = 720, WB = KONBINI_WALL_BOTTOM;
const kid = (k: string, t: ThemeId) => `kb-${k}-${t}`;

interface Pal {
  wall: string; wall2: string; stripe: string; stripe2: string; star: string;
  banner: string; bannerText: string; floorA: string; floorB: string; trim: string; mat: string;
}
const PAL: Record<ThemeId, Pal> = {
  everyday: { wall: '#eef8f2', wall2: '#fdf4e6', stripe: '#bfe3d0', stripe2: '#f9d3df', star: '#f6cf6b', banner: '#f7b9c9', bannerText: '#fffaf2', floorA: '#f6f1e8', floorB: '#e2edf3', trim: '#a9cbd9', mat: '#8fc3a7' },
  spring: { wall: '#fdf0f3', wall2: '#fff7ee', stripe: '#f8c6d4', stripe2: '#d4ebcb', star: '#f9d77e', banner: '#f3a8bf', bannerText: '#fffafb', floorA: '#f8f1ec', floorB: '#f2e2ea', trim: '#d9b3c8', mat: '#a9d6a0' },
  summer: { wall: '#e8f7fb', wall2: '#fffbe9', stripe: '#a9dcef', stripe2: '#fff0b0', star: '#f7c94a', banner: '#86cbe6', bannerText: '#fffdf4', floorA: '#f4f6f2', floorB: '#dcf0f5', trim: '#9cc9dc', mat: '#7ec4d8' },
  halloween: { wall: '#ece3f5', wall2: '#f8efe6', stripe: '#c2acdf', stripe2: '#f7c695', star: '#f6c25a', banner: '#a07ccc', bannerText: '#fff4e6', floorA: '#f1ebf2', floorB: '#e3d8ec', trim: '#b6a2cf', mat: '#f08a3c' },
  christmas: { wall: '#f7f0e6', wall2: '#fdf8f0', stripe: '#eba9a2', stripe2: '#c2dfc6', star: '#f2c14e', banner: '#d9776f', bannerText: '#fffaf2', floorA: '#f6f0e6', floorB: '#ece2d4', trim: '#c9a99a', mat: '#4f8f68' },
};
const pal = (t: ThemeId): [ThemeId, Pal] => (PAL[t] ? [t, PAL[t]] : ['everyday', PAL.everyday]);

/** Soft 5-point star path (round joins do the softening). */
function starD(cx: number, cy: number, r: number, rot = 0): string {
  let d = '';
  for (let i = 0; i < 10; i++) {
    const a = ((i * 36 + rot - 90) * Math.PI) / 180, rr = i % 2 ? r * 0.5 : r;
    d += `${i ? 'L' : 'M'}${n(cx + Math.cos(a) * rr)},${n(cy + Math.sin(a) * rr)} `;
  }
  return d + 'z ';
}
/** Five-petal blossom as one path (for merging many into one element). */
function blossomD(cx: number, cy: number, r: number): string {
  let d = '';
  for (let i = 0; i < 5; i++) {
    const a = ((i * 72 - 90) * Math.PI) / 180;
    d += hell(cx + Math.cos(a) * r * 0.62, cy + Math.sin(a) * r * 0.62, r * 0.48, r * 0.48, 0.05, i + Math.round(cx)) + ' ';
  }
  return d;
}
const txt = (x: number, y: number, s: string, size: number, fill: string, extra = '') =>
  `<text x="${x}" y="${y}" text-anchor="middle" font-family="${FONT}" font-size="${size}" font-weight="800" fill="${fill}"${extra}>${s}</text>`;
const inkTxt = (x: number, y: number, s: string, size: number, fill: string, sw = 3) =>
  txt(x, y, s, size, fill, ` stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round" paint-order="stroke"`);
/** Japanese labels: soft rounded gothic. */
const JFONT = "'Baloo 2', 'Hiragino Maru Gothic ProN', 'Yu Gothic', sans-serif";
const jtxt = (x: number, y: number, s: string, size: number, fill: string, extra = '') =>
  `<text x="${x}" y="${y}" text-anchor="middle" font-family="${JFONT}" font-size="${size}" font-weight="800" fill="${fill}"${extra}>${s}</text>`;
const jink = (x: number, y: number, s: string, size: number, fill: string, sw = 2.4) =>
  jtxt(x, y, s, size, fill, ` stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round" paint-order="stroke"`);
/** Puffy scalloped "burst" sign outline. */
function burstD(cx: number, cy: number, r: number, k = 12): string {
  const pt = (a: number, rr: number) => `${n(cx + Math.cos(a) * rr)},${n(cy + Math.sin(a) * rr)}`;
  let d = `M${pt(-Math.PI / 2, r * 0.86)}`;
  for (let i = 0; i < k; i++) {
    const a0 = -Math.PI / 2 + (i * 2 * Math.PI) / k, a1 = a0 + (2 * Math.PI) / k;
    d += ` Q${pt((a0 + a1) / 2, r * 1.16)} ${pt(a1, r * 0.86)}`;
  }
  return d + 'z';
}
/** Little yellow price tags (one path) centred under each x, hanging from a rail at y. */
function tagsD(xs: number[], y: number, w = 13, h = 6): string {
  return xs.map((x) => `M${n(x - w / 2)},${y} h${w} v${h} h-${w}z`).join(' ');
}
const TAG = '#ffe27a';
function priceTags(xs: number[], y: number, w = 13, h = 6): string {
  const d = tagsD(xs, y, w, h);
  let marks = '';
  for (const x of xs) marks += `M${n(x - w / 2 + 3)},${n(y + h / 2)} h${n(w - 6)} `;
  return `<path d="${d}" fill="${TAG}" stroke="${INK}" stroke-opacity=".55" stroke-width=".9"/>`
    + `<path d="${marks}" stroke="${INK}" stroke-opacity=".45" stroke-width="1.1" stroke-dasharray="1.6 1.4"/>`;
}
const slotXs = (area: string, y: number) => KONBINI_SLOTS.filter((s) => s.area === area && s.y === y).map((s) => s.x);

/* ------------------------------------------------------------------ defs */
export function konbiniDefs(theme: ThemeId): string {
  const [t, p] = pal(theme);
  return `<linearGradient id="${kid('fridge', t)}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbfdff"/><stop offset=".5" stop-color="#e3f3fb"/><stop offset="1" stop-color="#cfe8f4"/></linearGradient>`
    + `<linearGradient id="${kid('hot', t)}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3c9"/><stop offset="1" stop-color="#f9c27e"/></linearGradient>`
    + `<linearGradient id="${kid('out', t)}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t === 'halloween' ? '#cdb8e6' : t === 'christmas' ? '#d9e6f2' : '#d6eef8'}"/><stop offset="1" stop-color="${t === 'spring' ? '#fbe1ea' : '#f2f7ee'}"/></linearGradient>`
    + `<radialGradient id="${kid('glow', t)}"><stop offset="0" stop-color="#fffbe6" stop-opacity=".55"/><stop offset=".55" stop-color="#fff4d2" stop-opacity=".16"/><stop offset="1" stop-color="#fff4d2" stop-opacity="0"/></radialGradient>`
    + `<radialGradient id="${kid('warm', t)}"><stop offset="0" stop-color="#ffcf7a" stop-opacity=".5"/><stop offset="1" stop-color="#ffb35a" stop-opacity="0"/></radialGradient>`
    + `<pattern id="${kid('peg', t)}" width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="6" cy="6" r="1" fill="${mix(p.stripe, INK, 0.2)}" opacity=".35"/></pattern>`;
}

/* ------------------------------------------------------------ wall & floor */
function wall(p: Pal): string {
  const R = rng(311);
  let stars = '';
  for (let i = 0; i < 16; i++) stars += starD(n(10 + R() * 340), n(92 + R() * 120), 2.4 + R() * 1.6, R() * 60);
  let band = '';
  for (let x = 12; x < W; x += 24) band += starD(x, 240, 4.2, (x * 7) % 30);
  // ceiling: two staggered rows of bright light panels + a star-motif trim
  let lp = '', trim = '';
  for (const [y, off] of [[5, 0], [22, 34]] as const) {
    for (let i = 0; i < 5; i++) { const x = 8 + off + i * 70; if (x + 50 <= W) lp += hrect(x, y, 50, 11, 4, 0.2, i + y) + ' '; }
  }
  for (let x = 10; x < W; x += 20) trim += starD(x, 41, 2.6, (x * 3) % 30);
  return `<rect width="${W}" height="${WB + 2}" fill="${p.wall}"/>`
    + `<rect width="${W}" height="44" fill="${p.wall2}"/>`
    + `<path d="${lp}" fill="#fffdf2"/>`
    + `<path d="${lp}" fill="none" stroke="${mix(p.trim, INK, 0.3)}" stroke-width="1.2"/>`
    + `<rect y="37" width="${W}" height="8" fill="${p.stripe}"/>`
    + `<path d="${trim}" fill="${p.star}" stroke="${INK}" stroke-opacity=".4" stroke-width=".7"/>`
    + `<path d="${stars}" fill="${p.star}" opacity=".32"/>`
    // star-motif stripe along the bottom of the wall
    + `<rect y="226" width="${W}" height="${WB - 226 + 2}" fill="${p.stripe}"/>`
    + `<rect y="230" width="${W}" height="3" fill="${p.stripe2}"/>`
    + `<path d="${band}" fill="#fffaf0" stroke="${INK}" stroke-opacity=".35" stroke-width=".9" stroke-linejoin="round"/>`
    + ln(`M0,226 C120,225.4 240,226.6 ${W},226`, 1.6)
    + ln(`M0,${WB} C120,${WB + 0.6} 240,${WB - 0.6} ${W},${WB}`, 2);
}

function floor(p: Pal): string {
  const S = 36;
  let chk = '', grout = '', dots = '';
  for (let r = 0, y = WB + 1; y < H; r++, y += S) {
    for (let c = 0, x = 0; x < W; c++, x += S) {
      if ((r + c) % 2) chk += `M${x},${y}h${S}v${S}h-${S}z`;
      if ((r * 5 + c * 3) % 11 === 4) dots += starD(x + S / 2, y + S / 2, 4, r * 9);
    }
    grout += `M0,${y + S} C120,${n(y + S + 0.6)} 240,${n(y + S - 0.6)} ${W},${y + S} `;
  }
  for (let x = S; x < W; x += S) grout += `M${x},${WB + 1} C${x + 0.6},400 ${x - 0.6},560 ${x},${H} `;
  return `<rect y="${WB}" width="${W}" height="${H - WB}" fill="${p.floorA}"/>`
    + `<path d="${chk}" fill="${p.floorB}"/>`
    + `<path d="${dots}" fill="${p.star}" opacity=".22"/>`
    + `<path d="${grout}" fill="none" stroke="${INK}" stroke-opacity=".13" stroke-width="1"/>`
    + `<rect y="${WB}" width="${W}" height="12" fill="${INK}" opacity=".07"/>`;
}

/* ------------------------------------------------------------ sign banner (text below y 56) */
function banner(p: Pal): string {
  const b = hrect(6, 42, 242, 36, 9, 0.6, 3);
  return sh(b, p.banner, 2.2)
    + `<path d="${hrect(11, 46, 232, 28, 7, 0.4, 4)}" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="1.3" stroke-dasharray="3 3.5"/>`
    // star mascot emblem
    + sh(starD(30, 62, 11.5, 0), p.star, 1.8) + tinyFace(30, 63, 0.55)
    + inkTxt(134, 69, 'Hoshi Mart', 16, p.bannerText, 3.2)
    + `<path d="${starD(214, 58, 4.2, 10)}${starD(226, 66, 3, -8)}${starD(62, 54.5, 2.6, 4)}" fill="${p.star}" stroke="${INK}" stroke-width="1" stroke-linejoin="round"/>`;
}

/* ------------------------------------------------------------ automatic glass door + welcome mat */
function door(t: ThemeId, p: Pal): string {
  const D = KONBINI_DOOR, L = D.x - D.w / 2, T = WB - D.h, R = L + D.w, M = D.x;
  const frame = '#e4edf2';
  return sh(hrect(L - 4, T - 6, D.w + 8, D.h + 8, 6, 0.5, 21), frame, 2.2)
    + `<rect x="${L + 2}" y="${T}" width="${D.w - 4}" height="${D.h - 1}" rx="3" fill="url(#${kid('out', t)})"/>`
    // the street outside: a bush and the kerb
    + `<path d="M${L + 2},${WB - 22} C${L + 20},${WB - 23} ${R - 20},${WB - 21} ${R - 2},${WB - 22} L${R - 2},${WB - 1} L${L + 2},${WB - 1}z" fill="#d9d4cc" opacity=".8"/>`
    + `<path d="${hell(L + 16, WB - 28, 12, 9, 0.06, 5)} ${hell(R - 12, WB - 26, 9, 7, 0.06, 6)}" fill="#a9d6a0" opacity=".85"/>`
    // two sliding panes
    + ln(`M${L + 2},${T} L${R - 2},${T} L${R - 2},${WB - 1} L${L + 2},${WB - 1}z M${M},${T} L${M},${WB - 1}`, 2.4, mix(frame, INK, 0.45))
    + `<path d="M${L + 4},${T + 52} h${D.w - 8} M${L + 4},${T + 57} h${D.w - 8}" stroke="${p.stripe2}" stroke-width="3" opacity=".9"/>`
    + `<path d="M${L + 8},${T + 30} l14,-16 M${L + 8},${T + 42} l22,-26 M${M + 6},${T + 40} l14,-16" stroke="#fff" stroke-opacity=".6" stroke-width="3" fill="none"/>`
    // "自動ドア" sticker on the left pane, a star sticker on the right one
    + sh(hrect(L + 5, T + 66, 26, 11, 5, 0.2, 25), '#fffaf2', 1.1)
    + jtxt(L + 18, T + 74.2, '自動ドア', 5.6, INK)
    + sh(starD(M + 16, T + 71, 6, 0), p.star, 1.2)
    // motion sensor
    + sh(hrect(M - 13, T - 12, 26, 6, 3, 0.3, 22), '#f3f6f9', 1.5)
    + `<circle cx="${M + 7}" cy="${T - 9}" r="1.5" fill="#7fcf8f"/>`
    // welcome mat
    + sh(hrect(L - 2, WB + 4, D.w + 4, 19, 7, 0.5, 23), p.mat, 1.8)
    + `<path d="${hrect(L + 2, WB + 7, D.w - 4, 13, 5, 0.3, 24)}" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="1.1" stroke-dasharray="2.5 3"/>`
    + jtxt(M, WB + 16.6, 'いらっしゃいませ', 7, '#fffaf0');
}

/* ------------------------------------------------------------ entrance bits: 24h sign, umbrellas, baskets, recycling bin */
function entrance(p: Pal): string {
  const sx = 80, sy = 136;
  // hanging vertical "24時間" sign beside the door
  return ln(`M${sx + 4},128 L${sx + 6},${sy} M${sx + 16},128 L${sx + 14},${sy}`, 1)
    + `<circle cx="${sx + 10}" cy="127" r="1.6" fill="${INK}"/>`
    + sh(hrect(sx, sy, 20, 70, 5, 0.3, 26), '#fffaf2', 1.8)
    + fl(hrect(sx + 2, sy + 2, 16, 15, 4, 0.2, 27), p.banner)
    + jink(sx + 10, sy + 13.5, '24', 9, '#fffaf0', 2)
    + jtxt(sx + 10, sy + 32, '時', 11, INK) + jtxt(sx + 10, sy + 48, '間', 11, INK)
    + `<path d="${starD(sx + 10, sy + 60, 4, 0)}" fill="${p.star}" stroke="${INK}" stroke-width=".9"/>`
    // umbrella stand with two folded pastel umbrellas
    + sh('M82,238 C81,230 83,221 85,216 C87,221 89,230 88,238z', '#9dbbe6', 1.3)
    + sh('M89,238 C88,232 90,225 92,221 C94,225 96,232 95,238z', '#f7b9c9', 1.3)
    + ln('M85,216 L85,211 C85,207 80,207 80,210 M92,221 L92,216 C92,212 97,212 97,215', 1.6)
    + shadow(88, 257, 11, 2.2, 0.12)
    + sh(hrect(79, 236, 18, 20, 4, 0.4, 32), '#cfe3ee', 1.8)
    + `<path d="M79.5,243 h17" stroke="${p.stripe}" stroke-width="2.5"/>`
    // stack of shopping baskets by the door
    + shadow(92, 293, 15, 2.6, 0.12)
    + sh('M80,272 L104,272 L101,291 L83,291z', p.banner, 1.7)
    + `<path d="M82.5,279 h19 M83,285 h18 M87,274 v15 M92,274 v16 M97,274 v15" stroke="#fff" stroke-opacity=".6" stroke-width="1.3"/>`
    + ln('M79,272 h26 M79.5,268.5 h25 M80,265 h24', 2, mix(p.banner, INK, 0.35))
    + ln('M84,265 C84,256 100,256 100,265', 1.6)
    // cute recycling bin
    + shadow(18, 329, 15, 2.5, 0.12)
    + sh(hrect(5, 292, 26, 36, 5, 0.4, 28), '#d4ecdf', 1.8)
    + sh(hrect(3, 286, 30, 8, 3, 0.3, 29), '#a9d6c0', 1.6)
    + `<path d="${hell(12, 290, 3, 2, 0.04, 30)} M20,288.6 h8 v2.8 h-8z" fill="${INK}" opacity=".55"/>`
    + tinyFace(18, 310, 0.5)
    + jtxt(18, 323, 'エコ', 6, '#5a8f74');
}

/* ------------------------------------------------------------ wall shelving unit (empty boards) */
function shelf(t: ThemeId, p: Pal): string {
  const S = KONBINI_SHELF, x = S.x, y = S.y, w = S.w, h = S.h;
  const wood = '#efd2ad';
  let s = sh(hrect(x, y, w, h + 2, 6, 0.5, 41), '#f7ebdc', 2.2)
    + `<rect x="${x + 6}" y="${y + 14}" width="${w - 12}" height="${h - 24}" fill="#fffaf3"/>`
    + `<rect x="${x + 6}" y="${y + 14}" width="${w - 12}" height="${h - 24}" fill="url(#${kid('peg', t)})"/>`
    // header cap with a tiny sign
    + sh(hrect(x - 4, y - 2, w + 8, 15, 5, 0.4, 42), p.stripe, 1.9)
    + jtxt(x + w / 2, y + 9.6, '★ おやつ・パン ★', 8, INK);
  let boards = '', rails = '', shade = '';
  for (const by of [122, 172, 222]) {
    boards += hrect(x + 3, by, w - 6, 6, 2, 0.3, by) + ' ';
    rails += `M${x + 8},${by + 6} h${w - 16} v4 h-${w - 16}z `;
    shade += `M${x + 6},${by + 6} h${w - 12} v6 h-${w - 12}z `;
  }
  s += `<path d="${shade}" fill="${INK}" opacity=".07"/>`
    + fl(boards, wood) + ln(boards, 1.7)
    + `<path d="${rails}" fill="${p.stripe2}"/>`;
  for (const by of [122, 172, 222]) s += priceTags(slotXs('shelf', by - 12), by + 6, 13, 6);
  // little POP strips sticking out of the shelf edges
  return s + sh(hrect(x - 3, 164, 22, 10, 3, 0.2, 43), '#ffd9c2', 1.3) + jtxt(x + 8, 171.6, '特価', 6, '#d0623f')
    + sh(hrect(x + w - 14, 214, 22, 10, 3, 0.2, 44), '#d6ecfb', 1.3) + jtxt(x + w - 3, 221.6, '人気', 6, '#3f8fbf');
}

/* ------------------------------------------------------------ glass-door drinks fridge */
function fridge(t: ThemeId, p: Pal): string {
  const F = KONBINI_FRIDGE, x = F.x, y = F.y, w = F.w, h = F.h;
  const dl = { x: x + 4, w: 45 }, dr = { x: x + 51, w: 43 }, iy = y + 24, ih = h - 32;
  let s = shadow(x + w / 2, y + h + 2, w / 2 + 4, 3, 0.12)
    + sh(hrect(x - 2, y - 2, w + 4, h + 4, 7, 0.5, 51), '#f4f7fa', 2.2)
    + fl(hrect(x + 3, y + 2, w - 6, 18, 5, 0.3, 52), p.stripe)
    + jtxt(x + w / 2 + 6, y + 15, 'ドリンク', 8.5, INK)
    + `<path d="M${x + 14},${y + 7} v8 M${x + 10.5},${y + 9} l7,4 M${x + 17.5},${y + 9} l-7,4" stroke="#fff" stroke-width="1.6"/>`
    + `<rect x="${dl.x}" y="${iy}" width="${dl.w}" height="${ih}" rx="3" fill="url(#${kid('fridge', t)})"/>`
    + `<rect x="${dr.x}" y="${iy}" width="${dr.w}" height="${ih}" rx="3" fill="url(#${kid('fridge', t)})"/>`;
  // shelves just below the slot rows (120, 182) + glowing light strips at the top of each section
  let shelves = '', lights = '';
  for (const by of [133, 195, 234]) shelves += `M${dl.x},${by} h${dl.w} v3 h-${dl.w}z M${dr.x},${by} h${dr.w} v3 h-${dr.w}z `;
  for (const ly of [iy + 1, 137, 199]) lights += `M${dl.x + 3},${ly} h${dl.w - 6} v3 h-${dl.w - 6}z M${dr.x + 3},${ly} h${dr.w - 6} v3 h-${dr.w - 6}z `;
  s += `<path d="${lights}" fill="#fffbe0" opacity=".95"/>`
    + `<path d="${lights}" fill="none" stroke="#fff3a8" stroke-width="2.4" opacity=".45"/>`
    + `<path d="${shelves}" fill="#cfe0ea" stroke="${INK}" stroke-opacity=".45" stroke-width="1"/>`
    + priceTags(slotXs('fridge', 120), 136, 12, 5) + priceTags(slotXs('fridge', 182), 198, 12, 5)
    // door frames + handles
    + ln(`${hrect(dl.x, iy, dl.w, ih, 3, 0.2, 53)} ${hrect(dr.x, iy, dr.w, ih, 3, 0.2, 54)}`, 2.2, mix('#cfdbe4', INK, 0.4))
    + sh(`M${dl.x + dl.w - 5},144 C${dl.x + dl.w - 6},152 ${dl.x + dl.w - 6},164 ${dl.x + dl.w - 5},172 L${dl.x + dl.w - 2},172 L${dl.x + dl.w - 2},144z M${dr.x + 2},144 L${dr.x + 5},144 C${dr.x + 6},152 ${dr.x + 6},164 ${dr.x + 5},172 L${dr.x + 2},172z`, '#bcd2df', 1.4)
    + `<path d="M${x + 10},${y + h - 2} h${w - 20}" stroke="${INK}" stroke-opacity=".3" stroke-width="1.2" stroke-dasharray="4 3"/>`;
  return s;
}

/* ------------------------------------------------------------ middle aisle gondola (2 empty boards) + POP signs */
function aisle(t: ThemeId, p: Pal): string {
  const A = KONBINI_AISLE, x = A.x, y = A.y, w = A.w, h = A.h;
  const wood = '#efd2ad';
  let s = shadow(x + w / 2, y + h + 2, w / 2 + 8, 4.5, 0.14)
    + sh(hrect(x, y + 4, w, h - 4, 5, 0.5, 121), '#f7ebdc', 2.1)
    + `<rect x="${x + 6}" y="${y + 12}" width="${w - 12}" height="${h - 24}" fill="#fffaf3"/>`
    + `<rect x="${x + 6}" y="${y + 12}" width="${w - 12}" height="${h - 24}" fill="url(#${kid('peg', t)})"/>`
    + sh(hrect(x - 3, y, w + 6, 10, 4, 0.3, 122), p.stripe, 1.8);
  let boards = '', rails = '';
  for (const by of [364, 404]) {
    boards += hrect(x + 3, by, w - 6, 6, 2, 0.3, by) + ' ';
    rails += `M${x + 6},${by + 6} h${w - 12} v3.5 h-${w - 12}z `;
  }
  s += fl(boards, wood) + ln(boards, 1.7)
    + `<path d="${rails}" fill="${p.stripe2}"/>`
    + priceTags(slotXs('aisle', 352), 370, 14, 6.5)
    + `<path d="M${x + 4},${y + h - 1} h${w - 8}" stroke="${mix(p.stripe, INK, 0.25)}" stroke-width="2.4" opacity=".5"/>`
    // end cap on the left with a puffy "新発売!" burst sign on a little pole
    + sh(hrect(x - 6, y + 6, 9, h - 8, 3, 0.3, 123), p.stripe2, 1.6)
    + `<path d="M${x - 3},${y + 20} v8 M${x - 3},${y + 40} v8 M${x - 3},${y + 60} v8" stroke="#fff" stroke-width="2" opacity=".8"/>`
    + ln(`M52,${y - 6} L52,${y + 1}`, 1.5)
    + sh(burstD(52, 307, 17), '#ffe27a', 1.7)
    + `<path d="${burstD(52, 307, 13)}" fill="none" stroke="#f39a9a" stroke-width="1" stroke-dasharray="2 2"/>`
    + jtxt(52, 304.4, 'NEW', 5.6, '#e0697f')
    + jtxt(52, 313.6, '新発売!', 7.4, INK);
  // POP flags standing on the gondola
  const pops: [number, string, string, string][] = [
    [100, 'おにぎり', '#d9f0e2', '#4f8a6a'], [146, 'ホット', '#ffd9c2', '#d0623f'], [192, '冷たい', '#d6ecfb', '#3f8fbf'],
  ];
  let poles = '';
  for (const [cx] of pops) poles += `M${cx},${y + 1} L${cx},316 `;
  s += ln(poles, 1.4);
  pops.forEach(([cx, label, bg, fg], i) => {
    s += sh(hrect(cx - 19, 301, 38, 16, 6, 0.3, 124 + i), bg, 1.5)
      + jtxt(cx, 312.4, label, 7.6, fg);
  });
  return s;
}

/* ------------------------------------------------------------ magazine rack (front-left, by the window) */
function magazines(p: Pal): string {
  const x = 4, y = 428, w = 44, h = 88;
  const COLS = ['#f7b9c9', '#a9d8f0', '#ffe27a', '#bfe3d0', '#c9b6e8'];
  const byCol = ['', '', '', '', ''];
  let outl = '', marks = '', lips = '';
  [442, 468, 494].forEach((ty, i) => {
    for (let j = 0; j < 3; j++) {
      const mx = x + 4 + j * 12.6, top = ty - 10 + ((i + j) % 2) * 2.5;
      const d = hrect(mx, top, 11, 19, 1.5, 0.2, i * 3 + j + 140);
      byCol[(i * 3 + j) % 5] += d + ' ';
      outl += d + ' ';
      marks += `M${n(mx + 2)},${n(top + 4)} h7 M${n(mx + 2)},${n(top + 12)} h4 `;
    }
    lips += hrect(x + 3, ty + 6, w - 6, 5, 2, 0.2, ty) + ' ';
  });
  let s = shadow(x + w / 2, y + h + 3, w / 2 + 2, 3.5, 0.13)
    + sh(hrect(x, y, w, h, 5, 0.4, 131), '#efd2ad', 2)
    + `<rect x="${x + 4}" y="${y + 4}" width="${w - 8}" height="${h - 10}" rx="2" fill="#f9e8d2"/>`;
  byCol.forEach((d, i) => { s += fl(d, COLS[i]); });
  return s + ln(outl, 1.1)
    + `<path d="${marks}" stroke="#fff" stroke-width="1.6"/>`
    + sh(lips, '#e3bf93', 1.3)
    + sh(hrect(x + 6, y - 10, w - 12, 12, 4, 0.3, 132), p.stripe, 1.5)
    + jtxt(x + w / 2, y - 1.2, '雑誌', 7.4, INK);
}

/* ------------------------------------------------------------ low snack display table */
function table(p: Pal): string {
  const T = KONBINI_TABLE, x = T.x, w = T.w;
  let scal = `M${x + 4},497`;
  for (let i = 0; i < 8; i++) scal += ` q${n(w / 16 - 0.5)},6 ${n(w / 8 - 1)},0`;
  return shadow(x + w / 2, 519, w / 2 + 8, 4.5, 0.13)
    + sh(`M${x + 10},508 L${x + 8},518 L${x + 15},518 L${x + 17},508z M${x + w - 17},508 L${x + w - 15},518 L${x + w - 8},518 L${x + w - 10},508z`, '#d9b48a', 1.6)
    + sh(hrect(x + 2, 494, w - 4, 18, 5, 0.4, 61), p.stripe, 2)
    + `<path d="${scal}" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="2"/>`
    + sh(hrect(x - 3, 474, w + 6, 22, 8, 0.4, 62), '#f8e7cf', 2.1)
    + `<path d="M${x + 6},479 C${x + 50},478 ${x + 100},480 ${x + w - 6},479" stroke="#fff" stroke-opacity=".8" stroke-width="1.6" fill="none"/>`
    + priceTags(slotXs('table', 486), 495, 14, 6)
    // "new" star on the skirt + a little おすすめ card at the corner
    + sh(starD(x + w / 2 + 25, 506, 7, 0), p.star, 1.3)
    + sh(hrect(x - 8, 462, 26, 12, 4, 0.3, 63), '#fffaf2', 1.3) + jtxt(x + 5, 470.8, 'おすすめ', 5.4, '#e0697f');
}

/* ------------------------------------------------------------ self-serve coffee machine corner */
function coffee(p: Pal): string {
  const C = KONBINI_COFFEE, x = C.x, y = C.y, w = C.w, b = C.y + C.h;
  const cab = b - 50;
  return shadow(x + w / 2, b + 1, w / 2 + 6, 3.5, 0.13)
    // cabinet
    + sh(hrect(x, cab, w, 50, 5, 0.4, 71), '#d6e6ef', 2)
    + `<path d="M${x + w / 2},${cab + 5} v41" stroke="${INK}" stroke-opacity=".25" stroke-width="1.2"/>`
    + `<path d="${hell(x + w / 2 - 5, cab + 24, 1.6, 1.6)} ${hell(x + w / 2 + 5, cab + 24, 1.6, 1.6)}" fill="${INK}" opacity=".4"/>`
    + `<path d="${starD(x + 12, cab + 36, 4)}${starD(x + w - 12, cab + 36, 4, 12)}" fill="${p.star}" opacity=".7"/>`
    + sh(hrect(x - 4, cab - 6, w + 8, 8, 3, 0.3, 72), '#efd2ad', 1.9)
    // machine
    + sh(hrect(x + 3, y + 2, 36, 52, 7, 0.4, 73), '#fbf7f1', 2)
    + fl(hrect(x + 6, y + 6, 30, 11, 4, 0.2, 74), p.banner)
    + inkTxt(x + 21, y + 14.6, 'COFFEE', 6.4, '#fffaf0', 2)
    + sh(hrect(x + 7, y + 20, 28, 11, 3, 0.2, 75), '#6f5a52', 1.4)
    + `<circle cx="${x + 13}" cy="${y + 25.5}" r="2" fill="#ffcf6b"/><circle cx="${x + 21}" cy="${y + 25.5}" r="2" fill="#bfe3d0"/><circle cx="${x + 29}" cy="${y + 25.5}" r="2" fill="#f7b9c9"/>`
    + sh(`M${x + 16},${y + 34} L${x + 26},${y + 34} L${x + 25},${y + 38} L${x + 17},${y + 38}z`, '#cfc6bf', 1.2)
    + sh(`M${x + 14},${y + 42} C${x + 14},${y + 49} ${x + 16},${y + 52} ${x + 21},${y + 52} C${x + 26},${y + 52} ${x + 28},${y + 49} ${x + 28},${y + 42}z`, CREAM, 1.3)
    + `<path d="M${x + 16},${y + 45.5} h10" stroke="${p.stripe2}" stroke-width="2"/>`
    // stacked cups + lids beside the machine
    + sh(`M${x + 41},${y + 30} L${x + 54},${y + 30} L${x + 52},${y + 53} L${x + 43},${y + 53}z`, '#fffaf2', 1.4)
    + `<path d="M${x + 42},${y + 36} h11 M${x + 42.5},${y + 42} h10 M${x + 43},${y + 48} h9" stroke="${INK}" stroke-opacity=".35" stroke-width="1"/>`
    + sh(hrect(x + 40, y + 25, 16, 5, 2, 0.2, 76), p.stripe, 1.2)
    + jtxt(x + 21, cab + 16, 'セルフ', 6, mix('#7fa8bf', INK, 0.3));
}

/* ------------------------------------------------------------ hot case interior (back half: drawn behind the clerk + products) */
function hotBack(t: ThemeId): string {
  let buns = '', twist = '';
  for (const bx of [254, 265, 289, 300]) {
    buns += hell(bx, 428, 5, 3.8, 0.05, bx) + ' ';
    twist += `M${bx - 1.6},${n(424.8)} q1.6,-1.2 3.2,0 `;
  }
  return `<ellipse cx="277" cy="440" rx="46" ry="30" fill="url(#${kid('warm', t)})"/>`
    + fl(hrect(247, 419, 60, 42, 4, 0.3, 81), `url(#${kid('hot', t)})`)
    + `<path d="M250,422.5 h54" stroke="#fff3b0" stroke-width="2.4" opacity=".95"/>`
    + `<path d="M249,433 h56" stroke="#e9a96a" stroke-width="2"/>`
    + `<path d="${buns}" fill="#fffaf2" stroke="${INK}" stroke-width="1"/>`
    + `<path d="${twist}" fill="none" stroke="${INK}" stroke-opacity=".5" stroke-width=".8"/>`
    + `<path d="M249,456 h56 v4 h-56z" fill="#e9a96a" opacity=".6"/>`;
}

/* ------------------------------------------------------------ seasonal posters & decor */
function poster(x: number, y: number, w: number, h: number, bg: string, seed: number, inner: string): string {
  return sh(hrect(x, y, w, h, 4, 0.5, seed), bg, 1.8)
    + `<path d="M${x + 4},${y + 2} l3,3 M${x + w - 4},${y + 2} l-3,3" stroke="${INK}" stroke-opacity=".4" stroke-width="1.2"/>` + inner;
}
function furin(x: number, y: number, c: string): string {
  return ln(`M${x},44 L${x},${y}`, 1, INK)
    + sh(`M${x - 7},${y + 11} C${x - 7},${y + 2} ${x - 4},${y - 1} ${x},${y - 1} C${x + 4},${y - 1} ${x + 7},${y + 2} ${x + 7},${y + 11}z`, '#eef9fd', 1.4)
    + `<path d="M${x - 5},${y + 6} q2.5,-3 5,0 q2.5,3 5,0" stroke="${c}" stroke-width="1.4" fill="none"/>`
    + ln(`M${x},${y + 11} L${x},${y + 18}`, 0.9)
    + sh(`M${x - 3},${y + 18} L${x + 3},${y + 18} L${x + 3.5},${y + 32} L${x - 2.5},${y + 31}z`, c, 1.1);
}
function seasonal(t: ThemeId, p: Pal): string {
  const PX = 12, PY = 74, PW = 56, PH = 32; // poster spot above the door
  if (t === 'spring') {
    let bl = '';
    for (const [x, y, r] of [[22, 82, 6], [58, 86, 5], [98, 84, 6], [142, 87, 5], [186, 83, 6], [228, 86, 5]]) bl += blossomD(x, y, r);
    return ln('M8,80 C40,90 70,78 100,86 C130,92 170,78 200,86 C220,90 236,82 248,84', 2, '#8a5a5a')
      + sh(bl, '#f8c3d3', 1.1)
      + poster(PX + 2, PY + 10, PW - 4, PH, '#fff4f7', 91,
        sh(blossomD(PX + 18, PY + 26, 9), '#f6a9bd', 1.1) + `<circle cx="${PX + 18}" cy="${PY + 26}" r="2.2" fill="${GOLD}"/>`
        + txt(PX + 40, PY + 24, 'sakura', 7, '#c4506a') + txt(PX + 40, PY + 33, 'sweets', 7, '#c4506a'));
  }
  if (t === 'summer') {
    return furin(84, 82, '#e86a6a') + furin(98, 90, '#5aa6d6')
      + poster(PX, PY + 8, PW, PH + 4, '#fffdf4', 92,
        // shaved-ice bowl with syrup + a little flag
        sh(`M${PX + 8},${PY + 30} C${PX + 8},${PY + 38} ${PX + 30},${PY + 38} ${PX + 30},${PY + 30}z`, '#bfe6f5', 1.2)
        + sh(`M${PX + 9},${PY + 30} C${PX + 9},${PY + 16} ${PX + 29},${PY + 16} ${PX + 29},${PY + 30}z`, '#ffffff', 1.2)
        + `<path d="M${PX + 11},${PY + 22} C${PX + 16},${PY + 17} ${PX + 24},${PY + 18} ${PX + 27},${PY + 24} C${PX + 22},${PY + 27} ${PX + 15},${PY + 26} ${PX + 11},${PY + 22}z" fill="#f48aa6"/>`
        + txt(PX + 43, PY + 24, 'ice', 8, '#3f8fbf') + txt(PX + 43, PY + 33, 'cold!', 7, '#3f8fbf'))
      + `<path d="M0,233 q9,-4 18,0 t18,0 t18,0 t18,0 t18,0 t18,0 t18,0 t18,0 t18,0 t18,0 t18,0 t18,0 t18,0 t18,0 t18,0 t18,0 t18,0 t18,0 t18,0 t18,0" stroke="#fff" stroke-opacity=".7" stroke-width="1.6" fill="none"/>`;
  }
  if (t === 'halloween') {
    const bat = (x: number, y: number, s: number) =>
      `M${x},${y} c${-2 * s},${-4 * s} ${-6 * s},${-5 * s} ${-11 * s},${-3 * s} c${3 * s},${1 * s} ${4 * s},${3 * s} ${4 * s},${5 * s} c${2 * s},${-2 * s} ${5 * s},${-2 * s} ${7 * s},${1 * s} c${2 * s},${-3 * s} ${5 * s},${-3 * s} ${7 * s},${-1 * s} c0,${-2 * s} ${1 * s},${-4 * s} ${4 * s},${-5 * s} c${-5 * s},${-2 * s} ${-9 * s},${-1 * s} ${-11 * s},${3 * s}z `;
    return ln('M8,80 C60,92 120,80 180,90 C210,94 236,84 248,84', 1.2)
      + `<path d="${bat(40, 88, 0.7)}${bat(110, 88, 0.8)}${bat(176, 91, 0.7)}${bat(226, 87, 0.6)}" fill="#3b2a55"/>`
      + poster(PX, PY + 8, PW, PH + 2, '#3b2a55', 94,
        sh(`M${PX + 10},${PY + 38} C${PX + 8},${PY + 24} ${PX + 12},${PY + 15} ${PX + 19},${PY + 15} C${PX + 26},${PY + 15} ${PX + 30},${PY + 24} ${PX + 28},${PY + 38} L${PX + 24},${PY + 35} L${PX + 19},${PY + 38} L${PX + 14},${PY + 35}z`, '#fffaf2', 1.2)
        + `<circle cx="${PX + 16.5}" cy="${PY + 24}" r="1.3" fill="${INK}"/><circle cx="${PX + 21.5}" cy="${PY + 24}" r="1.3" fill="${INK}"/>`
        + txt(PX + 42, PY + 25, 'boo!', 8, '#f6c25a') + txt(PX + 42, PY + 34, 'treats', 6.6, '#f6c25a'))
      + pumpkin(228, 404, 0.55) + pumpkin(26, 548, 0.6) + pumpkin(240, 449, 0.4);
  }
  if (t === 'christmas') {
    let sw = 'M8,80';
    const bc = ['', '', ''];
    for (let i = 0; i < 6; i++) {
      const x0 = 8 + i * 40;
      sw += ` Q${x0 + 20},96 ${x0 + 40},80`;
      bc[i % 3] += hell(x0 + 20, 92, 3.4, 3.4, 0.04, i) + ' ';
    }
    const baub = `<path d="${bc[0]}" fill="#c9584f" stroke="${INK}" stroke-width="1"/><path d="${bc[1]}" fill="#f2c14e" stroke="${INK}" stroke-width="1"/><path d="${bc[2]}" fill="#7fb2d9" stroke="${INK}" stroke-width="1"/>`;
    return ln(sw, 6, '#4f8f68') + `<path d="${sw}" fill="none" stroke="#7fb894" stroke-width="2" stroke-dasharray="2 4"/>` + baub
      + poster(PX, PY + 10, PW, PH + 2, '#fffaf2', 95,
        sh(`M${PX + 18},${PY + 15} L${PX + 28},${PY + 38} L${PX + 8},${PY + 38}z`, '#4f8f68', 1.2)
        + `<path d="${starD(PX + 18, PY + 15, 3.4)}" fill="${GOLD}"/>`
        + txt(PX + 42, PY + 27, 'merry', 7, '#c9584f') + txt(PX + 42, PY + 36, 'treats', 6.6, '#4f8f68'))
      // a wreath on the right door pane
      + `<path d="${hell(56, 166, 9, 9, 0.04, 97)}" fill="none" stroke="#4f8f68" stroke-width="5"/>`
      + `<path d="${hell(56, 166, 9, 9, 0.04, 97)}" fill="none" stroke="#7fb894" stroke-width="1.6" stroke-dasharray="2 3"/>`
      + sh('M56,175 l-5,4 l1,-6z M56,175 l5,4 l-1,-6z', '#c9584f', 1);
  }
  // everyday: hanging star mobile + an onigiri poster
  return ln('M88,78 L88,92 M100,78 L100,100', 0.9)
    + `<path d="${starD(88, 96, 4.4, 0)}${starD(100, 104, 3.6, 14)}" fill="${p.star}" stroke="${INK}" stroke-width="1" stroke-linejoin="round"/>`
    + poster(PX, PY + 8, PW, PH + 2, '#fffaf2', 96,
      sh(`M${PX + 18},${PY + 14} C${PX + 22},${PY + 14} ${PX + 31},${PY + 30} ${PX + 29},${PY + 35} C${PX + 26},${PY + 38} ${PX + 10},${PY + 38} ${PX + 7},${PY + 35} C${PX + 5},${PY + 30} ${PX + 14},${PY + 14} ${PX + 18},${PY + 14}z`, '#ffffff', 1.3)
      + `<path d="M${PX + 12},${PY + 30} h12 v7 h-12z" fill="#4c5d4f"/>`
      + tinyFace(PX + 18, PY + 25, 0.45)
      + txt(PX + 42, PY + 25, 'fresh', 7, '#5a8f74') + txt(PX + 42, PY + 34, 'rice!', 7, '#5a8f74'));
}

/** The whole store (walls, floor, entrance, wall shelves, fridge, aisle gondola, magazines, snack table,
 *  coffee corner, hot-case interior) — no products. The counter itself is konbiniCounterFront. */
export function konbiniBack(theme: ThemeId): string {
  const [t, p] = pal(theme);
  const s = wall(p) + floor(p) + banner(p) + door(t, p) + entrance(p) + shelf(t, p) + fridge(t, p)
    + seasonal(t, p) + coffee(p) + aisle(t, p) + magazines(p) + table(p) + hotBack(t)
    + shadow(296, 527, 70, 4, 0.14);
  return `<g stroke-linecap="round" stroke-linejoin="round">${s}</g>`;
}

/* ------------------------------------------------------------ counter: face, top, hot-case glass, oden, register */
function counterFace(p: Pal): string {
  const C = KONBINI_COUNTER;
  const x = C.x - 4, y = C.y + 10, w = C.w + 8, h = C.y + C.h - y + 2;
  let band = '';
  for (let sx = x + 12; sx < x + w - 4; sx += 20) band += starD(sx, y + 9, 3.4, (sx * 5) % 30);
  return sh(hrect(x, y, w, h, 5, 0.5, 101), '#fbf3e8', 2.2)
    + `<rect x="${x + 2}" y="${y + 3}" width="${w - 3}" height="12" fill="${p.stripe}"/>`
    + `<path d="${band}" fill="#fffaf0" stroke="${INK}" stroke-opacity=".35" stroke-width=".8"/>`
    + `<path d="M${x + 2},${y + h - 9} h${w - 3}" stroke="${mix(p.stripe, INK, 0.25)}" stroke-width="5" opacity=".55"/>`
    + sh(starD(x + 24, y + 33, 10, 0), p.star, 1.6) + tinyFace(x + 24, y + 34, 0.45)
    + jtxt(x + w / 2 + 16, y + 33, 'ありがとう', 8.5, INK)
    + txt(x + w / 2 + 16, y + 44, '★ Hoshi Mart ★', 6.4, mix(INK, '#ffffff', 0.25))
    // counter top surface
    + sh(hrect(x - 2, C.y + 1, w + 2, 12, 4, 0.4, 100), '#fbf1e4', 2)
    + `<path d="M${x + 4},${C.y + 4.5} C${x + 40},${C.y + 4} ${x + 90},${C.y + 5} ${x + w - 4},${C.y + 4.5}" stroke="#fff" stroke-opacity=".8" stroke-width="1.5" fill="none"/>`;
}
function hotFront(): string {
  // glass front + frame + sign cap over the hot products
  return `<rect x="248" y="420" width="58" height="39" rx="3" fill="#fff8e6" opacity=".14"/>`
    + `<path d="M254,452 l9,-22 M260,454 l6,-14 M290,452 l8,-20" stroke="#fff" stroke-opacity=".55" stroke-width="2" fill="none"/>`
    + ln(hrect(246, 418, 62, 42, 5, 0.3, 81), 2)
    + sh(hrect(243, 409, 68, 11, 4, 0.3, 82), '#ee9c7c', 1.8)
    + jtxt(277, 417.6, 'ホット ★ 肉まん', 6.6, '#fffaf0');
}
function oden(): string {
  // little oden pot with a few skewers bobbing in the broth (steam is animated in konbiniFront)
  return sh('M325,446 L331,446 L328,439z', '#a39b95', 1.1) + ln('M328,439 L330,433', 1.2)
    + sh(hell(315.5, 443.5, 3.4, 2.6, 0.05, 86), '#fff3dc', 1.1)
    + sh(hell(321.5, 442.5, 2.6, 3.2, 0.05, 87), '#ffffff', 1.1)
    + `<circle cx="321.5" cy="443" r="1.3" fill="#ffd36a"/>`
    + sh(hell(321.5, 446, 11.5, 3, 0.04, 85), '#f2c27a', 1.3)
    + sh(hrect(310, 446, 23, 15, 4, 0.3, 84), '#cdd5dc', 1.7)
    + `<path d="M311,449 h21" stroke="#fff" stroke-opacity=".7" stroke-width="1.2"/>`
    + jtxt(321.5, 457.4, 'おでん', 5.6, INK);
}
function register(p: Pal): string {
  // right end of the counter, drawn in front of the clerk
  return ln('M341,434 L341,429', 1.8)
    + sh(hrect(335, 419, 14, 10, 2, 0.2, 112), '#bfe3d0', 1.4)
    + jtxt(342, 426.6, '¥', 6.5, INK)
    + sh(hrect(334, 433, 26, 27, 5, 0.3, 111), '#e9eef2', 1.9)
    + `<path d="M337,439 h20 M337,444 h20 M337,449 h20" stroke="${INK}" stroke-opacity=".3" stroke-width="1.6" stroke-dasharray="2.5 2.5"/>`
    + `<path d="M336,455 h22" stroke="${INK}" stroke-opacity=".35" stroke-width="1.2"/>`
    + `<path d="${starD(355, 426, 3.2)}" fill="${p.star}" stroke="${INK}" stroke-width=".8"/>`
    // change tray with two coins
    + sh(hell(346, 465.5, 9, 2.8, 0.04, 113), '#f3d58a', 1.3)
    + `<path d="${hell(343, 464.6, 2.2, 1.1, 0.04, 114)} ${hell(348.5, 465, 2.2, 1.1, 0.04, 115)}" fill="${GOLD}" stroke="${INK}" stroke-width=".7"/>`;
}
function donation(p: Pal): string {
  // clear little charity box with a star sticker
  return sh(hrect(230, 443, 14, 18, 3, 0.3, 116), '#eaf6fb', 1.6)
    + `<path d="${hell(234.5, 457, 2.2, 1.4, 0.04, 117)} ${hell(239.5, 458, 2.2, 1.4, 0.04, 118)}" fill="${GOLD}" stroke="${INK}" stroke-width=".6"/>`
    + ln('M234,446.5 h6', 1.6)
    + `<path d="${starD(237, 452, 3.6)}" fill="${p.star}" stroke="${INK}" stroke-width=".8"/>`;
}

/** Counter (front face + top, hot-case glass, oden pot, register, change tray, donation box) — drawn over the clerk + hot products. */
export function konbiniCounterFront(theme: ThemeId): string {
  const [, p] = pal(theme);
  return `<g stroke-linecap="round" stroke-linejoin="round">${counterFace(p) + hotFront() + oden() + register(p) + donation(p)}</g>`;
}

/* ------------------------------------------------------------ front: shine, glow, sparkles */
const SPARKS = (() => {
  const R = rng(4242);
  const pts: [number, number][] = [[118, 100], [236, 150], [300, 92], [340, 210], [60, 160], [276, 410], [150, 296]];
  return pts.map(([x, y]) => ({ x, y, ph: R() * Math.PI * 2, sp: 0.6 + R() * 0.6, s: 0.45 + R() * 0.3 }));
})();

const STEAM: [number, number, number, number][] = [
  [315, 440, 0, 16], [322, 438, 0.33, 18], [328, 440, 0.66, 15],
  [KONBINI_COFFEE.x + 19, KONBINI_COFFEE.y + 40, 0.2, 12], [KONBINI_COFFEE.x + 23, KONBINI_COFFEE.y + 40, 0.7, 12],
];

/** Over everything: fridge glass shine, soft light, gentle hum sparkles. */
export function konbiniFront(theme: ThemeId, time: number): string {
  const [t] = pal(theme);
  const F = KONBINI_FRIDGE;
  const breathe = n(0.85 + 0.15 * Math.sin(time * 0.6));
  let s = `<ellipse cx="175" cy="150" rx="150" ry="120" fill="url(#${kid('glow', t)})" opacity="${breathe}"/>`
    + `<ellipse cx="282" cy="442" rx="70" ry="40" fill="url(#${kid('warm', t)})" opacity="${n(0.5 + 0.2 * Math.sin(time * 1.1))}"/>`
    // fixed glass streaks on the fridge doors and the entrance
    + `<path d="M${F.x + 10},${F.y + 60} l18,-26 M${F.x + 12},${F.y + 76} l26,-38 M${F.x + 58},${F.y + 70} l22,-32 M${F.x + 58},${F.y + 140} l16,-22" stroke="#fff" stroke-opacity=".45" stroke-width="3" stroke-linecap="round" fill="none"/>`;
  // slow travelling shine band across the fridge glass
  const sx = n(F.x - 30 + (((time * 14) % 200)));
  if (sx > F.x - 20 && sx < F.x + F.w) {
    s += `<path d="M${sx},${F.y + 150} l26,-110 l10,0 l-26,110z" fill="#fff" opacity=".22"/>`;
  }
  // rising steam over the oden pot and the coffee cup
  let steam = '';
  for (const [x0, y0, ph, len] of STEAM) {
    const k = (time * 0.45 + ph) % 1, op = n(Math.sin(k * Math.PI) * 0.75);
    if (op < 0.05) continue;
    const y = n(y0 - k * len), dx = n(Math.sin(time * 1.3 + ph * 6) * 1.6);
    steam += `<path d="M${n(x0 + dx)},${y} c-3,-3 3,-5 0,-9" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity="${op}"/>`;
  }
  s += steam;
  for (const k of SPARKS) {
    const op = n(Math.max(0, Math.sin(time * k.sp + k.ph)) * 0.8);
    if (op < 0.05) continue;
    const sc = n(k.s * (0.7 + 0.3 * op));
    s += `<path transform="translate(${k.x},${k.y}) scale(${sc})" d="${SPARK}" fill="#fffbe0" opacity="${op}"/>`;
  }
  if (t === 'spring' || t === 'christmas') {
    const R = rng(77);
    for (let i = 0; i < 5; i++) {
      const bx = R() * W, sp = 10 + R() * 8, ph = R() * 6;
      const y = n(((R() * 700 + time * sp) % 680) + 30);
      const x = n(bx + Math.sin(time * 0.7 + ph) * 10);
      s += t === 'spring'
        ? `<path transform="translate(${x},${y}) rotate(${n((time * 40 + ph * 50) % 360)})" d="M0,-3 C3,-3 4,1 0,3.6 C-4,1 -3,-3 0,-3z" fill="#f6b6c8" opacity=".8"/>`
        : `<circle cx="${x}" cy="${y}" r="${n(1.6 + R())}" fill="#fff" opacity=".75"/>`;
    }
  } else if (t === 'halloween') {
    s += `<rect width="${W}" height="${H}" fill="#3b1f66" opacity=".06"/>`;
  } else if (t === 'summer') {
    s += `<path d="M0,0 L140,0 L60,260 L0,260z" fill="#fffbe0" opacity="${n(0.1 + 0.04 * Math.sin(time * 0.5))}"/>`;
  }
  return `<g pointer-events="none">${s}</g>`;
}

/** The clerk's look (drawn with character()): a soft cocoa-and-cream mouse in a mint shop apron. */
export const CLERK_LOOK: CharacterLook = { species: 'mouse', color: '#d9cbbd', accessory: 'apron', accentColor: '#f6b6c8', apronColor: '#bfe3d0', hat: 'none' };

/** The shop seen from outside (for the map/travel button and story). Standalone svg, ~200x140. */
export function konbiniExteriorSvg(theme: ThemeId, size: number): string {
  const [t, p] = pal(theme);
  const x = (k: string) => `kbx-${k}-${t}`;
  const sky: Record<ThemeId, [string, string]> = {
    everyday: ['#5a5ea8', '#f2b6a0'], spring: ['#6a5aa8', '#f6bccd'], summer: ['#4a6fb0', '#f7c79a'],
    halloween: ['#2c1c50', '#a0507a'], christmas: ['#22305e', '#6c80b0'],
  };
  const [s1, s2] = sky[t];
  const R = rng(19);
  let stars = '';
  for (let i = 0; i < 9; i++) stars += `M${n(6 + R() * 188)},${n(6 + R() * 34)}h.01 `;
  let awn = '';
  for (let i = 0; i < 8; i++) if (i % 2 === 0) awn += `M${38 + i * 16},62 h16 v10 q-8,5 -16,0z `;
  let s = `<defs><linearGradient id="${x('sky')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s1}"/><stop offset="1" stop-color="${s2}"/></linearGradient>`
    + `<radialGradient id="${x('glow')}"><stop offset="0" stop-color="#fff2b8" stop-opacity=".7"/><stop offset="1" stop-color="#fff2b8" stop-opacity="0"/></radialGradient></defs>`
    + `<rect width="200" height="140" rx="14" fill="url(#${x('sky')})"/>`
    + `<path d="${stars}" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".8"/>`
    + `<path d="M0,112 C60,110 140,111 200,112 L200,140 L0,140z" fill="#b9b0c4"/>`
    + `<path d="M0,120 h200" stroke="#fff" stroke-opacity=".3" stroke-width="2" stroke-dasharray="10 8"/>`
    + `<ellipse cx="100" cy="94" rx="90" ry="40" fill="url(#${x('glow')})"/>`
    // building
    + sh(hrect(34, 40, 132, 74, 6, 0.6, 201), p.wall, 2)
    + sh(hrect(30, 36, 140, 8, 3, 0.4, 202), mix(p.banner, INK, 0.1), 1.8)
    // star sign on top
    + sh(hrect(58, 18, 84, 20, 8, 0.5, 203), p.banner, 1.8)
    + sh(starD(70, 28, 7, 0), p.star, 1.4)
    + inkTxt(108, 32.5, 'Hoshi Mart', 11, p.bannerText, 2.4)
    + ln('M70,38 L70,36 M130,38 L130,36', 1.6)
    // awning
    + `<path d="M38,62 h128 v10 q-8,5 -16,0 q-8,5 -16,0 q-8,5 -16,0 q-8,5 -16,0 q-8,5 -16,0 q-8,5 -16,0 q-8,5 -16,0 q-8,5 -16,0z" fill="${p.stripe2}"/>`
    + `<path d="${awn}" fill="${p.stripe}"/>`
    + ln('M38,62 h128 v10 q-8,5 -16,0 q-8,5 -16,0 q-8,5 -16,0 q-8,5 -16,0 q-8,5 -16,0 q-8,5 -16,0 q-8,5 -16,0 q-8,5 -16,0z', 1.6)
    // glowing window with tiny shelves
    + sh(hrect(44, 80, 80, 30, 4, 0.4, 204), '#fff1c4', 1.8)
    + `<path d="M48,90 h72 M48,100 h72" stroke="#e6c48e" stroke-width="2"/>`
    + `<path d="M52,86h5v4h-5z M62,85h4v5h-4z M74,86h6v4h-6z M90,85h5v5h-5z M104,86h6v4h-6z M54,95h6v5h-6z M70,96h4v4h-4z M84,95h7v5h-7z M100,96h5v4h-5z M112,95h4v5h-4z" fill="${p.stripe}"/>`
    + `<path d="M50,104 l10,-14 M58,106 l8,-11" stroke="#fff" stroke-opacity=".7" stroke-width="2" stroke-linecap="round"/>`
    // glass door
    + sh(hrect(132, 78, 28, 36, 3, 0.3, 205), '#fff6d6', 1.8)
    + ln('M146,79 L146,113', 1.4)
    + `<path d="${starD(140, 92, 3)}" fill="${p.star}"/>`
    + sh(hrect(130, 112, 32, 4, 2, 0.2, 206), p.mat, 1.2)
    // little potted plant + street lamp
    + sh('M20,104 C14,96 16,88 22,86 C28,88 30,96 24,104z', '#8fc3a7', 1.4)
    + sh('M17,104 h10 l-1.5,9 h-7z', '#e79a7e', 1.3)
    + ln('M184,114 L184,58', 2.2) + ln('M184,58 C184,52 178,50 174,52', 2)
    + `<circle cx="174" cy="56" r="9" fill="#fff2b8" opacity=".35"/>`
    + sh(hell(174, 56, 3.4, 3.4, 0.04, 9), '#fff2b8', 1.3)
    + `<path transform="translate(158,22) scale(.6)" d="${SPARK}" fill="#fffbe0"/>`;
  if (t === 'christmas') s += `<path d="M30,36 C50,30 80,32 100,31 C130,30 150,31 170,36 L170,40 L30,40z" fill="#fff"/>` + ln('M30,36 C50,30 80,32 100,31 C130,30 150,31 170,36', 1.2);
  if (t === 'halloween') s += pumpkin(30, 112, 0.42) + pumpkin(170, 111, 0.36);
  if (t === 'spring') s += sh(blossomD(170, 40, 6) + blossomD(36, 44, 5), '#f8c3d3', 1);
  if (t === 'summer') s += furin(52, 76, '#e86a6a').replace('M52,44', 'M52,72');
  return standalone('0 0 200 140', size, `<g stroke-linecap="round" stroke-linejoin="round">${s}</g>`, 'Hoshi Mart');
}
