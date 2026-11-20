/* Character sheet: hand-shaped Bezier heads/bodies/ears/limbs, thick soft brown ink line,
   colour fill nudged off the line, dot eyes, rosy cheeks, little "w" mouth.
   Drawn in "doll" coordinates (feet at y=35, head top ~-51), then scaled so feet sit at (0,0). */
import type { CharacterLook, DrawCharacterOpts, HatKind, HeldProp, MenuItemId, Species } from '../types';
import { INK, EYE, CREAM, fl, ln, sh, blob, box } from './kit';
import { n } from './core';
import { item, itemCoaster } from './items';

const OUT = INK;
const SCALE = 0.88;

const HEAD = 'M-19,-30 C-21,-44 -9,-52 2,-51 C14,-50 22,-42 20,-29 C19,-18 10,-13 0,-13 C-11,-13 -18,-19 -19,-30z';
const BODY = 'M-11,-15 C-19,-4 -20,18 -12,24 C-5,28 8,28 13,23 C20,16 17,-5 10,-15z';
const LEG_L = 'M-11,22 C-13,30 -11,35 -6,35 C-2,35 -2,28 -3,23z';
const LEG_R = 'M3,23 C2,29 3,35 8,35 C13,35 13,28 11,22z';
const ARM_L = 'M-14,-6 C-23,-2 -26,8 -21,11 C-17,13 -14,6 -12,0z';
const ARM_R = 'M13,-6 C22,-3 26,6 22,10 C18,13 14,6 12,0z';
const ARM_R_UP = 'M11,-8 C18,-11 27,-9 29,-4 C30,0 24,2 12,1z';
const BELLY = 'M-6,3 C-10,10 -8,20 0,21 C8,21 10,11 7,3z';
const APRON = 'M-9,-6 C-3,-4 4,-4 9,-6 C12,6 11,16 8,20 C2,22 -4,22 -8,20 C-11,14 -11,4 -9,-6z';
const FOX_TAIL = 'M10,20 C26,24 37,10 31,-6 C28,2 22,7 13,8z';
const FOX_TIP = 'M31,-6 C33,-2 34,2 33,6 C30,5 28,4 26,3 C28,1 30,-2 31,-6z';
const FOX_MASK = 'M-17,-27 C-10,-22 -4,-28 0,-28 C5,-28 11,-22 19,-27 C18,-18 10,-13 0,-13 C-10,-13 -17,-19 -17,-27z';
const SHEEP_WOOL = 'M-20,-36 C-27,-42 -20,-51 -14,-48 C-14,-57 -4,-59 0,-53 C5,-60 16,-56 14,-48 C22,-50 27,-41 20,-36 C12,-40 -12,-40 -20,-36z';
const GHOST_ARM_L = 'M-19,-8 C-26,-6 -28,1 -24,3 C-21,4 -19,0 -19,-3z';
const GHOST_ARM_R = 'M19,-8 C26,-6 28,1 24,3 C21,4 19,0 19,-3z';

const EARS: Record<Species, string[]> = {
  bear: ['M-18,-42 C-25,-50 -14,-59 -8,-49z', 'M9,-50 C14,-59 26,-51 19,-42z'],
  bunny: ['M-12,-48 C-16,-66 -10,-77 -5,-75 C0,-72 -2,-58 -3,-49z', 'M5,-50 C6,-64 12,-72 18,-68 C24,-63 20,-56 13,-47z'],
  cat: ['M-18,-40 C-21,-52 -18,-59 -15,-59 C-11,-57 -7,-52 -5,-49z', 'M6,-50 C9,-54 14,-59 17,-58 C20,-54 20,-46 19,-40z'],
  fox: ['M-18,-40 C-23,-56 -20,-65 -16,-65 C-10,-61 -6,-54 -4,-49z', 'M5,-50 C8,-56 13,-63 18,-64 C23,-58 21,-48 19,-40z'],
  sheep: ['M-19,-34 C-28,-35 -31,-28 -27,-26 C-22,-24 -19,-28 -18,-31z', 'M19,-33 C28,-34 32,-28 28,-25 C23,-23 20,-27 19,-30z'],
  mouse: ['M-17,-41 C-31,-46 -29,-63 -16,-61 C-9,-59 -8,-51 -9,-48z', 'M10,-48 C9,-57 14,-63 23,-60 C32,-55 28,-42 18,-41z'],
  frog: ['M-17,-45 C-19,-57 -4,-58 -4,-47z', 'M5,-47 C5,-58 20,-57 18,-45z'],
  duck: [],
  ghost: [],
};

