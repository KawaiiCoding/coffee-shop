/* Decor A: ceiling (bunting, string lights, paper lanterns) and wall
   (yarn shelf, latte painting, cat clock). Drawn relative to slot anchor. */
import type { DecorId, ThemeId } from '../types';
import { INK, CREAM, fl, ln, sh, blob, box, tinyFace, EYE } from './kit';

const BLUSH = '#f4a9a8', SAGE = '#8fc3a7', MUSTARD = '#f6cf6b', SKY = '#9dbbe6', BERRY = '#e2607a';
const WOOD = '#d9a877', WOOD_DK = '#b98455';
const r1 = (n: number) => +n.toFixed(1);

const PALETTE: Record<ThemeId, string[]> = {
  everyday: [BLUSH, SAGE, MUSTARD, SKY, CREAM, BERRY],
  spring: [BLUSH, CREAM, '#f9cdd6', '#e88fa3', '#fdf0f2', '#c9e4cf'],
  summer: ['#f39aa6', '#fbe07a', '#8fcaee', '#a9dcc9', CREAM, '#7fc48e'],
  christmas: ['#d9605c', '#7fb48f', CREAM, '#d9605c', '#5f9c74', CREAM],
  halloween: ['#f39a4b', '#9a7bc4', '#4f4048', '#f6b56b', '#7d62a8', '#4f4048'],
};

/** Point on a sagging swag from x0..x1 at height y0 dipping by `sag`. */
function swagPt(x0: number, x1: number, y0: number, sag: number, t: number) {
  return { x: x0 + (x1 - x0) * t, y: y0 + 4 * sag * t * (1 - t) };
}
/** Path for a sagging swag (quadratic, peak dip = sag). */
const swagPath = (x0: number, x1: number, y0: number, sag: number) =>
  `M${x0},${y0} Q${(x0 + x1) / 2},${y0 + 2 * sag} ${x1},${y0}`;

/* ---------------- ceiling ---------------- */

function bunting(theme: ThemeId): string {
  const pal = PALETTE[theme];
  let s = '', knit = '';
  const swags: [number, number][] = [[-6, 180], [180, 366]];
  let i = 0;
  for (const [x0, x1] of swags) {
    s += ln(swagPath(x0, x1, 12, 16), 1.8);
    for (let k = 0; k < 6; k++) {
      const t = (k + 0.75) / 6.5;
      const p = swagPt(x0, x1, 12, 16, t);
      const w = 22, h = 26 - (i % 3);
      const L = p.x - w / 2, R = p.x + w / 2, top = p.y + 1, tip = top + h;
      const lean = (i % 2 ? 1.2 : -1.2);
      const d = `M${r1(L)},${r1(top)} C${r1(L + 7)},${r1(top - 1)} ${r1(R - 7)},${r1(top + 1)} ${r1(R)},${r1(top)} `
        + `C${r1(R - 2)},${r1(top + h * 0.4)} ${r1(p.x + 3 + lean)},${r1(tip - 6)} ${r1(p.x + lean)},${r1(tip)} `
        + `C${r1(p.x - 3 + lean)},${r1(tip - 6)} ${r1(L + 2)},${r1(top + h * 0.4)} ${r1(L)},${r1(top)}z`;
      s += sh(d, pal[i % pal.length], 2.2);
      // little knit "v" stitches down the middle
      for (let v = 0; v < 3; v++) {
        const vy = top + 5 + v * 5.5, vw = 3.2 - v * 0.6;
        knit += `M${r1(p.x + lean * v * 0.3 - vw)},${r1(vy)} l${vw},2.6 l${vw},-2.6 `;
      }
      i++;
    }
  }
  return s + `<path d="${knit}" fill="none" stroke="${INK}" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round" opacity=".45"/>`;
}

