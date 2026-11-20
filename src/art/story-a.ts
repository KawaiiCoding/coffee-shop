/* Story illustrations A: intro panels (ad, walk_to_cafe, interview, hired, messy_shop).
   Inner markup for viewBox 0 0 320 240. Picture-book style, deterministic. */
import type { CharacterLook, DrawCharacterOpts, StoryArtId } from '../types';
import { INK, fl, ln, sh, g, blob, box, shadow, tinyFace } from './kit';
import { character } from './character';
import { item } from './items';

/* ---------------------------------------------------------------- cast */
const MOCHA_SCARF: CharacterLook = { species: 'bear', color: '#d9a877', accessory: 'scarf', accentColor: '#e58a94', apronColor: '#fff6ea', hat: 'none' };
const MOCHA_APRON: CharacterLook = { ...MOCHA_SCARF, accessory: 'apron' };
const BUTTON: CharacterLook = { species: 'cat', color: '#b9b3c9', accessory: 'apron', accentColor: '#8fb39b', apronColor: '#fff6ea', hat: 'none' };

/** Character placed with feet at (x,y), scaled. */
const who = (look: CharacterLook, x: number, y: number, s: number, opts: DrawCharacterOpts) =>
  g(`translate(${x},${y}) scale(${s})`, character(look, opts));

/** Doll-space overlay (same mapping as character(): feet at 0,0; standing). */
/** Remove a default arm from character() markup, so a posed arm drawn on top doesn't make a third one. */
const ARM_R = 'M13,-6 C22,-3 26,6 22,10 C18,13 14,6 12,0z';
const ARM_L = 'M-14,-6 C-23,-2 -26,8 -21,11 C-17,13 -14,6 -12,0z';
function strip(svg: string, d: string): string {
  const tag = `<path d="${d}"`;
  let i = svg.indexOf(tag);
  while (i >= 0) {
    const e = svg.indexOf('/>', i);
    if (e < 0) break;
    svg = svg.slice(0, i) + svg.slice(e + 2);
    i = svg.indexOf(tag);
  }
  return svg;
}
/** Like who(), minus one default arm (a custom one is drawn with doll()). */
const whoNoArm = (look: CharacterLook, x: number, y: number, s: number, opts: DrawCharacterOpts, arm: string) =>
  g(`translate(${x},${y}) scale(${s})`, strip(character(look, opts), arm));

const doll = (x: number, y: number, s: number, f: 1 | -1, inner: string, sit = false) =>
  g(`translate(${x},${y}) scale(${s}) scale(${0.88 * f},0.88) translate(0,${sit ? -11 : -35})`, inner);

/* --------------------------------------------------------------- bits */
const HEART = 'M0,5 C-10,-2 -6,-10 0,-5 C6,-10 10,-2 0,5z';
const SPARK = 'M0,-6 Q0.8,-0.8 6,0 Q0.8,0.8 0,6 Q-0.8,0.8 -6,0 Q-0.8,-0.8 0,-6z';
const heart = (x: number, y: number, s: number, c = '#ee8b9c', rot = 0) =>
  g(`translate(${x},${y}) rotate(${rot}) scale(${s})`, sh(HEART, c, 2 / s));
const spark = (x: number, y: number, s: number, c = '#f6d77a') =>
  g(`translate(${x},${y}) scale(${s})`, sh(SPARK, c, 1.6 / s));

/** Little sweat drop. */
const sweat = (x: number, y: number) =>
  sh(`M${x},${y} C${x - 3},${y + 5} ${x - 3},${y + 8} ${x},${y + 8} C${x + 3},${y + 8} ${x + 3},${y + 5} ${x},${y}z`, '#bfe6f5', 1.4);

/** Flower on a stem. */
function flower(x: number, y: number, h: number, petal: string, s = 1): string {
  const top = y - h;
  let p = '';
  for (let i = 0; i < 5; i++) {
    const a = (i * 72 - 90) * Math.PI / 180;
    p += `<circle cx="${(x + Math.cos(a) * 3.4 * s).toFixed(1)}" cy="${(top + Math.sin(a) * 3.4 * s).toFixed(1)}" r="${(2.6 * s).toFixed(1)}" fill="${petal}"/>`;
  }
  return ln(`M${x},${y} C${x - 2},${y - h * 0.5} ${x + 2},${top + h * 0.3} ${x},${top}`, 1.6, '#6f9b72')
    + sh(`M${x},${y - h * 0.4} c5,-4 9,-3 9,-1 c-3,3 -6,3 -9,1z`, '#9fcf98', 1.2)
    + `<g stroke="${INK}" stroke-width="1" stroke-opacity=".6">${p}</g>`
    + `<circle cx="${x}" cy="${top}" r="${2 * s}" fill="#f6d77a" stroke="${INK}" stroke-width="1"/>`;
}

