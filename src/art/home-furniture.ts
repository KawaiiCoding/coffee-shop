/* HOME FURNITURE ART — the big unlockable pieces in Mocha's flat.
   Each piece is drawn with (0,0) = its FURNITURE_SPOTS bottom-centre (see layout.ts).
   Style matches home-items.ts / home-room.ts: ink line + offset colour fill, hand-shaped outlines. */
import type { DishId, FurnitureId, ThemeId } from '../types';
import { INK, CREAM, fl, ln, sh, blob, box, shadow, tinyFace, standalone, g } from './kit';
import { dish } from './food';

const BLUSH = '#f4a9a8', SAGE = '#8fc3a7', MUSTARD = '#f6cf6b', SKY = '#9dbbe6';
const BERRY = '#e2607a', WOOD = '#c98d63', WOOD_D = '#a8714d', WOOD_L = '#dcaa7e', GOLD = '#f0c34a';
const LEAF_D = '#7db596', IRON = '#5d5866', IRON_D = '#45414d', BRICK = '#d98b6f', BRICK_D = '#b86a52';
const PINK = '#f6b8c4', PINK_D = '#e48ea3';

const r = (v: number) => Math.round(v * 10) / 10;
const dot = (x: number, y: number, rad: number, fill: string, op = 1) =>
  `<circle cx="${r(x)}" cy="${r(y)}" r="${r(rad)}" fill="${fill}"${op < 1 ? ` opacity="${r(op * 100) / 100}"` : ''}/>`;
const stitch = (d: string, color = INK, w = 1.1, op = 0.5) =>
  `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-dasharray="2.6 2.6" stroke-linecap="round" opacity="${op}"/>`;

/** Small theme colour for cloths / blankets / doilies. */
function tint(theme: ThemeId): { cloth: string; trim: string } {
  switch (theme) {
    case 'spring': return { cloth: '#c7e6c0', trim: BLUSH };
    case 'summer': return { cloth: '#bfe3ef', trim: '#f7d36b' };
    case 'christmas': return { cloth: '#e98a8f', trim: '#7fb08f' };
    case 'halloween': return { cloth: '#f4b06f', trim: '#9b7bb8' };
    default: return { cloth: '#f7cbc8', trim: CREAM };
  }
}

/** Tiny seasonal touch (≤ 3 elements). */
function accent(theme: ThemeId, x: number, y: number): string {
  if (theme === 'christmas')
    return sh(`M${x},${y} c-3,-4 -7,-3 -8,0 c3,0 5,2 8,0z M${x},${y} c3,-4 7,-3 8,0 c-3,0 -5,2 -8,0z`, SAGE, 1.3)
      + sh(blob(x, y, 1.9, 1.9), BERRY, 1.2);
  if (theme === 'halloween')
    return sh(blob(x, y, 4.4, 3.5, 0.2), '#f2a65a', 1.5) + ln(`M${x},${y - 3.4} q1,-1.6 2.4,-2`, 1.4, '#7a9a5a');
  if (theme === 'spring') return sh(blob(x, y, 3, 3), BLUSH, 1.3) + dot(x, y, 1.1, MUSTARD);
  if (theme === 'summer')
    return sh(`M${x - 5},${y - 1} C${x - 4},${y + 4} ${x + 4},${y + 4} ${x + 5},${y - 1}z`, '#f08a8a', 1.3)
      + ln(`M${x - 4.6},${y - 0.4} C${x - 3},${y + 2.2} ${x + 3},${y + 2.2} ${x + 4.6},${y - 0.4}`, 1.2, '#7cc08f');
  return '';
}

/* ---------------------------- dining table ---------------------------- */

const STOOL_SEAT = blob(-34, -16, 11, 3.8);
const STOOL_FRONT = 'M-45,-16 C-45,-12.4 -23,-12.4 -23,-16 C-24,-10.6 -44,-10.6 -45,-16z';