function stringLights(theme: ThemeId): string {
  const glow = theme === 'halloween' ? ['#f6a35b', '#c3a3e6'] : theme === 'christmas' ? ['#ffd27a', '#f39b8f', '#a8d9b4'] : theme === 'spring' ? ['#ffe08f', '#f8c0cc'] : theme === 'summer' ? ['#fff0a0', '#bfe6f7', '#ffc2c9'] : ['#ffd88a', '#ffe6a8'];
  let halos = '', bulbs = '', caps = '';
  const swags: [number, number][] = [[-6, 120], [120, 240], [240, 366]];
  let wire = '', i = 0;
  for (const [x0, x1] of swags) {
    wire += swagPath(x0, x1, 10, 14) + ' ';
    for (let k = 0; k < 3; k++) {
      const p = swagPt(x0, x1, 10, 14, (k + 0.5) / 3);
      const c = glow[i % glow.length];
      const by = p.y + 12, swing = (i % 2 ? 1 : -1) * 0.8;
      halos += `<circle cx="${r1(p.x + swing)}" cy="${r1(by)}" r="12" fill="${c}" opacity=".3"/>`;
      // teardrop bulb hanging from the cap
      const bx = p.x + swing, t = by - 6;
      const d = `M${r1(bx - 3)},${r1(t)} C${r1(bx - 8)},${r1(t + 5)} ${r1(bx - 6.5)},${r1(t + 13)} ${r1(bx)},${r1(t + 13.5)} `
        + `C${r1(bx + 6.5)},${r1(t + 13)} ${r1(bx + 8)},${r1(t + 5)} ${r1(bx + 3)},${r1(t)}z`;
      bulbs += sh(d, c, 2);
      caps += `M${r1(p.x - 3)},${r1(p.y + 1)} L${r1(bx - 3)},${r1(t)} L${r1(bx + 3)},${r1(t)} L${r1(p.x + 3)},${r1(p.y + 1)}z `;
      bulbs += `<path d="M${r1(bx - 3)},${r1(t + 5)} q-1,3 0.6,5.5" fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity=".75"/>`;
      i++;
    }
  }
  return ln(wire, 1.8) + halos + bulbs
    + `<path d="${caps}" fill="#a58a74" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>`;
}

function paperLanterns(theme: ThemeId): string {
  const cols: Record<ThemeId, string[]> = {
    everyday: [BLUSH, MUSTARD, SKY, SAGE],
    spring: [BLUSH, CREAM, '#f9cdd6', '#e88fa3'],
    summer: ['#f39aa6', '#fbe07a', '#8fcaee', '#a9dcc9'],
    christmas: ['#d9605c', CREAM, '#7fb48f', '#d9605c'],
    halloween: ['#f39a4b', '#9a7bc4', '#f39a4b', '#f6b56b'],
  };
  const pal = cols[theme];
  const spots = [{ x: 52, cy: 42, rx: 14, ry: 12 }, { x: 140, cy: 48, rx: 12, ry: 11 }, { x: 222, cy: 40, rx: 15, ry: 13 }, { x: 310, cy: 47, rx: 13, ry: 11 }];
  let s = '';
  spots.forEach((p, i) => {
    const c = pal[i];
    const top = p.cy - p.ry, bot = p.cy + p.ry;
    s += ln(`M${p.x},0 C${p.x - 1},${r1(top * 0.4)} ${p.x + 1},${r1(top * 0.7)} ${p.x},${top - 3}`, 1.6);
    s += sh(blob(p.x, p.cy, p.rx, p.ry, i % 2 ? 0.2 : -0.2), c);
    // ribs
    s += ln(`M${p.x - p.rx * 0.5},${r1(top + 1.5)} Q${r1(p.x - p.rx * 0.95)},${p.cy} ${r1(p.x - p.rx * 0.5)},${r1(bot - 1.5)} `
      + `M${p.x},${top + 0.5} L${p.x},${bot - 0.5} M${r1(p.x + p.rx * 0.5)},${r1(top + 1.5)} Q${r1(p.x + p.rx * 0.95)},${p.cy} ${r1(p.x + p.rx * 0.5)},${r1(bot - 1.5)}`, 1.1);
    if (theme === 'halloween' && i % 2 === 0) {
      // tiny friendly pumpkin face
      s += `<path d="M${p.x - 6},${p.cy - 2} l2.2,-3 l2.2,3z M${p.x + 1.6},${p.cy - 2} l2.2,-3 l2.2,3z" fill="${EYE}"/>`
        + ln(`M${p.x - 5},${p.cy + 3} q5,4 10,0`, 1.4, EYE);
    } else {
      s += `<path d="M${r1(p.x - p.rx * 0.65)},${r1(p.cy - p.ry * 0.3)} q1,-4 4,-6" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>`;
    }
    // caps
    s += sh(box(p.x - 5, top - 3.5, 10, 4.5, 1.5, 0.4), '#a58a74', 1.8);
    s += sh(box(p.x - 4.5, bot - 1, 9, 4, 1.5, 0.4), '#a58a74', 1.8);
    // tassel
    s += ln(`M${p.x},${bot + 3} l-1,7 M${p.x},${bot + 3} l0.4,7.5 M${p.x},${bot + 3} l1.6,6.5`, 1.3, theme === 'christmas' ? '#c9a640' : INK);
  });
  return s;
}

