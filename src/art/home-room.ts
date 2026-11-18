/* Home room art: Mocha's small evening flat (360x720 portrait). Fixed furniture sits exactly at
   HOME_SPOTS (layout.ts); the decor slots (window curtains, wall frame, quilt, rug, corner, pet)
   are left clear so decor art can sit on top. Keep these exports and signatures. */
import type { ThemeId } from '../types';
import { HOME_WALL_BOTTOM } from '../layout';
import { INK, CREAM, fl, ln, sh, blob, box, shadow, tinyFace } from './kit';
import { TH } from './theme';
import { n, rng, hrect, mix, pumpkin, SPARK, HEART } from './core';

const W = 360, H = 720, WB = HOME_WALL_BOTTOM;
const hid = (k: string, t: ThemeId) => `hm-${k}-${t}`;
const safe = (t: ThemeId): ThemeId => (TH[t] ? t : 'everyday');

/** Home wallpaper: soft blue-lavender with tiny dots, nudged per theme. */
const PAPER: Record<ThemeId, { wall: string; dot: string; dot2: string }> = {
  everyday: { wall: '#dfe0f3', dot: '#c4c7e8', dot2: '#f3d9e2' },
  spring: { wall: '#e9e1f4', dot: '#d6c6ea', dot2: '#f8cfdc' },
  christmas: { wall: '#dde4f0', dot: '#c3cfe3', dot2: '#f1d3cf' },
  halloween: { wall: '#5d5486', dot: '#71679c', dot2: '#8a6fa8' },
};

const SKY: Record<ThemeId, [string, string, string]> = {
  everyday: ['#2c376e', '#6f6aa8', '#e8a98f'],
  spring: ['#3f3f80', '#9a7ab8', '#f2b3c8'],
  christmas: ['#17244a', '#2e4678', '#56709e'],
  halloween: ['#1f1440', '#4d2a6e', '#a0507a'],
};

/* ------------------------------------------------------------------ defs */
export function homeSceneDefs(theme: ThemeId): string {
  theme = safe(theme);
  const p = PAPER[theme];
  const [a, b, c] = SKY[theme];
  const vig = theme === 'halloween' ? '#1c0f2e' : '#3a2240';
  return `<pattern id="${hid('paper', theme)}" width="18" height="18" patternUnits="userSpaceOnUse">`
    + `<circle cx="4.5" cy="4.5" r="1.3" fill="${p.dot}"/><circle cx="13.5" cy="13.5" r="1.1" fill="${p.dot2}"/></pattern>`
    + `<clipPath id="${hid('win', theme)}"><rect x="114" y="68" width="92" height="80" rx="6"/></clipPath>`
    + `<linearGradient id="${hid('sky', theme)}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset=".6" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></linearGradient>`
    + `<radialGradient id="${hid('vig', theme)}" cx=".5" cy=".55" r=".75"><stop offset=".55" stop-color="${vig}" stop-opacity="0"/><stop offset="1" stop-color="${vig}" stop-opacity="${theme === 'halloween' ? 0.5 : 0.32}"/></radialGradient>`
    + `<radialGradient id="${hid('glow', theme)}"><stop offset="0" stop-color="#ffd98a" stop-opacity=".42"/><stop offset=".5" stop-color="#ffc870" stop-opacity=".14"/><stop offset="1" stop-color="#ffc870" stop-opacity="0"/></radialGradient>`;
}

/* ------------------------------------------------------------ wall & floor */
function wall(theme: ThemeId): string {
  const t = TH[theme], p = PAPER[theme];
  return `<rect width="${W}" height="${WB + 2}" fill="${p.wall}"/>`
    + `<rect width="${W}" height="${WB}" fill="url(#${hid('paper', theme)})"/>`
    // faint picture rail near the top
    + `<path d="M0,60 C120,59 240,61 ${W},60" stroke="${INK}" stroke-opacity=".14" stroke-width="1.4" fill="none"/>`
    // skirting
    + sh(hrect(-4, WB - 9, W + 8, 12, 3, 0.5, 41), mix(t.trim, '#ffffff', 0.15), 1.8)
    + `<path d="M0,${WB - 4} h${W}" stroke="#fff" stroke-opacity=".35" stroke-width="1.2" stroke-dasharray="3 4"/>`;
}

