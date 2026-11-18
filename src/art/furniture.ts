/* =====================================================================
   FURNITURE: seats, tables, counter (back + front), brew indicator.
   Hand-drawn pastel style built on kit.ts. Deterministic, lean
   (tables <= 30 elements, seats <= 10) because drawn every frame.
   ===================================================================== */
import type { MenuItemId, TableStyle, ThemeId } from '../types';
import { MACHINE } from '../layout';
import { INK, CREAM, fl, ln, sh, blob, box, shadow, tinyFace } from './kit';
import { item } from './items';
const itemArt = item;

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

/** Tip coins: a big face-on gold coin in front of a short stack (more coins = taller stack),
 *  on a soft gold glow so it pops against the cloth. ~13 elements max. */
function coinPile(n: number, x0: number): string {
  if (n <= 0) return '';
  const COIN = '#f6c84c', RIM = '#c98a1e';
  let s = `<path d="${blob(x0 + 1, -42, 16, 13, 0)}" fill="#fff6cf" opacity=".6"/>`
    + `<path d="${blob(x0 + 1, -42, 12, 10, 0)}" fill="#ffe9a0" opacity=".75"/>`;
  const k = n - 1, sx = x0 + 5, base = -36;
  if (k > 0) {
    const t = r1(base - k * 3.2);
    const body = `M${sx - 7},${t} L${sx - 7},${base} C${sx - 7},${base + 3.6} ${sx + 7},${base + 3.6} ${sx + 7},${base} L${sx + 7},${t}z`;
    let ridges = '';
    for (let j = 1; j < k; j++) {
      const y = r1(base - j * 3.2);
      ridges += `M${sx - 6},${y} C${sx - 6},${r1(y + 3.2)} ${sx + 6},${r1(y + 3.2)} ${sx + 6},${y}`;
    }
    s += sh(body, COIN, 2.2)
      + (ridges ? ln(ridges, 1.2, RIM) : '')
      + sh(blob(sx, t, 7, 2.8, 0), '#ffdf7e', 2.2)
      + ln(blob(sx, t, 4.2, 1.5, 0), 1.1, RIM);
  }
  const cx = x0 - 3, cy = -41.5;
  return s + sh(blob(cx, cy, 6.8, 6.8, 0), COIN, 2.4)
    + ln(blob(cx, cy, 4.6, 4.6, 0), 1.4, RIM)
    + ln(`M${cx - 3.6},${cy - 1.2} q0.8,-3 4,-3.8`, 1.7, '#ffffff');
}

function yarnTable(p: FP): string {
  return ln('M18,-5 C28,-1 34,3 42,1 C47,0 49,-4 46,-6', 1.8, INK)
    + sh(blob(0, -17, 25, 18), p.yarn)
    + ln('M-21,-27 C-8,-35 12,-30 23,-19 M-25,-15 C-10,-26 10,-20 24,-8 M-18,-3 C-6,-12 8,-10 17,-1 M-6,-33 C-15,-22 -12,-8 -4,0', 1.3)
    + sh(blob(0, -31, 36, 7.5), p.woodD)
    + sh(blob(0, -35, 35, 6.5), p.wood)
    // smooth oval doily with a soft dashed lace line inside
    + sh(blob(0, -35.5, 29, 5.4, 0), '#fffdf8', 1.6)
    + `<path d="${blob(0, -35.5, 23, 3.8, 0)}" fill="none" stroke="${INK}" stroke-width="1.1" stroke-dasharray="3 3" stroke-linecap="round" opacity=".45"/>`;
}

function woodTable(p: FP): string {
  const cloth = 'M-36,-35 C-36,-42 36,-42 36,-35 L37,-24 C22,-19.5 -22,-19.5 -37,-24 L-36,-35z';
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
  if (o.coins > 0) s += coinPile(Math.min(6, Math.ceil(o.coins / 4)), o.item ? 17 : -1);
  return s;
}

/* ------------------------------------------------------------- counter */

/** Counter back part: shelf/back counter and espresso machine. Drawn BEFORE the barista. */
export function counterBack(theme: ThemeId): string {
  const p = PAL[theme];
  const mx = MACHINE.x, my = MACHINE.y;
  // simple shelf with two jars (kept well above the machine)
  let s = ln('M232,150 l4,6 M274,150 l-4,6', 2, p.woodD)
    + sh(box(228,144,50,6,2,0.6), p.wood)
    + sh(box(233,126,14,18,4,0.6), '#f6efe4')
    + fl(box(234,134,11,8,3,0.4), '#8a5a3e', 0.85)
    + sh(box(232,122,16,5,2,0.4), p.a)
    + sh(box(256,131,12,13,4,0.5), '#f6efe4')
    + sh(box(255,127,14,5,2,0.4), p.b);
  // menu chalkboard
  s += ln('M338,133 L345,125 L352,133', 1.4)
    + sh(box(332, 132, 26, 40, 4), p.woodD)
    + fl(box(335, 135, 19, 33, 3, 0.5), '#55625b')
    + ln('M339,145 h12 M339,155 h9', 1.4, CREAM);
  // espresso machine at MACHINE (40x44): bold outline, few parts
  s += sh(box(mx + 12, my - 6, 10, 7, 2, 0.4), p.cream, 2)
    + sh(box(mx + 1, my + 2, 38, 34, 7), p.machine, 2.8)
    + sh(blob(mx + 20, my + 14, 8, 7.5), CREAM, 2.2)
    + tinyFace(mx + 20, my + 14, 0.6)
    + sh(box(mx + 14, my + 24, 12, 5, 2, 0.4), '#ddd5ca', 2)
    + ln(`M${mx + 35},${my + 19} q6,2 5,11`, 2.2)
    + sh(box(mx - 2, my + 35, 44, 6, 3, 0.5), '#eadfcf', 2.2)
    + sh(box(mx + 15, my + 30, 10, 6, 2, 0.4), p.cream, 2);
  return s;
}