/** Wooden table seen from the side, top centred at (cx, y). */
function table(cx: number, y: number, w: number): string {
  const h = 58;
  return shadow(cx, y + h, w * 0.55, 4)
    + sh(`M${cx - w / 2 + 14},${y + 6} C${cx - w / 2 + 13},${y + 26} ${cx - w / 2 + 16},${y + 44} ${cx - w / 2 + 15},${y + h} l8,0 C${cx - w / 2 + 22},${y + 40} ${cx - w / 2 + 22},${y + 22} ${cx - w / 2 + 22},${y + 6}z`, '#b57a5e')
    + sh(`M${cx + w / 2 - 22},${y + 6} C${cx + w / 2 - 22},${y + 24} ${cx + w / 2 - 22},${y + 42} ${cx + w / 2 - 23},${y + h} l8,0 C${cx + w / 2 - 15},${y + 42} ${cx + w / 2 - 13},${y + 24} ${cx + w / 2 - 14},${y + 6}z`, '#b57a5e')
    + sh(box(cx - w / 2, y - 4, w, 12, 5, 1), '#d39a72')
    + ln(`M${cx - w / 2 + 8},${y + 2} C${cx - 10},${y + 3} ${cx + 10},${y + 1} ${cx + w / 2 - 10},${y + 2}`, 1, '#fff6ea');
}

/** Cafe interior backdrop: wallpaper, dado, floor, window. `dusty` greys it a bit. */
function interior(dusty: boolean): string {
  const wall = dusty ? '#ead6c9' : '#f8dccd';
  const dot = dusty ? '#dcc3b4' : '#f2c6b4';
  const dado = dusty ? '#dcb6a5' : '#eebfae';
  const floorC = dusty ? '#d9b996' : '#e6bf92';
  let dots = '';
  for (let r = 0; r < 5; r++) for (let c = 0; c < 11; c++) {
    const x = 12 + c * 30 + (r % 2) * 15, y = 14 + r * 26;
    dots += `M${x},${y + 3} c-5,-3.5 -3,-7 0,-4.5 c3,-2.5 5,1 0,4.5z `;
  }
  let boards = '';
  for (let i = 0; i < 4; i++) {
    const y = 178 + i * 16;
    boards += `M0,${y} C100,${y + 1} 220,${y - 1} 320,${y} `;
  }
  return `<rect width="320" height="240" fill="${wall}"/>`
    + `<path d="${dots}" fill="${dot}"/>`
    + `<rect x="0" y="134" width="320" height="38" fill="${dado}"/>`
    + sh(box(-6, 130, 332, 7, 3, 0.5), '#b57a5e', 1.8)
    + `<path d="M0,134 h320" stroke="#fff" stroke-opacity=".6" stroke-width="1.2" stroke-dasharray="3 4"/>`
    + `<rect x="0" y="170" width="320" height="70" fill="${floorC}"/>`
    + sh(box(-6, 167, 332, 6, 3, 0.5), '#b57a5e', 1.8)
    + `<path d="${boards}" fill="none" stroke="${INK}" stroke-opacity=".18" stroke-width="1.1"/>`;
}

/** Window with sky + frame at (x,y). */
function windowPane(x: number, y: number, w: number, h: number, dusty: boolean): string {
  const sky = dusty ? '#cfe0e6' : '#bfe6f5';
  return fl(box(x, y, w, h, 5, 1), sky)
    + `<path d="M${x + 6},${y + h - 10} C${x + w * 0.3},${y + h - 22} ${x + w * 0.6},${y + h - 16} ${x + w - 4},${y + h - 24} L${x + w - 4},${y + h - 4} L${x + 6},${y + h - 4}z" fill="#a9d6a0" opacity=".7"/>`
    + `<path d="${blob(x + w * 0.3, y + h * 0.3, 9, 4, 0)}" fill="#fff" opacity=".85"/>`
    + ln(box(x, y, w, h, 5, 1), 2.6)
    + ln(`M${x + w / 2},${y + 2} V${y + h - 2} M${x + 2},${y + h / 2} H${x + w - 2}`, 2.2)
    + sh(box(x - 5, y + h - 2, w + 10, 6, 3, 0.5), '#b57a5e', 1.8);
}

