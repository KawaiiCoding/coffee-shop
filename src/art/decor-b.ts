/* Decor B: back-wall furniture, corner items and floor rugs.
   All coordinates are relative to the slot anchor (see DECOR_ANCHOR). */
import type { DecorId, ThemeId } from '../types';
import { INK, EYE, CREAM, fl, ln, sh, blob, box, shadow, tinyFace } from './kit';

const BLUSH = '#f4a9a8', SAGE = '#8fc3a7', MUSTARD = '#f6cf6b', SKY = '#9dbbe6';
const BERRY = '#e2607a', WOOD = '#c98d63', WOOD_D = '#a8714d', BRASS = '#e8b85a', GREY = '#b9b4b8';

const dot = (x: number, y: number, r: number, fill: string) =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`;

/** Music note (filled head + stem + flag). */
const note = (x: number, y: number, fill: string) =>
  sh(blob(x, y, 3.4, 2.6, 0.2), fill, 1.8) + ln(`M${x + 3},${y - 0.5} L${x + 3},${y - 11} q4,2 5,6`, 1.8);

const santaHat = (x: number, y: number, s = 1) =>
  sh(`M${x - 7 * s},${y} C${x - 5 * s},${y - 8 * s} ${x + 2 * s},${y - 12 * s} ${x + 9 * s},${y - 9 * s} C${x + 6 * s},${y - 6 * s} ${x + 6 * s},${y - 3 * s} ${x + 7 * s},${y}z`, BERRY, 1.8)
  + sh(box(x - 8 * s, y - 1.5 * s, 16 * s, 4 * s, 2, 0.4), CREAM, 1.6)
  + sh(blob(x + 10 * s, y - 9 * s, 2.4 * s, 2.4 * s), CREAM, 1.6);

const pumpkin = (x: number, y: number) =>
  sh(blob(x, y, 5.5, 4.4, 0.2), '#f2a65a', 1.8) + ln(`M${x},${y - 4} q0,4 0,8`, 1.2) + ln(`M${x},${y - 4.2} q1,-2 2.5,-2.6`, 1.6, '#7a9a5a');

/** Tiny scallop sea shell. */
const seaShell = (x: number, y: number) =>
  sh(`M${x - 4},${y + 2} C${x - 5},${y - 3} ${x - 2},${y - 5} ${x},${y - 5} C${x + 2},${y - 5} ${x + 5},${y - 3} ${x + 4},${y + 2}z`, '#fbd3c4', 1.4)
  + ln(`M${x},${y + 1.6} L${x},${y - 4} M${x - 2},${y + 1.6} L${x - 2.4},${y - 3} M${x + 2},${y + 1.6} L${x + 2.4},${y - 3}`, 0.9);

/** Little watermelon slice (point up). */
const melon = (x: number, y: number) =>
  sh(`M${x},${y - 7} L${x - 6},${y + 1} C${x - 3},${y + 3.5} ${x + 3},${y + 3.5} ${x + 6},${y + 1}z`, '#7fc48e', 1.5)
  + fl(`M${x},${y - 5.6} L${x - 4.6},${y + 0.6} C${x - 2.4},${y + 2.2} ${x + 2.4},${y + 2.2} ${x + 4.6},${y + 0.6}z`, '#f27f8f')
  + dot(x - 1.4, y - 1, 0.7, '#4a332b') + dot(x + 1.4, y - 0.4, 0.7, '#4a332b');

const petal = (x: number, y: number, fill: string) =>
  fl(`M${x},${y} q3,-3 6,0 q-3,3 -6,0z`, fill, 0.9);

/* ------------------------------ back slot ------------------------------ */

function recordPlayer(): string {
  let s = shadow(0, 0, 36, 4);
  // little feet
  s += sh(box(-29, -8, 7, 8, 2, 0.4), WOOD_D, 2) + sh(box(22, -8, 7, 8, 2, 0.4), WOOD_D, 2);
  // cabinet
  s += sh(box(-33, -46, 66, 40, 7, 1.2), WOOD);
  s += sh(box(-26, -38, 23, 24, 4, 0.6), '#dba57c', 1.8) + sh(box(3, -38, 23, 24, 4, 0.6), '#dba57c', 1.8);
  s += dot(-6, -26, 1.8, INK) + dot(6, -26, 1.8, INK);
  // little heart on left door
  s += sh('M-14.5,-29 c-3,-3 -6,-0.5 -3.5,2.2 l3.5,3 l3.5,-3 c2.5,-2.7 -0.5,-5.2 -3.5,-2.2z', BLUSH, 1.4);
  // knitted stripe on right door
  s += ln('M8,-30 q3,-2 6,0 q3,2 6,0', 1.4, BERRY);
  // top slab
  s += sh(box(-36, -52, 72, 8, 3, 0.6), WOOD_D);
  // platter + vinyl
  s += sh(blob(-8, -55, 21, 5, 0.1), SAGE, 2);
  s += sh(blob(-8, -56.5, 17, 3.8, 0.1), SKY, 1.8);
  s += ln('M-20,-56.5 q12,-3.2 24,0', 1, '#ffffff');
  s += sh(blob(-8, -56.6, 4.5, 1.4), MUSTARD, 1.2);
  // tone arm
  s += sh(blob(20, -55, 4, 2.4), BRASS, 1.6) + ln('M20,-56 q-6,-4 -14,-1.6', 1.8);
  // brass horn: neck rises from the back, bell opens up-left
  s += ln('M26,-52 C27,-62 22,-68 16,-72', 3.4);
  s += ln('M26,-52 C27,-62 22,-68 16,-72', 1.6, BRASS);
  s += sh('M18,-70 C10,-74 2,-80 -6,-90 C-2,-96 10,-95 15,-90 C14,-84 17,-77 21,-73z', BRASS);
  s += sh(blob(4.5, -92.5, 10, 3.6, -0.3), '#f7dc94', 2);
  s += fl(blob(4.5, -92, 6, 1.8), WOOD_D, 0.5);
  s += ln('M11,-84 C10,-80 13,-76 17,-73', 1.2, '#fff6ea');
  // floating notes are animated separately by musicNotes()
  return s;
}

/** Animated notes drifting out of the record player's horn, relative to the back-slot anchor.
 *  playing=false shows one sleepy grey note with a slash (tap to turn music back on). */
export function musicNotes(time: number, playing: boolean): string {
  const bx = 4.5, by = -96;
  if (!playing) {
    const y = by - 6 + Math.sin(time * 1.5) * 2;
    return `<g opacity=".75">${note(bx + 2, y, '#d8cfc6')}${ln(`M${bx - 5},${y - 12} L${bx + 12},${y + 4}`, 2.2, BERRY)}</g>`;
  }
  const cols = [BLUSH, SAGE, MUSTARD, SKY, BERRY];
  let s = '';
  for (let i = 0; i < 5; i++) {
    const t = (time * 0.32 + i / 5) % 1;
    const side = i % 2 ? 1 : -1;
    const x = bx + side * (6 + t * 26) + Math.sin(t * Math.PI * 3 + i) * 7;
    const y = by - t * 78;
    const op = t < 0.15 ? t / 0.15 : t > 0.6 ? Math.max(0, (1 - t) / 0.4) : 1;
    const rot = Math.sin(time * 3 + i * 1.7) * 14;
    const sc = 0.7 + t * 0.45;
    s += `<g opacity="${op.toFixed(2)}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(1)}) scale(${sc.toFixed(2)})">${note(0, 0, cols[i])}</g>`;
  }
  return s;
}

function bookshelf(theme: ThemeId): string {
  let s = shadow(0, 0, 32, 4);
  s += sh(box(-30, -92, 60, 88, 6, 1.2), WOOD);
  s += fl(box(-25, -86, 50, 78, 3, 0.6), WOOD_D, 0.55);
  // shelves
  s += sh(box(-27, -62, 54, 4, 2, 0.4), WOOD, 1.8) + sh(box(-27, -35, 54, 4, 2, 0.4), WOOD, 1.8);
  s += sh(box(-26, -8, 7, 8, 2, 0.4), WOOD_D, 1.8) + sh(box(19, -8, 7, 8, 2, 0.4), WOOD_D, 1.8);
  // top row books + yarn ball
  s += sh(box(-23, -82, 7, 20, 2, 0.4), BLUSH, 1.8) + sh(box(-15, -78, 6, 16, 2, 0.4), SKY, 1.8)
    + sh('M-8,-62 l4,-17 l6,1.5 l-4,15.5z', MUSTARD, 1.8);
  s += sh(blob(13, -70, 8, 8), SAGE, 2) + ln('M6,-73 q7,4 14,-1', 1.2) + ln('M8,-66 q6,-9 11,-10', 1.2)
    + ln('M21,-66 q3,3 1,4', 1.4);
  // middle row
  s += sh(box(-23, -55, 9, 20, 2, 0.4), BERRY, 1.8) + sh(box(-13, -52, 6, 17, 2, 0.4), CREAM, 1.8)
    + sh(box(-6, -55, 8, 20, 2, 0.4), SAGE, 1.8) + sh(box(3, -50, 6, 15, 2, 0.4), SKY, 1.8);
  s += sh(box(11, -43, 14, 8, 2, 0.4), MUSTARD, 1.8);
  // bottom row
  s += sh(box(-23, -27, 12, 19, 2, 0.4), SKY, 1.8) + sh(box(-10, -24, 7, 16, 2, 0.4), BLUSH, 1.8);
  s += sh(box(2, -18, 22, 10, 3, 0.4), '#e9d3b8', 1.8) + sh(box(4, -26, 18, 8, 3, 0.4), SAGE, 1.8);
  // little spine stripes
  s += ln('M-21,-76 h3', 1.2) + ln('M-21,-49 h5', 1.2) + ln('M-20,-21 h6', 1.2);
  if (theme === 'christmas') s += santaHat(13, -77, 0.7);
  if (theme === 'halloween') s += pumpkin(-20, -97);
  if (theme === 'spring') s += sh(blob(-18, -96, 3, 3), BLUSH, 1.4) + dot(-18, -96, 1, MUSTARD);
  if (theme === 'summer') s += seaShell(-18, -94);
  return s;
}

function piano(): string {
  let s = shadow(0, 0, 40, 4);
  // legs
  s += sh(box(-34, -14, 6, 14, 2, 0.4), WOOD_D, 2) + sh(box(28, -14, 6, 14, 2, 0.4), WOOD_D, 2);
  // body
  s += sh(box(-38, -74, 76, 62, 7, 1.2), WOOD);
  s += sh(box(-41, -78, 82, 7, 3, 0.6), WOOD_D);
  // front panel
  s += fl(box(-31, -66, 62, 24, 4, 0.6), '#dba57c');
  s += ln('M-31,-42 h62', 1.4);
  // keybed
  s += sh(box(-37, -42, 74, 13, 3, 0.6), CREAM, 2);
  for (let i = 0; i < 9; i++) s += ln(`M${-29 + i * 7.3},-41 v11`, 1, '#c9b49f');
  for (const x of [-30, -23, -9, -2, 5, 19, 26]) s += fl(box(x, -42, 3.4, 7, 1, 0), EYE);
  // music stand + sheet
  s += sh('M-14,-50 l2,-20 h24 l2,20z', CREAM, 2);
  s += ln('M-9,-63 h18', 1) + ln('M-9,-58 h18', 1) + ln('M-10,-53 h20', 1);
  s += dot(-4, -64, 1.6, INK) + dot(4, -59, 1.6, INK);
  // pedals + heart
  s += dot(-4, -6, 2, BRASS) + dot(4, -6, 2, BRASS);
  s += sh('M0,-20 c-3,-3 -6,-0.5 -3.5,2.2 l3.5,3 l3.5,-3 c2.5,-2.7 -0.5,-5.2 -3.5,-2.2z', BLUSH, 1.4);
  s += note(32, -82, SAGE);
  return s;
}

function catBed(theme: ThemeId): string {
  let s = shadow(0, 0, 40, 5);
  // knitted bed base + rim
  s += sh(blob(0, -12, 39, 12, 0.1), BLUSH);
  for (const x of [-26, -14, 0, 14, 26]) s += ln(`M${x - 2},-18 l2,4 l2,-4 M${x - 2},-10 l2,4 l2,-4`, 1.2, BERRY);
  // cushion inside
  s += sh(blob(0, -22, 32, 7, 0.1), CREAM, 2);
  // curled cat body
  s += sh('M-22,-22 C-26,-36 -8,-44 8,-41 C22,-38 28,-28 24,-20 C14,-15 -12,-15 -22,-22z', GREY);
  s += ln('M0,-40 q3,5 0,10', 1.3, '#8e888c') + ln('M8,-39 q3,5 0,10', 1.3, '#8e888c');
  // tail wrapping the front
  s += sh('M24,-21 C20,-14 -6,-13 -14,-17 C-16,-19 -12,-21 -8,-20 C2,-18 16,-19 22,-24z', '#a9a3a8', 2);
  // head
  s += sh('M-28,-26 C-31,-34 -26,-41 -19,-40 L-21,-48 L-14,-42 C-11,-43 -8,-43 -5,-42 L0,-48 L0,-38 C3,-33 0,-25 -8,-23 C-15,-21 -25,-21 -28,-26z', GREY);
  s += fl('M-18.5,-42 l-1,-4 l3,2.5z', BLUSH) + fl('M-2.5,-41 l0.8,-4 l-3,2.5z', BLUSH);
  // sleepy face
  s += ln('M-22,-31 q2,2 4,0', 1.4, EYE) + ln('M-11,-31 q2,2 4,0', 1.4, EYE);
  s += ln('M-16,-27 q1,1 2,0', 1.1, EYE);
  s += dot(-24, -27.5, 1.7, BLUSH) + dot(-5, -27.5, 1.7, BLUSH);
  // z z
  s += ln('M6,-56 h5 l-5,6 h5', 1.8) + ln('M15,-66 h4 l-4,4.5 h4', 1.5);
  if (theme === 'christmas') s += santaHat(-14, -43, 0.9);
  if (theme === 'spring') s += sh(blob(-3, -44, 2.6, 2.6), MUSTARD, 1.3) + dot(-3, -44, 1, BERRY);
  if (theme === 'halloween') s += pumpkin(32, -6);
  if (theme === 'summer') s += melon(32, -5);
  return s;
}

/* ------------------------------ corner slot ---------------------------- */

function plant(theme: ThemeId): string {
  let s = shadow(0, 0, 16, 3);
  // leaves
  s += sh('M0,-28 C-4,-44 -16,-50 -18,-62 C-8,-62 -2,-48 0,-30z', SAGE, 2);
  s += sh('M0,-28 C3,-46 14,-52 16,-66 C6,-64 0,-50 0,-30z', '#7db596', 2);
  s += sh('M0,-28 C-1,-50 -4,-64 1,-78 C6,-66 4,-48 1,-30z', SAGE, 2);
  s += sh('M-1,-30 C-8,-34 -17,-34 -19,-42 C-11,-44 -5,-38 -1,-31z', '#7db596', 2);
  s += sh('M1,-30 C8,-34 16,-36 19,-44 C11,-46 5,-39 1,-31z', SAGE, 2);
  s += ln('M-12,-55 q-3,-2 -4,-4', 1.1) + ln('M10,-58 q3,-2 4,-5', 1.1);
  // smiling pot
  s += sh('M-14,-28 h28 l-3,26 C6,0 -6,0 -11,-2z', WOOD);
  s += sh(box(-16, -31, 32, 6, 2, 0.4), '#dba57c', 2);
  s += tinyFace(0, -15, 0.9);
  if (theme === 'halloween') s += pumpkin(15, -4);
  if (theme === 'spring') s += sh(blob(-17, -62, 3, 3), BLUSH, 1.4) + dot(-17, -62, 1, MUSTARD);
  if (theme === 'christmas') s += sh(blob(16, -66, 2.6, 2.6), BERRY, 1.4) + sh(blob(1, -78, 2.4, 2.4), MUSTARD, 1.3);
  if (theme === 'summer') s += sh(blob(-17, -62, 3.4, 3.4), '#f9c846', 1.4) + dot(-17, -62, 1.3, '#9a6a4a');
  return s;
}

function lamp(theme: ThemeId): string {
  let s = `<circle cx="0" cy="-58" r="20" fill="${MUSTARD}" opacity=".22"/><circle cx="0" cy="-56" r="13" fill="#ffe7a8" opacity=".35"/>`;
  s += shadow(0, 0, 14, 3);
  s += sh(blob(0, -3, 12, 3.4), WOOD_D, 2);
  s += ln('M0,-4 L0,-60', 4.2) + ln('M0,-5 L0,-60', 2, WOOD);
  s += ln('M-2,-34 q2,2 4,0', 1.2, BERRY);
  // glowing bulb under shade
  s += sh(blob(0, -58, 4, 3.6), '#fff1c2', 1.6);
  // scalloped shade
  const shade = theme === 'christmas' ? SAGE : theme === 'halloween' ? '#f2a65a' : theme === 'summer' ? '#8fcaee' : BLUSH;
  s += sh('M-9,-79 C-4,-81 4,-81 9,-79 L17,-63 q-2.8,3.4 -5.7,0 q-2.8,3.4 -5.7,0 q-2.8,3.4 -5.6,0 q-2.8,3.4 -5.6,0 q-2.8,3.4 -5.7,0 q-2.8,3.4 -5.7,0z', shade);
  s += dot(-6, -70, 1.4, CREAM) + dot(0, -72, 1.4, CREAM) + dot(6, -70, 1.4, CREAM);
  s += ln('M-12,-66 q12,2 24,0', 1.1, '#ffffff');
  return s;
}

function flowerVase(theme: ThemeId): string {
  let s = shadow(0, 0, 18, 3);
  // little table
  s += ln('M-12,-34 L-14,-1', 3.6) + ln('M12,-34 L14,-1', 3.6);
  s += ln('M-12,-34 L-14,-1', 1.6, WOOD) + ln('M12,-34 L14,-1', 1.6, WOOD);
  s += ln('M-13,-14 h26', 2);
  s += sh(blob(0, -36, 19, 4, 0.1), WOOD, 2);
  // vase
  s += sh('M-5,-56 h10 C5,-52 10,-48 10,-44 C10,-39 6,-38 0,-38 C-6,-38 -10,-39 -10,-44 C-10,-48 -5,-52 -5,-56z', SKY, 2);
  s += ln('M-7,-46 q7,3 14,0', 1.2, CREAM);
  // stems
  s += ln('M0,-56 L-8,-68 M0,-56 L1,-74 M0,-56 L9,-66', 1.6, '#6f9d80');
  s += sh('M-3,-62 q-6,-3 -8,0 q4,4 8,0z', SAGE, 1.4);
  // flowers
  const p = theme === 'halloween' ? ['#f2a65a', '#b79ad6', MUSTARD] : theme === 'christmas' ? [BERRY, CREAM, BERRY]
    : theme === 'summer' ? ['#f9c846', '#f9c846', '#8fcaee'] : [BLUSH, MUSTARD, BERRY];
  s += sh(blob(-9, -69, 4.4, 4, 0.2), p[0], 1.8) + dot(-9, -69, 1.4, MUSTARD);
  s += sh(blob(1, -75, 4.6, 4.2, -0.2), p[1], 1.8) + dot(1, -75, 1.4, '#e89a5a');
  s += sh(blob(10, -67, 4, 3.8), p[2], 1.8) + dot(10, -67, 1.3, CREAM);
  if (theme === 'spring') s += petal(-16, -40, BLUSH) + petal(11, -42, BLUSH);
  return s;
}

/* -------------------------------- rugs --------------------------------- */

function roundRug(theme: ThemeId): string {
  const c = theme === 'christmas' ? [BERRY, CREAM, SAGE, BERRY]
    : theme === 'halloween' ? ['#f2a65a', '#b79ad6', MUSTARD, '#f2a65a']
      : theme === 'summer' ? ['#8fcaee', CREAM, '#f39aa6', '#fbe07a'] : [SAGE, CREAM, BLUSH, MUSTARD];
  let s = shadow(0, 2, 58, 21, 0.12);
  s += sh(blob(0, 0, 57, 21, 0.1), c[0]);
  s += sh(blob(0, 0, 44, 16, -0.1), c[1], 2);
  s += sh(blob(0, 0, 30, 11, 0.1), c[2], 2);
  s += sh(blob(0, 0, 15, 5.5, -0.1), c[3], 1.8);
  // crochet stitch dashes on rings
  s += `<ellipse cx="0" cy="0" rx="50.5" ry="18.5" fill="none" stroke="${INK}" stroke-width="1.1" stroke-dasharray="2 4" opacity=".55"/>`;
  s += `<ellipse cx="0" cy="0" rx="37" ry="13.5" fill="none" stroke="${INK}" stroke-width="1.1" stroke-dasharray="2 4" opacity=".55"/>`;
  s += `<ellipse cx="0" cy="0" rx="22.5" ry="8.2" fill="none" stroke="${INK}" stroke-width="1" stroke-dasharray="2 3.5" opacity=".55"/>`;
  if (theme === 'spring') s += petal(-38, -6, BLUSH) + petal(30, 8, BLUSH) + petal(8, -14, '#ffffff');
  return s;
}

function heartRug(theme: ThemeId): string {
  const main = theme === 'halloween' ? '#b79ad6' : theme === 'christmas' ? BERRY : theme === 'summer' ? '#f39aa6' : BLUSH;
  const heart = (sx: number, sy: number) => {
    const r = (n: number) => +n.toFixed(1);
    return `M0,${r(-10 * sy)} C${r(-8 * sx)},${r(-24 * sy)} ${r(-56 * sx)},${r(-24 * sy)} ${r(-56 * sx)},${r(-6 * sy)} `
      + `C${r(-56 * sx)},${r(8 * sy)} ${r(-24 * sx)},${r(16 * sy)} 0,${r(22 * sy)} `
      + `C${r(24 * sx)},${r(16 * sy)} ${r(56 * sx)},${r(8 * sy)} ${r(56 * sx)},${r(-6 * sy)} `
      + `C${r(56 * sx)},${r(-24 * sy)} ${r(8 * sx)},${r(-24 * sy)} 0,${r(-10 * sy)}z`;
  };
  let s = `<path d="${heart(1, 1)}" fill="${INK}" opacity=".12" transform="translate(0,3)"/>`;
  s += sh(heart(1, 1), main);
  s += sh(heart(0.74, 0.72), CREAM, 2);
  s += sh(heart(0.46, 0.44), theme === 'christmas' ? SAGE : theme === 'summer' ? '#a9dcc9' : main, 1.8);
  s += `<path d="${heart(0.87, 0.86)}" fill="none" stroke="${INK}" stroke-width="1.1" stroke-dasharray="2 4" opacity=".55"/>`;
  s += `<path d="${heart(0.6, 0.58)}" fill="none" stroke="${INK}" stroke-width="1" stroke-dasharray="2 3.5" opacity=".55"/>`;
  if (theme === 'spring') s += petal(-44, 8, '#ffffff') + petal(38, -12, SAGE);
  return s;
}

function stripeRug(theme: ThemeId): string {
  const c = theme === 'christmas' ? [BERRY, CREAM, SAGE] : theme === 'halloween' ? ['#f2a65a', '#b79ad6', CREAM]
    : theme === 'summer' ? ['#8fcaee', CREAM, '#a9dcc9'] : [SKY, CREAM, BLUSH];
  let s = shadow(0, 3, 52, 17, 0.12);
  // tassels
  for (let i = 0; i < 6; i++) {
    const y = -13 + i * 5.4;
    s += ln(`M-50,${y} l-6,${(i - 2.5) * 0.4}`, 1.6) + ln(`M50,${y} l6,${(i - 2.5) * 0.4}`, 1.6);
  }
  s += fl(box(-50, -17, 100, 34, 9, 1.4), c[0]);
  // stripes (vertical bands across the rug)
  const bands = [c[1], MUSTARD, c[2], c[1]];
  bands.forEach((col, i) => { s += fl(box(-36 + i * 20, -16, 12, 32, 2, 0.6), col); });
  s += ln(box(-50, -17, 100, 34, 9, 1.4));
  bands.forEach((_, i) => { const x = -34.7 + i * 20; s += ln(`M${x},-16 q1,16 0,33 M${x + 12},-16 q-1,16 0,33`, 1, '#8e6a58'); });
  s += ln('M-44,-11 q44,-3 88,0', 1, '#ffffff');
  if (theme === 'spring') s += petal(-26, 4, BLUSH) + petal(20, -8, '#ffffff');
  return s;
}

export function decorB(id: DecorId, theme: ThemeId): string {
  switch (id) {
    case 'record_player': return recordPlayer();
    case 'bookshelf': return bookshelf(theme);
    case 'piano': return piano();
    case 'cat_bed': return catBed(theme);
    case 'plant': return plant(theme);
    case 'lamp': return lamp(theme);
    case 'flower_vase': return flowerVase(theme);
    case 'round_rug': return roundRug(theme);
    case 'heart_rug': return heartRug(theme);
    case 'stripe_rug': return stripeRug(theme);
    default: return '';
  }
}