/** Counter front face and top, drawn AFTER the barista (hides barista's lower body). */
export function counterFront(theme: ThemeId): string {
  const p = PAL[theme];
  return sh(box(222, 236, 140, 64, 4), p.front, 2.8)
    // soft shade under the top lip + one plain inset panel
    + fl(box(222, 237, 140, 5, 2, 0.3), p.woodD, 0.3)
    + ln(box(286, 252, 66, 38, 5, 0.6), 1.4)
    // clear, plain, light counter top (ready drinks sit on it)
    + sh(box(218, 222, 144, 15, 5, 0.6), p.cream, 2.8)
    + ln('M224,233.8 C260,234.6 320,233.2 356,234', 1.2, p.wood)
    // small pastry window with a glass dome at the left end
    + sh(box(229, 250, 44, 38, 5), '#e6f2ef')
    + sh(box(241, 270, 20, 9, 3, 0.4), p.cream, 1.8)
    + fl(box(241, 269, 20, 4, 2, 0.3), p.a, 0.9)
    + `<circle cx="251" cy="267.5" r="2" fill="${p.a}" stroke="${INK}" stroke-width="1"/>`
    + ln('M236,280 h30 M251,280 v4', 1.8)
    + ln('M235,279 C235,257 267,257 267,279', 1.6)
    + ln('M240,273 q2,-7 7,-9', 1.3, '#ffffff');
}

/** Brewing progress bar above the machine (progress 0..1, null = idle) and steam. */
export function brewIndicator(progress: number | null, item: MenuItemId | null, time: number): string {

  const mx = MACHINE.x, my = MACHINE.y;
  const curl = (x: number, ph: number, op: number) => {
    const w = r1(Math.sin(time * 2.2 + ph) * 2.2);
    const y0 = my - 8, rise = r1(((time * 0.6 + ph) % 1) * 3);
    return `<path d="M${x},${r1(y0 - rise)} c${w + 3},-3 ${w - 3},-6 ${w},-9 c${-w + 3},-3 ${-w - 2},-5 ${0},-8" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" opacity="${r1(op)}"/>`;
  };
  if (progress == null) return curl(mx + 20, 0, 0.25 + 0.1 * Math.sin(time * 1.3));
  const q = Math.max(0, Math.min(1, progress));
  let s = curl(mx + 12, 0, 0.55 + 0.2 * Math.sin(time * 2))
    + curl(mx + 27, 0.5, 0.55 + 0.2 * Math.sin(time * 2 + 1.7));
  // A small cute brewing gauge set into the counter's front panel (box 286..352 x 252..290):
  // a recessed slot, a little cup on the left, and a pastel bar that fills with a heart at its tip.
  const sx = 291, sy = 263, sw = 56, sh2 = 16;
  s += `<rect x="${sx}" y="${sy}" width="${sw}" height="${sh2}" rx="8" fill="${INK}" opacity=".22"/>`;            // recess
  s += `<rect x="${sx}" y="${sy + 1.5}" width="${sw}" height="2" rx="1" fill="${INK}" opacity=".18"/>`;          // inner top shadow
  const bx = sx + 17, by = sy + 4, bw = sw - 21, bh = 8;
  s += `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="4" fill="#fffaf2" stroke="${INK}" stroke-width="1.6"/>`;
  const w = r1(Math.max(4, (bw - 2) * q));
  s += `<rect x="${bx + 1}" y="${by + 1}" width="${w}" height="${bh - 2}" rx="3" fill="#8fc3a7"/>`;
  s += `<path transform="translate(${r1(bx + 1 + w)} ${by + 4}) scale(.42)" d="M0,4 C-9,-3 -4,-10 0,-5 C4,-10 9,-3 0,4z" fill="#e2607a" stroke="${INK}" stroke-width="2"/>`;
  s += `<circle cx="${sx + 8}" cy="${sy + 8}" r="7" fill="#fffaf2" stroke="${INK}" stroke-width="1.6"/>`;
  if (item) s += `<g transform="translate(${sx + 8} ${sy + 8.5}) scale(.42)">${itemArt(item)}</g>`;
  return s;
}
