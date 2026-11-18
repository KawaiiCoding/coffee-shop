/* Room: scene defs, back wall / floor / door / window with seasonal views, theme fixtures,
   and the front overlay (petals, snow, tint/vignette). */
import type { ThemeId } from '../types';
import { WALL_BOTTOM } from '../layout';
import { INK, CREAM, fl, ln, sh, blob, box } from './kit';
import { TH } from './theme';
import { n, rng, hrect, hell, mix, pumpkin, yarn } from './core';

const W = 360, H = 720, WB = WALL_BOTTOM;
const id = (k: string, t: ThemeId) => `cs-${k}-${t}`;

/* ------------------------------------------------------------------ defs */
export function sceneDefs(theme: ThemeId): string {
  const t = TH[theme] ?? TH.everyday;
  let motif = '';
  if (theme === 'everyday') motif = `<path transform="translate(8,8) scale(.32)" d="M0,5 C-10,-2 -6,-10 0,-5 C6,-10 10,-2 0,5z" fill="${t.wallDot}"/><circle cx="23" cy="23" r="1.6" fill="${t.wallDot}"/>`;
  if (theme === 'spring') motif = `<g transform="translate(8,8)" fill="${t.wallDot}"><circle cx="0" cy="-2.2" r="1.8"/><circle cx="2.1" cy="-0.6" r="1.8"/><circle cx="1.3" cy="1.9" r="1.8"/><circle cx="-1.3" cy="1.9" r="1.8"/><circle cx="-2.1" cy="-0.6" r="1.8"/></g><circle cx="8" cy="8" r="1" fill="#fff"/><circle cx="23" cy="23" r="1.4" fill="${t.wallDot}"/>`;
  if (theme === 'christmas') motif = `<path d="M8,4 v8 M4,8 h8 M5.2,5.2 l5.6,5.6 M10.8,5.2 l-5.6,5.6" stroke="${t.wallDot}" stroke-width="1.2" stroke-linecap="round"/><circle cx="23" cy="23" r="1.6" fill="${t.wallDot}"/>`;
  if (theme === 'halloween') motif = `<path transform="translate(8,8) scale(.5)" d="M0,-6 Q0.8,-0.8 6,0 Q0.8,0.8 0,6 Q-0.8,0.8 -6,0 Q-0.8,-0.8 0,-6z" fill="${t.wallDot}"/><circle cx="23" cy="23" r="1.3" fill="${t.wallDot}"/>`;
  const vig = theme === 'halloween' ? '#1c0f2e' : theme === 'christmas' ? '#3a2030' : '#6b3a2a';
  const vigOp = theme === 'halloween' ? 0.5 : 0.18;
  return `<pattern id="${id('paper', theme)}" width="30" height="30" patternUnits="userSpaceOnUse">${motif}</pattern>`
    + `<clipPath id="${id('win', theme)}"><rect x="120" y="66" width="82" height="84" rx="5"/></clipPath>`
    + `<radialGradient id="${id('vig', theme)}" cx=".5" cy=".5" r=".72"><stop offset=".6" stop-color="${vig}" stop-opacity="0"/><stop offset="1" stop-color="${vig}" stop-opacity="${vigOp}"/></radialGradient>`
    + `<linearGradient id="${id('beam', theme)}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${theme === 'halloween' || theme === 'christmas' ? '#d8e2ff' : '#fff8e0'}" stop-opacity=".32"/><stop offset="1" stop-color="#fff8e0" stop-opacity="0"/></linearGradient>`
    + `<linearGradient id="${id('sky', theme)}" x1="0" y1="0" x2="0" y2="1">${skyStops(theme)}</linearGradient>`;
}

function skyStops(theme: ThemeId): string {
  const s: Record<ThemeId, [string, string]> = {
    everyday: ['#a9dcf2', '#e4f5fb'],
    spring: ['#f9cfdc', '#fdf0f3'],
    christmas: ['#22365e', '#4a6a9c'],
    halloween: ['#2f2158', '#a0598a'],
  };
  const [a, b] = s[theme];
  return `<stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/>`;
}

