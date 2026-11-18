/* =====================================================================
   Menu items, speech bubbles, tap hints, select ring and floating effects.
   All small, deterministic markup (drawn every frame).
   ===================================================================== */
import type { MenuItemId } from '../types';
import { INK, fl, ln, sh, blob, box, shadow } from './kit';

const r1 = (n: number) => +n.toFixed(2);
const BERRY = '#c4506a';
const PAPER = '#fffaf2';
const WHITE = '#fffdf8';

/* ---------- small shape helpers ---------- */
const heartD = (cx: number, cy: number, s: number) =>
  `M${r1(cx)},${r1(cy + s * 0.95)} C${r1(cx - s * 0.5)},${r1(cy + s * 0.55)} ${r1(cx - s * 1.15)},${r1(cy + s * 0.05)} ${r1(cx - s * 1.05)},${r1(cy - s * 0.45)} `
  + `C${r1(cx - s * 0.95)},${r1(cy - s * 1.05)} ${r1(cx - s * 0.2)},${r1(cy - s * 1.1)} ${r1(cx)},${r1(cy - s * 0.5)} `
  + `C${r1(cx + s * 0.2)},${r1(cy - s * 1.1)} ${r1(cx + s * 0.95)},${r1(cy - s * 1.05)} ${r1(cx + s * 1.05)},${r1(cy - s * 0.45)} `
  + `C${r1(cx + s * 1.15)},${r1(cy + s * 0.05)} ${r1(cx + s * 0.5)},${r1(cy + s * 0.55)} ${r1(cx)},${r1(cy + s * 0.95)}z`;

/** Several small dots as one path (subpaths). */
const dots = (pts: [number, number][], rad: number) =>
  pts.map(([x, y]) => `M${r1(x - rad)},${r1(y)} a${rad},${rad} 0 1,0 ${r1(rad * 2)},0 a${rad},${rad} 0 1,0 ${r1(-rad * 2)},0`).join(' ');

const puffD = (cx: number, cy: number, s: number) =>
  `M${r1(cx - 6 * s)},${r1(cy + 3 * s)} C${r1(cx - 9 * s)},${r1(cy + 2 * s)} ${r1(cx - 8.5 * s)},${r1(cy - 3 * s)} ${r1(cx - 5 * s)},${r1(cy - 2.5 * s)} `
  + `C${r1(cx - 5 * s)},${r1(cy - 6.5 * s)} ${r1(cx + 0.5 * s)},${r1(cy - 7.5 * s)} ${r1(cx + 1.5 * s)},${r1(cy - 4 * s)} `
  + `C${r1(cx + 4.5 * s)},${r1(cy - 6.5 * s)} ${r1(cx + 8.5 * s)},${r1(cy - 3 * s)} ${r1(cx + 6.5 * s)},${r1(cy)} `
  + `C${r1(cx + 9 * s)},${r1(cy + 2 * s)} ${r1(cx + 7 * s)},${r1(cy + 5.5 * s)} ${r1(cx + 4 * s)},${r1(cy + 4 * s)} `
  + `C${r1(cx + 2 * s)},${r1(cy + 6 * s)} ${r1(cx - 3 * s)},${r1(cy + 6 * s)} ${r1(cx - 6 * s)},${r1(cy + 3 * s)}z`;

const angerD = (cx: number, cy: number, s: number) => {
  const a = 1.6 * s, b = 5.5 * s;
  return `M${r1(cx - b)},${r1(cy - a)} Q${r1(cx - a)},${r1(cy - a)} ${r1(cx - a)},${r1(cy - b)} `
    + `M${r1(cx + a)},${r1(cy - b)} Q${r1(cx + a)},${r1(cy - a)} ${r1(cx + b)},${r1(cy - a)} `
    + `M${r1(cx + b)},${r1(cy + a)} Q${r1(cx + a)},${r1(cy + a)} ${r1(cx + a)},${r1(cy + b)} `
    + `M${r1(cx - a)},${r1(cy + b)} Q${r1(cx - a)},${r1(cy + a)} ${r1(cx - b)},${r1(cy + a)}`;
};