function floor(theme: ThemeId): string {
  const t = TH[theme];
  const A = mix(t.floorA, '#a0643a', 0.14), B = mix(t.floorB, '#8a5232', 0.14);
  const R = rng(523);
  let tint = '', seams = '', joints = '', grain = '';
  let y = WB + 3, row = 0;
  while (y < H) {
    const h = 30;
    if (row % 2) tint += `M0,${y}h${W}v${h}h-${W}z`;
    seams += `M-2,${n(y + h)} C120,${n(y + h + 0.7)} 240,${n(y + h - 0.7)} ${W + 2},${n(y + h)} `;
    let x = -30 - R() * 50;
    while (x < W) {
      x += 80 + R() * 80;
      if (x < W - 6) {
        joints += `M${n(x)},${n(y + 2)} C${n(x + 0.6)},${n(y + h * 0.4)} ${n(x - 0.6)},${n(y + h * 0.7)} ${n(x)},${n(y + h - 2)} `;
        if (R() < 0.45) grain += `M${n(x + 14)},${n(y + h * 0.5)} q${n(14 + R() * 10)},-1.5 ${n(28 + R() * 16)},0.5 `;
      }
    }
    y += h; row++;
  }
  return `<rect x="0" y="${WB}" width="${W}" height="${H - WB}" fill="${A}"/>`
    + `<path d="${tint}" fill="${B}" opacity=".4"/>`
    + `<path d="${seams}" fill="none" stroke="${INK}" stroke-opacity=".2" stroke-width="1.1"/>`
    + `<path d="${joints}" fill="none" stroke="${INK}" stroke-opacity=".16" stroke-width="1"/>`
    + `<path d="${grain}" fill="none" stroke="${INK}" stroke-opacity=".09" stroke-width=".9"/>`
    + `<rect x="0" y="${WB}" width="${W}" height="10" fill="${INK}" opacity=".08"/>`;
}

/* ------------------------------------------------------------ bathroom door (36,250) 56x120 */
function bathDoor(theme: ThemeId): string {
  const t = TH[theme];
  const leafC = theme === 'halloween' ? '#cfe4ea' : '#e6f3f4';
  return sh(hrect(5, 126, 62, 126, 8, 0.5, 51), t.trim, 2)
    + sh(hrect(11, 132, 50, 118, 6, 0.4, 52), leafC, 2)
    + `<path d="${hrect(17, 170, 38, 30, 4, 0.4, 53)} ${hrect(17, 208, 38, 34, 4, 0.4, 54)}" fill="#000" fill-opacity=".04" stroke="${INK}" stroke-opacity=".28" stroke-width="1.2"/>`
    + sh(blob(53, 203, 3, 3), '#f6cf6b', 1.4)
    // round duck sign
    + ln('M30,140 L36,136 L42,140', 1.1)
    + sh(blob(36, 152, 11, 10), CREAM, 1.6)
    + sh('M29,155 C29,150 33,149 36,151 C36,146 39,143 42,145 C45,147 44,151 42,152 C45,152 45,157 41,159 C36,161 29,160 29,155z', '#f6d55c', 1.2)
    + `<path d="M44.5,147.5 l3,0.6 l-2.6,1.5z" fill="#f08a3c"/><circle cx="41" cy="147.4" r=".9" fill="${INK}"/>`
    + `<circle cx="22" cy="161" r="1.6" fill="#bfe6f5"/><circle cx="25" cy="157" r="1.1" fill="#bfe6f5"/>`
    // towel hook + striped towel on the wall beside the door
    + sh(blob(78, 166, 2.6, 2.6), t.trim, 1.3)
    + sh('M71,168 C74,167 82,167 85,168 C86,180 85,196 86,206 C80,208 75,208 70,206 C71,196 70,180 71,168z', '#f4a9a8', 1.7)
    + `<path d="M71,194 C75,195 81,195 85.5,194 M71,199 C75,200 81,200 85.5,199" stroke="#fff" stroke-width="1.6" fill="none"/>`;
}