/* ---------------------------------------------------------------- AD */
function artAd(): string {
  let s = `<rect width="320" height="240" fill="#c9d6e3"/>`
    + `<rect y="96" width="320" height="80" fill="#d7e0e8"/>`;
  // distant rooftops
  s += fl('M-4,150 L-4,96 L30,74 L64,96 L64,110 L92,86 L130,110 L130,150z', '#b9c6d6')
    + fl('M196,150 L196,100 L230,80 L262,100 L262,92 L292,72 L326,96 L326,150z', '#b9c6d6')
    + fl(box(14, 104, 14, 16, 3, 0.5), '#f6e3a8') + fl(box(214, 108, 14, 16, 3, 0.5), '#f6e3a8')
    + fl(box(290, 102, 14, 16, 3, 0.5), '#f6e3a8');
  // clouds
  s += fl(blob(60, 30, 50, 16, 0.2), '#e9eef4') + fl(blob(110, 22, 34, 13, -0.2), '#f1f4f8')
    + fl(blob(250, 34, 56, 18, 0.1), '#e9eef4');
  // pavement
  s += fl('M-4,150 C80,146 240,152 324,148 L324,244 L-4,244z', '#a9b4c0')
    + ln('M-4,150 C80,146 240,152 324,148', 2.2)
    + `<path d="M0,176 C100,174 220,178 320,175 M0,206 C100,204 220,208 320,205 M40,150 L34,176 M120,149 L116,176 M200,150 L200,176 M280,149 L284,176 M80,176 L74,206 M170,176 L168,206 M250,176 L254,206" fill="none" stroke="${INK}" stroke-opacity=".18" stroke-width="1.2"/>`;
  // puddles
  s += fl(blob(70, 214, 40, 8, 0.2), '#bcd8ea') + ln(blob(70, 214, 40, 8, 0.2), 1.6)
    + `<path d="${blob(62, 212, 12, 2.4, 0)}" fill="none" stroke="#fff" stroke-width="1.2" opacity=".8"/>`
    + fl(blob(268, 222, 32, 7, -0.2), '#bcd8ea') + ln(blob(268, 222, 32, 7, -0.2), 1.6)
    + `<path d="${blob(274, 221, 9, 2, 0)}" fill="none" stroke="#fff" stroke-width="1.2" opacity=".8"/>`;
  // lamp post with notice board
  s += shadow(206, 186, 22, 4)
    + sh('M201,186 C202,140 200,90 202,40 L210,40 C211,90 209,140 211,186z', '#7d8fa3')
    + sh(box(195, 178, 22, 10, 3, 0.5), '#6f8095', 1.8)
    + sh('M190,40 C192,26 220,26 222,40z', '#7d8fa3')
    + fl(box(194, 40, 24, 8, 3, 0.5), '#fff2b8') + ln(box(194, 40, 24, 8, 3, 0.5), 2)
    + `<path d="${blob(206, 50, 26, 14, 0)}" fill="#fff2b8" opacity=".35"/>`;
  // paper ad (pinned, slightly tilted)
  s += g('translate(206,108) rotate(-4)',
    sh('M-22,-26 C-8,-27 8,-25 22,-26 C23,-8 21,10 23,27 C8,26 -8,28 -22,27 C-21,10 -23,-8 -22,-26z', '#fffaf2', 2)
    + `<circle cx="0" cy="-22" r="2.6" fill="#e58a94" stroke="${INK}" stroke-width="1.2"/>`
    + g('translate(-2,-2) scale(.9)', item('latte'))
    + heart(10, -13, 0.55, '#ee8b9c')
    + ln('M-12,15 h24 M-9,20 h18', 1.4, '#b89a8c'));
  // umbrella + Mocha
  const mx = 132, my = 200, ms = 1.35;
  s += g(`translate(${mx},${my}) scale(${ms})`,
    ln('M17,-22 L10,-96', 2.4)
    + ln('M17,-22 c1,5 -4,7 -6,3', 2.2));
  s += who(MOCHA_SCARF, mx, my, ms, { pose: 'stand', mood: 'calm', facing: 1 });
  s += g(`translate(${mx},${my}) scale(${ms})`,
    sh('M-30,-90 C-28,-118 44,-124 52,-96 C46,-100 38,-100 34,-94 C28,-100 18,-101 12,-94 C6,-100 -4,-100 -8,-93 C-14,-98 -24,-97 -30,-90z', '#e58a94')
    + ln('M12,-94 C10,-108 10,-116 11,-117 M34,-94 C30,-106 24,-114 11,-117 M-8,-93 C-4,-106 2,-114 11,-117', 1.4)
    + `<circle cx="11" cy="-118" r="2" fill="${INK}"/>`
    // hopeful little sparkle near eye
    + g('translate(30,-74) scale(.45)', sh(SPARK, '#f6d77a', 3)));
  // rain
  let rain = '';
  const pts = [[14, 8], [48, 40], [92, 14], [150, 6], [176, 60], [236, 12], [262, 70], [300, 30], [28, 90], [74, 120],
    [250, 120], [300, 140], [180, 150], [20, 160], [110, 30], [286, 186], [228, 196], [12, 200], [160, 220], [306, 92], [60, 70]];
  for (const [x, y] of pts) rain += `M${x},${y} l-3,9 `;
  s += `<path d="${rain}" stroke="#7e9cc0" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>`;
  // ripples
  s += `<path d="M48,214 q4,-3 8,0 M86,216 q4,-3 8,0 M256,222 q4,-3 8,0" fill="none" stroke="#fff" stroke-width="1.1"/>`;
  return s;
}

