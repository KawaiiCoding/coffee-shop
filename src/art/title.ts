/* Standalone illustrations: character portrait, title art. */
import type { CharacterLook, Mood, ThemeId } from '../types';
import { INK, CREAM, fl, ln, sh, blob, box } from './kit';
import { TH, THEME_HAT } from './theme';
import { character } from './character';
import { n, hell, yarn, pumpkin, SPARK } from './core';

export function characterSvg(look: CharacterLook, mood: Mood, size: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="-48 -102 96 106" stroke-linecap="round" stroke-linejoin="round">`
    + character(look, { pose: 'stand', mood, facing: 1 }) + '</svg>';
}

function bigLatte(theme: ThemeId): string {
  const t = TH[theme];
  const saucer = hell(0, 30, 62, 13, 0.02, 3);
  const body = 'M-44,-12 C-45,14 -26,34 0,34 C26,34 45,14 44,-12z';
  const rim = hell(0, -12, 44, 12, 0.015, 5);
  const foam = hell(0, -11, 38, 9, 0.02, 6);
  const handle = 'M41,-4 C62,-8 66,14 46,20 C44,17 43,15 42,13 C54,10 54,1 42,3z';
  const cupC = theme === 'halloween' ? '#f3e4f8' : '#fff';
  return `<ellipse cx="2" cy="36" rx="66" ry="10" fill="${INK}" opacity=".14"/>`
    + sh(saucer, CREAM, 2.4)
    + `<path d="${hell(0, 29, 48, 8.5, 0.02, 4)}" fill="none" stroke="${INK}" stroke-opacity=".3" stroke-width="1.4" stroke-dasharray="3 3"/>`
    + sh(handle, cupC, 2.4)
    + sh(body, cupC, 2.6)
    + `<path d="M-40,4 C-20,10 20,10 40,4" fill="none" stroke="${t.accent}" stroke-width="5" opacity=".7"/>`
    + `<path d="M-38,9 C-20,15 20,15 38,9" fill="none" stroke="#fff" stroke-opacity=".9" stroke-width="1.4" stroke-dasharray="2.5 3"/>`
    + sh(rim, cupC, 2.4)
    + fl(foam, '#c68b59')
    + `<path d="${hell(0, -11, 30, 6.5, 0.02, 7)}" fill="#d9a477"/>`
    + `<path transform="translate(1,-11) scale(1.5,.62)" d="M0,5 C-10,-2 -6,-10 0,-5 C6,-10 10,-2 0,5z" fill="#fff3e2"/>`
    + ln(foam, 1.6)
    // face on the cup
    + `<circle cx="-12" cy="14" r="2.6" fill="${INK}"/><circle cx="12" cy="14" r="2.6" fill="${INK}"/>`
    + ln('M-4,18 q2,2.6 4,0 q2,2.6 4,0', 1.8)
    + `<ellipse cx="-21" cy="19" rx="5" ry="3" fill="#eda2a2" opacity=".8"/><ellipse cx="21" cy="19" rx="5" ry="3" fill="#eda2a2" opacity=".8"/>`
    + (theme === 'summer' ? icedTop() : steam());
}

/** Summer: the giant latte turns iced, with two ice cubes and a striped straw. */
function icedTop(): string {
  const cube = (x: number, y: number, rot: number) =>
    `<g transform="translate(${x},${y}) rotate(${rot})">${sh(box(-6.5, -6, 13, 12, 3.5, 0.5), '#eaf7fb', 1.8)}`
    + `<path d="M-3.6,-2.6 q1.4,-2 3.6,-2" fill="none" stroke="#fff" stroke-width="1.4"/></g>`;
  return ln('M8,-14 L24,-62', 7) + ln('M8,-14 L24,-62', 4.4, '#f39aa6')
    + `<path d="M11.4,-24 l4,-1.4 M14.4,-33 l4,-1.4 M17.4,-42 l4,-1.4 M20.4,-51 l4,-1.4" stroke="#fff" stroke-width="2.4"/>`
    + cube(-20, -16, -12) + cube(24, -15, 10)
    + `<circle cx="34" cy="-30" r="2.4" fill="#fff" stroke="${INK}" stroke-opacity=".4" stroke-width="1"/><circle cx="-30" cy="-34" r="1.8" fill="#fff" stroke="${INK}" stroke-opacity=".4" stroke-width="1"/>`;
}

function steam(): string {
  return `<path d="M-14,-28 C-20,-36 -8,-42 -14,-52 M2,-30 C-4,-40 8,-46 2,-58 M18,-28 C12,-36 24,-42 18,-52" fill="none" stroke="#fff" stroke-width="4" opacity=".9"/>`
    + `<path d="M-14,-28 C-20,-36 -8,-42 -14,-52 M2,-30 C-4,-40 8,-46 2,-58 M18,-28 C12,-36 24,-42 18,-52" fill="none" stroke="${INK}" stroke-opacity=".18" stroke-width="1.2" transform="translate(1.5,1)"/>`;
}

/** Straw hat with a watermelon-pink ribbon, resting on the floor. */
function strawHat(x: number, y: number, k: number): string {
  return `<g transform="translate(${x},${y}) scale(${k})">`
    + `<ellipse cx="1" cy="4" rx="24" ry="5" fill="${INK}" opacity=".14"/>`
    + sh(hell(0, 0, 22, 6.5, 0.03, 21), '#f3d58a', 2)
    + sh('M-11,-1 C-12,-10 -7,-15 0,-15 C7,-15 12,-10 11,-1 C6,1 -6,1 -11,-1z', '#f6dd98', 2)
    + fl('M-11.4,-4.6 C-6,-2.6 6,-2.6 11.4,-4.6 L11,-1 C6,1 -6,1 -11,-1z', '#e8697e', 0.95)
    + `<path d="${hell(0, 0, 16, 4, 0.02, 22)}" fill="none" stroke="${INK}" stroke-opacity=".3" stroke-width="1" stroke-dasharray="2 3"/>`
    + `<path d="M-7,-11 q7,-2 14,0" fill="none" stroke="${INK}" stroke-opacity=".3" stroke-width="1" stroke-dasharray="2 3"/>`
    + sh(blob(13, -2, 3.4, 3), '#fbe07a', 1.4) + `<circle cx="13" cy="-2" r="1.1" fill="#9a6a4a"/>`
    + '</g>';
}

function titleBunting(theme: ThemeId): string {
  const t = TH[theme];
  let s = ln('M-4,14 Q80,46 160,22 Q240,46 324,14', 1.8);
  let stitches = '';
  const flags: [number, number][] = [];
  for (let i = 0; i < 14; i++) {
    const u = (i + 0.5) / 14;
    const seg = u < 0.5 ? u * 2 : (u - 0.5) * 2;
    const x0 = u < 0.5 ? -4 : 160, x1 = u < 0.5 ? 160 : 324, y0 = u < 0.5 ? 14 : 22, y1 = u < 0.5 ? 22 : 14;
    const cy = u < 0.5 ? 46 : 46, cx = (x0 + x1) / 2;
    const x = (1 - seg) ** 2 * x0 + 2 * (1 - seg) * seg * cx + seg ** 2 * x1;
    const y = (1 - seg) ** 2 * y0 + 2 * (1 - seg) * seg * cy + seg ** 2 * y1;
    flags.push([n(x), n(y)]);
  }
  flags.forEach(([x, y], i) => {
    const d = `M${x - 9},${y} C${x - 3},${y - 1} ${x + 3},${y + 1} ${x + 9},${y} C${x + 7},${y + 8} ${x + 2},${y + 15} ${x},${y + 19} C${x - 2},${y + 15} ${x - 7},${y + 8} ${x - 9},${y}z`;
    s += sh(d, t.bunt[i % t.bunt.length], 1.8);
    stitches += `M${x - 2.6},${y + 4} l2.6,2.2 l2.6,-2.2 M${x - 2},${y + 9} l2,2 l2,-2 `;
  });
  return s + `<path d="${stitches}" fill="none" stroke="${INK}" stroke-opacity=".4" stroke-width="1"/>`;
}

/** Big title illustration: the shop crew around a giant smiling latte (no text). */
export function titleArtSvg(theme: ThemeId): string {
  if (!TH[theme]) theme = 'everyday';
  const t = TH[theme];
  const hat = THEME_HAT[theme];
  const bear: CharacterLook = { species: 'bear', color: '#e8b98c', accessory: 'apron', accentColor: t.accent, apronColor: CREAM, hat };
  const bunny: CharacterLook = { species: 'bunny', color: '#f4d6dc', accessory: hat === 'none' ? 'bow' : 'scarf', accentColor: '#9dbbe6', hat: 'none' };
  const cat: CharacterLook = { species: theme === 'halloween' ? 'ghost' : 'cat', color: theme === 'halloween' ? '#fbf7ff' : '#cfc3e6', accessory: 'scarf', accentColor: t.bunt[1] === '#2f2145' ? '#f08a3c' : t.bunt[1], hat: theme === 'halloween' ? 'witch' : 'none' };
  let s = `<path d="${blob(160, 118, 156, 100, 0.1)}" fill="${t.wall}"/>`
    + `<path d="${blob(160, 118, 156, 100, 0.1)}" fill="none" stroke="${INK}" stroke-opacity=".25" stroke-width="1.4" stroke-dasharray="4 4" transform="translate(0,0) scale(.97) translate(5,4)"/>`
    + titleBunting(theme)
    + sh(hell(160, 200, 130, 16, 0.02, 9), t.rug[0], 2)
    + `<path d="${hell(160, 200, 116, 11, 0.02, 10)}" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="1.4" stroke-dasharray="3 3"/>`
    + `<path d="${hell(160, 200, 80, 6, 0.02, 11)}" fill="${t.rug[2]}" opacity=".8"/>`;
  s += `<g transform="translate(160,158) scale(.95)">${bigLatte(theme)}</g>`;
  s += `<g transform="translate(62,202) scale(1.15)">${character(bear, { pose: 'stand', mood: 'happy', facing: 1 })}</g>`;
  s += `<g transform="translate(262,203) scale(1.1)">${character(bunny, { pose: 'stand', mood: 'happy', facing: -1 })}</g>`;
  s += `<g transform="translate(216,210) scale(.82)">${character(cat, { pose: 'stand', mood: 'calm', facing: -1 })}</g>`;
  s += yarn(112, 200, 11, t.bunt[0], true, 15) + yarn(132, 206, 7, t.bunt[2], false, 60)
    + ln('M120,208 C130,216 150,214 156,208', 1.6, t.bunt[0]);
  if (theme === 'halloween') s += pumpkin(296, 200, 0.7, true) + pumpkin(24, 204, 0.5, false);
  if (theme === 'christmas') {
    s += `<g fill="#fff" opacity=".9">${[[30, 60], [80, 40], [130, 70], [200, 50], [250, 72], [292, 48], [20, 120], [300, 120]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.2"/>`).join('')}</g>`;
  }
  if (theme === 'summer') {
    s += strawHat(28, 206, 0.9)
      + `<circle cx="290" cy="58" r="15" fill="#fff4b8" opacity=".5"/>` + sh(blob(290, 58, 9, 9), '#ffe066', 1.8)
      + ln('M290,40 v-4 M290,76 v4 M272,58 h-4 M308,58 h4 M277,45 l-3,-3 M303,45 l3,-3 M277,71 l-3,3 M303,71 l3,3', 1.6, '#f2c14e')
      + [[48, 74], [110, 60], [236, 58], [36, 132]]
        .map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${2 + (i % 2)}" fill="#ffffff" fill-opacity=".25" stroke="#ffffff" stroke-width="1.2"/>`).join('');
  }
  if (theme === 'spring') {
    s += [[40, 70, '#f6b6c8'], [100, 54, '#fbd8e2'], [222, 60, '#f6b6c8'], [286, 84, '#fbd8e2'], [30, 140, '#f6b6c8']]
      .map(([x, y, c]) => `<path transform="translate(${x},${y}) rotate(${(x as number) % 90})" d="M0,-3.4 C3,-3.4 4.4,0.8 0,4 C-4.4,0.8 -3,-3.4 0,-3.4z" fill="${c}"/>`).join('');
  }
  // sparkles and a floating heart
  s += [[110, 92, 1], [214, 86, 0.8], [36, 104, 0.7], [292, 110, 0.9]]
    .map(([x, y, k]) => `<path transform="translate(${x},${y}) scale(${k})" d="${SPARK}" fill="#fff" stroke="${INK}" stroke-opacity=".35" stroke-width="1"/>`).join('');
  s += `<path transform="translate(196,104) rotate(12) scale(.8)" d="M0,5 C-10,-2 -6,-10 0,-5 C6,-10 10,-2 0,5z" fill="${t.accent}" stroke="${INK}" stroke-width="1.6"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 224" width="320" height="224" stroke-linecap="round" stroke-linejoin="round">${s}</svg>`;
}