/* ------------------------------------------------------------ window (centre 160,108) */
function view(theme: ThemeId): string {
  const sky = `<rect x="112" y="66" width="96" height="84" fill="url(#${hid('sky', theme)})"/>`;
  const R = rng(theme.length * 97 + 5);
  let stars = '';
  for (let i = 0; i < 12; i++) stars += `M${n(118 + R() * 84)},${n(72 + R() * 40)}h0.01 `;
  const starP = (op = 1) => `<path d="${stars}" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity="${op}"/>`;
  const roofs = (c: string) =>
    `<path d="M112,150 L112,128 L126,128 L126,120 L134,114 L142,120 L142,130 L156,130 L156,122 L172,122 L172,132 L182,126 L192,132 L192,124 L208,124 L208,150z" fill="${c}"/>`;
  const lit = (c: string) => `<path d="M118,134h4v4h-4z M131,124h4v4h-4z M160,128h4v4h-4z M166,136h4v4h-4z M196,130h4v4h-4z M146,136h4v4h-4z" fill="${c}"/>`;
  if (theme === 'everyday') {
    return sky + starP(0.9)
      + `<circle cx="186" cy="86" r="14" fill="#fff4c4" opacity=".18"/>`
      + `<path d="M188,76 C181,78 178,86 182,92 C186,98 194,97 197,92 C191,93 186,89 186,84 C186,80 187,78 188,76z" fill="#fff1b8"/>`
      + roofs('#3b3d6c') + lit('#ffd77a');
  }
  if (theme === 'spring') {
    return sky + starP(0.6)
      + `<circle cx="188" cy="84" r="7" fill="#fff4d6"/><circle cx="188" cy="84" r="12" fill="#fff4d6" opacity=".2"/>`
      + roofs('#4a3f78') + lit('#ffd9a0')
      + ln('M112,90 C124,94 134,100 142,110 M126,96 C130,88 136,84 142,82', 3, '#6e4a5a')
      + `<path d="${blob(128, 90, 10, 7)} ${blob(142, 104, 8, 6)} ${blob(142, 82, 7, 5)} ${blob(116, 98, 6, 6)}" fill="#f6b6c8"/>`
      + `<path d="${blob(124, 86, 4, 3)} ${blob(145, 101, 3.5, 3)}" fill="#fbd8e2"/>`
      + `<g fill="#f6b6c8"><path d="M162,114 q3,-3 6,0 q-3,3 -6,0z"/><path d="M178,104 q3,-3 6,0 q-3,3 -6,0z"/><path d="M154,126 q3,-3 6,0 q-3,3 -6,0z"/></g>`;
  }
  if (theme === 'christmas') {
    let snow = '';
    for (let i = 0; i < 16; i++) snow += `M${n(116 + R() * 88)},${n(70 + R() * 70)}h0.01 `;
    return sky + starP(0.7)
      + `<path d="M190,76 C184,78 182,86 186,91 C190,96 197,95 200,91 C195,92 190,88 190,83 C190,80 191,78 190,76z" fill="#fff3c4"/>`
      + roofs('#2a3560') + lit('#ffd45e')
      + `<path d="M112,129 C116,126 122,127 126,128 L126,121 L134,114 L142,121 C140,124 128,124 126,123 M142,131 C148,128 152,130 156,131 L156,123 C162,120 168,121 172,123 L172,133 L182,126 L192,133 L192,125 C198,122 204,123 208,125 L208,128 C200,127 196,127 192,129 L182,130 L172,136 L172,127 C166,125 160,125 156,127 L156,134 C150,133 146,133 142,134 L142,124 L134,118 L126,125 L126,131 C120,130 116,130 112,132z" fill="#f4f8ff"/>`
      + `<path d="${snow}" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".85"/>`;
  }
  const bat = (x: number, y: number, s: number) =>
    `<path transform="translate(${x},${y}) scale(${s})" d="M0,0 C-2,-4 -6,-5 -11,-3 C-8,-2 -7,0 -7,2 C-5,0 -2,0 0,3 C2,0 5,0 7,2 C7,0 8,-2 11,-3 C6,-5 2,-4 0,0z" fill="#140c24"/>`;
  return sky + starP(0.5)
    + `<circle cx="178" cy="92" r="20" fill="#ffb05a" opacity=".2"/><circle cx="178" cy="92" r="13" fill="#f7a04a"/>`
    + `<circle cx="173" cy="88" r="2.2" fill="#e08a38"/><circle cx="182" cy="97" r="1.6" fill="#e08a38"/>`
    + roofs('#1e1436') + lit('#ffb84d')
    + ln('M120,150 C120,136 118,126 114,116 M119,130 C124,124 128,122 132,118', 2.4, '#1e1436')
    + bat(148, 82, 0.8) + bat(196, 112, 0.5);
}

