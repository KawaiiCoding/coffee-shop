/* =====================================================================
   UI ICONS — small standalone <svg> icons for buttons / HUD (viewBox 32).
   Cozy hand-drawn style: soft brown ink, round caps, offset pastel fills.
   ===================================================================== */
import { INK, CREAM, fl, ln, sh, blob, box, standalone } from './kit';

export type IconName = 'coin' | 'pause' | 'play' | 'music' | 'music_off' | 'sound' | 'sound_off'
  | 'cafe' | 'shop' | 'decor' | 'settings' | 'star' | 'star_empty' | 'heart' | 'close' | 'check' | 'lock' | 'calendar'
  | 'purse' | 'energy' | 'smile' | 'home' | 'moon' | 'pot' | 'bath' | 'phone' | 'book' | 'jar' | 'broom' | 'bike';

const BLUSH = '#f4a9a8';
const SAGE = '#8fc3a7';
const MUSTARD = '#f6cf6b';
const SKY = '#9dbbe6';
const BERRY = '#e2607a';
const GOLD = '#f0c34a';
const WOOD = '#c98d63';
const GLASS = '#e3f2fb';
const EYE = '#4a332b';
const W = 2.2;

const r = (n: number) => +n.toFixed(2);
const pol = (cx: number, cy: number, rad: number, deg: number): [number, number] => {
  const a = (deg * Math.PI) / 180;
  return [r(cx + Math.cos(a) * rad), r(cy + Math.sin(a) * rad)];
};

/** Thick pastel stroke nudged off the ink line, then the ink line on top. */
const offLine = (d: string, color: string, w = 2.8) =>
  `<g transform="translate(1.1,1)">${ln(d, w + 2.4, color)}</g>` + ln(d, w);

/** Heart path centred at (cx, cy); s = 1 is about 22 units wide. */
function heartPath(cx: number, cy: number, s: number): string {
  const p = (x: number, y: number) => `${r(cx + x * s)},${r(cy + y * s)}`;
  return `M${p(0, 10.5)} C${p(-10, 4)} ${p(-12.5, -1.5)} ${p(-11, -5.5)} C${p(-9.5, -10)} ${p(-3.5, -11)} ${p(0, -5.5)} `
    + `C${p(3.5, -11)} ${p(9.5, -10)} ${p(11, -5.5)} C${p(12.5, -1.5)} ${p(10, 4)} ${p(0, 10.5)}z`;
}

/** Five-point star with softly rounded tips. */
function starPath(cx: number, cy: number, R: number, ri: number): string {
  const tips = [0, 1, 2, 3, 4].map((k) => pol(cx, cy, R, -90 + 72 * k));
  const ins = [0, 1, 2, 3, 4].map((k) => pol(cx, cy, ri, -90 + 36 + 72 * k));
  const lerp = (a: [number, number], b: [number, number], t: number) =>
    `${r(a[0] + (b[0] - a[0]) * t)},${r(a[1] + (b[1] - a[1]) * t)}`;
  let d = `M${ins[4][0]},${ins[4][1]}`;
  for (let k = 0; k < 5; k++) {
    const prev = k === 0 ? ins[4] : ins[k - 1];
    d += ` L${lerp(prev, tips[k], 0.8)} Q${tips[k][0]},${tips[k][1]} ${lerp(tips[k], ins[k], 0.2)} L${ins[k][0]},${ins[k][1]}`;
  }
  return d + 'z';
}

/** Rounded 8-tooth gear outline. */
function gearPath(cx: number, cy: number, R: number, ri: number): string {
  let d = '';
  for (let i = 0; i < 8; i++) {
    const a = i * 45;
    const b0 = pol(cx, cy, ri, a - 17), t0 = pol(cx, cy, R, a - 10);
    const tc = pol(cx, cy, R + 0.9, a), t1 = pol(cx, cy, R, a + 10);
    const b1 = pol(cx, cy, ri, a + 17), vc = pol(cx, cy, ri * 1.035, a + 22.5);
    const nb = pol(cx, cy, ri, a + 28);
    d += `${i === 0 ? 'M' : 'L'}${b0[0]},${b0[1]} L${t0[0]},${t0[1]} Q${tc[0]},${tc[1]} ${t1[0]},${t1[1]} L${b1[0]},${b1[1]} Q${vc[0]},${vc[1]} ${nb[0]},${nb[1]} `;
  }
  return d + 'z';
}

