/* Home room art: Mocha's small evening flat (360x720 portrait). Fixed furniture sits exactly at
   HOME_SPOTS (layout.ts); the decor slots (window curtains, wall frame, quilt, rug, corner, pet)
   are left clear so decor art can sit on top. Keep these exports and signatures. */
import type { HomeActionId, ThemeId } from '../types';
import { HOME_WALL_BOTTOM } from '../layout';
import { INK, CREAM, fl, ln, sh, blob, box, shadow, tinyFace } from './kit';
import { TH } from './theme';
import { n, rng, hrect, mix, pumpkin, SPARK, HEART, FONT } from './core';

const W = 360, H = 720, WB = HOME_WALL_BOTTOM;
const hid = (k: string, t: ThemeId) => `hm-${k}-${t}`;
const safe = (t: ThemeId): ThemeId => (PAPER[t] ? t : 'everyday');
/** Theme art tokens, falling back to everyday if a theme has no palette yet. */
const T = (t: ThemeId) => TH[t] || TH.everyday;

/** Home wallpaper: soft blue-lavender with tiny dots, nudged per theme. */
const PAPER: Record<ThemeId, { wall: string; dot: string; dot2: string }> = {
  everyday: { wall: '#dfe0f3', dot: '#c4c7e8', dot2: '#f3d9e2' },
  spring: { wall: '#e9e1f4', dot: '#d6c6ea', dot2: '#f8cfdc' },
  summer: { wall: '#dcefee', dot: '#bfe0de', dot2: '#fbe3b0' },
  christmas: { wall: '#dde4f0', dot: '#c3cfe3', dot2: '#f1d3cf' },
  halloween: { wall: '#5d5486', dot: '#71679c', dot2: '#8a6fa8' },
};

const SKY: Record<ThemeId, [string, string, string]> = {
  everyday: ['#2c376e', '#6f6aa8', '#e8a98f'],
  spring: ['#3f3f80', '#9a7ab8', '#f2b3c8'],
  summer: ['#1f4a8a', '#4f8fd0', '#f6c98c'],
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
  const t = T(theme), p = PAPER[theme];
  return `<rect width="${W}" height="${WB + 2}" fill="${p.wall}"/>`
    + `<rect width="${W}" height="${WB}" fill="url(#${hid('paper', theme)})"/>`
    // faint picture rail near the top
    + `<path d="M0,60 C120,59 240,61 ${W},60" stroke="${INK}" stroke-opacity=".14" stroke-width="1.4" fill="none"/>`
    // skirting
    + sh(hrect(-4, WB - 9, W + 8, 12, 3, 0.5, 41), mix(t.trim, '#ffffff', 0.15), 1.8)
    + `<path d="M0,${WB - 4} h${W}" stroke="#fff" stroke-opacity=".35" stroke-width="1.2" stroke-dasharray="3 4"/>`;
}