function sillItem(theme: ThemeId): string {
  // sill top at y ~152; item sits at x ~188
  if (theme === 'everyday') {
    return sh('M181,152 C180,147 180,144 181,142 L195,142 C196,144 196,147 195,152z', '#e79a7e', 1.5)
      + sh('M188,142 C182,142 181,132 184,128 C187,126 192,126 193,129 C195,133 194,142 188,142z', '#8fc3a7', 1.4)
      + ln('M186,133 l-2,-1 M190,136 l2,-1 M188,130 v-2', 1, INK)
      + `<circle cx="189" cy="127" r="2" fill="#f7a8b8"/>`;
  }
  if (theme === 'spring') {
    return sh('M181,152 C180,147 180,144 181,142 L195,142 C196,144 196,147 195,152z', '#9dbbe6', 1.5)
      + ln('M185,142 C185,136 184,133 184,130 M188,142 V127 M191,142 C191,137 192,134 193,131', 1.3, '#6aa883')
      + sh('M181,130 C181,126 183,125 184,127 C185,125 187,126 187,130 C187,132 181,132 181,130z', '#f6b6c8', 1.1)
      + sh('M185,127 C185,123 187,122 188,124 C189,122 191,123 191,127 C191,129 185,129 185,127z', '#f9d77e', 1.1)
      + sh('M190,131 C190,127 192,126 193,128 C194,126 196,127 196,131 C196,133 190,133 190,131z', '#f6b6c8', 1.1);
  }
  if (theme === 'christmas') {
    return `<circle cx="188" cy="136" r="12" fill="#ffd45e" opacity=".16"/>`
      + sh(box(184, 146, 8, 6, 1.5, 0.3), '#c9584f', 1.3)
      + sh('M188,124 C191,130 194,134 197,140 C194,141 192,141 192,141 C195,143 197,145 198,147 C192,148 184,148 178,147 C179,145 181,143 184,141 C184,141 182,141 179,140 C182,134 185,130 188,124z', '#4f8f68', 1.5)
      + `<circle cx="185" cy="138" r="1.3" fill="#ffd45e"/><circle cx="191" cy="143" r="1.3" fill="#f4a9a8"/><circle cx="187" cy="145" r="1.2" fill="#9dbbe6"/>`
      + `<path transform="translate(188,123) scale(.45)" d="${SPARK}" fill="#ffd45e"/>`;
  }
  return pumpkin(188, 146, 0.36, true);
}

function windowPart(theme: ThemeId): string {
  const t = TH[theme];
  const sillC = mix(t.trim, '#ffffff', 0.2);
  return `<g clip-path="url(#${hid('win', theme)})">${view(theme)}</g>`
    + `<path d="${hrect(115, 66, 90, 84, 7, 0.6, 61)}" fill="none" stroke="${CREAM}" stroke-width="6"/>`
    + `<path d="${hrect(111, 62, 98, 92, 9, 0.6, 62)}" fill="none" stroke="${INK}" stroke-width="1.8"/>`
    + `<path d="M160,68 C159.5,92 160.5,124 160,148 M117,108 C140,107.5 180,108.5 203,108" fill="none" stroke="${CREAM}" stroke-width="3.2"/>`
    + `<path d="M124,76 C128,72 134,70 140,70" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="1.6"/>`
    + sh(hrect(104, 150, 112, 8, 3, 0.5, 63), sillC, 1.8)
    + sillItem(theme);
}

/* ------------------------------------------------------------ jar shelf (jar centre 238,132) */
function jarShelf(theme: ThemeId): string {
  const t = TH[theme];
  return sh('M222,158 L222,170 C226,166 230,162 233,158z M254,158 L254,170 C250,166 246,162 243,158z', mix(t.trim, '#ffffff', 0.1), 1.4)
    + sh(hrect(212, 151, 52, 8, 2.5, 0.4, 71), mix(t.trim, '#ffffff', 0.25), 1.8)
    + `<path d="M216,154.5 h44" stroke="#fff" stroke-opacity=".4" stroke-width="1" stroke-dasharray="2 3"/>`;
}

