/* =====================================================================
   FURNITURE: seats, tables, counter (back + front), brew indicator.
   Hand-drawn pastel style built on kit.ts. Deterministic, lean
   (tables <= 30 elements, seats <= 10) because drawn every frame.
   ===================================================================== */
import type { MenuItemId, TableStyle, ThemeId } from '../types';
import { MACHINE } from '../layout';
import { INK, CREAM, fl, ln, sh, blob, box, shadow, tinyFace } from './kit';
import { item } from './items';

interface FP {
  a: string;      // main pastel (blush / pink / red / orange)
  b: string;      // second pastel (sage / mint / green / purple)
  c: string;      // accent (mustard / butter / gold / dark plum)
  cream: string;
  wood: string;
  woodD: string;
  front: string;  // counter front panel
  yarn: string;   // yarn / knit colour
  machine: string;
}

const PAL: Record<ThemeId, FP> = {
  everyday: { a: '#f2b5b0', b: '#a8c69f', c: '#e9c46a', cream: '#fff6ea', wood: '#dcae84', woodD: '#c08e66', front: '#f6d6c8', yarn: '#f2b5b0', machine: '#a8c69f' },
  spring: { a: '#f5b3c8', b: '#a6dcc3', c: '#f6e19b', cream: '#fff4f6', wood: '#e8c19c', woodD: '#cfa07c', front: '#fbe0e8', yarn: '#a6dcc3', machine: '#f5b3c8' },
  christmas: { a: '#d9625f', b: '#79a886', c: '#efcf7a', cream: '#fff3e2', wood: '#c99268', woodD: '#a8714f', front: '#f3e2cf', yarn: '#d9625f', machine: '#d9625f' },
  halloween: { a: '#ef9a52', b: '#9a7cb6', c: '#6a5878', cream: '#f6ead8', wood: '#a98266', woodD: '#86624c', front: '#d9c8e2', yarn: '#ef9a52', machine: '#9a7cb6' },
};

const GOLD = '#f2c95c';
const BERRY = '#c4506a';
const r1 = (n: number) => +n.toFixed(1);

/** Path of tiny circles (one element) for dots / lace holes. */
function dots(pts: [number, number][], rad: number): string {
  return pts.map(([x, y]) => `M${r1(x - rad)},${r1(y)}a${rad},${rad} 0 1,0 ${rad * 2},0a${rad},${rad} 0 1,0 ${-rad * 2},0`).join('');
}

/* ---------------------------------------------------------------- seat */

/** Seat (stool/chair) for a table, origin = table floor point; drawn BEFORE the seated guest. */
export function seat(style: TableStyle, theme: ThemeId): string {
  const p = PAL[theme];
  if (style === 'wood') {
    return ln('M-18,-24 L-20,-10 M18,-24 L20,-10 M-6,-24 L-7,-12 M6,-24 L7,-12', 2.4, p.woodD)
      + sh(box(-24, -30, 48, 7, 3), p.wood)
      + sh(blob(0, -32, 22, 5), p.b)
      + ln('M-10,-33 q10,3 20,0', 1.1);
  }
  if (style === 'teacup') {
    // little sugar-cube pouf
    return sh(box(-22, -34, 44, 22, 7), p.cream)
      + fl(box(-20, -34, 40, 6, 3), p.a, 0.7)
      + ln('M-14,-24 q2,2 4,0 M6,-20 q2,2 4,0 M-3,-17 q2,2 4,0', 1.1);
  }
  // yarn: knitted pouf
  return sh(blob(0, -22, 26, 11), p.yarn)
    + ln('M-18,-28 q4,6 0,13 M-8,-32 q4,8 0,19 M4,-32 q4,8 0,19 M15,-29 q4,6 0,13', 1.2)
    + sh(blob(0, -32, 4, 2.6), p.c);
}

/* --------------------------------------------------------------- table */