const starD = (cx: number, cy: number, s: number) =>
  `M${cx},${r1(cy - 7 * s)} Q${r1(cx + 1.2 * s)},${r1(cy - 1.2 * s)} ${r1(cx + 7 * s)},${cy} Q${r1(cx + 1.2 * s)},${r1(cy + 1.2 * s)} ${cx},${r1(cy + 7 * s)} `
  + `Q${r1(cx - 1.2 * s)},${r1(cy + 1.2 * s)} ${r1(cx - 7 * s)},${cy} Q${r1(cx - 1.2 * s)},${r1(cy - 1.2 * s)} ${cx},${r1(cy - 7 * s)}z`;

/* ---------- cups ---------- */
const CUP = 'M-8,-5 C-8.2,0.5 -6.4,4.6 -3.2,5.4 C-1,5.8 1.2,5.8 3.2,5.4 C6.4,4.6 8.2,0.5 8,-5z';
const HANDLE = 'M7.6,-3 C11.8,-4 12.4,2.4 6.4,2.6';
const SAUCER = blob(0, 6.2, 11, 2.4, 0.1);
const TOP = blob(0, -5, 8, 2.1, 0.1);

/** Cup on a saucer; `art` goes on the drink surface (drawn last). */
function cup(cupColor: string, drink: string, art: string, saucer = '#fff6ea', extraBelowTop = ''): string {
  return shadow(0, 8.6, 10, 1.6)
    + sh(SAUCER, saucer, 2)
    + ln(HANDLE, 2.2)
    + sh(CUP, cupColor, 2.2)
    + extraBelowTop
    + sh(TOP, drink, 1.8)
    + art;
}