/** Ghost sheet with a wavy hem at `bottom`. */
function ghostPath(bottom: number): string {
  const b = bottom, u = b - 4;
  return `M-19,-30 C-21,-46 -8,-52 2,-51 C14,-50 21,-42 20,-28 C21,-12 22,${n(b - 18)} 21,${u}`
    + ` C17,${b + 2} 14,${u - 2} 10,${u}`
    + ` C6,${b + 2} 3,${u - 2} -1,${u}`
    + ` C-5,${b + 2} -8,${u - 2} -12,${u}`
    + ` C-16,${b + 2} -19,${u} -20,${u - 3}`
    + ` C-21,${n(b - 22)} -20,-16 -19,-30z`;
}

const FLOWER_PETALS = (() => {
  let d = '';
  for (let i = 0; i < 5; i++) {
    const a = (i * 72 - 90) * Math.PI / 180, a1 = a - 0.5, a2 = a + 0.5;
    const p = (ang: number, r: number) => `${n(Math.cos(ang) * r)},${n(Math.sin(ang) * r)}`;
    d += `M0,0 C${p(a1, 3.6)} ${p(a1 + 0.25, 4.6)} ${p(a, 4.6)} C${p(a2 - 0.25, 4.6)} ${p(a2, 3.6)} 0,0z `;
  }
  return d.trim();
})();
const miniFlower = (x: number, y: number, petal: string, mid: string, s = 1) =>
  `<g transform="translate(${x},${y}) scale(${s})"><path d="${FLOWER_PETALS}" fill="${petal}" stroke="${OUT}" stroke-width="1.1"/><circle r="1.5" fill="${mid}"/></g>`;

/** Frogs: hats rest on top of the two eye bumps (brim above the eyes) instead of over them. */
const frogTop = (base: number, inner: string) => `<g transform="translate(0.5,-54) scale(.85) translate(0,${base})">${inner}</g>`;

function hat(kind: HatKind, frog = false): string {
  if (frog && (kind === 'santa' || kind === 'witch')) return frogTop(kind === 'santa' ? 34 : 37, hat(kind));
  if (frog && kind === 'flowercrown') {
    // vine follows the eye bumps, dipping between them; flowers beside and between the eyes
    return ln('M-19,-49 C-15,-61 -6,-61 0.5,-53 C7,-61 16,-61 20,-49', 2.2, '#6aa883')
      + `<path d="M-9,-59 C-11,-63 -7,-64 -6,-60 M9,-60 C10,-64 14,-62 12,-59" fill="#8fc3a7" stroke="${OUT}" stroke-width="1"/>`
      + miniFlower(-19, -48, '#f7b6c8', '#f6cf6b', 0.95)
      + miniFlower(0.5, -54, '#f6cf6b', '#e2607a', 1)
      + miniFlower(20, -48, CREAM, '#9dbbe6', 0.95);
  }
  if (kind === 'santa') {
    return sh('M-17,-42 C-15,-57 -2,-66 11,-64 C20,-62 27,-55 30,-46 C26,-48 22,-48 19,-45 C10,-44 -8,-44 -17,-42z', '#d2443f', 2.2)
      + sh('M-20,-42 C-12,-47 12,-48 21,-41 C22,-38 21,-36 20,-34 C10,-39 -10,-39 -20,-35 C-22,-37 -22,-40 -20,-42z', CREAM, 2.2)
      + sh('M30,-51 C34,-51 36,-48 35,-45 C34,-41 29,-41 27,-44 C26,-47 27,-51 30,-51z', CREAM, 2);
  }
  if (kind === 'witch') {
    return sh('M-31,-42 C-20,-49 21,-50 32,-42 C27,-36 -25,-35 -31,-42z', '#3b2a55', 2.2)
      + sh('M-14,-44 C-12,-56 -6,-70 4,-80 C8,-83 13,-82 15,-78 C10,-76 9,-68 12,-58 C13,-52 15,-47 15,-44 C6,-42 -6,-42 -14,-44z', '#3b2a55', 2.2)
      + fl('M-14,-49 C-5,-47 6,-47 14,-49 C15,-47 15,-46 15,-44 C6,-42 -6,-42 -14,-44 C-14,-46 -14,-47 -14,-49z', '#f08a3c')
      + `<circle cx="8" cy="-47" r="1.4" fill="#ffe08a"/>`;
  }
  if (kind === 'flowercrown') {
    return ln('M-19,-41 C-12,-49 9,-52 20,-42', 2.2, '#6aa883')
      + `<path d="M-13,-46 C-16,-50 -12,-52 -10,-48 M12,-49 C15,-53 18,-50 16,-46" fill="#8fc3a7" stroke="${OUT}" stroke-width="1"/>`
      + miniFlower(-17, -42, '#f7b6c8', '#f6cf6b', 0.9)
      + miniFlower(-8, -48, CREAM, '#e2607a', 1)
      + miniFlower(2, -50, '#f6cf6b', '#e2607a', 1.05)
      + miniFlower(11, -48, '#f7b6c8', '#f6cf6b', 1)
      + miniFlower(19, -42, CREAM, '#9dbbe6', 0.9);
  }
  return '';
}