function coinPile(n: number, x0: number): string {
  if (n <= 0) return '';
  const a = Math.min(n, 4), b = n - a;
  const stacks: [number, number, number][] = [[x0, -35, a]];
  if (b > 0) stacks.push([x0 + 9, -33.5, b]);
  let bodies = '', tops = '', ridges = '';
  for (const [cx, base, k] of stacks) {
    const h = k * 2.6, t = base - h;
    bodies += `M${cx - 5},${r1(t)} L${cx - 5},${base} C${cx - 5},${r1(base + 2.4)} ${cx + 5},${r1(base + 2.4)} ${cx + 5},${base} L${cx + 5},${r1(t)}z`;
    tops += blob(cx, t, 5, 2, 0.1);
    for (let j = 1; j < k; j++) {
      const y = r1(base - j * 2.6);
      ridges += `M${cx - 5},${y} C${cx - 5},${r1(y + 2.4)} ${cx + 5},${r1(y + 2.4)} ${cx + 5},${y}`;
    }
  }
  return sh(bodies, GOLD, 1.6) + sh(tops, '#f8dc86', 1.6) + (ridges ? ln(ridges, 1, INK) : '');
}

function yarnTable(p: FP): string {
  let doily = 'M-30,-33';
  for (let i = 0; i < 10; i++) doily += ' q3,5.5 6,0';
  doily += ' C24,-41 -24,-41 -30,-33z';
  const holes: [number, number][] = [];
  for (let i = 0; i < 10; i++) holes.push([-27 + i * 6, -31.2]);
  return ln('M18,-5 C28,-1 34,3 42,1 C47,0 49,-4 46,-6', 1.8, INK)
    + sh(blob(0, -17, 25, 18), p.yarn)
    + ln('M-21,-27 C-8,-35 12,-30 23,-19 M-25,-15 C-10,-26 10,-20 24,-8 M-18,-3 C-6,-12 8,-10 17,-1 M-6,-33 C-15,-22 -12,-8 -4,0', 1.3)
    + sh(blob(0, -31, 36, 7.5), p.woodD)
    + sh(blob(0, -35, 35, 6.5), p.wood)
    + sh(doily, '#fffdf8', 1.6)
    + `<path d="${dots(holes, 0.9)}" fill="${INK}" opacity=".35"/>`
    + ln(blob(0, -36, 14, 2.6), 1.1);
}

function woodTable(p: FP): string {
  let cloth = 'M-36,-35 C-36,-42 36,-42 36,-35 L37,-24';
  for (let i = 0; i < 8; i++) cloth += ' q-4.6,3.2 -9.25,0';
  cloth += ' L-36,-35z';
  let check = '';
  for (let x = -30; x <= 30; x += 10) check += `M${x},-37.5 L${r1(x * 1.03)},-25.5`;
  check += 'M-34,-32 L34,-32 M-35,-27.5 L35,-27.5';
  return sh(blob(0, -3, 17, 4), p.woodD)
    + sh(box(-5, -26, 10, 23, 3, 0.6), p.wood)
    + sh(cloth, p.cream)
    + `<path d="${check}" fill="none" stroke="${p.a}" stroke-width="4.2" opacity=".42"/>`
    + ln('M-36,-35 C-30,-31 30,-31 36,-35', 1.2);
}

function teacupTable(p: FP): string {
  const ds: [number, number][] = [[-24, -26], [-12, -23], [12, -23], [24, -26], [-17, -14], [17, -14]];
  return sh(blob(0, -5, 34, 6.5), p.cream)
    + ln(blob(0, -6, 22, 3.2), 1.1)
    + sh('M30,-31 C47,-35 49,-12 28,-15 L30,-20 C41,-20 41,-28 31,-26z', p.a)
    + sh('M-33,-35 C-32,-18 -22,-9 -14,-8 C-6,-6.5 6,-6.5 14,-8 C22,-9 32,-18 33,-35 C20,-30 -20,-30 -33,-35z', p.a)
    + `<path d="${dots(ds, 2)}" fill="${p.cream}" opacity=".85"/>`
    + sh(blob(0, -35, 33, 6), p.cream)
    + ln(blob(0, -35.5, 27, 4.2), 1.1)
    + tinyFace(0, -18, 0.8);
}