/* ------------------------------------------------------------ pieces */
function floor(theme: ThemeId): string {
  const t = TH[theme];
  const R = rng(311);
  let s = `<rect x="0" y="${WB}" width="${W}" height="${H - WB}" fill="${t.floorA}"/>`;
  let tint = '', seams = '', joints = '', grain = '';
  let y = WB + 4, row = 0;
  while (y < H) {
    const h = 26;
    if (row % 2) tint += `M0,${y}h${W}v${h}h-${W}z`;
    seams += `M-2,${n(y + h)} C120,${n(y + h + 0.7)} 240,${n(y + h - 0.7)} ${W + 2},${n(y + h)} `;
    let x = -20 - R() * 60;
    while (x < W) {
      x += 70 + R() * 70;
      if (x < W - 6) {
        joints += `M${n(x)},${n(y + 2)} C${n(x + 0.6)},${n(y + h * 0.4)} ${n(x - 0.6)},${n(y + h * 0.7)} ${n(x)},${n(y + h - 2)} `;
        if (R() < 0.4) grain += `M${n(x + 12)},${n(y + h * 0.5)} q${n(14 + R() * 10)},-1.5 ${n(28 + R() * 14)},0.5 `;
      }
    }
    y += h; row++;
  }
  s += `<path d="${tint}" fill="${t.floorB}" opacity=".35"/>`
    + `<path d="${seams}" fill="none" stroke="${INK}" stroke-opacity=".2" stroke-width="1.1"/>`
    + `<path d="${joints}" fill="none" stroke="${INK}" stroke-opacity=".16" stroke-width="1"/>`
    + `<path d="${grain}" fill="none" stroke="${INK}" stroke-opacity=".09" stroke-width=".9"/>`;
  return s;
}

function wall(theme: ThemeId): string {
  const t = TH[theme];
  let panels = '';
  for (let i = 0; i < 9; i++) panels += hrect(6 + i * 40, 204, 30, 36, 4, 0.5, i + 3);
  return `<rect width="${W}" height="${WB + 2}" fill="${t.wall}"/>`
    + `<rect width="${W}" height="${WB}" fill="url(#${id('paper', theme)})"/>`
    + `<rect x="0" y="194" width="${W}" height="${WB - 194 + 2}" fill="${t.dado}"/>`
    + `<path d="${panels}" fill="${mix(t.dado, '#ffffff', 0.12)}" stroke="${INK}" stroke-opacity=".18" stroke-width="1.1"/>`
    + sh(hrect(-4, 188, W + 8, 8, 3, 0.5, 5), t.trim, 1.8)
    + `<path d="M0,192 h${W}" stroke="${t.stitch}" stroke-opacity=".6" stroke-width="1.2" stroke-dasharray="3 4"/>`
    + sh(hrect(-4, WB - 5, W + 8, 9, 3, 0.5, 9), t.trim, 1.8);
}

function door(theme: ThemeId): string {
  const t = TH[theme];
  const frame = 'M22,253 C21,230 22,196 22,172 C22,148 40,134 60,134 C80,134 98,148 98,172 C98,196 99,230 98,253z';
  const leaf = 'M30,250 C29,226 30,196 30,173 C30,155 43,142 60,142 C77,142 90,155 90,173 C90,196 91,226 90,250z';
  let s = sh(frame, t.trim, 2) + sh(leaf, t.door, 2)
    + `<path d="${hrect(36, 202, 22, 40, 4, 0.4, 21)} ${hrect(62, 202, 22, 40, 4, 0.4, 22)}" fill="#000" fill-opacity=".05" stroke="${INK}" stroke-opacity=".3" stroke-width="1.2"/>`
    + sh(hell(60, 169, 11, 11, 0.03, 4), t.doorWin, 2)
    + ln('M60,158 v22 M49,169 h22', 1.6, t.trim)
    + ln('M54,163 q3,-3 7,-3', 1.4, '#ffffff')
    + sh(blob(83, 214, 2.8, 2.8), '#f6cf6b', 1.4);
  if (theme !== 'christmas') {
    // little hanging sign with a heart
    s += ln('M53,184 L60,180 L67,184', 1.2)
      + sh(box(49, 184, 22, 12, 4, 0.5), CREAM, 1.6)
      + `<path transform="translate(60,190) scale(.36)" d="M0,5 C-10,-2 -6,-10 0,-5 C6,-10 10,-2 0,5z" fill="${t.accent}"/>`;
  }
  // knitted doormat
  s += sh(hell(60, 262, 30, 7, 0.03, 8), t.rug[0], 1.8)
    + `<path d="${hell(60, 262, 24, 4.4, 0.02, 9)}" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="1.2" stroke-dasharray="2.5 3"/>`;
  return s;
}