const ITEMS: Record<MenuItemId, string> = {
  latte: cup('#fbeee0', '#c8936a',
    fl(heartD(-0.3, -5.6, 2.1), WHITE)),

  cocoa: (() => {
    const mug = 'M-7.4,-6 C-7.8,-0.5 -7.4,4.4 -5.4,5.8 C-2,6.6 2,6.6 5.4,5.8 C7.4,4.4 7.8,-0.5 7.4,-6z';
    return shadow(0, 7.4, 9, 1.6)
      + ln('M7,-3.6 C12.2,-4.6 12.6,3.2 6.6,3', 2.2)
      + sh(mug, '#a9c8e0', 2.2)
      + ln('M-6.8,0.6 C-3,1.4 3,1.4 6.8,0.6', 1.4, '#ffffff')
      + sh(blob(0, -6, 7.4, 2, 0.1), '#8a5a44', 1.8)
      + sh(box(-4.6, -9.6, 4, 3.4, 1.2, 0.4), WHITE, 1.4)
      + sh(box(0.6, -10.4, 4, 3.4, 1.2, 0.4), '#fbd3dc', 1.4);
  })(),

  matcha: cup('#e9f0dc', '#9cc47a',
    ln('M-3.6,-4.6 C-1.6,-6.8 1.8,-6.8 3.6,-5.2 C1.6,-3.8 -1.6,-3.6 -3.6,-4.6z M-3.6,-4.6 L3.6,-5.2', 1, '#eef6dc'),
    '#f4f8ea'),

  cake: shadow(0, 8.4, 11, 1.6)
    + sh(blob(0, 5.6, 11.5, 2.6, 0.1), '#fff6ea', 2)
    + sh('M-9,-2 C-3,-3.4 3,-3.6 9,-3.4 L9.2,4.4 C3,5 -3,5 -9.2,4.6z', '#f7dfae', 2.2)
    + fl('M-9,0.6 C-3,0 3,-0.2 9,0 L9,1.8 C3,1.6 -3,1.8 -9,2.4z', '#f4a3b6')
    + sh('M-9.4,-2 C-9.6,-4.4 -6,-5.4 -2,-5.6 C2,-5.8 7,-6 9.4,-4.4 C9.6,-3.6 9.2,-3 8.4,-3 C7,-1.6 6,-3.2 4.6,-2.6 C3,-1.4 2,-3 0.4,-2.4 C-1.2,-1.6 -2.4,-3 -4,-2.2 C-5.6,-1.4 -6.6,-2.8 -8,-1.8 C-8.8,-1.4 -9.4,-1.6 -9.4,-2z', WHITE, 1.8)
    + sh('M1.4,-12.6 C-1.8,-12.6 -2.6,-8.4 1.4,-5.8 C5.4,-8.4 4.6,-12.6 1.4,-12.6z', '#e8606f', 1.8)
    + ln('M-0.6,-12.4 L1.4,-11.4 L3.4,-12.4 M1.4,-11.4 L1.4,-13.6', 1.4, '#6fa36b'),

  cookie: shadow(0, 8.4, 11, 1.6)
    + sh(blob(0, 5.4, 11.5, 2.6, 0.1), '#fff6ea', 2)
    + sh(blob(-3.4, 0.6, 6.4, 5, 0.2), '#e3b27a', 2.2)
    + sh(blob(3.8, -2.4, 6.4, 5, -0.2), '#eabd86', 2.2)
    + `<path d="${dots([[-6, 1.4], [-2.4, 3.4], [-4.2, -1.6], [2, -4], [5.6, -3.4], [3.8, 0.4], [7.2, -0.6]], 1.05)}" fill="#7a4b34"/>`,

  gingerbread_latte: cup('#e9988a', '#f3dcc0',
    `<circle cx="-1.6" cy="-5.2" r=".9" fill="#c98a52" opacity=".7"/><circle cx="3.4" cy="-4.6" r=".7" fill="#c98a52" opacity=".7"/>`,
    '#fff6ea',
    // little gingerbread figure peeking out of the foam
    sh('M2.2,-14.4 C0.2,-14.4 -0.4,-12 0.8,-11 C-1.2,-10.8 -2.2,-9.8 -1.4,-9 C-0.6,-8.6 0.4,-9.2 0.6,-9.4 L0.4,-5 L5.6,-5 L5.4,-9.4 C5.6,-9.2 6.6,-8.6 7.4,-9 C8.2,-9.8 7.2,-10.8 5.2,-11 C6.4,-12 6,-14.4 3.8,-14.4z', '#c98a52', 1.7)
    + `<path d="${dots([[2.1, -12.6], [3.9, -12.6]], 0.45)} ${dots([[3, -8.4]], 0.5)}" fill="#fff6ea"/>`),

  pumpkin_latte: cup('#f2a65a', '#f6d7a8',
    sh('M-7,-5.4 C-8.6,-8.4 -5.6,-10.8 -3,-9.8 C-2.2,-13 2.6,-13.4 3.4,-10 C6.4,-10.8 8.6,-8 7,-5.4 C2,-4.2 -2,-4.2 -7,-5.4z', WHITE, 1.8)
    + ln('M-3,-9.8 C-1.6,-8.4 1.4,-8.2 3.4,-10', 1.1)
    + `<path d="${dots([[-3.6, -7.2], [-0.6, -10.4], [2.4, -7.6], [4.8, -8.4], [0.6, -6.6]], 0.55)}" fill="#a0613a"/>`,
    '#fff6ea'),

  sakura_latte: cup('#f7c6d3', '#fbe3e8',
    `<path d="${dots([[0, -6.9], [1.9, -5.6], [1.2, -3.8], [-1.2, -3.8], [-1.9, -5.6]], 1.25)}" fill="#ec8fac"/>`
    + `<circle cx="0" cy="-5.1" r=".8" fill="#fff2a8"/>`,
    '#fff6ea'),
};

/** A menu item (cup / plate) centred at (0,0), roughly 22 units wide at scale 1. */
export function item(id: MenuItemId): string {
  return ITEMS[id] ?? ITEMS.latte;
}

/* ---------- bubble ---------- */
const BUBBLE_D = 'M-17,-46 C-6,-47 6,-46.4 17,-46 Q23,-46 23,-40 C23.5,-30 23.2,-20 23,-14 Q23,-8.2 17,-8.4 '
  + 'L5,-8.4 Q2.2,-4 0,0 Q-1.6,-4.2 -5,-8.4 L-17,-8.2 Q-23,-8 -23,-14 C-23.4,-24 -23.2,-34 -23,-40 Q-23,-46 -17,-46z';