/* ------------------------------------------------------------ kitchen corner (stove 300,250) */
function kitchen(theme: ThemeId): string {
  const t = TH[theme];
  const tile = theme === 'halloween' ? '#d9cfe6' : '#f4f1ea';
  // tiled backsplash
  let grid = '';
  for (let x = 274; x < 346; x += 14) grid += `M${x},116 V176 `;
  for (let y = 130; y < 176; y += 14) grid += `M266,${y} H346 `;
  const stoveC = theme === 'christmas' ? '#e9ecef' : '#f1ede4';
  return sh(hrect(266, 116, 80, 60, 4, 0.4, 81), tile, 1.6)
    + `<path d="${grid}" stroke="${INK}" stroke-opacity=".14" stroke-width="1"/>`
    // hanging rail with a ladle and tiny pan
    + ln('M274,124 H338', 2, t.trim)
    + ln('M286,124 V146', 1.6) + sh(blob(286, 149, 4.5, 3), '#c9c3bd', 1.3)
    + ln('M322,124 V134', 1.6) + sh(blob(322, 142, 8, 7), '#7a6f6a', 1.5)
    // stove cabinet
    + shadow(300, 250, 44, 4)
    + sh(hrect(262, 180, 76, 70, 6, 0.5, 82), stoveC, 2)
    + sh(hrect(270, 202, 60, 40, 5, 0.4, 83), mix(stoveC, '#c9b8a6', 0.25), 1.6)
    + sh(hrect(278, 212, 44, 18, 4, 0.3, 84), '#6e5a52', 1.4)
    + `<path d="M282,216 q6,-2 12,0" stroke="#fff" stroke-opacity=".35" stroke-width="1.4" fill="none"/>`
    + ln('M286,207 H314', 2.4)
    + sh(blob(276, 191, 3.2, 3.2), t.accent, 1.2) + sh(blob(324, 191, 3.2, 3.2), t.accent, 1.2)
    // stove top + 2 rings
    + sh(hrect(258, 172, 84, 10, 3, 0.4, 85), mix(stoveC, '#b8a898', 0.3), 1.8)
    + `<path d="M270,174.5 C270,172 294,172 294,174.5 C294,177 270,177 270,174.5z M306,174.5 C306,172 330,172 330,174.5 C330,177 306,177 306,174.5z" fill="#4f403b" opacity=".8"/>`
    // pot (left ring)
    + ln('M268,156 h-4 M296,156 h4', 2.4)
    + sh(hrect(268, 150, 28, 24, 6, 0.4, 86), '#e48a7a', 1.8)
    + sh('M267,151 C270,145 294,145 297,151z', mix('#e48a7a', '#ffffff', 0.15), 1.5)
    + sh(blob(282, 144.5, 2.6, 2), '#6e5a52', 1.1)
    + ln('M276,140 c-3,-4 3,-6 0,-10 M287,139 c-3,-4 3,-6 0,-10', 1.4, '#ffffff')
    // kettle (right ring) with a tiny face
    + ln('M308,150 C308,138 328,138 328,150', 2.4)
    + sh('M306,172 C303,164 306,152 318,151 C330,152 333,164 330,172z', '#8fc3a7', 1.8)
    + sh('M306,160 C301,158 298,154 297,151 L300,150 C302,154 304,156 307,157z', '#8fc3a7', 1.4)
    + sh(blob(318, 150, 3, 2), '#6e5a52', 1.1)
    + tinyFace(318, 163, 0.7);
}

/* ------------------------------------------------------------ bed (footprint 96,452) */
function bed(theme: ThemeId): string {
  const t = TH[theme];
  const wood = mix(t.trim, '#e0a878', 0.45), woodD = mix(wood, INK, 0.25);
  const sheet = '#fbf7f0', side = '#e7ecf6';
  return shadow(98, 452, 82, 6, 0.16)
    + sh(hrect(40, 438, 7, 14, 2, 0.3, 91), woodD, 1.5) + sh(hrect(158, 438, 7, 14, 2, 0.3, 92), woodD, 1.5)
    + sh(hrect(30, 428, 144, 14, 5, 0.4, 93), wood, 1.9)
    // mattress: top surface + soft front side
    + sh(hrect(34, 388, 136, 44, 10, 0.5, 94), sheet, 2)
    + fl('M35,416 C80,418 130,418 169,416 L169,422 C168,429 164,431 158,431 L46,431 C40,431 35,428 35,422z', side, 0.9)
    + ln('M36,416 C80,418.5 130,418.5 168,416', 1.5)
    + ln('M90,398 C100,401 112,400 120,397 M128,408 C138,410 148,409 154,406', 1, mix(INK, sheet, 0.55))
    // pillow
    + sh('M44,402 C42,394 48,389 60,389 C72,389 80,391 80,399 C80,408 74,411 62,411 C50,411 45,409 44,402z', '#fffdf8', 1.7)
    + ln('M50,394 C56,392 66,392 72,394', 1, '#c4c7e8')
    // headboard (wall side, left) and low footboard
    + sh('M14,450 L14,362 C14,350 34,348 38,360 L38,450z', wood, 2.1)
    + ln('M20,372 C22,362 30,362 32,372 V440 M20,372 V440', 1.2, woodD)
    + sh(blob(26, 358, 3, 3), mix(wood, '#ffffff', 0.3), 1.2)
    + sh('M164,450 L164,402 C164,394 178,394 178,402 L178,450z', wood, 2);
}

