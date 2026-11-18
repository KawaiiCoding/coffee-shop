/* =====================================================================
   UPGRADE CARD PICTURES — small standalone SVGs (readable at ~56px).
   Hand-drawn pastel style built on kit.ts; reuses items + furniture.
   ===================================================================== */
import type { MenuItemId, UpgradeId } from '../types';
import { INK, CREAM, fl, ln, sh, blob, box, shadow, tinyFace, standalone } from './kit';
import { item } from './items';
import { table } from './furniture';

const BLUSH = '#f4a9a8';
const SAGE = '#8fc3a7';
const MUSTARD = '#f6cf6b';
const SKY = '#9dbbe6';
const BERRY = '#e2607a';
const GOLD = '#f0c34a';
const GLASS = '#e8f3f7';
const WHITE = '#fffdf8';

const r1 = (n: number) => +n.toFixed(1);
const VB = '-32 -32 64 64';

/* ---------- little helpers ---------- */
const heartD = (cx: number, cy: number, s: number) =>
  `M${r1(cx)},${r1(cy + s * 0.95)} C${r1(cx - s * 0.5)},${r1(cy + s * 0.55)} ${r1(cx - s * 1.15)},${r1(cy + s * 0.05)} ${r1(cx - s * 1.05)},${r1(cy - s * 0.45)} `
  + `C${r1(cx - s * 0.95)},${r1(cy - s * 1.05)} ${r1(cx - s * 0.2)},${r1(cy - s * 1.1)} ${r1(cx)},${r1(cy - s * 0.5)} `
  + `C${r1(cx + s * 0.2)},${r1(cy - s * 1.1)} ${r1(cx + s * 0.95)},${r1(cy - s * 1.05)} ${r1(cx + s * 1.05)},${r1(cy - s * 0.45)} `
  + `C${r1(cx + s * 1.15)},${r1(cy + s * 0.05)} ${r1(cx + s * 0.5)},${r1(cy + s * 0.55)} ${r1(cx)},${r1(cy + s * 0.95)}z`;

/** Four-point sparkle star. */
const sparkleD = (cx: number, cy: number, s: number) =>
  `M${r1(cx)},${r1(cy - s)} C${r1(cx + s * 0.18)},${r1(cy - s * 0.2)} ${r1(cx + s * 0.2)},${r1(cy - s * 0.18)} ${r1(cx + s)},${r1(cy)} `
  + `C${r1(cx + s * 0.2)},${r1(cy + s * 0.18)} ${r1(cx + s * 0.18)},${r1(cy + s * 0.2)} ${r1(cx)},${r1(cy + s)} `
  + `C${r1(cx - s * 0.18)},${r1(cy + s * 0.2)} ${r1(cx - s * 0.2)},${r1(cy + s * 0.18)} ${r1(cx - s)},${r1(cy)} `
  + `C${r1(cx - s * 0.2)},${r1(cy - s * 0.18)} ${r1(cx - s * 0.18)},${r1(cy - s * 0.2)} ${r1(cx)},${r1(cy - s)}z`;

const sparkle = (cx: number, cy: number, s: number, fill = MUSTARD) => sh(sparkleD(cx, cy, s), fill, 1.6);

/** Gold coin seen slightly from the front. */
const coin = (cx: number, cy: number, rx = 4.6) =>
  sh(blob(cx, cy, rx, rx * 0.8, 0.1), GOLD, 1.5)
  + ln(`M${r1(cx - rx * 0.4)},${r1(cy - rx * 0.15)} q${r1(rx * 0.4)},${r1(-rx * 0.35)} ${r1(rx * 0.8)},0`, 1, '#b9862a');


/* ---------- pictures ---------- */
function tables(): string {
  return (
    `<g transform="translate(-3,24) scale(.6)">${table('yarn', 'everyday', { item: null, coins: 0, highlight: false, pulse: 0 })}</g>`
    // "+" badge
    + sh(blob(19, -17, 9.5, 9, 0.2), SAGE, 2)
    + ln('M19,-21.6 L19,-12.4 M14.4,-17 L23.6,-17', 2.8, WHITE)
    + ln('M19,-21.6 L19,-12.4 M14.4,-17 L23.6,-17', 1.2)
  );
}