/** Table, origin = table floor point; drawn AFTER the seated guest.
 *  item = what is on the table; coins = uncollected tip (draw a little coin pile, more coins = bigger pile);
 *  highlight = pulsing "you can tap here" ring (pulse 0..1). */
export function table(style: TableStyle, theme: ThemeId, o: { item: MenuItemId | null; coins: number; highlight: boolean; pulse: number }): string {
  const p = PAL[theme];
  let s = '';
  if (o.highlight) {
    const q = Math.max(0, Math.min(1, o.pulse));
    s += `<path d="${blob(0, -2, r1(48 + q * 5), r1(14 + q * 1.5), 0.2)}" fill="none" stroke="${BERRY}" stroke-width="2.6" stroke-dasharray="7 6" stroke-linecap="round" opacity="${r1(0.5 + 0.45 * q)}"/>`;
  }
  s += shadow(0, 0, 38, 7);
  s += style === 'wood' ? woodTable(p) : style === 'teacup' ? teacupTable(p) : yarnTable(p);
  if (o.item) s += `<g transform="translate(-7,-45)">${item(o.item)}</g>`;
  if (o.coins > 0) s += coinPile(Math.min(6, Math.ceil(o.coins / 4)), o.item ? 14 : -4);
  return s;
}

/* ------------------------------------------------------------- counter */

/** Counter back part: shelf/back counter and espresso machine. Drawn BEFORE the barista. */
export function counterBack(theme: ThemeId): string {
  const p = PAL[theme];
  const mx = MACHINE.x, my = MACHINE.y;
  // shelf with jars and a cup
  let s = ln('M230,154 l4,6 M276,154 l-4,6', 2, p.woodD)
    + sh(box(226, 148, 56, 6, 2, 0.6), p.wood)
    + sh(box(230, 130, 14, 18, 4, 0.6), '#f6efe4')
    + fl(box(231, 138, 11, 8, 3, 0.4), '#8a5a3e', 0.85)
    + sh(box(229, 126, 16, 5, 2, 0.4), p.a)
    + sh(box(248, 135, 12, 13, 4, 0.5), '#f6efe4')
    + fl(box(249, 140, 9, 6, 2, 0.3), '#a0704f', 0.85)
    + sh(box(247, 131, 14, 5, 2, 0.4), p.b)
    + sh('M265,136 L267,148 L277,148 L279,136z', p.cream, 2)
    + ln('M279,139 q5,1 1,6', 1.8)
    + ln('M270,141 q1.5,-2 2,0 q0.5,-2 2,0 q-1,2.5 -2,3 q-1,-0.5 -2,-3', 1, p.a);
  // menu chalkboard
  s += ln('M338,133 L345,125 L352,133', 1.4)
    + sh(box(332, 132, 26, 40, 4), p.woodD)
    + fl(box(335, 135, 19, 33, 3, 0.5), '#55625b')
    + ln('M339,142 h12 M339,150 h9 M339,158 h11 M339,164 h6', 1.2, CREAM)
    + `<circle cx="353" cy="150" r="1.5" fill="${p.c}"/>`;
  // espresso machine at MACHINE (40x44)
  s += sh(box(mx + 7, my - 6, 9, 7, 2, 0.4), p.cream, 1.8)
    + sh(box(mx + 21, my - 5, 8, 6, 2, 0.4), p.a, 1.8)
    + sh(box(mx + 1, my + 2, 38, 34, 7), p.machine)
    + ln(`M${mx + 4},${my + 3} C${mx + 14},${my + 1} ${mx + 26},${my + 3} ${mx + 36},${my + 2}`, 1.2)
    + sh(blob(mx + 20, my + 14, 8, 7.5), CREAM, 2)
    + ln(`M${mx + 14},${my + 10} q6,-5 12,0`, 1, INK)
    + tinyFace(mx + 20, my + 14, 0.6)
    + `<path d="${dots([[mx + 7, my + 27], [mx + 33, my + 27]], 2.2)}" fill="${p.c}" stroke="${INK}" stroke-width="1.2"/>`
    + sh(box(mx + 14, my + 24, 12, 5, 2, 0.4), '#ddd5ca', 1.8)
    + ln(`M${mx + 20},${my + 29} v2.5`, 1.6)
    + ln(`M${mx + 35},${my + 19} q6,2 5,11`, 2)
    + sh(box(mx - 2, my + 36, 44, 7, 3, 0.5), '#eadfcf')
    + sh(box(mx + 15, my + 31, 10, 6, 2, 0.4), p.cream, 1.8);
  return s;
}