/* ------------------------------------------------------------ phone table (300,430) */
function phoneTable(theme: ThemeId): string {
  const t = TH[theme];
  const wood = mix(t.trim, '#e0a878', 0.4);
  const phoneC = theme === 'halloween' ? '#f08a3c' : theme === 'spring' ? '#f4a9bd' : '#e47b78';
  return shadow(300, 430, 24, 4)
    + sh(blob(300, 426, 15, 4), wood, 1.6)
    + sh('M296,398 C297,408 295,416 294,425 L306,425 C305,416 303,408 304,398z', wood, 1.7)
    + sh(hrect(272, 390, 56, 9, 4.5, 0.3, 101), mix(wood, INK, 0.15), 1.8)
    + sh(blob(300, 390, 28, 6), wood, 1.9)
    + `<path d="${blob(300, 390, 20, 3.6)}" fill="${CREAM}" stroke="${INK}" stroke-opacity=".35" stroke-width="1" stroke-dasharray="2 2"/>`
    // old rotary phone
    + sh('M283,389 C282,378 289,371 300,371 C311,371 318,378 317,389z', phoneC, 1.8)
    + sh(blob(300, 381, 6.5, 5.5), CREAM, 1.3)
    + `<g fill="${INK}" opacity=".55"><circle cx="300" cy="377.4" r=".9"/><circle cx="303.4" cy="378.8" r=".9"/><circle cx="304.6" cy="382" r=".9"/><circle cx="296.6" cy="378.8" r=".9"/><circle cx="295.4" cy="382" r=".9"/><circle cx="302.6" cy="384.6" r=".9"/></g>`
    + `<circle cx="300" cy="381" r="1.6" fill="${phoneC}"/>`
    + sh('M281,370 C280,363 320,363 319,370 C319,374 313,374 312,369 C306,367 294,367 288,369 C287,374 281,374 281,370z', phoneC, 1.7)
    + ln('M317,384 c5,0 4,4 7,4 c3,0 2,4 5,4 c3,0 2,4 4,6', 1.3);
}

/* ------------------------------------------------------------ armchair (280,600) + lamp */
function armchair(theme: ThemeId): string {
  const c = theme === 'halloween' ? '#b88ad6' : theme === 'christmas' ? '#8fbf9c' : theme === 'spring' ? '#9fcbb8' : '#e6b25e';
  const cl = mix(c, '#ffffff', 0.25), cd = mix(c, INK, 0.18);
  return shadow(280, 600, 52, 6, 0.16)
    + sh(hrect(240, 590, 7, 10, 2, 0.3, 111), cd, 1.4) + sh(hrect(314, 590, 7, 10, 2, 0.3, 112), cd, 1.4)
    + sh('M240,560 C238,536 242,514 262,512 C274,511 288,511 300,512 C318,514 322,536 320,560z', c, 2.1)
    + `<g fill="${cd}"><circle cx="266" cy="532" r="1.6"/><circle cx="280" cy="530" r="1.6"/><circle cx="294" cy="532" r="1.6"/></g>`
    + ln('M266,532 L280,544 L294,532 M280,530 V544', 1, cd)
    + sh(hrect(236, 566, 88, 26, 9, 0.4, 113), c, 2)
    + sh(hrect(246, 556, 68, 18, 8, 0.4, 114), cl, 1.8)
    + sh('M226,552 C224,540 230,536 238,536 C246,536 250,542 250,552 L250,590 C244,592 232,592 228,590z', c, 2)
    + sh('M310,552 C310,542 314,536 322,536 C330,536 336,540 334,552 L332,590 C328,592 316,592 310,590z', c, 2)
    + `<path d="M232,546 C236,542 242,542 246,546 M314,546 C318,542 324,542 328,546" stroke="#fff" stroke-opacity=".5" stroke-width="1.2" fill="none"/>`
    // book on the right arm
    + sh(box(312, 529, 22, 7, 1.6, 0.3), '#9dbbe6', 1.4)
    + `<path d="M315,532.5 h16" stroke="#fff" stroke-width="1.6"/>`
    + ln('M330,536 l1,5', 1.2, '#c4506a')
    // small floor lamp beside the chair
    + shadow(346, 604, 10, 2.4)
    + sh(blob(346, 601, 8, 2.6), '#6e5a52', 1.3)
    + ln('M346,600 C345.5,560 346.5,530 346,508', 2)
    + sh('M334,508 L358,508 C356,500 354,494 351,488 L341,488 C338,494 336,500 334,508z', '#fdf0d0', 1.7)
    + `<path d="M336,505 h20" stroke="${INK}" stroke-opacity=".25" stroke-width="1" stroke-dasharray="2 2"/>`;
}