/* ---------- seated / lying / holding parts (doll coords) ---------- */
const SIT_BODY = 'M-11,-15 C-20,-7 -23,8 -14,11 C-6,13.5 8,13.5 15,11 C23,7 18,-7 10,-15z';
const SIT_LEG_L = 'M-14,5 C-19,8 -18,17 -11.5,17 C-6,17 -5,10 -7,6z';
const SIT_LEG_R = 'M8,6 C6,10 7,17 12.5,17 C19,17 20,8 15,5z';
/** Squash apron/belly/towel markup to fit the shorter seated body. */
const SQ = 'translate(0,-10) scale(1,.66) translate(0,10)';
/** Arms resting with paws on the lap / tummy (drawn in front of the body). */
const REST_L = 'M-13,-8 C-20,-3 -19,5 -12,6 C-7,6.5 -6,2 -8,-1z';
const REST_R = 'M13,-8 C20,-3 19,5 12,6 C7,6.5 6,2 8,-1z';
/** Arms reaching forward, paws in front of the chest (for two-paw props). */
const HOLD_L = 'M-13,-9 C-20,-5 -20,2 -13.5,2.5 C-9,3 -7,-1 -8.5,-4z';
const HOLD_R = 'M13,-9 C20,-5 20,2 13.5,2.5 C9,3 7,-1 8.5,-4z';
/** Right arm variants for one-paw props. */
const ARM_PHONE = 'M11,-9 C17,-12 21,-17 21,-22 C21,-26 16,-27 15.5,-23 C15,-19 13,-15 9,-12z';
const ARM_OUT = 'M12,-9 C19,-9 25,-6 25.5,-1.5 C26,2.5 21,3.5 13,1z';
const ARM_LIFT = 'M12,-9 C18,-11 22,-8 21.5,-4 C21,0 16,0.5 11,-2z';

const TOWEL_C = '#bfe3ee', TOWEL_HI = '#e6f5f9';
const TOWEL_BODY = 'M-16,-11 C-7,-13 7,-13 16,-11 C21,0 21,14 15,23 C5,27 -6,27 -14,23 C-21,13 -21,0 -16,-11z';
const TOWEL_FOLD = 'M-17,-13 C-8,-16 8,-16 17,-13 C18.5,-10 18,-8 16.5,-6.5 C7,-9.5 -7,-9.5 -16.5,-6.5 C-18.5,-8.5 -18.5,-11 -17,-13z';
const TURBAN = 'M-21,-35 C-25,-49 -11,-59 1,-58 C14,-59 26,-49 21,-35 C14,-41 -13,-41 -21,-35z';
const TURBAN_KNOT = 'M-3,-56 C-6,-64 4,-67 7,-62 C9,-58 5,-55 2,-56z';
const DROP = 'M0,-3.5 C1.8,-1 2.6,.6 2.6,1.5 C2.6,3 1.4,4 0,4 C-1.4,4 -2.6,3 -2.6,1.5 C-2.6,.6 -1.8,-1 0,-3.5z';
const drop = (x: number, y: number, s = 1) =>
  `<path d="${DROP}" transform="translate(${x},${y}) scale(${s})" fill="#a9d8ef" stroke="${OUT}" stroke-width="1.1"/>`;