function windowView(theme: ThemeId): string {
  const sky = `<rect x="118" y="64" width="86" height="88" fill="url(#${id('sky', theme)})"/>`;
  if (theme === 'everyday') {
    return sky
      + `<circle cx="186" cy="84" r="13" fill="#fff4b8" opacity=".5"/><circle cx="186" cy="84" r="8" fill="#ffe28a"/>`
      + `<path d="${blob(140, 88, 11, 4.5)} ${blob(149, 85, 7, 4.5)}" fill="#fff"/>`
      + `<path d="${blob(172, 104, 7, 3)}" fill="#fff" opacity=".85"/>`
      + `<path d="M116,152 C126,126 146,124 160,136 C172,124 194,120 206,132 L206,154z" fill="#8fc3a7"/>`
      + `<path d="M116,154 C134,138 154,140 170,146 C184,138 198,140 206,146 L206,156z" fill="#7fb894"/>`
      + `<path d="M138,134 C138,124 146,118 151,124 C156,118 162,126 158,134z" fill="#6aa883"/>`
      + `<circle cx="131" cy="143" r="1.8" fill="#f7a8b8"/><circle cx="178" cy="146" r="1.8" fill="#fff"/><circle cx="194" cy="141" r="1.8" fill="#f7a8b8"/><circle cx="160" cy="148" r="1.6" fill="#f6cf6b"/>`;
  }
  if (theme === 'spring') {
    return sky
      + `<path d="M116,152 C130,132 150,134 166,142 C180,134 196,132 206,138 L206,156z" fill="#b5dca5"/>`
      + ln('M134,154 C136,138 140,124 148,112 M141,128 C150,124 158,118 164,108 M146,116 C142,108 136,104 130,102', 3.2, '#9a6a52')
      + `<path d="${blob(140, 100, 15, 12)} ${blob(160, 104, 13, 11)} ${blob(150, 88, 12, 9)}" fill="#f6b6c8"/>`
      + `<path d="${blob(133, 96, 6, 5)} ${blob(158, 96, 7, 5)} ${blob(166, 110, 5, 4)}" fill="#fbd8e2"/>`
      + `<path d="${blob(190, 84, 9, 3.5)} ${blob(184, 82, 5, 3)}" fill="#fff" opacity=".9"/>`
      + `<g fill="#f6b6c8"><path d="M184,120 q3,-3 6,0 q-3,3 -6,0z"/><path d="M194,132 q3,-3 6,0 q-3,3 -6,0z"/><path d="M174,134 q3,-3 6,0 q-3,3 -6,0z"/></g>`;
  }
  if (theme === 'christmas') {
    const R = rng(77);
    let stars = '';
    for (let i = 0; i < 14; i++) stars += `M${n(122 + R() * 78)},${n(70 + R() * 50)}h0.01 `;
    const pine = (x: number, y: number, s: number) =>
      `<path transform="translate(${x},${y}) scale(${s})" d="M0,-24 C3,-18 6,-14 9,-10 C7,-10 6,-9 5,-9 C8,-5 11,-1 13,2 C5,3 -5,3 -13,2 C-11,-1 -8,-5 -5,-9 C-6,-9 -7,-10 -9,-10 C-6,-14 -3,-18 0,-24z" fill="#3f7a56"/>`
      + `<path transform="translate(${x},${y}) scale(${s})" d="M0,-24 C2,-21 3,-19 4,-17 C2,-16 -2,-16 -4,-17 C-3,-19 -2,-21 0,-24z" fill="#f4f8ff"/>`;
    return sky
      + `<path d="${stars}" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>`
      + `<path d="M190,78 C184,80 182,88 186,93 C190,98 197,97 200,93 C195,94 190,90 190,85 C190,82 191,80 190,78z" fill="#fff3c4"/>`
      + `<path d="M116,152 L116,136 C138,126 158,138 178,130 C190,126 200,128 206,131 L206,154z" fill="#f4f8ff"/>`
      + pine(138, 136, 0.95) + pine(184, 134, 0.8)
      + `<path d="M154,140 L154,128 L162,121 L170,128 L170,140z" fill="#c9584f"/><path d="M152,129 L162,119 L172,129" fill="none" stroke="#f4f8ff" stroke-width="2.4"/><rect x="159" y="130" width="6" height="6" rx="1" fill="#ffd45e"/>`
      + `<path d="M116,154 C140,144 170,150 206,144 L206,156 L116,156z" fill="#ffffff"/>`;
  }
  // halloween
  const bat = (x: number, y: number, s: number) =>
    `<path transform="translate(${x},${y}) scale(${s})" d="M0,0 C-2,-4 -6,-5 -11,-3 C-8,-2 -7,0 -7,2 C-5,0 -2,0 0,3 C2,0 5,0 7,2 C7,0 8,-2 11,-3 C6,-5 2,-4 0,0z" fill="#1c1230"/>`;
  return sky
    + `<circle cx="182" cy="88" r="17" fill="#ffe9a6" opacity=".18"/><circle cx="182" cy="88" r="11" fill="#ffe9a6"/><circle cx="178" cy="85" r="2" fill="#f2d68a"/><circle cx="185" cy="92" r="1.4" fill="#f2d68a"/>`
    + `<path d="M116,152 L116,140 C134,130 150,136 166,132 C182,128 196,134 206,132 L206,154z" fill="#22163d"/>`
    + ln('M138,140 C138,128 136,118 132,108 M136,122 C140,116 146,114 150,110 M134,114 C130,110 126,110 124,106', 2.4, '#22163d')
    + bat(150, 84, 0.9) + bat(165, 104, 0.6) + bat(140, 98, 0.5);
}