/* ================================================================== exports */

export function homeBack(theme: ThemeId): string {
  theme = safe(theme);
  return wall(theme) + floor(theme)
    + windowPart(theme) + bathDoor(theme) + jarShelf(theme) + kitchen(theme)
    + bed(theme) + phoneTable(theme) + armchair(theme);
}

const MOTES = (() => {
  const R = rng(4242);
  return Array.from({ length: 12 }, () => ({ x: 20 + R() * 320, y: R() * 600, sp: 3 + R() * 5, ph: R() * 6.28, r: 0.9 + R() * 1.2 }));
})();

export function homeFront(theme: ThemeId, time: number): string {
  theme = safe(theme);
  const mc = theme === 'halloween' ? '#e9c6ff' : theme === 'spring' ? '#ffe0ea' : '#fff3c8';
  let s = `<ellipse cx="346" cy="505" rx="90" ry="80" fill="url(#${hid('glow', theme)})"/>`
    + `<rect width="${W}" height="${H}" fill="url(#${hid('vig', theme)})"/>`;
  let motes = '';
  for (const p of MOTES) {
    const y = n(80 + ((p.y - time * p.sp) % 560 + 560) % 560);
    const x = n(p.x + Math.sin(time * 0.4 + p.ph) * 10);
    const op = n(0.25 + 0.35 * (0.5 + 0.5 * Math.sin(time * 0.9 + p.ph * 2)));
    motes += `<circle cx="${x}" cy="${y}" r="${n(p.r)}" opacity="${op}"/>`;
  }
  s += `<g fill="${mc}">${motes}</g>`;
  if (theme === 'christmas' || theme === 'halloween') {
    const pts = theme === 'christmas' ? [[126, 80], [196, 120], [150, 96]] : [[200, 76], [130, 118]];
    const col = theme === 'christmas' ? '#ffffff' : '#ffd08a';
    pts.forEach(([x, y], i) => {
      const k = Math.max(0, Math.sin(time * 1.6 + i * 2.1));
      if (k > 0.05) s += `<path transform="translate(${x},${y}) scale(${n(0.15 + 0.35 * k)})" d="${SPARK}" fill="${col}" opacity="${n(0.4 + 0.6 * k)}"/>`;
    });
  }
  return s;
}

export function savingsJar(fill: number, time: number): string {
  const f = Math.max(0, Math.min(1, fill || 0));
  const body = 'M-11,-13 C-15,-11 -16,-6 -16,0 L-16,14 C-16,18 -13,20 -9,20 L9,20 C13,20 16,18 16,14 L16,0 C16,-6 15,-11 11,-13z';
  let s = `<ellipse cx="0" cy="20.5" rx="15" ry="2.4" fill="${INK}" opacity=".14"/>`
    + `<path d="${body}" fill="#dff1f7" opacity=".55"/>`;
  if (f > 0) {
    const top = n(18 - 28 * f);
    let scal = `M-14,${top}`;
    for (let i = 0; i < 4; i++) scal += ` q3.5,${i % 2 ? -2.6 : -2} 7,0`;
    s += `<path d="${scal} L14,14 C14,17 12,18.5 9,18.5 L-9,18.5 C-12,18.5 -14,17 -14,14z" fill="#f2c14e"/>`
      + `<path d="M-10,${n(Math.min(16, top + 6))} h4 M3,${n(Math.min(14, top + 10))} h5 M-5,${n(Math.min(17, top + 14))} h5" stroke="#c99a2e" stroke-width="1.1" stroke-linecap="round"/>`
      + `<ellipse cx="-6" cy="${n(top - 1)}" rx="3.6" ry="1.4" fill="#ffd96e" stroke="#c99a2e" stroke-width=".8"/>`
      + `<ellipse cx="5" cy="${n(top - 1.6)}" rx="3.6" ry="1.4" fill="#ffd96e" stroke="#c99a2e" stroke-width=".8"/>`;
  }
  s += ln(body, 1.9)
    + `<path d="M-12,-4 C-13,2 -13,8 -12,13" stroke="#fff" stroke-opacity=".8" stroke-width="2" fill="none" stroke-linecap="round"/>`
    // neck + cork
    + sh(box(-11, -15, 22, 4, 1.5, 0.3), '#dff1f7', 1.4)
    + sh(box(-8, -20, 16, 6, 2, 0.3), '#d9a877', 1.5)
    + `<path d="M-5,-18 h1 M2,-17 h1" stroke="${INK}" stroke-opacity=".4" stroke-width="1" stroke-linecap="round"/>`
    // string + bicycle tag
    + ln('M9,-13 C13,-10 15,-6 14,-3', 0.9)
    + sh(box(7, -3, 13, 9, 2, 0.2), CREAM, 1.2)
    + `<g fill="none" stroke="${INK}" stroke-width=".8"><circle cx="10.4" cy="3" r="2"/><circle cx="16.6" cy="3" r="2"/><path d="M10.4,3 L12.6,0 L15.6,0 L16.6,3 M12.6,0 L13.6,3 L15.6,0"/></g>`;
  if (f >= 1) {
    const k = 0.5 + 0.5 * Math.sin(time * 4);
    s += `<path transform="translate(-9,-9) scale(${n(0.4 + 0.4 * k)})" d="${SPARK}" fill="#fff8c8" opacity="${n(0.6 + 0.4 * k)}"/>`
      + `<path transform="translate(15,-16) scale(${n(0.6 - 0.3 * k)})" d="${SPARK}" fill="#ffe28a"/>`;
  }
  return s;
}