/* -------------------------------------------------------- WALK TO CAFE */
function artWalk(): string {
  let s = `<rect width="320" height="240" fill="#bfe6f5"/>`
    + `<rect y="70" width="320" height="90" fill="#e4f5fb"/>`;
  // sun peeking out from cloud
  s += `<path d="M266,18 l0,-10 M286,26 l8,-7 M294,46 l10,0 M246,26 l-8,-7" stroke="#f2c14e" stroke-width="2.4" stroke-linecap="round"/>`
    + sh(blob(268, 46, 20, 20, 0), '#f6d77a')
    + fl(blob(248, 60, 30, 12, 0.2), '#ffffff') + ln('M220,62 C224,50 238,48 246,54 C252,44 270,46 274,58 C282,56 288,62 284,68', 1.8)
    + fl(blob(70, 36, 36, 11, -0.2), '#ffffff')
    // little rainbow
    + `<path d="M10,110 C20,60 80,50 104,80" fill="none" stroke="#f4a9a8" stroke-width="4" opacity=".55"/>`
    + `<path d="M18,112 C28,68 80,60 100,86" fill="none" stroke="#f6d77a" stroke-width="4" opacity=".55"/>`
    + `<path d="M26,114 C36,76 80,70 96,92" fill="none" stroke="#a9d6a0" stroke-width="4" opacity=".55"/>`;
  // hedge on left
  s += fl('M-4,150 C4,128 22,124 34,134 C42,120 62,122 70,136 C80,128 96,134 98,152 L-4,152z', '#a9d6a0')
    + ln('M-4,150 C4,128 22,124 34,134 C42,120 62,122 70,136 C80,128 96,134 98,152', 2);
  // cafe building
  s += shadow(222, 160, 92, 5)
    + sh('M140,160 C139,120 141,90 140,68 L304,68 C303,100 305,130 304,160z', '#f8dccd')
    + sh('M132,72 C170,50 274,50 312,72 C280,70 170,70 132,72z', '#b57a5e')
    + sh(box(146, 52, 152, 14, 5, 1), '#fffaf2', 2)
    + `<path d="M170,59 h8 M188,59 h20 M216,59 h6 M232,59 h40" stroke="${INK}" stroke-opacity=".25" stroke-width="2.4"/>`
    + g('translate(160,59) scale(.42)', sh(HEART, '#ee8b9c', 3));
  // awning (scalloped stripes)
  let stripes = '';
  for (let i = 0; i < 8; i++) {
    const x = 138 + i * 21;
    stripes += fl(`M${x},76 L${x + 21},76 L${x + 21},94 C${x + 18},101 ${x + 3},101 ${x},94z`, i % 2 ? '#fff6ea' : '#8fc3a7');
  }
  s += stripes + ln('M138,76 L306,76 L306,94 ' + Array.from({ length: 8 }, (_, i) => {
    const x = 306 - i * 21;
    return `C${x - 3},101 ${x - 18},101 ${x - 21},94`;
  }).join(' ') + ' L138,76z', 2.2);
  // dusty window
  s += fl(box(152, 104, 64, 44, 5, 1), '#cfdde2')
    + `<path d="M158,114 l14,-6 M160,126 l30,-14 M176,140 l30,-14" stroke="#fff" stroke-width="2" opacity=".6"/>`
    + `<path d="${blob(186, 132, 22, 10, 0.2)}" fill="#c9b8a6" opacity=".35"/>`
    + ln(box(152, 104, 64, 44, 5, 1), 2.4) + ln('M184,106 V146', 2)
    + sh(box(148, 146, 72, 6, 3, 0.5), '#b57a5e', 1.8);
  // door with closed sign
  s += sh('M236,160 L236,112 C236,100 290,100 290,112 L290,160z', '#8fc3a7')
    + fl(box(246, 112, 34, 18, 6, 0.5), '#cfdde2') + ln(box(246, 112, 34, 18, 6, 0.5), 1.8)
    + `<circle cx="282" cy="140" r="2.4" fill="#f2c14e" stroke="${INK}" stroke-width="1.2"/>`
    + ln('M254,132 L263,124 L272,132', 1.3)
    + g('translate(263,140) rotate(3)', sh(box(-12, -2, 24, 12, 3, 0.5), '#fffaf2', 1.8)
      + `<path d="M-6,4 h12" stroke="#c4506a" stroke-width="2.2" stroke-linecap="round"/>`);
  // flower pots by the door
  s += flower(228, 156, 18, '#f4a9a8') + flower(298, 156, 16, '#f6d77a', 0.9)
    + sh('M220,152 L236,152 L233,162 L223,162z', '#e58a4f', 1.6)
    + sh('M290,152 L306,152 L303,162 L293,162z', '#e58a4f', 1.6);
  // cobbled lane
  s += fl('M-4,152 L324,152 L324,244 L-4,244z', '#e8d2b6') + ln('M-4,152 L138,156 M306,158 L324,158', 2);
  let cob = '';
  const rows: Array<[number, number, number]> = [[166, 26, 6], [184, 34, 8], [206, 42, 10], [230, 50, 12]];
  rows.forEach(([y, w, h], r) => {
    for (let x = -10 + (r % 2) * w / 2; x < 330; x += w + 4) cob += blob(x + w / 2, y, w / 2, h / 2, (r % 3) * 0.2 - 0.2) + ' ';
  });
  s += `<path d="${cob}" fill="#dcc1a2" stroke="${INK}" stroke-opacity=".22" stroke-width="1.1"/>`;
  // puddle shining
  s += fl(blob(150, 214, 26, 5, 0.1), '#bfe6f5') + `<path d="M140,213 h12" stroke="#fff" stroke-width="1.2"/>`;
  // flowers along lane
  s += flower(12, 174, 18, '#9dbbe6') + flower(30, 180, 14, '#f4a9a8', 0.9) + flower(104, 166, 14, '#f6d77a', 0.9);
  // Mocha walking toward café
  s += who(MOCHA_SCARF, 82, 218, 1.4, { pose: 'walk', mood: 'happy', facing: 1, walkPhase: 0.25 });
  s += ln('M48,206 q6,-2 10,0 M44,214 q6,-2 10,0', 1.6, '#b89a8c');
  s += spark(120, 120, 0.7) + spark(28, 128, 0.5, '#fff');
  return s;
}