function machine(): string {
  // body
  const body = 'M-17,-20 C-17.6,-25 -14,-26.4 -9,-26.2 C-2,-26.6 6,-26 11,-26.2 C15.6,-26.2 17.4,-24 17,-20 '
    + 'C16.6,-8 17.4,6 17,17 C17,20.4 15,21.4 11,21.2 C2,21.6 -6,21 -11,21.2 C-15.4,21.4 -17.2,19.6 -17,16 C-16.6,4 -17.4,-8 -17,-20z';
  let s = shadow(0, 22, 22, 3.6);
  s += sh(body, BLUSH);
  // top cap
  s += sh(box(-14, -31, 28, 6, 3, 0.6), SAGE, 1.8);
  // gauge face
  s += sh(blob(0, -14, 8, 7.4, 0.1), CREAM, 2);
  s += tinyFace(0, -14.6, 0.75);
  // spout / group head
  s += sh(box(-8, -4, 16, 5, 2.4, 0.5), SKY, 1.8);
  s += sh('M-2.4,1 L-2,5 C-1.4,6 1.4,6 2,5 L2.4,1z', SKY, 1.6);
  // drip area (dark recess)
  s += fl(box(-12, 4, 24, 13, 4, 0.5), '#e78f8d', 0.7);
  // cup under spout
  s += sh('M-6,8.4 C-2,7.8 2,7.8 6,8.4 C5.6,12.6 4.6,15.6 1.8,16 C0.2,16.2 -1.6,16.2 -2.6,16 C-5,15.6 -5.8,12.6 -6,8.4z', WHITE, 1.8);
  s += ln('M6,9.8 c2.6,-0.4 3.2,3.6 0.2,4', 1.5);
  s += `<path d="M-1,6.2 L-1,8" stroke="#8a5a3c" stroke-width="1.4" stroke-linecap="round"/>`;
  // drip tray
  s += sh(box(-14, 17, 28, 4, 2, 0.4), SAGE, 1.6);
  // speed swooshes
  s += ln('M-29,-6 C-25,-7.4 -22,-7.6 -19.6,-7', 1.8);
  s += ln('M-30,1 C-26,0 -23,0 -19.6,0.6', 1.8);
  s += ln('M-28,8 C-25,7.4 -22.6,7.4 -20,8', 1.8);
  // lightning bolt
  s += sh('M24,-31 L17.6,-19 L22.4,-19 L18.4,-8 L28.6,-22.4 L23.4,-22.4 L27.6,-31z', MUSTARD, 1.8);
  return s;
}

function tray(): string {
  let s = shadow(0, 17, 28, 4);
  // tray rim + inner
  s += sh(blob(0, 10, 29, 9.5, 0.15), '#d9b48f', 2.2);
  s += fl(blob(0, 9, 24.5, 7, 0.1), '#ecd2b3', 1);
  s += ln(blob(0, 9.2, 24.5, 7, 0.1), 1.2);
  // items: back two, front one
  s += `<g transform="translate(-11,2) scale(.82)">${item('latte')}</g>`;
  s += `<g transform="translate(11,2) scale(.82)">${item('cocoa')}</g>`;
  s += `<g transform="translate(0,10) scale(.85)">${item('cake')}</g>`;
  s += sparkle(-24, -16, 3.6);
  return s;
}

function cushions(): string {
  const d = 'M-24,-12 C-26,-17 -21,-21 -16,-18 C-6,-20.4 6,-20.4 16,-18 C21,-21 26,-17 24,-12 '
    + 'C26.4,-3 26.4,5 24,12 C26,17 21,21 16,18 C6,20.4 -6,20.4 -16,18 C-21,21 -26,17 -24,12 C-26.4,5 -26.4,-3 -24,-12z';
  let s = shadow(0, 22, 26, 3.6);
  s += sh(d, BLUSH, 2.4);
  // knit stitches (little v rows)
  const vRow = (y: number) => {
    let p = '';
    for (let x = -18; x <= 18; x += 6) {
      if (Math.abs(x) < 11 && y > -10 && y < 10) continue; // leave the heart area clear
      p += `M${x - 1.8},${y - 1.6} L${x},${y + 1.2} L${x + 1.8},${y - 1.6} `;
    }
    return p;
  };
  s += `<path d="${vRow(-12) + vRow(-4) + vRow(4) + vRow(12)}" fill="none" stroke="#c8706f" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round" opacity=".75"/>`;
  // seam stitches
  s += `<path d="${blob(0, 0, 21, 15.5, 0.1)}" fill="none" stroke="${INK}" stroke-width="1" stroke-dasharray="2 2.6" stroke-linecap="round" opacity=".55"/>`;
  // heart
  s += sh(heartD(0, -1, 8.6), BERRY, 2);
  s += ln('M-4.6,-4.6 q1,-1.6 2.6,-1.4', 1.2, WHITE);
  // corner tassels
  s += ln('M-25,-19 l-3,-3 M-24,-20 l-1,-4 M25,-19 l3,-3 M24,-20 l1,-4 M-25,19 l-3,3 M25,19 l3,3', 1.4);
  return s;
}