/** Towel wrapped round the body (body markup coords). */
const towelWrap = () => sh(TOWEL_BODY, TOWEL_C, 2.2) + sh(TOWEL_FOLD, TOWEL_HI, 2)
  + ln('M9,-7 C7,2 8,10 6,16', 1.4) + ln('M-14,17 C-5,20 6,20 15,17', 1.6, '#fff');
/** Towel turban (head coords). */
const turban = () => sh(TURBAN, TOWEL_C, 2.2)
  + ln('M-17,-42 C-8,-50 8,-51 16,-46 M-12,-37 C-3,-45 10,-46 18,-39', 1.4) + sh(TURBAN_KNOT, TOWEL_HI, 2);

type Hold = HeldProp | undefined;
const TWO_PAW: HeldProp[] = ['towel', 'book', 'bowl', 'gift'];
const ONE_PAW: HeldProp[] = ['phone', 'spatula', 'chopsticks'];

/** The prop (plus any arm that grips it), drawn in front of everything. */
function held(h: HeldProp, c: string, ac: string): string {
  const arms = sh(HOLD_L, c) + sh(HOLD_R, c);
  switch (h) {
    case 'towel': // draped over both paws
      return arms
        + sh('M-15,-4 C-6,-6.5 7,-6.5 16,-4 C17,3 16,9 15,13 C12,11 9,14 6,12 C3,14 0,11 -3,13 C-6,11 -9,14 -12,12 C-15,13 -16,6 -15,-4z', TOWEL_C, 2.2)
        + ln('M-14.5,6 C-5,5 6,5 15.5,6', 1.6, '#fff') + ln('M-15,-1 C-5,-2.5 6,-2.5 16,-1', 1.2);
    case 'book':
      return sh('M-14,-7 L-13.5,6 C-8,4 -3,5 0.5,7.5 C4,5 9,4 14.5,6 L15,-7 C9,-9 4,-8 0.5,-6 C-3,-8 -9,-9 -14,-7z', ac, 2)
        + sh('M0.5,-9 C-4,-12 -10,-11 -12.5,-8.5 L-12,4 C-8,2 -3,2 0.5,5z M0.5,-9 C5,-12 11,-11 13.5,-8.5 L13,4 C9,2 4,2 0.5,5z', CREAM, 1.8)
        + ln('M-9.5,-6 C-7,-7 -4.5,-7 -2.5,-6 M-9.5,-2.5 C-7,-3.5 -4.5,-3.5 -2.5,-2.5 M3.5,-6 C6,-7 8.5,-7 10.5,-6 M3.5,-2.5 C6,-3.5 8.5,-3.5 10.5,-2.5', 1.1)
        + arms;
    case 'bowl':
      return ln('M-2,-12 c-2,-3 2,-4 0,-7 M4,-12 c-2,-3 2,-4 0,-7', 1.4, '#c9b1a3')
        + sh('M-8.5,-4 C-8,-11 10,-11 10.5,-4z', '#fffdf8', 1.8)
        + sh('M-11,-4.5 C-10,5 12,5 13,-4.5 C5,-3 -3,-3 -11,-4.5z M-3,2.8 C-2,5 4,5 5,2.8', '#86acd3', 2)
        + ln('M-8,-1 C-3,0.5 5,0.5 10,-1', 1.3, '#fff')
        + arms;
    case 'gift':
      return sh(box(-11, -8, 23, 15, 3, 0.8), '#f4a7b9', 2)
        + `<path d="M0.5,-8 L0.5,7 M-11,-1 L12,-1" fill="none" stroke="${ac === '#f4a7b9' ? '#e2607a' : ac}" stroke-width="3"/>`
        + sh('M0.5,-8 C-4,-15 -10,-12 -6,-8.5 C-4,-7.5 -1,-7.8 0.5,-8z M0.5,-8 C5,-15 11,-12 7,-8.5 C5,-7.5 2,-7.8 0.5,-8z', ac, 1.6)
        + arms;
    case 'phone': // old pink receiver at the ear, curly cord
      return ln('M18,-16 c3,1.5 -1,3.5 2,5 c3,1.5 -1,3.5 2,5 c3,1.5 -1,3.5 2,5 c3,1.5 -1,3.5 2,5', 1.4)
        + sh('M17,-39 C21,-41 27,-38 26,-34 C25.5,-31 23,-31 23,-27 C23,-24 25,-22.5 25,-19.5 C25,-15 19,-14 17,-17 C16,-19 19,-21 19,-24.5 C19,-28 16,-30 15.5,-33 C15.5,-35.5 16,-38 17,-39z', '#f5a9c0', 2)
        + sh(ARM_PHONE, c);
    case 'spatula':
      return ln('M23.5,-1 L27,-17', 2.6, '#b5653d')
        + sh('M23,-27 C24,-30.5 32,-30 32.5,-26.5 L30.5,-17.5 C28.5,-16 26,-16 24,-17.5z', '#d9d2cc', 1.8)
        + ln('M26,-26 l-.6,6 M29,-26 l-.6,6', 1.1)
        + sh(ARM_OUT, c);
    case 'chopsticks':
      return ln('M8,-17 C7,-13 10,-11 8,-7 C6,-3 9,-1 8,2', 3.4)
        + ln('M8,-17 C7,-13 10,-11 8,-7 C6,-3 9,-1 8,2', 1.8, '#f6e2a8')
        + ln('M21,-2 L6,-18 M23,-4 L9,-19.5', 1.8, '#b5653d')
        + sh(ARM_LIFT, c);
    case 'basket': // red-and-white basket hooked over the left arm
      return sh('M-32,7 C-26,6 -14,6 -10,7 C-11,13 -12,17 -14,20 C-19,21 -25,21 -29,20 C-30,17 -31,13 -32,7z', '#de5b55', 2)
        + ln('M-27,11.5 l.4,5 M-23,11.5 l.2,5.5 M-19,11.5 l0,5.5 M-15,11.5 l-.3,5', 1.8, '#fff')
        + sh('M-33,5.5 C-26,3.5 -14,3.5 -9,5.5 C-8.7,7.5 -8.8,8.5 -9.5,9 C-15,8 -26,8 -32.5,9 C-33.3,8 -33.3,7 -33,5.5z', '#fff', 1.8)
        + ln('M-29,5.5 C-28.5,-4 -14.5,-4 -13.5,5.5', 3.8) + ln('M-29,5.5 C-28.5,-4 -14.5,-4 -13.5,5.5', 1.8, '#fff');
  }
  return '';
}