/* ---------------- wall ---------------- */

function yarnBall(cx: number, cy: number, r: number, c: string, lean: number): string {
  return sh(blob(cx, cy, r, r * 0.95, lean), c)
    + ln(`M${r1(cx - r * 0.75)},${r1(cy - r * 0.45)} Q${r1(cx)},${r1(cy - r * 0.15)} ${r1(cx + r * 0.6)},${r1(cy - r * 0.8)} `
      + `M${r1(cx - r * 0.85)},${r1(cy + r * 0.2)} Q${r1(cx + r * 0.1)},${r1(cy + r * 0.1)} ${r1(cx + r * 0.9)},${r1(cy - r * 0.35)} `
      + `M${r1(cx - r * 0.5)},${r1(cy + r * 0.8)} Q${r1(cx + r * 0.3)},${r1(cy + r * 0.5)} ${r1(cx + r * 0.85)},${r1(cy + r * 0.3)}`, 1.1)
    + tinyFace(cx, cy + r * 0.05, r / 16);
}

function yarnShelf(theme: ThemeId): string {
  const c = theme === 'halloween' ? ['#f39a4b', '#9a7bc4', MUSTARD]
    : theme === 'christmas' ? ['#d9605c', '#7fb48f', CREAM]
      : theme === 'spring' ? [BLUSH, '#c9e4cf', CREAM]
        : theme === 'summer' ? ['#f39aa6', '#8fcaee', '#fbe07a'] : [BLUSH, SAGE, MUSTARD];
  return ''
    // brackets
    + sh(`M-21,15 L-21,24 Q-20,25 -19,24 L-12,16z`, WOOD_DK, 2)
    + sh(`M21,15 L21,24 Q20,25 19,24 L12,16z`, WOOD_DK, 2)
    // plank
    + sh(box(-29, 9, 58, 7, 2.5, 0.8), WOOD)
    // trailing strand from the left ball, over the shelf edge
    + ln(`M-12,11 C-8,18 -2,13 1,20 C3,25 -1,27 2,28`, 1.5, '#d98c8b')
    + yarnBall(-17, 0, 10, c[0], 0.2)
    + yarnBall(19, 1.5, 8.6, c[2], -0.2)
    + yarnBall(1.5, -1, 11, c[1], 0.1)
    // knitting needles poking out of the middle ball
    + ln(`M8,-6 L18,-22 M5,-8 L11,-24`, 1.8)
    + `<circle cx="18.6" cy="-23" r="2" fill="${BERRY}" stroke="${INK}" stroke-width="1.3"/><circle cx="11.4" cy="-25" r="2" fill="${BERRY}" stroke="${INK}" stroke-width="1.3"/>`;
}

function paintingLatte(theme: ThemeId): string {
  const bg = theme === 'halloween' ? '#e9d6f0' : theme === 'christmas' ? '#e4f0e6' : theme === 'spring' ? '#fde3e8' : theme === 'summer' ? '#fdf3c8' : '#dfe9f7';
  return ''
    + ln(`M-10,-23 L0,-28 L10,-23`, 1.5)
    + `<circle cx="0" cy="-28" r="1.6" fill="${INK}"/>`
    + sh(box(-26, -23, 52, 47, 4, 1.2), WOOD)
    + sh(box(-20.5, -17.5, 41, 36, 2.5, 0.8), bg, 1.8)
    // saucer
    + sh(blob(0, 12.5, 15, 3.2, 0.1), CREAM, 1.8)
    // cup body
    + sh(`M-11,-1 C-11.5,6 -8,11.5 0,11.8 C8,11.5 11.3,6 11,-1z`, CREAM, 2)
    // handle
    + ln(`M10.6,1.5 C16,0.5 16.5,7 9.6,7.4`, 2)
    + fl(`M-9,4 C-8,9 -4,10.6 0,10.7 C4,10.6 8,9 9,4z`, BLUSH, 0.6)
    // foam top + heart
    + sh(blob(0, -1, 11, 3.4, -0.1), '#d9a877', 1.8)
    + `<path d="M0,1 C-3.4,-1 -3.6,-3.6 -1.6,-3.8 C-0.6,-3.9 0,-3.2 0,-2.6 C0,-3.2 0.6,-3.9 1.6,-3.8 C3.6,-3.6 3.4,-1 0,1z" fill="${CREAM}"/>`
    // steam
    + ln(`M-4,-7 c-2,-2.5 2,-4 0,-7 M3.5,-6.5 c-2,-2.5 2,-4 0,-7`, 1.4, '#a58a74');
}