/* ---------------------------------------------------------- INTERVIEW */
function chair(x: number, y: number, f: 1 | -1): string {
  // back on the outside of the sitter
  const bx = x - 22 * f;
  return sh(`M${bx - 4},${y - 4} C${bx - 5},${y - 40} ${bx - 3},${y - 60} ${bx - 4},${y - 74} C${bx},${y - 80} ${bx + 4},${y - 80} ${bx + 4},${y - 74} C${bx + 3},${y - 50} ${bx + 4},${y - 30} ${bx + 4},${y - 4}z`, '#b57a5e')
    + sh(box(x - 26, y - 16, 52, 8, 4, 0.5), '#d39a72')
    + sh(`M${x - 22},${y - 8} L${x - 22},${y + 18} l6,0 L${x - 16},${y - 8}z M${x + 16},${y - 8} L${x + 16},${y + 18} l6,0 L${x + 22},${y - 8}z`, '#b57a5e', 2);
}

function artInterview(): string {
  let s = interior(true)
    + windowPane(118, 22, 84, 76, true)
    // warm light beam from window
    + `<path d="M118,98 L202,98 L250,206 L70,206z" fill="#fff3cc" opacity=".4"/>`
    // pendant lamp
    + ln('M160,0 V22', 1.6)
    + sh('M146,32 C146,20 174,20 174,32z', '#f6cf6b') + `<path d="${blob(160, 52, 40, 20, 0)}" fill="#fff3cc" opacity=".35"/>`
    // cobweb corner hint
    + ln('M0,26 C10,22 20,12 24,0 M0,14 C6,12 10,6 12,0 M0,0 L18,18', 1, '#b89a8c')
    // dust motes
    + `<g fill="#fff" opacity=".8"><circle cx="140" cy="118" r="1.4"/><circle cx="176" cy="130" r="1.1"/><circle cx="160" cy="104" r="1"/><circle cx="196" cy="140" r="1.2"/></g>`;
  // Mocha on left chair (facing right), Button on right chair (facing left)
  s += chair(84, 196, 1) + chair(236, 196, -1);
  s += who(MOCHA_SCARF, 84, 188, 1.5, { pose: 'sit', mood: 'calm', facing: 1 });
  s += who(BUTTON, 236, 188, 1.5, { pose: 'sit', mood: 'happy', facing: -1 });
  s += sweat(106, 100) + ln('M60,90 c-3,-3 -3,-6 0,-8 M56,100 c-4,-2 -5,-5 -3,-8', 1.4, '#7e9cc0');
  // table in front + lattes
  s += table(160, 162, 128);
  s += g('translate(134,150) scale(1.2)', item('latte')) + g('translate(186,150) scale(1.2) scale(-1,1)', item('latte'));
  s += `<path d="M131,128 c-3,-4 3,-6 0,-10 M137,130 c-3,-4 3,-6 0,-10 M183,128 c-3,-4 3,-6 0,-10 M189,130 c-3,-4 3,-6 0,-10" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".85"/>`;
  // small vase with flower on table
  s += flower(160, 152, 18, '#f4a9a8', 0.9) + sh(blob(160, 152, 5, 6, 0), '#bfe6f5', 1.6);
  // Button's cheerful note
  s += g('translate(262,74) scale(.5)', sh(HEART, '#ee8b9c', 3.5));
  return s;
}