function diningTable(theme: ThemeId, meal: DishId | null | undefined, time: number): string {
  const t = tint(theme);
  let s = shadow(5, 1, 34, 4) + shadow(-34, 9, 12, 2.4);
  // pedestal + foot
  s += sh('M1,-30 C2,-20 2,-10 0,-4 L10,-4 C8,-10 8,-20 9,-30z', WOOD_D, 2);
  s += sh(blob(5, -2.4, 15, 3), WOOD, 2);
  // round top under the cloth
  s += sh(blob(5, -40, 32, 7.5), WOOD, 2.2);
  // tablecloth draped with a scalloped hem
  let hem = 'M-25,-39 C-26,-34 -26,-30 -25,-27';
  for (let i = 0; i < 8; i++) hem += ` q3.75,${i % 2 ? 3 : 4} 7.5,0`;
  s += sh(`${hem} C35,-30 35,-34 35,-39 C25,-46 -15,-46 -25,-39z`, t.cloth, 2);
  s += fl(blob(5, -41.6, 27, 4.6), '#ffffff', 0.35);
  s += stitch('M-23,-30.6 C-10,-27.6 20,-27.6 33,-30.6', INK, 1, 0.45);
  s += dot(-14, -33, 1.4, t.trim) + dot(-2, -31.6, 1.4, t.trim) + dot(12, -31.6, 1.4, t.trim) + dot(24, -33, 1.4, t.trim);
  // meal on top + steam curls
  if (meal) {
    s += g('translate(6,-47) scale(0.8)', dish(meal));
    const p = (time * 0.7) % 1, q = (time * 0.7 + 0.5) % 1;
    const curl = (x: number, ph: number) =>
      `<path d="M${x},${r(-56 - ph * 10)} c-3,-3 3,-5 0,-9" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" opacity="${r(Math.sin(ph * Math.PI) * 0.8 * 100) / 100}"/>`;
    s += curl(2, p) + curl(10, q);
  } else {
    s += accent(theme, 6, -44);
  }
  // little stool on the left
  s += ln('M-42,-14 L-44,8 M-26,-14 L-24,8', 3.6) + ln('M-42,-14 L-44,8 M-26,-14 L-24,8', 1.8, WOOD_D);
  s += ln('M-34,-13 L-34,9', 3.6) + ln('M-34,-13 L-34,9', 1.8, WOOD);
  s += ln('M-43,0 C-38,1.6 -30,1.6 -25,0', 1.4);
  s += sh(STOOL_SEAT, WOOD_L, 2) + sh(STOOL_FRONT, WOOD, 1.6);
  return s;
}

/* -------------------------------- phone ------------------------------- */