/** Counter front face and top, drawn AFTER the barista (hides barista's lower body). */
export function counterFront(theme: ThemeId): string {
  const p = PAL[theme];
  let knit = '';
  for (let x = 225; x < 358; x += 7) knit += `M${x},239 l3.5,4 l3.5,-4 M${x},245 l3.5,4 l3.5,-4`;
  let fringe = '';
  for (let x = 226; x < 360; x += 8) fringe += `M${x},252 l0.5,4.5`;
  return sh(box(222, 232, 140, 68, 4), p.front)
    + ln(box(282, 260, 32, 34, 4, 0.6), 1.4)
    + ln(box(322, 260, 32, 34, 4, 0.6), 1.4)
    + sh(box(219, 224, 143, 10, 4, 0.6), p.wood)
    + ln('M222,229 C260,230 320,228 360,229.5', 1, p.woodD)
    // knitted runner
    + sh(box(222, 236, 140, 15, 3, 0.6), p.yarn)
    + ln(knit, 1.1)
    + ln(fringe, 1.6, p.yarn === p.a ? p.b : p.a)
    // pastry display window with a glass dome
    + sh(box(228, 258, 46, 37, 5), '#e6f2ef')
    + sh(box(241, 277, 20, 9, 3, 0.4), p.cream, 1.8)
    + fl(box(241, 276, 20, 4, 2, 0.3), p.a, 0.9)
    + `<circle cx="251" cy="274.5" r="2" fill="${p.a}" stroke="${INK}" stroke-width="1"/>`
    + ln('M236,287 h30 M251,287 v5 M246,292 h10', 1.8)
    + ln('M235,286 C235,264 267,264 267,286', 1.6)
    + ln('M240,280 q2,-7 7,-9', 1.3, '#ffffff');
}

/** Brewing progress bar above the machine (progress 0..1, null = idle) and steam. */
export function brewIndicator(progress: number | null, item: MenuItemId | null, time: number): string {
  void item;
  const mx = MACHINE.x, my = MACHINE.y;
  const curl = (x: number, ph: number, op: number) => {
    const w = r1(Math.sin(time * 2.2 + ph) * 2.2);
    const y0 = my - 8, rise = r1(((time * 0.6 + ph) % 1) * 3);
    return `<path d="M${x},${r1(y0 - rise)} c${w + 3},-3 ${w - 3},-6 ${w},-9 c${-w + 3},-3 ${-w - 2},-5 ${0},-8" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" opacity="${r1(op)}"/>`;
  };
  if (progress == null) return curl(mx + 20, 0, 0.25 + 0.1 * Math.sin(time * 1.3));
  const q = Math.max(0, Math.min(1, progress));
  const bx = mx + 2, by = my - 30, bw = 36, bh = 7;
  let s = curl(mx + 12, 0, 0.55 + 0.2 * Math.sin(time * 2))
    + curl(mx + 27, 0.5, 0.55 + 0.2 * Math.sin(time * 2 + 1.7));
  s += fl(box(bx, by, bw, bh, 3.5, 0.4), CREAM);
  if (q > 0.02) s += fl(box(bx + 1, by + 1, r1(Math.max(5, (bw - 2) * q)), bh - 2, 2.5, 0.2), '#a8c69f');
  s += ln(box(bx, by, bw, bh, 3.5, 0.4), 1.8);
  return s;
}