function patienceBar(p: number): string {
  const v = Math.max(0, Math.min(1, p));
  const col = v > 0.5 ? '#7fae93' : v > 0.25 ? '#e2a93b' : '#e2607a';
  const w = r1(28 * v);
  return `<rect x="-14" y="-17" width="28" height="4.4" rx="2.2" fill="#eadbd0"/>`
    + (w > 0.3 ? `<rect x="-14" y="-17" width="${w}" height="4.4" rx="2.2" fill="${col}"/>` : '')
    + `<rect x="-14" y="-17" width="28" height="4.4" rx="2.2" fill="none" stroke="${INK}" stroke-width="1.2" opacity=".55"/>`;
}

const exclaim = (cx: number, cy: number) =>
  sh(`M${cx - 2.6},${cy - 9} C${cx - 2.8},${cy - 11.6} ${cx + 2.8},${cy - 11.6} ${cx + 2.6},${cy - 9} L${cx + 1.4},${cy + 1} C${cx + 1.2},${cy + 2.2} ${cx - 1.2},${cy + 2.2} ${cx - 1.4},${cy + 1}z`, BERRY, 1.8)
  + sh(blob(cx, cy + 6, 2.4, 2.3, 0), BERRY, 1.8);

/** Speech/thought bubble; the tail tip is at (0,0), bubble extends upward (~44 tall).
 *  'order' shows the item + patience bar; 'reading' shows "..." ; 'waiting' shows the item faded + patience bar;
 *  'door' shows "!" + patience bar; 'heart' and 'angry' are reactions. */
export function bubble(kind: 'order' | 'reading' | 'waiting' | 'door' | 'heart' | 'angry',
  o: { item?: MenuItemId | null; patience?: number }): string {
  let inner = '';
  const withBar = kind === 'order' || kind === 'waiting' || kind === 'door';
  switch (kind) {
    case 'order':
    case 'waiting': {
      const it = item(o.item ?? 'latte');
      inner = `<g transform="translate(0,-29) scale(.85)"${kind === 'waiting' ? ' opacity=".45"' : ''}>${it}</g>`;
      break;
    }
    case 'door': inner = exclaim(0, -31); break;
    case 'reading':
      inner = `<path d="${dots([[-8, -27], [0, -27.6], [8, -27]], 2.8)}" fill="#b89a88"/>`;
      break;
    case 'heart':
      inner = sh(heartD(0, -26.6, 9), '#ef8fa6', 2.2)
        + ln('M-6,-30 C-5.6,-32 -4,-33 -2.6,-32.6', 1.6, '#ffffff');
      break;
    case 'angry':
      inner = ln(angerD(0, -27, 1.6), 3, '#e2607a');
      break;
  }
  return sh(BUBBLE_D, PAPER, 2)
    + inner
    + (withBar ? patienceBar(o.patience ?? 1) : '');
}

/* ---------- tap marker / select ring ---------- */

/** Pulsing tap marker (tutorial hint / selection), centred at (0,0). pulse 0..1. */
export function tapMarker(pulse: number): string {
  const p = ((pulse % 1) + 1) % 1;
  const rr = r1(9 + 10 * p);
  const op = r1(0.85 * (1 - p));
  const bob = r1(-2 * Math.sin(p * Math.PI * 2));
  return `<circle r="${rr}" fill="none" stroke="${BERRY}" stroke-width="2.4" opacity="${op}"/>`
    + `<circle r="8" fill="#ffffff" fill-opacity=".6" stroke="${BERRY}" stroke-width="2"/>`
    + `<circle r="3" fill="${BERRY}"/>`
    + `<path d="M0,${r1(-12 + bob)} l-4,-5 h8z" fill="${BERRY}" stroke="${BERRY}" stroke-width="1.6" stroke-linejoin="round"/>`;
}

/** Ground ring under a selected guest, centred at (0,0). */
export function selectRing(pulse: number): string {
  const p = ((pulse % 1) + 1) % 1;
  const op = r1(0.55 + 0.45 * (0.5 + 0.5 * Math.sin(p * Math.PI * 2)));
  return `<path d="${blob(0, 0, 22, 7, 0)}" fill="#fff6ea" fill-opacity=".45" stroke="${BERRY}" stroke-width="2.2" `
    + `stroke-dasharray="5 4" stroke-linecap="round" opacity="${op}"/>`;
}