function windowFrame(theme: ThemeId): string {
  const t = TH[theme];
  const sillC = mix(t.trim, '#ffffff', 0.18);
  // scalloped crochet valance across the top
  let lace = 'M116,64 ';
  for (let i = 0; i < 9; i++) { const x = 116 + i * 10; lace += `C${x + 1},${74} ${x + 9},${74} ${x + 10},64 `; }
  const curtL = 'M108,60 C116,62 124,62 130,60 C129,82 122,98 125,116 C119,120 113,120 108,118 C110,98 106,78 108,60z';
  const curtR = 'M214,60 C206,62 198,62 192,60 C193,82 200,98 197,116 C203,120 209,120 214,118 C212,98 216,78 214,60z';
  return `<g clip-path="url(#${id('win', theme)})">${windowView(theme)}</g>`
    + `<path d="${hrect(116, 62, 90, 92, 7, 0.6, 31)}" fill="none" stroke="${t.trim}" stroke-width="6"/>`
    + `<path d="${hrect(113, 59, 96, 98, 9, 0.6, 32)}" fill="none" stroke="${INK}" stroke-width="1.8"/>`
    + `<path d="M161,64 C160.5,90 161.5,120 161,152 M118,108 C140,107.5 180,108.5 204,108" fill="none" stroke="${t.trim}" stroke-width="3.4"/>`
    + `<path d="M126,74 C130,70 136,68 142,68" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="1.6"/>`
    + sh(lace + 'L206,64z', CREAM, 1.4)
    + `<path d="M120,67 h82" stroke="${INK}" stroke-opacity=".3" stroke-width="1" stroke-dasharray="1.5 3"/>`
    + sh(curtL, t.curtain, 2) + sh(curtR, t.curtain, 2)
    + `<path d="M114,72 C116,90 116,104 118,114 M208,72 C206,90 206,104 204,114" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="1.3" stroke-dasharray="2 3"/>`
    + sh(box(108, 105, 22, 5, 2, 0.4), CREAM, 1.4) + sh(box(192, 105, 22, 5, 2, 0.4), CREAM, 1.4)
    + ln('M102,58 C140,57 182,59 220,58', 2.6, t.trim)
    + sh(blob(102, 58, 3, 3), t.trim, 1.4) + sh(blob(220, 58, 3, 3), t.trim, 1.4)
    + sh(hrect(108, 150, 106, 8, 3, 0.5, 33), sillC, 1.8);
}

function sillItems(theme: ThemeId): string {
  if (theme === 'everyday') {
    return sh('M190,150 C189,145 189,142 190,140 L202,140 C203,142 203,145 202,150z', '#e79a7e', 1.6)
      + sh('M196,140 C190,138 189,130 193,128 C196,131 196,135 196,140z', '#7fb894', 1.4)
      + sh('M196,140 C202,137 203,129 199,127 C196,130 196,135 196,140z', '#8fc3a7', 1.4)
      + sh('M196,140 C195,133 196,126 196,122 C198,127 198,134 196,140z', '#6aa883', 1.2)
      + sh(box(128, 143, 9, 7, 2, 0.3), '#9dbbe6', 1.4) + ln('M137,145 q3,1 0,3.5', 1.2);
  }
  if (theme === 'spring') {
    return sh('M188,150 C187,145 187,142 188,140 L204,140 C205,142 205,145 204,150z', '#9dbbe6', 1.6)
      + ln('M192,140 C192,134 191,130 191,127 M196,140 V124 M200,140 C200,135 201,131 202,128', 1.4, '#6aa883')
      + sh('M188,128 C188,123 191,122 192,124 C193,122 195,123 195,128 C195,131 188,131 188,128z', '#f6b6c8', 1.2)
      + sh('M193,124 C193,119 196,118 197,120 C198,118 200,119 200,124 C200,127 193,127 193,124z', '#f9d77e', 1.2)
      + sh('M199,129 C199,124 202,123 203,125 C204,123 206,124 206,129 C206,132 199,132 199,129z', '#f6b6c8', 1.2);
  }
  if (theme === 'christmas') {
    return `<path d="M108,151 C130,147 170,149 214,150 C212,154 110,154 108,151z" fill="#ffffff"/>`
      + `<circle cx="196" cy="134" r="10" fill="#ffd45e" opacity=".22"/>`
      + sh(box(192, 136, 8, 14, 2, 0.3), '#d2443f', 1.5)
      + sh('M196,128 C199,131 199,134 196,135 C193,134 193,131 196,128z', '#ffd45e', 1.1)
      + sh('M186,150 C186,146 188,145 190,146 C193,145 196,146 197,150z', '#4f8f68', 1.2)
      + `<circle cx="191" cy="146.5" r="1.4" fill="#d2443f"/>`;
  }
  return pumpkin(197, 144, 0.36, true)
    + `<circle cx="130" cy="140" r="8" fill="#ffd45e" opacity=".18"/>`
    + sh(box(127, 141, 7, 9, 2, 0.3), '#efe2f7', 1.4)
    + sh('M130.5,134 C133,137 133,139 130.5,140 C128,139 128,137 130.5,134z', '#ffb84d', 1);
}