function clockCat(theme: ThemeId): string {
  const fur = theme === 'halloween' ? '#5a4a55' : theme === 'christmas' ? '#e9967a' : theme === 'spring' ? '#f7c6cf' : theme === 'summer' ? '#f9b98a' : MUSTARD;
  const inner = theme === 'halloween' ? '#9a7bc4' : BLUSH;
  const head = `M-21,-4 C-21.5,-12 -19,-18 -15,-21 L-14,-29 C-10,-27 -7,-24.5 -5,-23 C-2,-23.8 2,-23.8 5,-23 `
    + `C7,-24.5 10,-27 14.5,-28.5 L15,-21 C19.5,-17.5 21.5,-12 21.2,-4 C21,8 12,15.5 0,15.6 C-12,15.5 -21.2,8 -21,-4z`;
  return ''
    // tail pendulum (behind)
    + ln(`M2,14 C3,19 -4,21 -3,25 C-2.4,27.5 1.5,27.5 2,25.5`, 3.4)
    + ln(`M2,14 C3,19 -4,21 -3,25 C-2.4,27.5 1.5,27.5 2,25.5`, 1.6, fur)
    + sh(head, fur)
    // inner ears
    + fl(`M-13,-25 L-12.5,-20 L-8,-22.5z M13,-24.5 L12.8,-19.8 L8.2,-22.3z`, inner, 0.85)
    // dial
    + sh(blob(0, -3, 14.5, 13.5, 0.1), CREAM, 1.8)
    // hour marks
    + ln(`M0,-14.5 L0,-12.5 M12,-3 L10,-3 M0,8.5 L0,6.5 M-12,-3 L-10,-3`, 1.5)
    // hands: 3 o'clock (minute up, hour right)
    + ln(`M0,-3 L0,-12 M0,-3 L7.5,-3`, 2)
    + `<circle cx="0" cy="-3" r="1.7" fill="${BERRY}" stroke="${INK}" stroke-width="1.2"/>`
    // whiskers + cheeks outside the dial
    + ln(`M-15,0 L-24,-1.5 M-15,3 L-23.5,4.5 M15,0 L24,-1.5 M15,3 L23.5,4.5`, 1.2)
    + `<circle cx="-17" cy="8" r="2" fill="${BLUSH}" opacity=".8"/><circle cx="17" cy="8" r="2" fill="${BLUSH}" opacity=".8"/>`
    // sleepy happy eyes peeking above the dial
    + ln(`M-9,-18.5 q2,-1.8 4,0 M5,-18.5 q2,-1.8 4,0`, 1.3, EYE)
    + (theme === 'christmas' ? sh(`M-6,15 Q0,18.5 6,15 L5,18 Q0,20.5 -5,18z`, '#7fb48f', 1.6) : '')
    // summer: a tiny sunflower tucked behind one ear
    + (theme === 'summer' ? sh(`M14,-26 q3,-2.4 4.4,0.6 q2.6,1.8 -0.4,3.8 q-0.4,3 -3.4,1.6 q-3,0.8 -2.8,-2.4 q-1.6,-2.8 2.2,-3.6z`, '#f9c846', 1.2) + `<circle cx="15.6" cy="-23.6" r="1.4" fill="#9a6a4a"/>` : '');
}

export function decorA(id: DecorId, theme: ThemeId): string {
  switch (id) {
    case 'bunting': return bunting(theme);
    case 'string_lights': return stringLights(theme);
    case 'paper_lanterns': return paperLanterns(theme);
    case 'yarn_shelf': return yarnShelf(theme);
    case 'painting_latte': return paintingLatte(theme);
    case 'clock_cat': return clockCat(theme);
    default: return '';
  }
}