/* -------------------------------------------------------------- HIRED */
function artHired(): string {
  let s = interior(false)
    + windowPane(40, 24, 72, 64, false)
    // bunting
    + ln('M120,14 C160,30 220,30 312,12', 1.6);
  const bc = ['#f4a9a8', '#f6cf6b', '#8fc3a7', '#9dbbe6', '#f4a9a8', '#f6cf6b', '#8fc3a7'];
  bc.forEach((c, i) => {
    const x = 132 + i * 26, y = 20 + Math.sin((i / 6) * Math.PI) * 6;
    s += sh(`M${x - 8},${y} L${x + 8},${y + 1} L${x},${y + 14}z`, c, 1.6);
  });
  // warm glow behind characters
  s += `<path d="${blob(160, 120, 120, 70, 0)}" fill="#fff3cc" opacity=".45"/>`;
  // Mocha (left, happy, arms up) and Button (right) handing an apron
  s += whoNoArm(MOCHA_SCARF, 98, 206, 1.6, { pose: 'stand', mood: 'happy', facing: 1 }, ARM_R);
  s += whoNoArm(BUTTON, 228, 206, 1.6, { pose: 'stand', mood: 'happy', facing: -1 }, ARM_R);
  // Button's raised arm holding the apron toward Mocha
  const BUTTON_ARM = 'M11,-8 C18,-12 28,-14 32,-10 C35,-6 30,-2 12,1z';
  s += doll(228, 206, 1.6, -1, sh(BUTTON_ARM, '#b9b3c9'));
  // apron held up between them
  s += g('translate(163,120) rotate(-6)',
    sh('M-14,-24 C-6,-20 6,-20 14,-24 C18,-6 20,12 18,26 C6,30 -6,30 -18,26 C-20,12 -18,-6 -14,-24z', '#fff6ea')
    + ln('M-14,-24 C-12,-34 -6,-40 0,-40 C6,-40 12,-34 14,-24', 1.8)
    + sh(box(-9, 4, 18, 11, 3, 0.5), '#e58a94', 1.6)
    + ln('M-18,0 C-26,2 -30,8 -32,12 M18,0 C26,2 30,8 32,12', 1.6)
    + g('translate(0,-8) scale(.45)', sh(HEART, '#ee8b9c', 3.5))
    + `<path d="M-15,22 C-5,25 5,25 15,22" fill="none" stroke="#e58a94" stroke-width="1.4" stroke-dasharray="2 3"/>`);
  // Mocha's paw reaching up
  s += doll(98, 206, 1.6, 1, sh('M11,-8 C18,-14 26,-20 31,-18 C35,-14 30,-8 12,1z', '#d9a877'));
  // hearts & sparkles
  s += heart(130, 56, 0.9, '#ee8b9c', -12) + heart(196, 44, 0.7, '#f4a9a8', 10) + heart(60, 120, 0.6, '#ee8b9c', -8)
    + heart(270, 92, 0.75, '#f4a9a8', 12) + heart(160, 30, 0.5, '#ee8b9c', 0)
    + spark(104, 74, 0.8) + spark(214, 72, 0.9) + spark(286, 140, 0.6) + spark(40, 150, 0.6, '#fff')
    + spark(150, 76, 0.5, '#fff') + spark(180, 172, 0.5);
  return s;
}