function hoop(theme: ThemeId): string {
  const t = TH[theme];
  return ln('M60,88 L52,96 M60,88 L68,96', 1.2)
    + sh(hell(60, 108, 13, 13, 0.02, 12), CREAM, 1.8)
    + `<path d="${hell(60, 108, 13, 13, 0.02, 12)}" fill="none" stroke="#c98d63" stroke-width="3.2" transform="translate(.6,.5)"/>`
    + ln(hell(60, 108, 14.6, 14.6, 0.02, 12), 1.2)
    + sh(box(57, 91, 6, 5, 1.5, 0.3), '#c98d63', 1.2)
    + `<path transform="translate(60,109) scale(.62)" d="M0,5 C-10,-2 -6,-10 0,-5 C6,-10 10,-2 0,5z" fill="${t.accent}"/>`
    + `<path transform="translate(60,109) scale(.62)" d="M0,5 C-10,-2 -6,-10 0,-5 C6,-10 10,-2 0,5z" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="1.6" stroke-dasharray="2 2.5"/>`;
}

/* ------------------------------------------------------- theme fixtures */
function christmasExtras(): string {
  // wreath around the door window
  let s = `<path d="${hell(60, 169, 14.5, 14.5, 0.03, 41)}" fill="none" stroke="#3f7a56" stroke-width="8"/>`
    + `<path d="${hell(60, 169, 14.5, 14.5, 0.03, 41)}" fill="none" stroke="#6fae86" stroke-width="2.4" stroke-dasharray="2 5"/>`
    + ln(hell(60, 169, 19, 19, 0.03, 42), 1.3) + ln(hell(60, 169, 10.3, 10.3, 0.03, 43), 1.2);
  [[48, 160], [71, 162], [52, 181], [70, 178], [60, 154]].forEach(([x, y]) => { s += `<circle cx="${x}" cy="${y}" r="2" fill="#d2443f" stroke="${INK}" stroke-width=".8"/>`; });
  s += sh('M60,186 C55,180 49,180 50,185 C50,190 55,189 60,186z', '#d2443f', 1.4) + sh('M60,186 C65,180 71,180 70,185 C70,190 65,189 60,186z', '#d2443f', 1.4)
    + ln('M58,187 L54,196 M62,187 L66,196', 2, '#d2443f') + `<circle cx="60" cy="186" r="2.2" fill="#ffd45e" stroke="${INK}" stroke-width="1"/>`;
  // fairy-light garlands: over the window and along the door arch
  const lights = (pts: [number, number][]) => pts.map(([x, y], i) => {
    const c = ['#ffd45e', '#e2607a', '#7fc4f0', '#fff6ea', '#8fd19e'][i % 5];
    return `<circle cx="${x}" cy="${y + 3}" r="5.5" fill="${c}" opacity=".3"/><path d="${blob(x, y + 3, 2.4, 3)}" fill="${c}" stroke="${INK}" stroke-width=".9"/>`;
  }).join('');
  const winSwag = 'M104,58 C126,72 142,72 161,62 C180,72 196,72 218,58';
  s += `<path d="${winSwag}" fill="none" stroke="#3f7a56" stroke-width="5"/>`
    + `<path d="${winSwag}" fill="none" stroke="#6fae86" stroke-width="1.6" stroke-dasharray="2 4"/>`
    + lights([[112, 63], [124, 68], [138, 69], [150, 66], [172, 66], [184, 69], [198, 68], [210, 63]]);
  const arch = 'M22,176 C22,150 40,134 60,134 C80,134 98,150 98,176';
  s += `<path d="${arch}" fill="none" stroke="#3f7a56" stroke-width="5"/>`
    + `<path d="${arch}" fill="none" stroke="#6fae86" stroke-width="1.6" stroke-dasharray="2 4"/>`
    + lights([[23, 162], [30, 147], [42, 137], [60, 132], [78, 137], [90, 147], [97, 162]]);
  // small tree at the left wall
  s += `<ellipse cx="13" cy="266" rx="14" ry="3.4" fill="${INK}" opacity=".16"/>`
    + sh(box(9, 252, 9, 13, 2, 0.3), '#c9584f', 1.6)
    + sh('M13,236 C9,240 2,246 -1,252 C8,254 20,254 28,252 C25,246 19,240 13,236z', '#3f7a56', 1.8)
    + sh('M13,220 C9,225 4,231 1,237 C9,239 18,239 25,237 C22,231 17,225 13,220z', '#4f8f68', 1.8)
    + sh('M13,205 C10,210 6,216 4,222 C10,224 17,224 22,222 C20,216 16,210 13,205z', '#5fa07a', 1.8)
    + `<path d="M4,233 C10,236 17,236 23,233 M1,249 C9,252 19,252 26,249" fill="none" stroke="#fff6ea" stroke-width="1.2" stroke-dasharray="2 3"/>`
    + `<path d="M13,197 l2,4.4 l4.8,.6 l-3.5,3.3 l1,4.8 l-4.3,-2.4 l-4.3,2.4 l1,-4.8 l-3.5,-3.3 l4.8,-.6z" fill="#ffd45e" stroke="${INK}" stroke-width="1" stroke-linejoin="round"/>`;
  [[9, 217, '#d2443f'], [17, 229, '#ffd45e'], [7, 243, '#7fc4f0'], [20, 245, '#d2443f'], [15, 214, '#7fc4f0']].forEach(([x, y, c]) => {
    s += `<circle cx="${x}" cy="${y}" r="2.1" fill="${c}" stroke="${INK}" stroke-width=".8"/>`;
  });
  return s;
}

