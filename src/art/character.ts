/* Character sheet: hand-shaped Bezier heads/bodies/ears/limbs, thick soft brown ink line,
   colour fill nudged off the line, dot eyes, rosy cheeks, little "w" mouth.
   Drawn in "doll" coordinates (feet at y=35, head top ~-51), then scaled so feet sit at (0,0). */
import type { CharacterLook, DrawCharacterOpts, HatKind, MenuItemId, Species } from '../types';
import { INK, EYE, CREAM, fl, ln, sh } from './kit';
import { n } from './core';
import { item } from './items';

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

function hat(kind: HatKind): string {
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

/** Tray held at the side with up to 3 items. Doll coords. */
function tray(items: MenuItemId[]): string {
  let s = sh('M15,-4 C17,-7 43,-7 45,-4 C45,-1 17,-1 15,-4z', '#d9d2cc', 1.8);
  const list = items.slice(0, 3);
  const xs = list.length === 1 ? [30] : list.length === 2 ? [25, 36] : [21, 30, 39];
  list.forEach((id, i) => {
    s += `<g transform="translate(${xs[i]},${i === 1 && list.length === 3 ? -10 : -9}) scale(.62)">${item(id)}</g>`;
  });
  return s;
}

function doll(look: CharacterLook, o: DrawCharacterOpts): string {
  const sp = look.species, c = look.color, c2 = look.color2 ?? c;
  const sit = o.pose === 'sit', walk = o.pose === 'walk', gh = sp === 'ghost';
  const carrying = !!(o.carrying && o.carrying.length && !sit);
  const hatK = look.hat ?? 'none';
  let acc = look.accessory;
  if (hatK !== 'none' && (acc === 'beret' || acc === 'bow' || acc === 'flower')) acc = 'none';
  const ac = look.accentColor || '#e58a94';
  const limb = sp === 'duck' ? c2 : c;
  const ph = (o.walkPhase ?? 0) * Math.PI * 2, sw = walk ? Math.sin(ph) : 0;
  let s = '';

  if (gh) {
    const bottom = sit ? 12 : 26;
    s += `<g transform="translate(0,${sit ? 0 : 4})">`;
    s += sh(GHOST_ARM_L, c) + (carrying ? '' : sh(GHOST_ARM_R, c));
    s += sh(ghostPath(bottom), c);
  } else {
    s += sit ? '<g transform="translate(0,-15) scale(1,.62) translate(0,15)">' : '<g>';
    if (sp === 'fox') s += fl(FOX_TAIL, c) + fl(FOX_TIP, CREAM) + ln(FOX_TAIL);
    if (!sit) {
      const lx = n(sw * 2.4), ly = n(-Math.max(0, sw) * 3), rx = n(-sw * 2.4), ry = n(-Math.max(0, -sw) * 3);
      s += (walk ? `<g transform="translate(${lx},${ly})">` : '<g>') + sh(LEG_L, limb) + '</g>';
      s += (walk ? `<g transform="translate(${rx},${ry})">` : '<g>') + sh(LEG_R, limb) + '</g>';
    }
    const armRot = walk ? n(sw * 12) : 0;
    s += (armRot ? `<g transform="rotate(${armRot} -12 -4)">` : '<g>') + sh(ARM_L, c) + '</g>';
    if (!carrying) s += (armRot ? `<g transform="rotate(${-armRot} 12 -4)">` : '<g>') + sh(ARM_R, c) + '</g>';
    s += sh(BODY, c);
    if (acc === 'apron') {
      s += sh(APRON, look.apronColor ?? CREAM, 2)
        + `<path transform="translate(0,7) scale(.5)" d="M0,4 C-9,-3 -4,-10 0,-5 C4,-10 9,-3 0,4z" fill="${ac}"/>`
        + `<path d="M-6,13 C-3,12 3,12 6,13" fill="none" stroke="${INK}" stroke-opacity=".35" stroke-width="1.2" stroke-dasharray="1.5 2.5"/>`;
    } else if (sp !== 'sheep') {
      s += `<path d="${BELLY}" fill="#fff" opacity=".35"/>`;
    }
    if (sp === 'sheep') s += `<path d="M-8,4 C-6,1 -3,1 -1,4 C1,1 4,1 6,4 M-9,13 C-7,10 -4,10 -2,13 C0,10 3,10 5,13" fill="none" stroke="${INK}" stroke-opacity=".3" stroke-width="1.2"/>`;
    s += '</g>';
  }

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
  const frog = sp === 'frog';
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
  const cheek = gh ? '#f3b7cf' : '#eda2a2';
  s += `<ellipse cx="-14" cy="-25" rx="4" ry="2.6" transform="rotate(-8 -14 -25)" fill="${cheek}" opacity="${mood === 'cross' ? 0.95 : 0.75}"/><ellipse cx="15" cy="-24.5" rx="4" ry="2.6" transform="rotate(8 15 -24.5)" fill="${cheek}" opacity="${mood === 'cross' ? 0.95 : 0.75}"/>`;
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

  // accessories
  if (acc === 'scarf') {
    s += sh('M5,-8 C6,0 9,7 7,9 C3,9 2,2 1,-6z', ac, 2)
      + sh('M-13,-17 C-4,-11 6,-11 13,-17 C14,-12 13,-9 12,-8 C4,-3 -5,-3 -12,-8z', ac, 2)
      + `<path d="M-6,-11 l1,4 M0,-10 l0,4 M6,-11 l-1,4" fill="none" stroke="${INK}" stroke-opacity=".45" stroke-width="1.2"/>`;
  }
  if (acc === 'bow') {
    s += `<g transform="translate(14,-48) rotate(16)">${sh('M0,0 C-4,-7 -11,-6 -10,-1 C-10,5 -4,4 0,0z', ac, 1.8) + sh('M0,0 C4,-7 11,-6 10,-1 C10,5 4,4 0,0z', ac, 1.8)}<circle r="2.4" fill="${CREAM}" stroke="${OUT}" stroke-width="1.5"/></g>`;
  }
  if (acc === 'flower') {
    const fp = frog ? '-20,-35' : '-13,-48';
    s += `<g transform="translate(${fp})"><path d="${FLOWER_PETALS}" transform="scale(1.5)" fill="${CREAM}" stroke="${OUT}" stroke-width=".9"/><circle r="2.2" fill="${ac}"/></g>`;
  }
  if (acc === 'beret') s += sh('M-15,-46 C-13,-58 12,-61 18,-48 C10,-44 -6,-43 -15,-46z', ac) + ln('M2,-58 l1,-4', 2);
  s += hat(hatK);
  if (gh) s += '</g>';

  if (carrying) {
    const armUp = gh
      ? 'M19,-9 C24,-11 29,-9 30,-5 C30,-1 25,0 19,-2z'
      : ARM_R_UP;
    s += (gh ? '<g transform="translate(0,4)">' : '<g>') + tray(o.carrying!) + sh(armUp, c) + '</g>';
  }
  return s;
}

/** Character with feet at (0,0). Standing ~78 units tall, seated ~56. */
export function character(look: CharacterLook, opts: DrawCharacterOpts): string {
  const f = opts.facing === -1 ? -1 : 1;
  const sit = opts.pose === 'sit';
  const walk = opts.pose === 'walk';
  const bob = walk ? n(-Math.abs(Math.sin((opts.walkPhase ?? 0) * Math.PI * 2)) * 1.6) : 0;
  const shadow = sit ? '' : `<ellipse cx="0" cy="0" rx="16" ry="3.4" fill="${OUT}" opacity=".14"/>`;
  const ty = sit ? -11 : -35 + bob;
  return `<g stroke-linecap="round" stroke-linejoin="round">${shadow}<g transform="scale(${SCALE * f},${SCALE}) translate(0,${ty})">${doll(look, opts)}</g></g>`;
}