function sneaker(fill: string): string {
  const shoe = 'M-12,-4 C-12.4,-9 -8,-10 -5,-8.4 C-3,-6 0,-4.4 3,-4 C8,-3.6 12.6,-2 13,2 '
    + 'C13.2,4.6 11,5.4 8,5.4 C1,5.6 -6,5.4 -11,5.2 C-13,5 -13,2 -12,-4z';
  let s = sh(shoe, fill, 2);
  s += sh('M-12.6,2.2 C-5,3 4,3 12.8,2.4 C13,4.8 11,5.6 8,5.6 C1,5.8 -6,5.6 -11,5.4 C-12.8,5.2 -13,4 -12.6,2.2z', WHITE, 1.6);
  s += ln('M-3,-6.6 l2.4,-1.6 M-0.6,-5.2 l2.4,-1.6 M1.8,-4.4 l2.2,-1.4', 1.2);
  s += sh(heartD(-8, -3, 2), CREAM, 1.1);
  return s;
}

function wing(x: number, y: number, flip: boolean): string {
  const d = 'M0,0 C-3,-6 -9,-9 -15,-8 C-12,-6 -11,-5 -12,-4 C-9,-3 -8,-2 -9,-1 C-6,0 -3,1 0,0z';
  return `<g transform="translate(${x},${y})${flip ? ' scale(-1,1)' : ''}">${sh(d, WHITE, 1.6)}</g>`;
}

function shoes(): string {
  let s = shadow(0, 20, 26, 3.4);
  s += `<g transform="translate(-6,-6)">${wing(-10, -6, false)}${sneaker(SKY)}</g>`;
  s += `<g transform="translate(6,10)">${wing(-10, -6, false)}${sneaker(SAGE)}</g>`;
  // speed lines
  s += ln('M-30,4 l7,0 M-29,10 l5,0 M-30,16 l8,0', 1.8);
  s += sparkle(24, -18, 3.6);
  return s;
}

function tipjar(): string {
  const jar = 'M-14,-14 C-17,-10 -18,-4 -18,4 C-18,14 -15,19 -9,19.6 C-3,20 3,20 9,19.6 C15,19 18,14 18,4 '
    + 'C18,-4 17,-10 14,-14z';
  let s = shadow(0, 21, 22, 3.6);
  // coins inside (behind glass tint)
  s += fl(jar, GLASS, 0.9);
  const pile: [number, number][] = [[-10, 14], [-1, 15], [8, 14], [-6, 8], [4, 8.6], [11, 6], [-12, 3], [0, 2], [-5, -3], [7, -2], [1, -8]];
  for (const [x, y] of pile) s += coin(x, y, 4.4);
  s += ln(jar, 2.4);
  // neck / rim
  s += sh(box(-15, -20, 30, 6.4, 3, 0.5), SKY, 2);
  // glass shine
  s += ln('M-13.6,-6 C-14.6,0 -14.6,6 -13.4,11', 1.8, WHITE);
  // heart label
  s += sh(box(-7.6, 3, 15.2, 11, 3, 0.5), CREAM, 1.6);
  s += sh(heartD(0, 8.4, 3.6), BERRY, 1.4);
  // coins popping out on top
  s += coin(-4, -24, 4.4) + coin(5, -26, 4.4);
  s += sparkle(20, -24, 3.4);
  return s;
}

function tableStyle(): string {
  return `<g transform="translate(-2,25) scale(.62)">${table('teacup', 'everyday', { item: null, coins: 0, highlight: false, pulse: 0 })}</g>`
    + sparkle(21, -20, 5.4)
    + sparkle(-24, -12, 3.2, BLUSH)
    + sparkle(14, -8, 2.4, SKY);
}

function menuItem(id: MenuItemId): string {
  let s = shadow(0, 18, 24, 3.6);
  s += sh(blob(0, 13, 25, 7, 0.15), WHITE, 2.2);
  s += ln(blob(0, 12.4, 17, 4.2, 0.1), 1.2);
  s += `<g transform="translate(0,1) scale(1.45)">${item(id)}</g>`;
  s += sparkle(21, -19, 5);
  s += sparkle(-22, -11, 3, BLUSH);
  return s;
}

const DRAW: Record<UpgradeId, () => string> = {
  tables,
  machine,
  tray,
  cushions,
  shoes,
  tipjar,
  table_style: tableStyle,
  menu_cocoa: () => menuItem('cocoa'),
  menu_matcha: () => menuItem('matcha'),
  menu_cake: () => menuItem('cake'),
  menu_cookie: () => menuItem('cookie'),
};

export function upgradeSvg(id: UpgradeId, size: number): string {
  return standalone(VB, size, (DRAW[id] ?? tables)());
}