function halloweenExtras(): string {
  const web = (ox: number, oy: number, sx: number, sy: number, r: number) => {
    let spokes = '', rings = '';
    const angs = [0, 22, 45, 68, 90];
    angs.forEach((a) => {
      const rad = a * Math.PI / 180;
      spokes += `M0,0 L${n(Math.cos(rad) * r)},${n(Math.sin(rad) * r)} `;
    });
    [0.35, 0.62, 0.9].forEach((f) => {
      angs.forEach((a, i) => {
        if (i === angs.length - 1) return;
        const r0 = a * Math.PI / 180, r1 = angs[i + 1] * Math.PI / 180, mid = (r0 + r1) / 2;
        const p = (an: number, rr: number) => `${n(Math.cos(an) * rr)},${n(Math.sin(an) * rr)}`;
        rings += `M${p(r0, r * f)} Q${p(mid, r * f * 0.8)} ${p(r1, r * f)} `;
      });
    });
    return `<g transform="translate(${ox},${oy}) scale(${sx},${sy})" fill="none" stroke="#efe6ff" stroke-opacity=".7" stroke-width="1.1"><path d="${spokes}"/><path d="${rings}"/></g>`;
  };
  return web(0, 56, 1, 1, 46) + web(360, 56, -1, 1, 30)
    + web(116, 60, 1, 1, 22) + web(206, 60, -1, 1, 18)
    // dangling spider from the window corner
    + `<path d="M196,61 C196,72 196,80 196,86" stroke="#efe6ff" stroke-opacity=".8" stroke-width=".9" fill="none"/>`
    + `<g transform="translate(196,90)"><path d="M-3,-1 l-5,-3 M-3,1 l-6,1 M-3,2 l-4,4 M3,-1 l5,-3 M3,1 l6,1 M3,2 l4,4" stroke="#1c1230" stroke-width="1.1" fill="none"/>${fl(blob(0, 0, 4, 3.8), '#1c1230')}<circle cx="-1.4" cy="-0.6" r=".8" fill="#fff"/><circle cx="1.4" cy="-0.6" r=".8" fill="#fff"/></g>`
    // pumpkins at the door
    + pumpkin(12, 258, 0.62, true) + pumpkin(106, 262, 0.48, false) + pumpkin(4, 268, 0.4, false)
    // paper bats on the wall
    + `<g fill="#2f2145" opacity=".85"><path transform="translate(230,78) scale(.7)" d="M0,0 C-2,-4 -6,-5 -11,-3 C-8,-2 -7,0 -7,2 C-5,0 -2,0 0,3 C2,0 5,0 7,2 C7,0 8,-2 11,-3 C6,-5 2,-4 0,0z"/><path transform="translate(92,92) scale(.55)" d="M0,0 C-2,-4 -6,-5 -11,-3 C-8,-2 -7,0 -7,2 C-5,0 -2,0 0,3 C2,0 5,0 7,2 C7,0 8,-2 11,-3 C6,-5 2,-4 0,0z"/></g>`;
}