/* ---------------------------------------------------------- MESSY SHOP */
function dustBunny(x: number, y: number, s: number): string {
  const d = `M-14,4 C-18,-2 -14,-10 -8,-10 C-6,-16 2,-17 5,-12 C10,-15 17,-10 15,-3 C19,0 17,7 11,7 C4,9 -6,9 -14,4z`;
  return g(`translate(${x},${y}) scale(${s})`,
    sh(d, '#cfc6c2', 2 / s)
    + `<path d="M-15,-4 l-3,-2 M-9,-11 l-2,-3 M3,-14 l1,-3 M14,-9 l3,-2 M17,3 l3,1" stroke="${INK}" stroke-width="${1.2 / s}" stroke-linecap="round" opacity=".6"/>`
    + tinyFace(1, -1, 0.75));
}

function cobweb(x: number, y: number, s: number, flip = 1): string {
  return g(`translate(${x},${y}) scale(${s * flip},${s})`,
    ln('M0,0 L40,6 M0,0 L30,26 M0,0 L8,40', 1.1, '#9a8478')
    + ln('M12,2 C14,6 12,9 9,9 C8,11 6,12 3,12 M24,4 C26,10 24,16 19,17 C16,21 10,24 5,24 M36,6 C38,14 34,22 27,24 C23,30 14,34 7,35', 1.1, '#9a8478')
    // tiny spider
    + ln('M30,26 L30,34', 0.8, '#9a8478')
    + `<circle cx="30" cy="37" r="3" fill="#7a6a72"/>` + `<circle cx="29" cy="36.5" r=".6" fill="#fff"/><circle cx="31" cy="36.5" r=".6" fill="#fff"/>`);
}

function cardboard(x: number, y: number, w: number, h: number, open: boolean): string {
  return shadow(x + w / 2, y + h, w * 0.6, 3)
    + sh(box(x, y, w, h, 3, 1), '#d9a86c')
    + (open
      ? sh(`M${x},${y + 1} L${x - 8},${y - 10} L${x + w * 0.45},${y - 8} L${x + w * 0.5},${y + 1}z`, '#e6bb84', 1.8)
        + sh(`M${x + w},${y + 1} L${x + w + 6},${y - 12} L${x + w * 0.55},${y - 9} L${x + w * 0.5},${y + 1}z`, '#e6bb84', 1.8)
      : ln(`M${x + w / 2},${y + 1} V${y + h * 0.3}`, 1.6) + fl(box(x + w / 2 - 4, y, 8, h * 0.3, 1, 0), '#c9b48e'))
    + ln(`M${x + 6},${y + h - 8} l6,0 M${x + 6},${y + h - 12} l10,0`, 1.2, '#a07850');
}