/* ---------- floating effects ---------- */
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Floating effect at (0,0); t = 0..1 of its life (art handles rise + fade). */
/** A little broom swishing back and forth over the mess (pivot at the top of the handle),
 *  kicking up soft dust puffs; fades out at the end. k = 0..1 of its life. */
function broomSweep(k: number): string {
  const swing = Math.sin(k * Math.PI * 5) * 28;              // 2.5 swishes
  const op = k < 0.1 ? k / 0.1 : k > 0.8 ? (1 - k) / 0.2 : 1;
  const broom =
    ln('M0,-34 L0,-6', 3.2, '#a8714d')                                             // handle
    + sh('M-3,-8 C-4,-12 4,-12 3,-8z', '#e2607a', 1.6)                              // ribbon band
    + sh('M-4,-8 C-10,-2 -13,6 -12,10 C-6,12 6,12 12,10 C13,6 10,-2 4,-8z', '#f6cf6b', 2) // bristles
    + ln('M-6,0 L-8,9 M-2,-1 L-3,10 M2,-1 L3,10 M6,0 L8,9', 1.1, '#c99a3c');
  let puffs = '';
  for (let i = 0; i < 3; i++) {
    const pk = (k * 2.5 + i / 3) % 1;
    const px = (i - 1) * 12 + Math.sin(k * 9 + i) * 4, py = 8 - pk * 14;
    puffs += `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${(3 + pk * 4).toFixed(1)}" fill="#e9e2dc" stroke="${INK}" stroke-width=".8" stroke-opacity=".35" opacity="${((1 - pk) * 0.8).toFixed(2)}"/>`;
  }
  return `<g opacity="${op.toFixed(2)}">${puffs}<g transform="translate(0,-6) rotate(${swing.toFixed(1)} 0 -34)">${broom}</g></g>`;
}

export function effect(kind: 'coin' | 'heart' | 'angry' | 'sparkle' | 'text' | 'broom', t: number, text?: string): string {
  const k = Math.max(0, Math.min(1, t));
  if (kind === 'broom') return broomSweep(k);
  const rise = -30 * (1 - (1 - k) * (1 - k));
  const op = k < 0.6 ? 1 : 1 - (k - 0.6) / 0.4;
  const s = k < 0.15 ? 0.6 + (k / 0.15) * 0.5 : k < 0.3 ? 1.1 - ((k - 0.15) / 0.15) * 0.1 : 1;
  let inner = '';
  switch (kind) {
    case 'coin':
      inner = sh(blob(0, 0, 6.4, 6.4, 0.1), '#f4c94e', 2.2)
        + ln('M-3.4,-0.4 C-3.4,-3.6 0,-4.6 2,-3.6', 1.2, '#fff3c4')
        + `<circle r="3.4" fill="none" stroke="#c8902c" stroke-width="1.2" transform="translate(.6,.4)"/>`;
      break;
    case 'heart':
      inner = sh(heartD(0, 0, 6.5), '#ef8fa6', 2)
        + ln('M-4.4,-2.4 C-4,-4 -2.8,-4.6 -1.8,-4.4', 1.3, '#ffffff');
      break;
    case 'angry':
      inner = sh(puffD(0, 0, 1), '#f7c0c4', 2) + ln(angerD(0.4, 0, 0.75), 1.8, '#e2607a');
      break;
    case 'sparkle':
      inner = sh(starD(0, 0, 1), '#ffe08a', 1.8)
        + `<path d="${starD(7, -6, 0.38)}" fill="#ffe08a" stroke="${INK}" stroke-width="1.1" stroke-linejoin="round"/>`;
      break;
    case 'text':
      inner = `<text x="0" y="5" text-anchor="middle" font-family="'Baloo 2', sans-serif" font-weight="800" font-size="15" `
        + `fill="#e2a93b" stroke="${INK}" stroke-width="3" stroke-linejoin="round" paint-order="stroke">${esc(text ?? '')}</text>`;
      break;
  }
  return `<g transform="translate(0,${r1(rise)}) scale(${r1(s)})" opacity="${r1(Math.max(0, op))}">${inner}</g>`;
}