function phoneTable(theme: ThemeId): string {
  const t = tint(theme);
  let s = shadow(0, 0, 18, 3);
  // three-leg side table
  s += ln('M-10,-30 L-14,0 M10,-30 L14,0 M0,-30 L0,-1', 3.8) + ln('M-10,-30 L-14,0 M10,-30 L14,0 M0,-30 L0,-1', 2, WOOD_D);
  s += ln('M-12,-12 C-4,-10 4,-10 12,-12', 1.4);
  s += sh(blob(0, -32, 19, 4.6), WOOD, 2);
  s += fl('M-19,-31.6 C-12,-27.6 12,-27.6 19,-31.6 L19,-30 C12,-26 -12,-26 -19,-30z', WOOD_D);
  // crochet doily
  let d = 'M-16,-34';
  for (let i = 0; i < 8; i++) d += ` q2,3 4,0`;
  s += sh(`${d} C14,-38 -14,-38 -16,-34z`, t.trim === CREAM ? '#fffdf8' : mix2(t.trim), 1.4);
  // rotary phone body
  s += sh('M-12,-35 C-13,-42 -9,-47 0,-47 C9,-47 13,-42 12,-35 C6,-33.6 -6,-33.6 -12,-35z', PINK, 2);
  // dial
  s += sh(blob(0, -40.6, 5.4, 3.6), CREAM, 1.4);
  s += dot(-3.2, -41.4, 0.8, PINK_D) + dot(0, -43, 0.8, PINK_D) + dot(3.2, -41.4, 0.8, PINK_D) + dot(-3, -39, 0.8, PINK_D) + dot(3, -39, 0.8, PINK_D);
  s += dot(0, -40.6, 1.3, PINK_D);
  // handset on the cradle
  s += sh('M-15,-48 C-16,-52 -12,-53.6 -9,-52 C-4,-50.6 4,-50.6 9,-52 C12,-53.6 16,-52 15,-48 C12,-46 10,-47.6 8,-49 C3,-48 -3,-48 -8,-49 C-10,-47.6 -12,-46 -15,-48z', PINK, 1.8);
  // curly cord
  s += ln('M12,-37 c3,0 3,3 1,3.6 c-2,0.6 -1,3 1,3 c2,0 2.6,2.6 0.6,3.4 c-2,0.8 -1.4,3 0.4,3', 1.2, PINK_D);
  s += dot(-8, -36.8, 1.4, BLUSH, 0.8) + dot(8, -36.8, 1.4, BLUSH, 0.8);
  return s;
}
/** Doily tint that stays soft. */
const mix2 = (c: string) => {
  const p = parseInt(c.slice(1), 16);
  const ch = (k: number) => Math.round(((p >> k) & 255) * 0.35 + 255 * 0.65);
  return '#' + ((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1);
};

/* ------------------------------ armchair ------------------------------ */

const KNIT = '#e8a17f', KNIT_D = '#c97e5d', KNIT_L = '#f4c3a6';
const ARM_L = 'M-40,-40 C-44,-46 -34,-50 -28,-46 C-26,-34 -26,-16 -27,-6 L-38,-6 C-40,-16 -40,-30 -40,-40z';
const ARM_R = 'M40,-40 C44,-46 34,-50 28,-46 C26,-34 26,-16 27,-6 L38,-6 C40,-16 40,-30 40,-40z';
const SEAT_FRONT = 'M-28,-21 C-14,-23 14,-23 28,-21 C29,-16 29,-11 28,-7 C14,-5 -14,-5 -28,-7 C-29,-11 -29,-16 -28,-21z';

function armchairFront(): string {
  let s = sh(SEAT_FRONT, KNIT_L, 2);
  s += stitch('M-24,-14 C-10,-15.4 10,-15.4 24,-14', KNIT_D, 1.1, 0.7);
  s += sh(ARM_L, KNIT, 2.2) + sh(ARM_R, KNIT, 2.2);
  s += ln('M-34,-42 C-35,-30 -35,-18 -34,-9 M34,-42 C35,-30 35,-18 34,-9', 1.1, KNIT_D);
  s += sh(blob(-34, -43.6, 5.4, 2.6), KNIT_L, 1.4) + sh(blob(34, -43.6, 5.4, 2.6), KNIT_L, 1.4);
  return s;
}

function armchair(theme: ThemeId): string {
  const t = tint(theme);
  let s = shadow(0, 0, 40, 4);
  // little feet
  s += sh(box(-35, -7, 7, 7, 2, 0.4), WOOD_D, 1.8) + sh(box(28, -7, 7, 7, 2, 0.4), WOOD_D, 1.8);
  // plump back with cable knit
  s += sh('M-32,-28 C-36,-56 -30,-82 0,-82 C30,-82 36,-56 32,-28z', KNIT, 2.4);
  s += ln('M-16,-76 C-12,-64 -20,-52 -16,-32 M0,-79 C4,-64 -4,-50 0,-32 M16,-76 C20,-64 12,-52 16,-32', 1.2, KNIT_D);
  s += stitch('M-24,-70 C-27,-56 -27,-42 -25,-32 M24,-70 C27,-56 27,-42 25,-32', KNIT_D, 1, 0.6);
  // seat cushion top (the bear sits here)
  s += sh('M-30,-28 C-16,-32 16,-32 30,-28 L28,-20 C14,-22 -14,-22 -28,-20z', KNIT_L, 2);
  // heart cushion leaning on the back
  s += sh('M-8,-31 C-20,-38 -20,-52 -12,-53 C-8,-54 -5,-51 -4,-48 C-2,-52 2,-54 6,-52 C12,-49 8,-37 -8,-31z', t.cloth, 1.8);
  s += dot(-5, -44, 1.4, INK, 0.7);
  // folded blanket draped over the top-right
  s += sh('M8,-80 C18,-84 28,-80 33,-72 C36,-62 37,-50 36,-42 C32,-40 28,-41 26,-43 C27,-54 24,-66 16,-72 C12,-75 9,-77 8,-80z', SKY, 2);
  s += ln('M14,-80.4 C22,-78 28,-70 30,-60 M20,-81 C28,-76 32,-68 33.6,-58', 1.6, t.trim === CREAM ? '#ffffff' : t.trim);
  s += ln('M27,-42 l-1,4 M30,-41 l0,4 M33,-41 l1,4', 1.2);
  s += armchairFront();
  s += accent(theme, -24, -74);
  return s;
}

/* ------------------------------ fireplace ----------------------------- */

function fireplace(theme: ThemeId, fireOn: boolean, time: number): string {
  let s = shadow(0, 1, 44, 4);
  // brick back panel
  s += sh(box(-40, -96, 80, 90, 5, 1), BRICK, 2.2);
  s += ln('M-38,-80 H38 M-38,-64 H38 M-38,-48 H38 M-38,-32 H38 M-38,-16 H38 M-20,-96 V-80 M18,-96 V-80 M-30,-80 V-64 M30,-80 V-64 M-30,-48 V-32 M30,-48 V-32 M-24,-16 V-6 M24,-16 V-6', 1.1, BRICK_D);
  // hearth slab
  s += sh(box(-44, -8, 88, 8, 3, 0.6), '#cbbfb4', 2);
  // chimney pipe up the wall
  s += sh('M-6,-110 L6,-110 L6,-74 L-6,-74z', IRON, 2);
  s += sh(box(-9, -84, 18, 5, 2, 0.4), IRON_D, 1.6);
  // stove legs + body
  s += ln('M-22,-14 L-24,-8 M22,-14 L24,-8', 3.4);
  s += sh('M-28,-72 C-30,-56 -30,-28 -27,-14 C-10,-12 10,-12 27,-14 C30,-28 30,-56 28,-72z', IRON, 2.4);
  s += sh(box(-32, -76, 64, 6, 2, 0.4), IRON_D, 2);
  // firebox window (arched)
  const WIN = 'M-17,-24 L-17,-46 C-17,-60 17,-60 17,-46 L17,-24z';
  const flick = (k: number, ph: number) => 1 + 0.12 * Math.sin(time * k + ph) + 0.06 * Math.sin(time * k * 2.3 + ph * 1.7);
  if (fireOn) {
    const glow = 0.22 + 0.06 * Math.sin(time * 5.1);
    s += dot(0, -40, 46, '#ffb35c', glow) + dot(0, -38, 26, '#ffd27a', glow + 0.1);
    s += fl(WIN, '#5a2a22');
    const flame = (x: number, h: number, w: number, c: string, sc: number) =>
      `<path d="M${x - w},-25 C${x - w - 2},${r(-25 - h * 0.45 * sc)} ${x - 1},${r(-25 - h * 0.7 * sc)} ${x},${r(-25 - h * sc)} C${x + 1},${r(-25 - h * 0.7 * sc)} ${x + w + 2},${r(-25 - h * 0.45 * sc)} ${x + w},-25z" fill="${c}"/>`;
    s += flame(-7, 20, 6, '#f2803c', flick(9, 0)) + flame(7, 18, 6, '#f2803c', flick(8, 2)) + flame(0, 26, 7, '#f7b043', flick(10, 1));
    s += flame(0, 13, 4, '#ffe9a0', flick(12, 3));
    s += ln('M-12,-25 L10,-28 M-10,-28 L12,-25', 3, '#7a4a32');
    // sparks rising above the stove
    for (let i = 0; i < 3; i++) {
      const p = (time * 0.45 + i / 3) % 1;
      s += dot(r(-8 + i * 8 + Math.sin(time * 3 + i * 2) * 3), r(-78 - p * 26), 1.3 - p * 0.6, '#ffc36a', 1 - p);
    }
  } else {
    s += fl(WIN, '#3a2b2a');
    s += sh(blob(-5, -28, 9, 3.6), WOOD_D, 1.6) + sh(blob(6, -31, 9, 3.4, -0.2), WOOD, 1.6);
    s += dot(3, -26, 2.4, '#e8743c', 0.35 + 0.15 * Math.sin(time * 1.5));
  }
  s += ln(WIN, 2.4) + ln('M0,-55 V-24', 1.4, IRON_D);
  // little knob + ash door
  s += ln('M-12,-18 H12', 1.4, IRON_D) + dot(21, -40, 2, GOLD);
  s += ln('M-6,-66 C-2,-68 2,-68 6,-66', 1.4, IRON_D);
  s += accent(theme, -22, -79);
  return s;
}

/* ------------------------------ bookshelf ----------------------------- */

function bookshelf(theme: ThemeId): string {
  let s = shadow(0, 0, 22, 3);
  s += sh(box(-19, -90, 38, 86, 3, 0.8), WOOD, 2.2);
  s += fl(box(-15, -86, 30, 78, 2, 0.4), WOOD_D);
  s += ln('M-16,-60 H16 M-16,-33 H16', 3.2) + ln('M-16,-60 H16 M-16,-33 H16', 1.6, WOOD_L);
  s += ln('M-15,-4 L-16,0 M15,-4 L16,0', 3);
  // bottom shelf: pastel books
  const book = (x: number, y: number, w: number, h: number, c: string, tilt = 0) =>
    (tilt ? g(`rotate(${tilt} ${x + w / 2} ${y + h})`, sh(box(x, y, w, h, 1.2, 0.3), c, 1.4)) : sh(box(x, y, w, h, 1.2, 0.3), c, 1.4));
  s += book(-14, -30, 5, 21, BLUSH) + book(-9, -27, 5, 18, SKY) + book(-4, -29, 6, 20, MUSTARD) + book(2, -26, 5, 17, SAGE) + book(8, -25, 5, 16, '#c9b2e6', 14);
  s += ln('M-12.6,-25 h2.2 M-1.8,-24 h2', 1, CREAM);
  // middle shelf: books + framed photo
  s += book(-14, -56, 5, 22, '#c9b2e6') + book(-9, -53, 5, 19, BLUSH);
  s += sh(box(0, -52, 13, 18, 2, 0.4), GOLD, 1.6);
  s += fl(box(2.4, -49.4, 8.2, 12.6, 1, 0.2), '#d6e6f5');
  s += tinyFace(6.5, -43, 0.45);
  // top shelf: tiny plant + books
  s += sh('M-12,-71 h12 l-1.6,9.6 h-8.8z', '#e9a58f', 1.6);
  s += sh('M-6,-71 C-12,-74 -14,-80 -11,-82 C-8,-80 -6,-76 -6,-71z M-6,-71 C-1,-76 0,-82 -3,-84 C-6,-81 -7,-76 -6,-71z', SAGE, 1.4);
  s += ln('M-6,-71 C-6,-76 -4,-80 -3,-83', 1, LEAF_D);
  s += book(4, -82, 5, 21, SKY) + book(9, -79, 5, 18, MUSTARD);
  s += accent(theme, 11, -88);
  return s;
}

/* -------------------------------- radio ------------------------------- */

function radio(theme: ThemeId, time: number): string {
  const t = tint(theme);
  let s = shadow(0, 0, 18, 3);
  // little stand
  s += ln('M-12,-26 L-14,0 M12,-26 L14,0', 3.6) + ln('M-12,-26 L-14,0 M12,-26 L14,0', 1.8, WOOD_D);
  s += ln('M-13,-10 H13', 1.4);
  s += sh(box(-17, -30, 34, 5, 2, 0.4), WOOD, 1.8);
  // radio body
  s += sh('M-16,-31 C-17,-42 -16,-52 -10,-54 C-4,-55.4 4,-55.4 10,-54 C16,-52 17,-42 16,-31z', '#f2c9a8', 2.2);
  s += sh(blob(-6, -42, 7, 7), CREAM, 1.6);
  s += ln('M-11,-44 h10 M-12,-41 h12 M-11,-38 h10', 1, WOOD_D);
  s += sh(box(3, -49, 10, 6, 1.5, 0.3), '#fff6d4', 1.3) + ln('M7,-48 v4', 1.1, BERRY);
  s += sh(blob(5.4, -37, 2.4, 2.4), t.cloth, 1.3) + sh(blob(11, -37, 2.4, 2.4), t.cloth, 1.3);
  // antenna
  s += ln('M8,-54.6 L18,-70', 1.4) + dot(18, -70, 1.6, BERRY);
  // two floating notes
  const note = (ph: number, x0: number, dbl: boolean) => {
    const p = (time * 0.4 + ph) % 1, x = r(x0 + Math.sin((time + ph * 6) * 2.2) * 3), y = r(-60 - p * 22);
    const op = r(Math.sin(p * Math.PI) * 100) / 100;
    const d = dbl ? `M${x},${y} v-9 l7,-2 v9` : `M${x},${y} v-9 q4,1 5,4`;
    return `<g opacity="${op}">${ln(d, 1.4)}${dot(x - 1.8, y, 2.2, INK)}${dbl ? dot(x + 5.2, y - 2, 2.2, INK) : ''}</g>`;
  };
  s += note(0, -10, false) + note(0.5, 2, true);
  s += accent(theme, -12, -56);
  return s;
}

/* ------------------------------ exports ------------------------------- */

/** o.meal: dish on the dining table; o.fireOn: fireplace lit; time for flames / radio notes. */
export function furniture(id: FurnitureId, theme: ThemeId, o: { meal?: DishId | null; fireOn?: boolean; time: number }): string {
  const time = o.time || 0;
  switch (id) {
    case 'dining_table': return diningTable(theme, o.meal, time);
    case 'phone': return phoneTable(theme);
    case 'armchair': return armchair(theme);
    case 'fireplace': return fireplace(theme, !!o.fireOn, time);
    case 'bookshelf': return bookshelf(theme);
    case 'radio': return radio(theme, time);
    default: return '';
  }
}

/** Front part drawn OVER a sitting bear (armchair arm, dining stool front). '' if none. */
export function furnitureFront(id: FurnitureId, theme: ThemeId): string {
  void theme;
  if (id === 'armchair') return armchairFront();
  if (id === 'dining_table') return sh(STOOL_FRONT, WOOD, 1.6);
  return '';
}

const VIEWBOX: Record<FurnitureId, string> = {
  dining_table: '-50 -78 100 100',
  phone: '-32 -62 64 66',
  armchair: '-46 -88 92 92',
  fireplace: '-58 -114 116 118',
  bookshelf: '-48 -94 96 98',
  radio: '-40 -82 80 86',
};

export function furnitureSvg(id: FurnitureId, size: number): string {
  const inner = furniture(id, 'everyday', { meal: null, fireOn: id === 'fireplace', time: 0.6 });
  return standalone(VIEWBOX[id] ?? '-50 -100 100 100', size, inner, id.replace(/_/g, ' '));
}