function springExtras(): string {
  const blossom = (x: number, y: number, s: number, c: string) =>
    `<g transform="translate(${x},${y}) scale(${s})"><path d="M0,0 C-3,-3 -2,-6 0,-6 C2,-6 3,-3 0,0z M0,0 C3,-2 6,-1 6,1 C5,3 2,3 0,0z M0,0 C3,2 3,5 1,6 C-1,6 -2,3 0,0z M0,0 C-2,3 -5,4 -6,2 C-6,0 -3,-1 0,0z M0,0 C-3,-1 -5,-3 -4,-5 C-2,-6 -1,-3 0,0z" fill="${c}" stroke="${INK}" stroke-width="1"/><circle r="1.3" fill="#f6cf6b"/></g>`;
  let s = ln('M100,60 C118,54 132,62 150,57 C168,52 188,62 222,56', 2.6, '#9a6a52')
    + ln('M132,59 C134,54 138,52 141,51 M190,59 C193,55 197,54 201,53', 1.8, '#9a6a52');
  [[108, 58, '#f6b6c8'], [122, 60, '#fbd8e2'], [138, 52, '#f6b6c8'], [154, 57, '#fff2f4'], [172, 56, '#f6b6c8'], [186, 60, '#fbd8e2'], [202, 53, '#f6b6c8'], [216, 57, '#fff2f4']]
    .forEach(([x, y, c], i) => { s += blossom(x as number, y as number, i % 2 ? 0.85 : 1, c as string); });
  // flower garland along the door arch
  s += ln('M24,174 C24,150 40,136 60,136 C80,136 96,150 96,174', 2, '#8fc3a7');
  [[25, 162, '#f6b6c8'], [32, 147, '#fff2f4'], [44, 139, '#f9d77e'], [60, 135, '#f6b6c8'], [76, 139, '#fff2f4'], [88, 147, '#f9d77e'], [95, 162, '#f6b6c8']]
    .forEach(([x, y, c]) => { s += blossom(x as number, y as number, 0.75, c as string); });
  // tulip planter by the door
  s += `<ellipse cx="11" cy="266" rx="13" ry="3" fill="${INK}" opacity=".15"/>`
    + ln('M6,252 C5,244 4,238 3,234 M11,252 V230 M16,252 C17,245 18,240 20,236', 1.8, '#6aa883')
    + sh('M-1,236 C-1,230 2,228 3,231 C4,228 7,230 7,236 C7,240 -1,240 -1,236z', '#f6a9bd', 1.4)
    + sh('M7,231 C7,225 10,223 11,226 C12,223 15,225 15,231 C15,235 7,235 7,231z', '#f9d77e', 1.4)
    + sh('M16,237 C16,231 19,229 20,232 C21,229 24,231 24,237 C24,241 16,241 16,237z', '#f6a9bd', 1.4)
    + sh('M0,250 C1,258 3,264 5,265 C10,266 13,266 18,265 C20,264 22,258 23,250z', '#9dbbe6', 1.8)
    + `<path d="M2,254 h19" stroke="#fff" stroke-opacity=".7" stroke-width="1.2" stroke-dasharray="2 2.5"/>`;
  return s;
}

function everydayExtras(): string {
  // potted fern by the door with a tiny face
  return `<ellipse cx="11" cy="266" rx="13" ry="3" fill="${INK}" opacity=".15"/>`
    + sh('M11,250 C4,246 -2,238 -1,230 C4,234 8,240 11,250z', '#7fb894', 1.6)
    + sh('M11,250 C18,246 24,238 23,229 C18,233 13,240 11,250z', '#8fc3a7', 1.6)
    + sh('M11,250 C8,240 8,228 12,220 C15,228 15,240 11,250z', '#6aa883', 1.6)
    + sh('M0,249 C1,257 3,264 5,265 C10,266 13,266 18,265 C20,264 22,257 23,249z', '#e79a7e', 1.8)
    + `<circle cx="8" cy="256" r="1.1" fill="#4a332b"/><circle cx="15" cy="256" r="1.1" fill="#4a332b"/><path d="M10.2,258.4 q1.3,1.3 2.6,0" stroke="#4a332b" stroke-width="1" fill="none"/>`
    + yarn(104, 262, 6, '#9dbbe6', false, 20) + ln('M109,265 C114,268 118,266 120,269', 1.3, '#9dbbe6');
}