function floor(theme: ThemeId): string {
  const t = T(theme);
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
function bathDoorBase(theme: ThemeId): string {
  const t = T(theme);
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
  if (theme === 'summer') {
    // blue summer evening: big soft moon, a leafy tree silhouette and fireflies
    let flies = '', glow = '';
    for (let i = 0; i < 9; i++) {
      const x = n(116 + R() * 88), y = n(112 + R() * 34);
      glow += `M${n(x - 3)},${y} a3,3 0 1,0 6,0 a3,3 0 1,0 -6,0 `;
      flies += `M${x},${y}h0.01 `;
    }
    return sky + starP(0.55)
      + `<circle cx="184" cy="88" r="19" fill="#fff6d0" opacity=".16"/><circle cx="184" cy="88" r="12" fill="#fff6d0" opacity=".25"/>`
      + sh(blob(184, 88, 9, 9, 0.05), '#fff3c0', 1)
      + `<path d="M180,85 a1.6,1.4 0 1,0 3.2,0 a1.6,1.4 0 1,0 -3.2,0 M186,92 a1.2,1 0 1,0 2.4,0 a1.2,1 0 1,0 -2.4,0" fill="#f1dc98"/>`
      + roofs('#2b4470') + lit('#ffe08a')
      + `<path d="M112,150 L112,104 C118,96 130,96 134,104 C142,102 148,110 144,118 C150,124 146,134 138,134 L130,134 L130,150z" fill="#1f3a5e"/>`
      + `<path d="${glow}" fill="#e9ff9a" opacity=".22"/>`
      + `<path d="${flies}" stroke="#f4ffb0" stroke-width="2.2" stroke-linecap="round"/>`;
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
  if (theme === 'summer') {
    // a slice of watermelon on a little saucer
    return sh(blob(188, 150, 11, 2.4, 0.05), '#cfe8f5', 1.3)
      + sh('M178,148 C179,139 184,135 188,135 C192,135 197,139 198,148z', '#f07a78', 1.5)
      + `<path d="M178.6,148 C180,141 184,137.5 188,137.5 C192,137.5 196,141 197.4,148" fill="none" stroke="#fff3e0" stroke-width="1.2"/>`
      + ln('M177.6,148.6 C179,138.4 184,134 188,134 C192,134 197,138.4 198.4,148.6', 2, '#6aa883')
      + `<g fill="${INK}"><circle cx="184" cy="143" r=".9"/><circle cx="188" cy="141" r=".9"/><circle cx="192" cy="143" r=".9"/><circle cx="186" cy="146" r=".8"/><circle cx="190" cy="146" r=".8"/></g>`;
  }
  return pumpkin(188, 146, 0.36, true);
}

/** Summer: a little glass wind chime (bell + paper strip) hanging from the window frame. */
function windChime(): string {
  return ln('M196,62 V69', 1)
    + sh('M190,76 C190,70 192.5,68.5 196,68.5 C199.5,68.5 202,70 202,76z', '#e4f4fb', 1.4)
    + `<path d="M192.4,73.6 q1.6,-1.6 3.2,0 q-1.6,1.4 -3.2,0z M197.4,72.4 q1.4,-1.3 2.8,0 q-1.4,1.2 -2.8,0z" fill="#f07a78"/>`
    + `<path d="M191,75 C194,74 198,74 201,75" fill="none" stroke="#9dbbe6" stroke-width=".9"/>`
    + ln('M196,76 V82', 0.9)
    + sh(blob(196, 77, 1.3, 1.3, 0), '#f6d55c', 0.8)
    + sh('M193.4,82 L198.6,82 L198.9,95 L193.2,95z', '#bfe6f5', 1.2)
    + `<path d="M194.6,86 h2.6 M194.6,89 h2.6" stroke="#6f9fc8" stroke-width=".8" stroke-linecap="round"/>`;
}

function windowPart(theme: ThemeId): string {
  const t = T(theme);
  const sillC = mix(t.trim, '#ffffff', 0.2);
  return `<g clip-path="url(#${hid('win', theme)})">${view(theme)}</g>`
    + `<path d="${hrect(115, 66, 90, 84, 7, 0.6, 61)}" fill="none" stroke="${CREAM}" stroke-width="6"/>`
    + `<path d="${hrect(111, 62, 98, 92, 9, 0.6, 62)}" fill="none" stroke="${INK}" stroke-width="1.8"/>`
    + `<path d="M160,68 C159.5,92 160.5,124 160,148 M117,108 C140,107.5 180,108.5 203,108" fill="none" stroke="${CREAM}" stroke-width="3.2"/>`
    + `<path d="M124,76 C128,72 134,70 140,70" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="1.6"/>`
    + sh(hrect(104, 150, 112, 8, 3, 0.5, 63), sillC, 1.8)
    + sillItem(theme)
    + (theme === 'summer' ? windChime() : '');
}

/* ------------------------------------------------------------ jar shelf (jar centre 238,132) */
function jarShelf(theme: ThemeId): string {
  const t = T(theme);
  return sh('M222,158 L222,170 C226,166 230,162 233,158z M254,158 L254,170 C250,166 246,162 243,158z', mix(t.trim, '#ffffff', 0.1), 1.4)
    + sh(hrect(212, 151, 52, 8, 2.5, 0.4, 71), mix(t.trim, '#ffffff', 0.25), 1.8)
    + `<path d="M216,154.5 h44" stroke="#fff" stroke-opacity=".4" stroke-width="1" stroke-dasharray="2 3"/>`;
}

/* ------------------------------------------------------------ kitchen corner (stove 300,250) */
function kitchen(theme: ThemeId): string {
  const t = T(theme);
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
  const t = T(theme);
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

/* ------------------------------------------------------------ bare floor (just moved in) */
/** Where unlockable furniture will stand the floor is left bare: a few nail heads, scuffs and a
 *  lonely moving box, so the flat reads as "just moved in". Furniture art (home-furniture.ts) covers it later. */
function bareFloor(theme: ThemeId): string {
  const t = T(theme);
  const nail = mix(t.floorA, INK, 0.45);
  // nail heads + scuffs near the empty furniture spots (phone 300,450 / armchair 280,610 / table 240,372 / stove 58,612)
  const nails = [[236, 344], [262, 346], [282, 470], [318, 468], [256, 588], [304, 590], [40, 590], [84, 592], [322, 512], [338, 418]];
  let dots = '';
  for (const [x, y] of nails) dots += `M${x},${y}h0.01 M${x + 5},${y}h0.01 `;
  const scuff = 'M222,360 q10,-2 22,0 M268,440 q8,1.5 18,-0.5 M248,604 q14,-2 26,1 M46,602 q9,1 18,-1 M310,520 q6,-1 12,0';
  // a faint dust outline where an old tenant's rug used to be
  const ghost = `<path d="M232,616 C232,606 262,600 286,600 C312,600 330,606 330,616 C330,626 306,630 282,630 C256,630 232,626 232,616z" fill="none" stroke="${INK}" stroke-opacity=".08" stroke-width="1.2" stroke-dasharray="4 5"/>`;
  return `<path d="${dots}" stroke="${nail}" stroke-width="2.2" stroke-linecap="round" opacity=".55"/>`
    + `<path d="${scuff}" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="1.4" stroke-linecap="round"/>`
    + ghost
    + movingBox(214, 492);
}

/** A single cardboard moving box, bottom-centre (x,y), ~34 wide x 26 tall, with tape and a flap up. */
function movingBox(x: number, y: number): string {
  const c = '#d9a877', cs = mix(c, INK, 0.18), ct = mix(c, '#ffffff', 0.2);
  return shadow(x + 2, y, 22, 3.6, 0.16)
    + `<g transform="translate(${x},${y})">`
    // front + side faces
    + sh('M-17,-1 C-17.4,-9 -17.2,-16 -17,-22 L10,-22 C10.3,-15 10.2,-8 10,-1z', c, 1.8)
    + sh('M10,-1 L10,-22 L19,-27 C19.3,-20 19.2,-12 19,-6z', cs, 1.6)
    // top face (open, one flap leaning up)
    + sh('M-17,-22 L-8,-27 L19,-27 L10,-22z', mix(c, INK, 0.32), 1.5)
    + sh('M-8,-27 L19,-27 L22,-36 C14,-36 2,-35.6 -3,-35z', ct, 1.5)
    // tape strip + a scribbled label
    + `<path d="M-4.5,-22 L-4.5,-1 M-1,-22 L-1,-1" stroke="#f3e2b8" stroke-width="2.6" opacity=".9"/>`
    + sh(box(-14, -15, 8, 6, 1.4, 0.2), CREAM, 1)
    + ln('M-12.5,-12.6 h4.4 M-12.5,-10.8 h3', 0.7)
    + ln('M3,-8 l2,-2 l2,2', 1, cs)
    + '</g>';
}

/* ================================================================== exports */

/** Always-there room only: walls, floor, window, bath door, stove corner, jar shelf and a plainly-made bed.
 *  Phone table, armchair, fireplace, dining table etc. are unlockable FURNITURE drawn elsewhere. */
export function homeBack(theme: ThemeId): string {
  theme = safe(theme);
  return wall(theme) + floor(theme)
    + windowPart(theme) + bathDoorBase(theme) + jarShelf(theme) + kitchen(theme)
    + bareFloor(theme) + bed(theme);
}

const MOTES = (() => {
  const R = rng(4242);
  return Array.from({ length: 12 }, () => ({ x: 20 + R() * 320, y: R() * 600, sp: 3 + R() * 5, ph: R() * 6.28, r: 0.9 + R() * 1.2 }));
})();

export function homeFront(theme: ThemeId, time: number): string {
  theme = safe(theme);
  const summer = theme === 'summer';
  const mc = theme === 'halloween' ? '#e9c6ff' : theme === 'spring' ? '#ffe0ea' : summer ? '#eaff9e' : '#fff3c8';
  // warm glow by the little stove (the only light source in the bare flat)
  let s = `<ellipse cx="300" cy="200" rx="80" ry="70" fill="url(#${hid('glow', theme)})"/>`
    + `<rect width="${W}" height="${H}" fill="url(#${hid('vig', theme)})"/>`;
  let motes = '', halos = '';
  for (const p of MOTES) {
    const y = n(80 + ((p.y - time * p.sp) % 560 + 560) % 560);
    const x = n(p.x + Math.sin(time * 0.4 + p.ph) * 10);
    if (summer) {
      // fireflies: slow wandering, blinking on and off
      const blink = Math.max(0, Math.sin(time * 1.3 + p.ph * 3));
      if (blink < 0.08) continue;
      const fx = n(p.x + Math.sin(time * 0.5 + p.ph) * 16), fy = n(120 + (p.y % 440) + Math.cos(time * 0.37 + p.ph) * 12);
      halos += `<circle cx="${fx}" cy="${fy}" r="${n(4 + p.r * 2)}" opacity="${n(0.18 * blink)}"/>`;
      motes += `<circle cx="${fx}" cy="${fy}" r="${n(p.r + 0.4)}" opacity="${n(0.4 + 0.6 * blink)}"/>`;
      continue;
    }
    const op = n(0.25 + 0.35 * (0.5 + 0.5 * Math.sin(time * 0.9 + p.ph * 2)));
    motes += `<circle cx="${x}" cy="${y}" r="${n(p.r)}" opacity="${op}"/>`;
  }
  if (halos) s += `<g fill="#d8ff6a">${halos}</g>`;
  s += `<g fill="${mc}">${motes}</g>`;
  if (theme === 'christmas' || theme === 'halloween' || summer) {
    const pts = theme === 'christmas' ? [[126, 80], [196, 120], [150, 96]] : summer ? [[132, 78], [204, 98]] : [[200, 76], [130, 118]];
    const col = theme === 'halloween' ? '#ffd08a' : '#ffffff';
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

/** Tap badge above a home spot; (0,0) = the badge's pointer tip. Big (r 16), thick outline, high-contrast icon. */
export function homeSpotIcon(action: HomeActionId, pulse: number): string {
  const p = Math.max(0, Math.min(1, pulse || 0));
  const sc = n(1 + 0.1 * p);
  const cy = -24;
  const badge = `<ellipse cx="0" cy="1" rx="7" ry="2" fill="${INK}" opacity=".18"/>`
    + `<circle cx="0" cy="${cy}" r="${n(19 + 3 * p)}" fill="#fff6c8" opacity="${n(0.25 + 0.35 * p)}"/>`
    + sh('M-7,-11 L0,-1 L7,-11z', CREAM, 2.6)
    + sh(blob(0, cy, 16, 15.6, 0.08), CREAM, 3)
    + `<path d="${blob(0, cy, 12.6, 12.2, 0.08)}" fill="none" stroke="#f2c14e" stroke-opacity=".55" stroke-width="1.4"/>`;
  let icon = '';
  if (action === 'cook') {
    icon = sh(box(-7, -21, 14, 9, 3, 0.3), '#e48a7a', 1.4)
      + ln('M-9,-19 h2 M7,-19 h2 M-7.5,-21 h15', 1.4)
      + ln('M-3,-24 c-2,-2 2,-3 0,-6 M3,-24 c-2,-2 2,-3 0,-6', 1.1, '#9a8a80');
  } else if (action === 'eat') {
    icon = ln('M1,-21 L8,-29 M3.5,-20 L10.5,-27', 1.5, '#b8743f')
      + sh(blob(0, -19.6, 8.4, 2.6, 0.05), '#fffdf8', 1.2)
      + sh('M-9,-19.5 C-9,-13.5 -5,-11 0,-11 C5,-11 9,-13.5 9,-19.5 C5,-18 -5,-18 -9,-19.5z', '#7fa8de', 1.4)
      + `<path d="M-5,-15 q2,1.4 4,0 M1,-15 q2,1.4 4,0" fill="none" stroke="#fff" stroke-width="1" stroke-linecap="round"/>`
      + ln('M-4,-24 c-2,-2 2,-3 0,-5', 1, '#9a8a80');
  } else if (action === 'warm') {
    icon = sh('M0,-29 C4,-25 8,-22 8,-16.5 C8,-12.5 4.5,-10 0,-10 C-4.5,-10 -8,-12.5 -8,-16.5 C-8,-20.5 -5.5,-22 -4.5,-25.5 C-2.5,-23 -1.4,-23 0,-29z', '#f08a3c', 1.4)
      + sh('M0,-21 C2.4,-19 4.2,-17.6 4.2,-15 C4.2,-12.8 2.2,-11.6 0,-11.6 C-2.2,-11.6 -4.2,-12.8 -4.2,-15 C-4.2,-17.2 -1.2,-17.8 0,-21z', '#ffd45e', 1);
  } else if (action === 'calendar') {
    icon = sh(box(-8.5, -27, 17, 17.5, 2.5, 0.3), '#ffffff', 1.4)
      + sh('M-8.5,-22 L-8.5,-24.5 Q-8.5,-27 -6,-27 L6,-27 Q8.5,-27 8.5,-24.5 L8.5,-22z', '#e4605c', 1.2)
      + ln('M-4,-29.5 v4 M4,-29.5 v4', 1.4)
      + `<g fill="${INK}" opacity=".6"><circle cx="-4.5" cy="-18.5" r=".9"/><circle cx="0" cy="-18.5" r=".9"/><circle cx="4.5" cy="-18.5" r=".9"/><circle cx="-4.5" cy="-14" r=".9"/><circle cx="0" cy="-14" r=".9"/></g>`
      + `<path transform="translate(4.6,-14.2) scale(.3)" d="${HEART}" fill="#e4605c"/>`;
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
      + ln('M0,-23 V-14', 1.1) + ln('M-6.5,-21 h4 M2.5,-21 h4 M-6.5,-18 h4', 0.8, '#7fa8de');
  } else if (action === 'save') {
    icon = sh(blob(0, -19, 7.5, 7.5, 0.05), '#f2c14e', 1.5)
      + `<circle cx="0" cy="-19" r="4.6" fill="none" stroke="#c99a2e" stroke-width=".9"/>`
      + ln('M0,-22 v6', 1.3, '#a97c1e');
  } else {
    icon = sh('M-3,-27 C-9,-25 -10,-17 -6,-13 C-2,-10 4,-11 6,-15 C1,-14 -4,-17 -4,-22 C-4,-24 -4,-26 -3,-27z', '#f6d55c', 1.3)
      + ln('M2,-26 h4 l-4,4 h4', 1.4, '#5a6ab4');
  }
  // icons are authored around (0,-19) at ~18 units; enlarge to fill the bigger badge
  return `<g transform="scale(${sc})">${badge}<g transform="translate(0,${cy}) scale(1.4) translate(0,19)">${icon}</g></g>`;
}

/* ------------------------------------------------------------ v3 additions */

/** Bath door overlay: occupied = warm light under the door, steam puffs drifting from the top edge and a
 *  swinging "occupied" duck sign; free = nothing (the calm duck sign is part of homeBack).
 *  (0,0) = HOME_SPOTS.bath (door bottom-centre; leaf spans x -25..25, y -118..0). */
export function bathDoor(occupied: boolean, time: number): string {
  if (!occupied) return '';
  const t = time || 0;
  // warm light leaking under the door
  let s = `<path d="M-24,-1.6 C-10,-2.4 10,-2.4 24,-1.6 L24,0.6 L-24,0.6z" fill="#ffd98a" opacity=".9"/>`
    + `<ellipse cx="0" cy="3" rx="30" ry="5" fill="#ffd98a" opacity=".28"/>`
    + `<ellipse cx="0" cy="5" rx="40" ry="8" fill="#ffe2a6" opacity=".14"/>`;
  // steam puffs rising out of the gap over the door
  for (let i = 0; i < 4; i++) {
    const k = ((t * 0.32 + i * 0.25) % 1 + 1) % 1;
    const x = n(-16 + i * 11 + Math.sin(t * 1.2 + i * 1.7) * 3 + k * 6);
    const y = n(-120 - k * 34);
    const r = n(3.4 + k * 5);
    const op = n(Math.sin(k * Math.PI) * 0.75);
    if (op < 0.04) continue;
    s += `<g opacity="${op}">`
      + `<path d="${blob(x, y, r, r * 0.8, 0.2)} ${blob(x + r * 0.8, y + r * 0.3, r * 0.7, r * 0.55, -0.2)}" fill="#ffffff"/>`
      + `<path d="M${n(x - r * 0.5)},${n(y - r * 0.2)} q${n(r * 0.4)},${n(-r * 0.5)} ${n(r)},${n(-r * 0.3)}" fill="none" stroke="#c9d8e6" stroke-width="1" stroke-linecap="round"/>`
      + '</g>';
  }
  // swinging "occupied" sign on its hook (covers the calm sign underneath)
  const ang = n(Math.sin(t * 2.6) * 9);
  s += `<circle cx="0" cy="-114" r="1.4" fill="${INK}"/>`
    + `<g transform="rotate(${ang} 0 -114)">`
    + ln('M-6,-110 L0,-114 L6,-110', 1.2)
    + sh(blob(0, -98, 12.5, 11.5, 0.1), '#ffe9ef', 1.8)
    + sh('M-7,-95 C-7,-100 -3,-101 0,-99 C0,-104 3,-107 6,-105 C9,-103 8,-99 6,-98 C9,-98 9,-93 5,-91 C0,-89 -7,-90 -7,-95z', '#f6d55c', 1.2)
    + `<path d="M8.5,-102.5 l3,0.6 l-2.6,1.5z" fill="#f08a3c"/>`
    // sleepy closed eye: the duck is having a bath
    + ln('M3.6,-103 q1.2,1 2.4,0', 0.9)
    + sh('M-9,-88 L9,-88 L8,-82 L-8,-82z', '#e4605c', 1.2)
    + `<text x="0" y="-83.6" text-anchor="middle" font-family="${FONT}" font-size="5" font-weight="700" fill="#fff">busy</text>`
    + `<circle cx="-8" cy="-104" r="1.6" fill="#bfe6f5" stroke="${INK}" stroke-width=".6"/><circle cx="-5" cy="-108" r="1" fill="#bfe6f5"/>`
    + '</g>';
  return s;
}

/** Shooting star at (0,0): the head travels from top-right (+26,-16) to bottom-left (-26,+16) as t goes 0..1,
 *  with a sparkly trail streaming back up-right, fading in and out. The caller positions and clips it. */
export function shootingStar(t: number): string {
  const k = Math.max(0, Math.min(1, t || 0));
  const fade = Math.sin(k * Math.PI);
  if (fade < 0.02) return '';
  const hx = n(26 - 52 * k), hy = n(-16 + 32 * k);
  // direction of travel is (-52, 32); the trail points back the other way
  const len = 18 + 18 * fade;
  const ux = 0.851, uy = -0.524; // normalised (52,-32)
  const tx = n(hx + ux * len), ty = n(hy + uy * len);
  const px = -uy, py = ux; // perpendicular
  const w = 2.4;
  const trail = `M${n(hx + px * w)},${n(hy + py * w)} L${tx},${ty} L${n(hx - px * w)},${n(hy - py * w)}z`;
  let s = `<g opacity="${n(fade)}">`
    + `<path d="${trail}" fill="#ffe9a8" opacity=".55"/>`
    + `<path d="M${hx},${hy} L${n(hx + ux * len * 0.7)},${n(hy + uy * len * 0.7)}" stroke="#fffbe6" stroke-width="1.4" stroke-linecap="round"/>`;
  // little sparkles left along the trail
  for (let i = 1; i <= 3; i++) {
    const d = len * (0.25 * i + 0.05);
    const tw = 0.5 + 0.5 * Math.sin(k * 40 + i * 2.3);
    s += `<path transform="translate(${n(hx + ux * d + px * (i % 2 ? 2 : -2))},${n(hy + uy * d + py * (i % 2 ? 2 : -2))}) scale(${n((0.32 - i * 0.06) * (0.6 + 0.4 * tw))})" d="${SPARK}" fill="#fff6c8" opacity="${n(0.9 - i * 0.2)}"/>`;
  }
  // twinkling head
  const tw = 0.5 + 0.5 * Math.sin(k * 60);
  s += `<circle cx="${hx}" cy="${hy}" r="${n(4 + 2 * tw)}" fill="#fff4b8" opacity=".35"/>`
    + `<path transform="translate(${hx},${hy}) scale(${n(0.55 + 0.25 * tw)}) rotate(${n(k * 90)})" d="${SPARK}" fill="#ffffff"/>`
    + `<circle cx="${hx}" cy="${hy}" r="1.5" fill="#fffbe6"/>`
    + '</g>';
  return s;
}

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const CAL_HEAD: Record<ThemeId, string> = {
  everyday: '#e4605c', spring: '#ef8fae', summer: '#4fa6d2', christmas: '#c9584f', halloween: '#f08a3c',
};

/** Tiny festival sticker centred (0,0), ~12 wide. */
function sticker(kind: string): string {
  const disc = sh(blob(0, 0, 7, 6.8, 0.1), '#ffffff', 1.1);
  if (kind === 'halloween') return disc + pumpkin(0, 0.6, 0.34, false);
  if (kind === 'christmas') {
    return disc + sh('M0,-5.5 L4.2,1 L2,1 L4.8,4.4 L-4.8,4.4 L-2,1 L-4.2,1z', '#4f8f68', 0.9)
      + `<circle cx="0" cy="-5.6" r="1.1" fill="#f6cf6b"/><circle cx="-1.4" cy="2.6" r=".7" fill="#e4605c"/><circle cx="1.6" cy="0" r=".7" fill="#f6cf6b"/>`;
  }
  if (kind === 'spring') {
    let petals = '';
    for (let i = 0; i < 5; i++) {
      const a = (i * 72 - 90) * Math.PI / 180;
      petals += blob(n(Math.cos(a) * 2.8), n(Math.sin(a) * 2.8), 2.2, 2.2, 0) + ' ';
    }
    return disc + `<path d="${petals}" fill="#f6b6c8" stroke="${INK}" stroke-width=".6"/><circle cx="0" cy="0" r="1.2" fill="#f6cf6b"/>`;
  }
  if (kind === 'summer') {
    return disc + `<path d="M0,-5.6 V-4 M0,4 V5.6 M-5.6,0 H-4 M4,0 H5.6 M-4,-4 l1.1,1.1 M4,4 l-1.1,-1.1 M4,-4 l-1.1,1.1 M-4,4 l1.1,-1.1" stroke="#f0a43c" stroke-width="1.1" stroke-linecap="round"/>`
      + sh(blob(0, 0, 2.9, 2.9, 0), '#f9d75e', 0.8);
  }
  if (kind === 'valentine') return disc + `<path transform="translate(0,-0.4) scale(.5)" d="${HEART}" fill="#e4605c" stroke="${INK}" stroke-width="1.4"/>`;
  if (kind === 'tanabata') {
    return disc + `<path transform="scale(.62)" d="${SPARK}" fill="#f6cf6b" stroke="${INK}" stroke-width="1"/>`
      + `<path d="M-4.6,3 l2,-1 M3.4,-3.6 l1.4,-0.8" stroke="#9dbbe6" stroke-width="1" stroke-linecap="round"/>`;
  }
  // new year: a little gold sparkle burst
  return disc + `<path transform="scale(.55)" d="${SPARK}" fill="#f2c14e" stroke="${INK}" stroke-width="1"/>`
    + `<path transform="translate(3.6,-3.4) scale(.22)" d="${SPARK}" fill="#e4605c"/>`;
}

function festivalKind(festival: string | null): string | null {
  if (!festival) return null;
  const f = festival.toLowerCase();
  if (f.includes('halloween')) return 'halloween';
  if (f.includes('christmas')) return 'christmas';
  if (f.includes('valentine')) return 'valentine';
  if (f.includes('tanabata')) return 'tanabata';
  if (f.includes('new_year') || f.includes('new year') || f.includes('newyear')) return 'new_year';
  if (f.includes('spring') || f.includes('blossom') || f.includes('sakura') || f.includes('hanami')) return 'spring';
  if (f.includes('summer')) return 'summer';
  return null;
}

/** Wall calendar at (0,0) = HOME_SPOTS.calendar centre (~44 x 50): coloured header with the 3-letter month,
 *  a big day number, a pin on top and a tiny festival sticker when `festival` names one. month is 1..12. */
export function calendarArt(month: number, day: number, festival: string | null, theme: ThemeId): string {
  theme = safe(theme);
  const head = CAL_HEAD[theme];
  const m = MONTHS[(((Math.round(month || 1) - 1) % 12) + 12) % 12];
  const d = Math.max(1, Math.min(31, Math.round(day || 1)));
  const kind = festivalKind(festival);
  const page = box(-22, -25, 44, 50, 5, 0.6);
  let s = `<path d="${page}" fill="${INK}" opacity=".14" transform="translate(2,2.4)"/>`
    // a torn-off page peeking from behind
    + sh('M-20,22 C-12,27 10,27.6 21,23.6 L21,26 C10,29.6 -12,29 -20,25z', '#f3ece0', 1.2)
    + sh(page, '#fffaf2', 2)
    + sh('M-21.6,-11 C-21.8,-14 -21.8,-17 -21.7,-20 Q-21.6,-24.9 -17,-24.9 C-6,-25.3 6,-24.7 17,-24.9 Q21.9,-24.8 21.9,-20 C22,-17 22,-14 21.8,-11 C8,-10.4 -8,-11.6 -21.6,-11z', head, 1.8)
    + `<path d="M-17,-21.6 C-10,-23 -4,-23 2,-22.6" stroke="#fff" stroke-opacity=".45" stroke-width="1.2" fill="none" stroke-linecap="round"/>`
    + `<text x="0" y="-14" text-anchor="middle" font-family="${FONT}" font-size="10" font-weight="800" letter-spacing=".6" fill="#ffffff">${m}</text>`
    + `<text x="${kind ? -3 : 0}" y="14.5" text-anchor="middle" font-family="${FONT}" font-size="23" font-weight="800" fill="${INK}">${d}</text>`
    // tiny week dots along the bottom
    + `<path d="M-15,20 h0.01 M-10,20 h0.01 M-5,20 h0.01 M0,20 h0.01 M5,20 h0.01" stroke="${INK}" stroke-opacity=".3" stroke-width="1.6" stroke-linecap="round"/>`
    // pin
    + `<ellipse cx="1" cy="-23.6" rx="3" ry="1" fill="${INK}" opacity=".2"/>`
    + sh(blob(0, -26, 3.6, 3.4, 0.1), '#e4605c', 1.4)
    + `<circle cx="-1.1" cy="-27.2" r="1" fill="#fff" opacity=".8"/>`;
  if (kind) s += `<g transform="translate(14.5,13) rotate(12)">${sticker(kind)}</g>`;
  return s;
}

const BLANKET: Record<ThemeId, string> = {
  everyday: '#9dbbe6', spring: '#f6b6c8', summer: '#8fd0c4', christmas: '#c9584f', halloween: '#b88ad6',
};

/** Blanket drawn OVER the lying bear. (0,0) = HOME_SPOTS.sleep (bed bottom-centre 96,452). Covers the mattress
 *  from x ~-24 to +77 (the left ~30 units over the pillow stay open for his head), top surface down over the front edge.
 *  quilt 'quilt_hearts' / 'quilt_stars' gives a patchwork quilt; anything else a plain cozy blanket. */
export function bedBlanket(quilt: string | null, theme: ThemeId): string {
  theme = safe(theme);
  const isHearts = quilt === 'quilt_hearts', isStars = quilt === 'quilt_stars';
  const base = isHearts ? '#f7b3b8' : isStars ? '#8ea6dc' : BLANKET[theme];
  const dark = mix(base, INK, 0.2), light = mix(base, '#ffffff', 0.35);
  const body = 'M-24,-47 C-22,-55 -10,-60 8,-60 C30,-61 52,-58 66,-54 C74,-52 78,-46 77,-38 C77.4,-30 76.6,-24 75,-17 C50,-13.6 10,-13.6 -21,-16.6 C-24.4,-26 -25.6,-37 -24,-47z';
  const clipId = `hm-blk-${quilt || 'plain'}-${theme}`;
  let s = `<defs><clipPath id="${clipId}"><path d="${body}"/></clipPath></defs>`
    + fl(body, base);
  let inner = '';
  if (isHearts || isStars) {
    // patchwork: alternating light squares, then the motif on top
    let patch = '';
    for (let cx = 0; cx < 6; cx++) {
      for (let cy = 0; cy < 3; cy++) {
        if ((cx + cy) % 2) continue;
        const x = -20 + cx * 17, y = -62 + cy * 16;
        patch += `M${x},${y}h17v16h-17z `;
      }
    }
    inner += `<path d="${patch}" fill="${light}" transform="translate(1.3,1)"/>`
      + `<path d="M-3,-62 V-12 M14,-62 V-12 M31,-62 V-12 M48,-62 V-12 M65,-62 V-12 M-26,-46 H80 M-26,-30 H80" stroke="#fff" stroke-width="1.1" stroke-dasharray="2 2" opacity=".8"/>`;
    const spots = [[6, -52], [40, -52], [23, -38], [57, -38], [6, -22], [40, -22], [70, -24]];
    for (const [x, y] of spots) {
      inner += isHearts
        ? `<path transform="translate(${x},${y}) scale(.5)" d="${HEART}" fill="#e4605c" stroke="${INK}" stroke-width="1.6"/>`
        : `<path transform="translate(${x},${y}) scale(.62)" d="${SPARK}" fill="#f6d55c" stroke="${INK}" stroke-width="1.2"/>`;
    }
    if (isStars) inner += `<path d="M24,-55h0.01 M56,-50h0.01 M-6,-34h0.01 M44,-30h0.01 M24,-20h0.01" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>`;
  } else {
    // plain cozy blanket: two soft stripes and knit stitches
    inner += `<path d="M-26,-30 C10,-27 46,-27 80,-31 L80,-26 C46,-22 10,-22 -26,-25z M-26,-52 C10,-50 46,-50 80,-50 L80,-46 C46,-46 10,-46 -26,-48z" fill="${light}" opacity=".75"/>`
      + `<path d="M4,-40 l3,2.4 l3,-2.4 M22,-41 l3,2.4 l3,-2.4 M40,-40 l3,2.4 l3,-2.4 M58,-39 l3,2.4 l3,-2.4" fill="none" stroke="${dark}" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" opacity=".7"/>`;
  }
  s += `<g clip-path="url(#${clipId})">${inner}`
    // the blanket hangs over the mattress front edge: a soft darker band below the fold
    + `<path d="M-26,-33 C10,-30 46,-30 80,-34 L80,-10 L-26,-10z" fill="${INK}" opacity=".1"/>`
    + '</g>'
    + ln(body, 2.1)
    // fold line along the mattress edge + a couple of rumples over the curled-up body
    + ln('M-23,-33 C10,-30 46,-30 76.6,-34', 1.4, mix(base, INK, 0.45))
    + ln('M6,-53 C14,-55.6 24,-55.6 32,-52.4 M44,-45 C50,-44 56,-44 62,-46', 1.1, mix(base, INK, 0.4))
    + `<path d="M-18,-19.6 C10,-17 46,-17 71,-20" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="1.1" stroke-dasharray="2.4 2.6"/>`
    // turned-down cuff under the bear's chin
    + sh('M-24,-47 C-22,-55 -17,-58.6 -11,-59.4 C-13.4,-46 -13.4,-30 -10.4,-16 L-21,-16.6 C-24.4,-26 -25.6,-37 -24,-47z', isHearts || isStars ? '#fffaf2' : CREAM, 1.8)
    + `<path d="M-19,-50 C-19.6,-40 -19.4,-28 -17,-20" fill="none" stroke="${base}" stroke-width="1.3" stroke-dasharray="2 2.4"/>`;
  return s;
}

/** Window rectangle in scene coords (for clipping the shooting star). */
export const HOME_WINDOW = { x: 110, y: 63, w: 100, h: 90 };