export function homeSpotIcon(action: 'cook' | 'bath' | 'call_mom' | 'read' | 'save' | 'sleep', pulse: number): string {
  const sc = n(1 + 0.08 * Math.max(0, Math.min(1, pulse || 0)));
  const cy = -19;
  const badge = sh(`M-4,-7 L0,-1 L4,-7z`, CREAM, 1.5) + sh(blob(0, cy, 13, 12.5, 0.1), CREAM, 1.8);
  let icon = '';
  if (action === 'cook') {
    icon = sh(box(-7, -21, 14, 9, 3, 0.3), '#e48a7a', 1.4)
      + ln('M-9,-19 h2 M7,-19 h2 M-7.5,-21 h15', 1.4)
      + ln('M-3,-24 c-2,-2 2,-3 0,-6 M3,-24 c-2,-2 2,-3 0,-6', 1.1, '#9a8a80');
  } else if (action === 'bath') {
    icon = sh('M-7,-15 C-8,-20 -4,-21 -1,-19 C-1,-24 2,-26 5,-24 C8,-22 7,-19 5,-18 C8,-18 8,-14 4,-12 C0,-11 -6,-11 -7,-15z', '#f6d55c', 1.3)
      + `<path d="M7.4,-23 l2.6,.6 l-2.3,1.4z" fill="#f08a3c"/><circle cx="4" cy="-22.6" r=".9" fill="${INK}"/>`
      + `<g fill="#bfe6f5" stroke="${INK}" stroke-width=".7"><circle cx="-6" cy="-25" r="2"/><circle cx="-2.5" cy="-28" r="1.3"/></g>`;
  } else if (action === 'call_mom') {
    icon = sh('M-8,-22 C-8,-28 6,-28 6,-22 C6,-19 2,-19 2,-21 C0,-22 -2,-22 -4,-21 C-4,-19 -8,-19 -8,-22z', '#e47b78', 1.3)
      + sh('M-7,-12 C-7,-17 -3,-19 -1,-19 C1,-19 5,-17 5,-12z', '#e47b78', 1.3)
      + `<path transform="translate(7,-14) scale(.38)" d="${HEART}" fill="#c4506a"/>`;
  } else if (action === 'read') {
    icon = sh('M0,-14 C-3,-16 -6,-16 -9,-15 L-9,-24 C-6,-25 -3,-25 0,-23 C3,-25 6,-25 9,-24 L9,-15 C6,-16 3,-16 0,-14z', '#ffffff', 1.4)
      + ln('M0,-23 V-14', 1.1) + ln('M-6.5,-21 h4 M2.5,-21 h4 M-6.5,-18 h4', 0.8, '#9dbbe6');
  } else if (action === 'save') {
    icon = sh(blob(0, -19, 7.5, 7.5, 0.05), '#f2c14e', 1.5)
      + `<circle cx="0" cy="-19" r="4.6" fill="none" stroke="#c99a2e" stroke-width=".9"/>`
      + ln('M0,-22 v6', 1.3, '#a97c1e');
  } else {
    icon = sh('M-3,-27 C-9,-25 -10,-17 -6,-13 C-2,-10 4,-11 6,-15 C1,-14 -4,-17 -4,-22 C-4,-24 -4,-26 -3,-27z', '#f6d55c', 1.3)
      + ln('M2,-26 h4 l-4,4 h4', 1.2, '#7a8ac4');
  }
  return `<g transform="scale(${sc})">${badge}${icon}</g>`;
}