/** Wall, floor, door, window (with seasonal view) and theme-specific fixed extras. */
export function roomBack(theme: ThemeId): string {
  if (!TH[theme]) theme = 'everyday';
  const night = theme === 'christmas' || theme === 'halloween';
  let s = wall(theme) + floor(theme)
    // soft light from the window falling on the floor
    + `<path d="M124,${WB + 1} L198,${WB + 1} L262,470 L72,470z" fill="url(#${id('beam', theme)})" opacity="${night ? 0.7 : 1}"/>`
    + door(theme) + windowFrame(theme) + sillItems(theme) + hoop(theme);
  if (theme === 'christmas') s += christmasExtras();
  if (theme === 'halloween') s += halloweenExtras();
  if (theme === 'spring') s += springExtras();
  if (theme === 'everyday') s += everydayExtras();
  return `<g stroke-linecap="round" stroke-linejoin="round">${s}</g>`;
}

/* ------------------------------------------------------------ front */
interface Particle { x: number; y: number; sp: number; sway: number; ph: number; r: number; c: number }
function particles(seed: number, count: number, spMin: number, spMax: number): Particle[] {
  const R = rng(seed);
  return Array.from({ length: count }, () => ({
    x: R() * W, y: R() * (H + 40), sp: spMin + R() * (spMax - spMin), sway: 6 + R() * 12,
    ph: R() * Math.PI * 2, r: R(), c: Math.floor(R() * 3),
  }));
}
const PETALS = particles(901, 16, 16, 28);
const SNOW = particles(733, 30, 14, 30);
const MOTES = particles(555, 8, 3, 7);

/** Things drawn over everything (theme particles, tint, vignette). */
export function roomFront(theme: ThemeId, time: number): string {
  if (!TH[theme]) theme = 'everyday';
  const span = H + 40;
  const fall = (p: Particle) => {
    const y = ((p.y + time * p.sp) % span) - 20;
    const x = (((p.x + Math.sin(time * 0.8 + p.ph) * p.sway + time * p.sp * 0.2) % (W + 20)) + W + 20) % (W + 20) - 10;
    return [n(x), n(y)];
  };
  let s = '';
  if (theme === 'spring') {
    const cols = ['#f6b6c8', '#fbd8e2', '#f49ab4'];
    for (const p of PETALS) {
      const [x, y] = fall(p);
      const rot = n((time * 70 * (p.r > 0.5 ? 1 : -1) + p.ph * 57) % 360);
      const sq = n(0.55 + 0.45 * Math.abs(Math.sin(time * 2 + p.ph)));
      s += `<path transform="translate(${x},${y}) rotate(${rot}) scale(${n(0.8 + p.r * 0.6)},${sq})" d="M0,-3.4 C3,-3.4 4.4,0.8 0,4 C-4.4,0.8 -3,-3.4 0,-3.4z" fill="${cols[p.c]}" opacity=".9"/>`;
    }
  } else if (theme === 'christmas') {
    let d = '';
    let big = '';
    for (const p of SNOW) {
      const [x, y] = fall(p);
      if (p.r > 0.7) big += `<circle cx="${x}" cy="${y}" r="${n(2 + p.r)}"/>`;
      else d += `M${x},${y}h0.01 `;
    }
    s += `<path d="${d}" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".9"/><g fill="#fff" opacity=".85">${big}</g>`;
  } else if (theme === 'halloween') {
    s += `<rect width="${W}" height="${H}" fill="#3b1f66" opacity=".1"/>`;
    for (const p of MOTES) {
      const y = n(260 + ((p.y * 0.5 + time * p.sp) % 360));
      const x = n(p.x + Math.sin(time * 0.7 + p.ph) * 14);
      const op = n(0.25 + 0.35 * (0.5 + 0.5 * Math.sin(time * 2 + p.ph)));
      s += `<circle cx="${x}" cy="${H - y + 200}" r="5" fill="#d9f08a" opacity="${n(op * 0.35)}"/><circle cx="${x}" cy="${H - y + 200}" r="1.6" fill="#eaffb0" opacity="${op}"/>`;
    }
  } else {
    for (const p of MOTES) {
      const x = n(110 + p.x * 0.4 + Math.sin(time * 0.4 + p.ph) * 10);
      const y = n(270 + ((p.y * 0.3 + time * p.sp) % 180));
      const op = n(0.25 + 0.3 * (0.5 + 0.5 * Math.sin(time * 1.3 + p.ph)));
      s += `<circle cx="${x}" cy="${y}" r="1.4" fill="#fffbe8" opacity="${op}"/>`;
    }
  }
  s += `<rect width="${W}" height="${H}" fill="url(#${id('vig', theme)})" pointer-events="none"/>`;
  return `<g pointer-events="none">${s}</g>`;
}