/** Tray held at the side with up to 3 items. Doll coords. */
function tray(items: MenuItemId[]): string {
  let s = sh('M15,-4 C17,-7 43,-7 45,-4 C45,-1 17,-1 15,-4z', '#d9d2cc', 1.8);
  const list = items.slice(0, 3);
  const xs = list.length === 1 ? [30] : list.length === 2 ? [25, 36] : [21, 30, 39];
  list.forEach((id, i) => {
    s += `<g transform="translate(${xs[i]},${i === 1 && list.length === 3 ? -10 : -9}) scale(.62)">${itemCoaster(id)}${item(id)}</g>`;
  });
  return s;
}

function doll(look: CharacterLook, o: DrawCharacterOpts): string {
  const sp = look.species, c = look.color, c2 = look.color2 ?? c;
  const sit = o.pose === 'sit', lie = o.pose === 'lie', walk = o.pose === 'walk', gh = sp === 'ghost';
  const frog = sp === 'frog';
  const towel = !!o.towel;
  const carrying = !!(o.carrying && o.carrying.length && !sit && !lie);
  const hold: Hold = carrying ? undefined : o.holding;
  const two = !!hold && TWO_PAW.includes(hold), oneR = !!hold && ONE_PAW.includes(hold);
  const rest = sit || lie;
  const hatK = towel ? 'none' : look.hat ?? 'none';
  let acc = look.accessory;
  if (hatK !== 'none' && (acc === 'beret' || acc === 'bow' || acc === 'flower')) acc = 'none';
  if (towel) acc = 'none';
  const ac = look.accentColor || '#e58a94';
  const limb = sp === 'duck' ? c2 : c;
  const ph = (o.walkPhase ?? 0) * Math.PI * 2, sw = walk ? Math.sin(ph) : 0;
  const armRot = walk ? n(sw * 12) : 0;
  let s = '';

  if (gh) {
    const bottom = sit ? 12 : 26;
    s += `<g transform="translate(0,${sit ? 0 : 4})">`;
    if (!two) s += sh(GHOST_ARM_L, c) + (carrying || oneR ? '' : sh(GHOST_ARM_R, c));
    s += sh(ghostPath(bottom), c);
    if (towel) s += `<g transform="translate(0,${sit ? -6 : 0}) scale(1.08,${sit ? 0.7 : 1})">${towelWrap()}</g>`;
  } else {
    s += '<g>';
    if (sp === 'fox') s += (sit ? '<g transform="translate(0,-12)">' : '<g>') + fl(FOX_TAIL, c) + fl(FOX_TIP, CREAM) + ln(FOX_TAIL) + '</g>';
    if (!sit) {
      const lx = n(sw * 2.4), ly = n(-Math.max(0, sw) * 3), rx = n(-sw * 2.4), ry = n(-Math.max(0, -sw) * 3);
      s += (walk ? `<g transform="translate(${lx},${ly})">` : '<g>') + sh(LEG_L, limb) + '</g>';
      s += (walk ? `<g transform="translate(${rx},${ry})">` : '<g>') + sh(LEG_R, limb) + '</g>';
    }
    if (!rest && !two) {
      s += (armRot ? `<g transform="rotate(${armRot} -12 -4)">` : '<g>') + sh(ARM_L, c) + '</g>';
      if (!carrying && !oneR) s += (armRot ? `<g transform="rotate(${-armRot} 12 -4)">` : '<g>') + sh(ARM_R, c) + '</g>';
    }
    s += sh(sit ? SIT_BODY : BODY, c);
    let front = '';
    if (towel) {
      front += towelWrap();
    } else if (acc === 'apron') {
      front += sh(APRON, look.apronColor ?? CREAM, 2)
        + `<path transform="translate(0,7) scale(.5)" d="M0,4 C-9,-3 -4,-10 0,-5 C4,-10 9,-3 0,4z" fill="${ac}"/>`
        + `<path d="M-6,13 C-3,12 3,12 6,13" fill="none" stroke="${INK}" stroke-opacity=".35" stroke-width="1.2" stroke-dasharray="1.5 2.5"/>`;
    } else if (sp !== 'sheep') {
      front += `<path d="${BELLY}" fill="#fff" opacity=".35"/>`;
    }
    if (sp === 'sheep' && !towel) front += `<path d="M-8,4 C-6,1 -3,1 -1,4 C1,1 4,1 6,4 M-9,13 C-7,10 -4,10 -2,13 C0,10 3,10 5,13" fill="none" stroke="${INK}" stroke-opacity=".3" stroke-width="1.2"/>`;
    s += sit ? `<g transform="${SQ}">${front}</g>` : front;
    if (sit) {
      // legs bent forward towards us: round thighs with the soles showing
      for (const [d, x] of [[SIT_LEG_L, -11.5], [SIT_LEG_R, 12.5]] as const) {
        s += sh(d, limb) + `<path d="${blob(x, 12.5, 3, 2.7)}" fill="#fff" opacity=".45"/>`;
      }
    }
    if (rest && !two) s += sh(REST_L, c) + (oneR ? '' : sh(REST_R, c));
    s += '</g>';
  }

  // head (tilted up on the pillow when lying down)
  const tilt = lie && !gh;
  if (tilt) s += '<g transform="rotate(18 0 -14)">';
  if (!gh) {
    for (const d of EARS[sp]) s += sh(d, sp === 'sheep' ? c2 : c);
    if (sp === 'bunny') s += `<path d="M-8,-54 C-10,-61 -9,-67 -7,-69 M11,-54 C12,-60 15,-64 17,-64" fill="none" stroke="#eaa6ae" stroke-width="3.5" stroke-linecap="round"/>`;
    if (sp === 'mouse') s += `<path d="M-21,-47 C-24,-52 -20,-57 -16,-55 C-13,-53 -15,-48 -21,-47z M17,-47 C15,-52 18,-56 22,-55 C26,-52 23,-47 17,-47z" fill="#eaa6ae"/>`;
    if (sp === 'fox' || sp === 'cat') s += `<path d="M-16,-46 C-17,-52 -16,-55 -15,-55 C-13,-53 -11,-51 -10,-49z M11,-50 C13,-52 15,-54 16,-54 C17,-51 17,-48 17,-45z" fill="#f2b8b8" opacity=".8"/>`;
    s += fl(HEAD, sp === 'sheep' ? c2 : c);
    if (sp === 'fox') s += fl(FOX_MASK, CREAM);
    if (sp === 'bear') s += `<path d="M-7,-25 C-7,-31 9,-31 9,-25 C9,-19 -7,-19 -7,-25z" fill="#f3dcc0" opacity=".9"/>`;
    s += ln(HEAD);
    if (sp === 'sheep') s += sh(SHEEP_WOOL, c);
    if (sp === 'cat') s += ln('M-3,-49 l0,5 M2,-50 l0,6 M7,-49 l0,5', 2) + ln('M-17,-27 l-9,-2 M-17,-23.5 l-9,1 M18,-26 l9,-2 M18,-22.5 l9,1', 1.3);
    if (sp === 'duck') s += ln('M1,-51 C-2,-58 5,-61 4,-55', 2);
  }

  // face
  const ey = frog ? -51 : -31, ex = frog ? [-10.5, 11.5] : [-8, 9];
  const mood = o.mood;
  if (mood === 'happy') {
    s += ln(`M${ex[0] - 3},${ey + 1} q3,-4.5 6,0 M${ex[1] - 3},${ey + 1.5} q3,-4.5 6,0`, 2, EYE);
  } else if (mood === 'sleepy') {
    s += ln(`M${ex[0] - 3},${ey - 0.5} q3,3 6,0 M${ex[1] - 3},${ey} q3,3 6,0`, 2, EYE);
  } else {
    s += `<circle cx="${ex[0]}" cy="${ey}" r="2.2" fill="${EYE}"/><circle cx="${ex[1]}" cy="${ey + 0.5}" r="2.2" fill="${EYE}"/>`;
    if (mood === 'calm') s += `<circle cx="${ex[0] + 0.7}" cy="${ey - 0.8}" r=".7" fill="#fff"/><circle cx="${ex[1] + 0.7}" cy="${ey - 0.3}" r=".7" fill="#fff"/>`;
  }
  if (mood === 'cross') s += ln(frog ? 'M-15,-57 l7,2.5 M17,-56.5 l-7,2.5' : 'M-13,-36.5 l7,2.5 M14,-36 l-7,2.5', 2, EYE);
  const cheek = gh ? '#f3b7cf' : towel ? '#ec8f97' : '#eda2a2';
  const cop = mood === 'cross' || towel ? 0.95 : 0.75, crx = towel ? 4.6 : 4;
  s += `<ellipse cx="-14" cy="-25" rx="${crx}" ry="2.6" transform="rotate(-8 -14 -25)" fill="${cheek}" opacity="${cop}"/><ellipse cx="15" cy="-24.5" rx="${crx}" ry="2.6" transform="rotate(8 15 -24.5)" fill="${cheek}" opacity="${cop}"/>`;
  if (sp === 'duck') {
    s += sh('M-6,-26 C-4,-31 6,-31 8,-26 C6,-21 -4,-21 -6,-26z', c2, 1.8);
    if (mood === 'cross') s += ln('M-4,-25.5 C-1,-27 3,-27 6,-25.5', 1.2, EYE);
  } else if (frog) {
    s += ln(mood === 'cross' ? 'M-8,-23 q9,-5 18,0' : mood === 'sleepy' ? 'M-2,-25 q3,2 6,0' : 'M-9,-27 q9,8 19,0', 2, EYE);
  } else {
    const nose = sp === 'ghost' ? '' : `<path d="M-1.5,-27.5 q2,-1.5 4,0 q-2,2.6 -4,0z" fill="${EYE}"/>`;
    const mouth = mood === 'cross' ? 'M-3,-21.5 q3.5,-3 7,0'
      : mood === 'sleepy' ? 'M-0.5,-23.5 q1.2,1.4 2.4,0'
      : mood === 'happy' ? 'M-4,-24.5 q2.2,3 4.5,0 q2.2,3 4.5,0'
      : 'M-3,-24 q1.8,2.2 3.5,0 q1.8,2.2 3.5,0';
    s += nose + ln(mouth, 1.6, EYE);
  }

  // accessories (frogs: no ears, eyes on top of the head -> everything sits around the eye bumps)
  if (acc === 'scarf') {
    s += sh('M5,-8 C6,0 9,7 7,9 C3,9 2,2 1,-6z', ac, 2)
      + sh('M-13,-17 C-4,-11 6,-11 13,-17 C14,-12 13,-9 12,-8 C4,-3 -5,-3 -12,-8z', ac, 2)
      + `<path d="M-6,-11 l1,4 M0,-10 l0,4 M6,-11 l-1,4" fill="none" stroke="${INK}" stroke-opacity=".45" stroke-width="1.2"/>`;
  }
  if (acc === 'bow') {
    const bt = frog ? 'translate(23.5,-41) rotate(22) scale(.8)' : 'translate(14,-48) rotate(16)';
    s += `<g transform="${bt}">${sh('M0,0 C-4,-7 -11,-6 -10,-1 C-10,5 -4,4 0,0z', ac, 1.8) + sh('M0,0 C4,-7 11,-6 10,-1 C10,5 4,4 0,0z', ac, 1.8)}<circle r="2.4" fill="${CREAM}" stroke="${OUT}" stroke-width="1.5"/></g>`;
  }
  if (acc === 'flower') {
    const fp = frog ? '-22,-43' : '-13,-48';
    s += `<g transform="translate(${fp})"><path d="${FLOWER_PETALS}" transform="scale(${frog ? 1.3 : 1.5})" fill="${CREAM}" stroke="${OUT}" stroke-width=".9"/><circle r="2.2" fill="${ac}"/></g>`;
  }
  if (acc === 'beret') {
    s += frog
      ? sh('M-7,-48 C-6.5,-55.5 7.5,-56.5 8.5,-48.5 C3.5,-46.5 -2.5,-46.5 -7,-48z', ac, 2) + ln('M1,-55.5 l.6,-3', 1.8)
      : sh('M-15,-46 C-13,-58 12,-61 18,-48 C10,-44 -6,-43 -15,-46z', ac) + ln('M2,-58 l1,-4', 2);
  }
  s += hat(hatK, frog);
  if (towel) {
    s += (frog ? frogTop(35, turban()) : turban()) + drop(-25, -41) + drop(25, -16, 0.8);
  }
  if (tilt) s += '</g>';

  if (hold) s += (armRot && hold === 'basket' ? `<g transform="rotate(${armRot} -12 -4)">` : '<g>') + held(hold, c, ac) + '</g>';
  if (gh) s += '</g>';

  if (carrying) {
    const armUp = gh
      ? 'M19,-9 C24,-11 29,-9 30,-5 C30,-1 25,0 19,-2z'
      : ARM_R_UP;
    s += (gh ? '<g transform="translate(0,4)">' : '<g>') + tray(o.carrying!) + sh(armUp, c) + '</g>';
  }
  return s;
}

/** Character with feet at (0,0). Standing ~78 units tall, seated ~59 (seat at (0,0)).
 *  'lie': on its back, head to the left, (0,0) = centre of the body, ~70 x 34. */
export function character(look: CharacterLook, opts: DrawCharacterOpts): string {
  const f = opts.facing === -1 ? -1 : 1;
  const sit = opts.pose === 'sit';
  const walk = opts.pose === 'walk';
  if (opts.pose === 'lie') {
    return `<g stroke-linecap="round" stroke-linejoin="round"><g transform="scale(${n(SCALE * 0.9)}) rotate(-90) translate(0,-5)">${doll(look, opts)}</g></g>`;
  }
  const bob = walk ? n(-Math.abs(Math.sin((opts.walkPhase ?? 0) * Math.PI * 2)) * 1.6) : 0;
  const shadow = sit ? '' : `<ellipse cx="0" cy="0" rx="16" ry="3.4" fill="${OUT}" opacity=".14"/>`;
  const ty = sit ? -12 : -35 + bob;
  return `<g stroke-linecap="round" stroke-linejoin="round">${shadow}<g transform="scale(${SCALE * f},${SCALE}) translate(0,${ty})">${doll(look, opts)}</g></g>`;
}