const shine = (d: string) => ln(d, 1.6, '#ffffff');

const note = () =>
  sh(blob(11.5, 23, 5, 3.9, -0.3), SKY, W)
  + ln('M16.3,22.3 V6.5', W)
  + ln('M16.3,6.5 C17.2,10 20.5,10.6 22.6,11.8 C24.2,12.8 24.4,14.8 23.4,16.4', W);

const speaker = () =>
  sh('M5,13 Q5,11.6 6.4,11.6 H10 L15.6,6.8 Q17.6,5.4 17.6,7.9 V24.1 Q17.6,26.6 15.6,25.2 L10,20.4 H6.4 Q5,20.4 5,19 Z', MUSTARD, W);

const slash = () => ln('M6,6 L26,26', 5.4, CREAM) + ln('M6,6 L26,26', 2.6);

const ICONS: Record<IconName, () => string> = {
  coin: () =>
    sh(blob(16, 16, 12, 11.6, 0.2), GOLD, W)
    + ln(blob(16, 16, 8.4, 8.1, -0.2), 1.3, '#c9952e')
    + sh(blob(16, 16, 3.6, 5.1, 0.1), '#c98f3a', 1.6)
    + ln('M16.4,11.6 C14.8,14.4 17.6,17.4 15.8,20.4', 1.3)
    + shine('M8.6,12 C9.3,9.8 10.8,8.4 12.6,7.7'),

  pause: () => sh(box(8, 6.5, 5.6, 19, 2.6, 0.8), BLUSH, W) + sh(box(18.4, 6.5, 5.6, 19, 2.6, 0.8), BLUSH, W),

  play: () =>
    sh('M9.5,8 C9.5,6 11.2,5.3 12.8,6.3 L24.6,14 C26,15 26,17 24.6,18 L12.8,25.7 C11.2,26.7 9.5,26 9.5,24 C9.2,18.7 9.8,13.3 9.5,8 Z', SAGE, W),

  music: note,
  music_off: () => note() + slash(),

  sound: () => speaker() + ln('M21.2,12.2 C22.8,14.6 22.8,17.4 21.2,19.8', W) + ln('M24.6,8.8 C28,13.2 28,18.8 24.6,23.2', W),
  sound_off: () => speaker() + ln('M21.4,12.6 L27.4,19.4', W) + ln('M27.4,12.6 L21.4,19.4', W),

  cafe: () =>
    ln('M4.5,27.2 C10.5,29.4 19,29.4 25,27.2', W)
    + ln('M21.6,14.8 C26.6,13.8 27.4,20.6 21,21.4', W)
    + sh('M5.8,13 C11,12.4 17,13.4 22.4,13 C22.6,20.4 20,26 14.1,26 C8.2,26 5.6,20.4 5.8,13 Z', BLUSH, W)
    + fl(heartPath(14.1, 19, 0.26), CREAM)
    + ln('M10.6,9.6 C9.4,8.2 11.8,6.8 10.6,4.6', 1.6)
    + ln('M15.6,9.6 C14.4,8.2 16.8,6.8 15.6,4.6', 1.6),

  shop: () =>
    ln('M11.5,11.5 V9.2 C11.5,3.4 20.5,3.4 20.5,9.2 V11.5', W)
    + sh('M6.8,11.2 C13,10.8 19,11.6 25.2,11.2 L26.6,25.6 Q26.8,27.6 24.8,27.6 C19,28 13,27.3 7.2,27.6 Q5.2,27.6 5.4,25.6 Z', SAGE, W)
    + ln('M16,24.2 V15.6', 2.4) + ln('M12.4,19 L16,15.4 L19.6,19', 2.4)
    + sh('M26.4,1.8 Q27,5 29.8,5.6 Q27,6.2 26.4,9.4 Q25.8,6.2 23,5.6 Q25.8,5 26.4,1.8 Z', GOLD, 1.3),

  decor: () =>
    ln('M10.5,7 L16,2.8 L21.5,7', 1.6)
    + sh(box(4.5, 6.5, 23, 20.5, 3.4, 1), MUSTARD, W)
    + sh(box(8.6, 10.5, 14.8, 12.5, 1.6, 0.6), CREAM, 1.6)
    + sh(heartPath(16, 16.4, 0.36), BERRY, 1.5),

  settings: () =>
    sh(gearPath(16, 16, 13, 9.6), SKY, W)
    + sh(blob(16, 16, 4, 3.9, 0.2), CREAM, W),

  star: () => sh(starPath(16, 17, 13.4, 6.4), GOLD, W) + shine('M11.4,13.6 L13.6,13.4'),
  star_empty: () => sh(starPath(16, 17, 13.4, 6.4), '#f7ecdc', W),

  heart: () => sh(heartPath(15.6, 16, 1.08), BERRY, W) + shine('M7.8,12.8 C8.2,10.6 9.6,9.4 11.6,9.2'),

  close: () => offLine('M9,9 L23,23', BLUSH, 3) + offLine('M23,9 L9,23', BLUSH, 3),
  check: () => offLine('M7,16.8 L13,22.8 L25,9.2', SAGE, 3),

  lock: () =>
    ln('M10.8,14.4 V10.6 C10.8,3.8 21.2,3.8 21.2,10.6 V14.4', W + 0.4)
    + sh(box(6.5, 14, 19, 14, 3.6, 0.8), MUSTARD, W)
    + `<circle cx="16" cy="19.8" r="2" fill="${INK}"/>` + ln('M16,21 V24', 2),

  calendar: () => {
    const body = box(5, 7.5, 22, 20, 3.6, 0.8);
    const dot = (x: number, y: number) => `<circle cx="${x}" cy="${y}" r="1.3" fill="${INK}"/>`;
    return fl(body, CREAM)
      + fl('M5.2,13.2 V10.8 Q5.2,7.8 8.4,7.8 H23.6 Q26.8,7.8 26.8,10.8 V13.2 Z', BLUSH)
      + ln(body, W) + ln('M5.4,13.4 C12,13 20,13.8 26.6,13.3', 1.8)
      + ln('M11,4.6 V9.8', W) + ln('M21,4.6 V9.8', W)
      + dot(10.8, 18) + dot(16, 18) + dot(21.2, 18) + dot(10.8, 22.8) + dot(16, 22.8)
      + sh(heartPath(21.2, 22.6, 0.2), BERRY, 1);
  },

  purse: () =>
    sh('M6,15.4 C5.6,11.8 9,10.6 16,10.6 C23,10.6 26.4,11.8 26,15.4 C27,21.6 25.4,27.4 16,27.4 C6.6,27.4 5,21.6 6,15.4z', BLUSH, W)
    + ln('M14.2,9.6 V11 M17.8,9.6 V11', 1.6)
    + sh(blob(14.1, 7.7, 2, 2), GOLD, 1.5) + sh(blob(17.9, 7.7, 2, 2), GOLD, 1.5)
    + sh(box(7, 10.4, 18, 3.6, 1.6, 0.3), GOLD, 1.8)
    + sh(heartPath(16, 20, 0.3), CREAM, 1.3)
    + shine('M8.6,17.2 C8.8,15.8 9.4,15 10.4,14.6'),

  energy: () =>
    sh('M18.5,3.5 L8.5,17.5 C8,18.3 8.5,19 9.4,19 H14.6 L12.4,28 C12.2,29 13.2,29.4 13.8,28.6 L23.6,14.6 C24.1,13.8 23.6,13 22.7,13 H17.6 L20.2,4.4 C20.5,3.3 19.2,2.8 18.5,3.5z', GOLD, W)
    + shine('M16.6,8.4 L13.6,12.8'),

  smile: () =>
    sh(blob(16, 16, 12, 11.6, 0.2), MUSTARD, W)
    + ln('M9.8,14.6 q2.1,-2.8 4.2,0', 1.8) + ln('M18,14.6 q2.1,-2.8 4.2,0', 1.8)
    + sh('M11,18.4 C13,23 19,23 21,18.4 C18,19.4 14,19.4 11,18.4z', BERRY, 1.6)
    + fl(blob(7.6, 18.6, 2, 1.4), BLUSH) + fl(blob(22.6, 18.6, 2, 1.4), BLUSH)
    + shine('M8.4,10.4 C9.2,8.8 10.4,7.8 12,7.2'),

  home: () =>
    sh(box(20, 5.6, 4, 7.4, 1, 0.3), WOOD, 1.8)
    + sh('M7.6,14.2 L7.8,26.4 Q7.8,27.8 9.2,27.8 H22.8 Q24.2,27.8 24.2,26.4 L24.4,14.2 L16,7.6z', CREAM, W)
    + offLine('M4.8,16 L16,6 L27.2,16', BERRY, 2.4)
    + sh(box(13, 19.4, 6, 8.4, 2.6, 0.3), SAGE, 1.8)
    + sh(box(19.6, 16.4, 3.6, 3.6, 1, 0.2), SKY, 1.4)
    + fl(heartPath(10.8, 18.4, 0.16), BERRY),

  moon: () =>
    sh('M19,4.5 C11,4 5,10 5,17 C5,24 11,28.5 17.5,28 C23,27.6 26.5,24 27.6,20.5 C25,22.5 21,23 17.8,21.6 C13,19.4 11.6,13.8 13.6,9.6 C14.8,7 17,5.2 19,4.5z', MUSTARD, W)
    + ln('M8.4,17 q2,2 4,0', 1.6)
    + fl(blob(10.6, 21.4, 1.8, 1.3), BLUSH)
    + sh(starPath(24, 9, 4.2, 2), SKY, 1.5)
    + sh(starPath(27, 16.6, 2.2, 1.1), CREAM, 1.2),

  pot: () =>
    ln('M10.6,6.4 C9.4,5 11.8,3.8 10.6,1.8', 1.5) + ln('M21.4,6.4 C20.2,5 22.6,3.8 21.4,1.8', 1.5)
    + ln('M6.6,15 C2.8,15 2.8,19.4 6.8,19.4', 2) + ln('M25.4,15 C29.2,15 29.2,19.4 25.2,19.4', 2)
    + sh('M6.5,12.4 C12,11.8 20,13 25.5,12.4 C25.6,19.4 25,26.4 16,26.8 C7,26.4 6.4,19.4 6.5,12.4z', SKY, W)
    + sh('M7.4,12.2 C9,8.4 23,8.4 24.6,12.2 C19,12.8 13,11.8 7.4,12.2z', '#c3d5f0', 1.8)
    + sh(blob(16, 7.6, 2.2, 1.6), MUSTARD, 1.5)
    + fl(heartPath(16, 19.4, 0.28), CREAM),

  bath: () =>
    sh(blob(6.6, 8.4, 3.4, 3.4), '#dcebfa', 1.5) + sh(blob(12.2, 4.6, 2.2, 2.2), '#dcebfa', 1.4)
    + sh(blob(26, 6.4, 2.6, 2.6), '#dcebfa', 1.4) + shine('M5,7.6 q0.6,-1.4 1.8,-1.8')
    + sh(blob(14.2, 21.6, 10, 5.8, -0.2), MUSTARD, W)
    + sh(blob(19, 13.6, 5.2, 5), MUSTARD, W)
    + sh('M23.6,13.4 L28,14.6 L23.8,16.6z', '#f2a65a', 1.6)
    + `<circle cx="20.4" cy="12.6" r="1.1" fill="${EYE}"/>`
    + fl(blob(18, 16, 1.4, 1), BLUSH)
    + ln('M9.4,20.6 C11.4,24 15.6,24 17.4,20.6', 1.6)
    + ln('M2.6,28.6 q3,-2 6,0 q3,2 6,0 q3,-2 6,0 q3,2 6,0', 1.8, SKY),

  phone: () =>
    sh('M5,27 C4.4,22 6.4,15.6 9.6,14.2 C13.6,13 18.4,13 22.4,14.2 C25.6,15.6 27.6,22 27,27 C20,28 12,28 5,27z', BLUSH, W)
    + sh('M4,10.6 C4,7.4 7,5.6 16,5.6 C25,5.6 28,7.4 28,10.6 C28,12.4 25.6,12.6 24.6,11 C23.8,9.8 22.4,9.4 21.4,10 H10.6 C9.6,9.4 8.2,9.8 7.4,11 C6.4,12.6 4,12.4 4,10.6z', BERRY, W)
    + sh(blob(16, 21, 5.4, 5), CREAM, 1.6)
    + fl([0, 1, 2, 3, 4, 5, 6].map((k) => { const [x, y] = pol(16, 21, 3.3, -60 + k * 40); return `M${r(x - 0.9)},${y} a0.9,0.9 0 1,0 1.8,0 a0.9,0.9 0 1,0 -1.8,0`; }).join(' '), INK, 0.8)
    + `<circle cx="16" cy="21" r="1.2" fill="${MUSTARD}"/>`,

  book: () =>
    sh(box(9, 6, 17.4, 23, 2, 0.4), CREAM, 1.8)
    + ln('M25.4,10 V26', 1, '#c9b49f')
    + sh(box(6.4, 4.4, 17.6, 22.4, 2.6, 0.6), SAGE, W)
    + ln('M10.2,5 V26.4', 1.6)
    + sh(box(13, 8.6, 8, 5, 1.2, 0.2), CREAM, 1.4)
    + sh(heartPath(17, 19.6, 0.24), BERRY, 1.2)
    + sh('M18.6,26.6 V30.6 L20.2,29.2 L21.8,30.6 V26.8z', BERRY, 1.3),

  jar: () =>
    sh('M9.4,9 C8,11 6.6,13 6.6,17.4 C6.6,25 8.4,28 16,28 C23.6,28 25.4,25 25.4,17.4 C25.4,13 24,11 22.6,9z', GLASS, W)
    + sh(blob(11.6, 24.6, 3.8, 1.7) + ' ' + blob(19.8, 24.2, 3.8, 1.7) + ' ' + blob(15.8, 21.4, 3.8, 1.7), GOLD, 1.4)
    + sh(heartPath(16, 15.4, 0.28), BLUSH, 1.3)
    + sh(box(8.6, 4.4, 14.8, 5, 1.8, 0.4), MUSTARD, W)
    + ln('M13.6,6.9 H18.4', 1.8)
    + shine('M9.6,14 C9.4,17 9.6,20 10.4,22.4'),

  broom: () =>
    offLine('M25.4,3.4 L14.4,17.6', WOOD, 2.2)
    + sh('M12.2,16.2 C9,18 5.6,22.4 4.6,26.8 C4.4,27.8 5.2,28.4 6.2,28 C10,26.8 14.6,24.8 17.4,21.6 C17,19.6 14.4,16.8 12.2,16.2z', MUSTARD, W)
    + ln('M7.6,24.6 L12.2,20.8 M10.2,26.2 L14.4,22.4', 1.2)
    + ln('M11.2,16.4 L17.4,21', 4.6) + ln('M11.2,16.4 L17.4,21', 2.2, BERRY)
    + ln('M25.4,3.4 q1.8,-1.2 2.4,0.8', 1.4),

  bike: () =>
    sh(blob(8, 21.4, 5.8, 5.8, 0.1), CREAM, W) + sh(blob(24, 21.4, 5.8, 5.8, 0.1), CREAM, W)
    + `<circle cx="8" cy="21.4" r="1.3" fill="${INK}"/><circle cx="24" cy="21.4" r="1.3" fill="${INK}"/>`
    + offLine('M8,21.4 L12.6,13.4 H21.6 L24,21.4 M12.6,13.4 L15.8,21.4 L21.6,13.4 M15.8,21.4 L8,21.4', BLUSH, 1.8)
    + ln('M12.6,13.4 L11.8,10.6', 1.8) + ln('M9.6,10.4 H14.4', 2.8)
    + ln('M21.6,13.4 L20.8,9.4 C22.2,8.6 23.8,8.6 25,9.4', 1.8)
    + sh(box(23.4, 10.6, 6, 4.4, 1.2, 0.2), MUSTARD, 1.4)
    + fl(heartPath(26.4, 12.8, 0.12), BERRY),
};

export function iconSvg(name: IconName, size: number): string {
  const draw = ICONS[name] ?? ICONS.star_empty;
  return standalone('0 0 32 32', size, draw());
}
