/* =====================================================================
   UI ICONS — small standalone <svg> icons for buttons / HUD (viewBox 32).
   Cozy hand-drawn style: soft brown ink, round caps, offset pastel fills.
   ===================================================================== */
import { INK, CREAM, fl, ln, sh, blob, box, standalone } from './kit';

export type IconName = 'coin' | 'pause' | 'play' | 'music' | 'music_off' | 'sound' | 'sound_off'
  | 'cafe' | 'shop' | 'decor' | 'settings' | 'star' | 'star_empty' | 'heart' | 'close' | 'check' | 'lock' | 'calendar';

const BLUSH = '#f4a9a8';
const SAGE = '#8fc3a7';
const MUSTARD = '#f6cf6b';
const SKY = '#9dbbe6';
const BERRY = '#e2607a';
const GOLD = '#f0c34a';
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
};

export function iconSvg(name: IconName, size: number): string {
  const draw = ICONS[name] ?? ICONS.star_empty;
  return standalone('0 0 32 32', size, draw());
}