function artMessy(): string {
  let s = interior(true)
    + windowPane(130, 20, 70, 62, true)
    + `<path d="M138,30 l20,-8 M140,50 l46,-22 M160,72 l34,-16" stroke="#b8a898" stroke-width="2" opacity=".35"/>`
    // crooked picture frame
    + g('translate(250,58) rotate(9)', sh(box(-18, -14, 36, 28, 3, 0.5), '#b57a5e', 2)
      + fl(box(-13, -9, 26, 18, 2, 0.3), '#cfe0e6') + `<path d="M-12,8 L-4,0 L3,6 L8,2 L12,8z" fill="#a9d6a0"/>`)
    + ln('M250,40 L246,34 L242,42', 1.2)
    // cobwebs in corners
    + cobweb(0, 0, 1.1) + cobweb(320, 0, 1.0, -1);
  // stacked boxes on the left
  s += cardboard(12, 150, 52, 40, false) + cardboard(20, 116, 40, 34, true);
  // upturned chair sitting on a table (closed-shop look)
  s += sh(box(214, 118, 84, 8, 4, 0.5), '#d39a72') + sh('M224,126 L224,180 l6,0 L230,126z M282,126 L282,180 l6,0 L288,126z', '#b57a5e', 2)
    + shadow(256, 182, 46, 4);
  // spill on the floor
  s += fl('M170,214 C160,204 176,198 190,202 C204,196 226,200 222,210 C232,216 214,224 198,222 C186,228 168,224 170,214z', '#a9764f', 0.85)
    + ln('M170,214 C160,204 176,198 190,202 C204,196 226,200 222,210 C232,216 214,224 198,222 C186,228 168,224 170,214z', 1.6)
    + g('translate(232,210) rotate(78)', item('latte'))
    + `<path d="${blob(196, 208, 8, 2, 0)}" fill="#fff" opacity=".5"/>`;
  // dust bunnies
  s += dustBunny(122, 206, 1) + dustBunny(150, 182, 0.75) + dustBunny(300, 214, 0.9);
  // Mocha with broom (left-centre), Button pointing (right)
  const broom = g('translate(64,214) rotate(-16)',
    sh('M-2,-112 C-3,-80 -2,-40 -2,-10 L3,-10 C3,-40 4,-80 3,-112z', '#c98a5a', 1.8)
    + sh('M-12,-12 C-6,-15 6,-15 12,-12 C16,-4 18,4 18,8 C6,10 -6,10 -18,8 C-18,2 -16,-6 -12,-12z', '#f6cf6b')
    + ln('M-10,-6 L-12,6 M-4,-8 L-5,8 M3,-8 L3,8 M9,-6 L11,6', 1.1)
    + `<path d="M-13,-9 C-5,-7 5,-7 13,-9" fill="none" stroke="#c4506a" stroke-width="2.2"/>`);
  s += broom;
  s += whoNoArm(MOCHA_APRON, 80, 210, 1.45, { pose: 'stand', mood: 'calm', facing: 1 }, ARM_L);
  s += doll(80, 210, 1.45, 1, sh('M-14,-6 C-22,-12 -24,-22 -20,-25 C-15,-27 -13,-18 -12,-8z', '#d9a877'));
  s += whoNoArm(BUTTON, 246, 210, 1.45, { pose: 'stand', mood: 'happy', facing: -1 }, ARM_R);
  // Button's pointing arm (toward the mess, i.e. left)
  s += doll(246, 210, 1.45, -1,
    sh('M11,-8 C20,-12 30,-16 36,-14 C39,-11 36,-8 12,1z', '#b9b3c9')
    + sh(blob(37, -14, 3.2, 2.8, 0), '#b9b3c9', 1.6));
  // determination sparkle for Mocha, cheer hearts for Button
  s += spark(104, 92, 0.6) + heart(272, 104, 0.55, '#ee8b9c', 10)
    + ln('M196,120 l-8,-3 M198,128 l-9,1', 1.6, '#e58a94');
  return s;
}

export function storyArtA(id: StoryArtId): string {
  switch (id) {
    case 'ad': return artAd();
    case 'walk_to_cafe': return artWalk();
    case 'interview': return artInterview();
    case 'hired': return artHired();
    case 'messy_shop': return artMessy();
    default: return '';
  }
}
