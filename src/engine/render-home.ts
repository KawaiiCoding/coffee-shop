/* HOME RENDERER. Keep exports + signatures.
   render.ts calls homeStatic() when the static layer is rebuilt and the scene is 'home',
   and homeDynamic() every frame (≈30fps) for the moving parts. */
import * as art from '../art';
import type { CharacterLook, DrawCharacterOpts, FurnitureId, GameState, HomeActionId, HomeSlot } from '../types';
import { BED_LIE, FURNITURE_SPOTS, HOME_ANCHOR, HOME_NEWSPAPER, HOME_SPOTS, SECRET_SPOTS } from '../layout';
import { HOME_ACTIONS, homeActionAvailable, homeAnim, homeIconPos } from './home';

/** Mocha's comfy at-home look. */
export const HOME_BEAR_LOOK: CharacterLook = {
  species: 'bear', color: '#d9a877', accessory: 'scarf', accentColor: '#e58a94', hat: 'none',
};

const f = (n: number) => (Math.round(n * 10) / 10).toString();
const at = (x: number, y: number, body: string, extra = '') =>
  (body ? `<g transform="translate(${f(x)} ${f(y)})${extra ? ' ' + extra : ''}">${body}</g>` : '');
const breathe = (time: number, seed: number, amt = 0.018) => {
  const s = Math.sin(time * 2.2 + seed);
  return `scale(${(1 - amt * 0.5 * s).toFixed(3)} ${(1 + amt * s).toFixed(3)})`;
};
const sway = (phase: number) => `rotate(${(Math.sin(phase * Math.PI * 2) * 4).toFixed(1)})`;
const spotIcon = art.homeSpotIcon as (a: HomeActionId, pulse: number) => string;
const STAR_CLIP = 'homeStarClip';

/** Seated positions (feet point for pose 'sit'). */
const SIT = {
  read: { x: HOME_SPOTS.read.stand.x, y: HOME_SPOTS.read.stand.y - 8 },
  eat: HOME_SPOTS.eat.stand,
  warm: HOME_SPOTS.warm.stand,
};

const placedItem = (s: GameState, slot: HomeSlot) => {
  const id = s.progress.home.placed[slot];
  if (!id) return '';
  const a = HOME_ANCHOR[slot];
  return at(a.x, a.y, art.homeItem(id, s.theme));
};

/** defs + room + placed home decor + wall calendar (things that never move). */
export function homeStatic(s: GameState): string {
  const w = art.HOME_WINDOW;
  const cal = s.calendar;
  const fest = cal.next && cal.next.daysLeft <= 30 ? cal.next.name : null;
  const c = HOME_SPOTS.calendar;
  return `<defs>${art.homeSceneDefs(s.theme)}`
    + `<clipPath id="${STAR_CLIP}"><rect x="${w.x}" y="${w.y}" width="${w.w}" height="${w.h}"/></clipPath></defs>`
    + art.homeBack(s.theme)
    + placedItem(s, 'rug')
    + placedItem(s, 'window')
    + placedItem(s, 'wall')
    + placedItem(s, 'bed')
    + at(c.x, c.y, art.calendarArt(cal.date.month, cal.date.day, fest, s.theme));
}

type Layer = { y: number; svg: string };

function zzz(t: number): string {
  let z = '';
  for (let i = 0; i < 3; i++) {
    const k = ((t * 0.6 + i / 3) % 1);
    const op = k < 0.2 ? k / 0.2 : 1 - (k - 0.2) / 0.8;
    z += `<text x="${f(k * 14 + i * 4)}" y="${f(-k * 40)}" font-size="${f(10 + k * 8)}" font-weight="700"`
      + ` font-family="sans-serif" fill="#7f8fc9" opacity="${f(op)}">z</text>`;
  }
  return z;
}

function steam(t: number, n = 3, spread = 16): string {
  let out = '';
  for (let i = 0; i < n; i++) {
    const k = (t * 0.8 + i / n) % 1;
    const x = (i - (n - 1) / 2) * (spread / Math.max(1, n - 1)) + Math.sin(t * 3 + i) * 3;
    out += `<circle cx="${f(x)}" cy="${f(-k * 34)}" r="${f(3 + k * 5)}" fill="#ffffff" opacity="${f((1 - k) * 0.7)}"/>`;
  }
  return out;
}

function sizzle(t: number): string {
  let out = '';
  for (let i = 0; i < 4; i++) {
    const k = (t * 2.4 + i / 4) % 1;
    const a = i * 1.7 + t;
    out += `<circle cx="${f(Math.cos(a) * (4 + k * 10))}" cy="${f(-k * 10)}" r="1.4" fill="#ffd36a" opacity="${f(1 - k)}"/>`;
  }
  return out;
}

function floatingHearts(t: number): string {
  let out = '';
  for (let i = 0; i < 2; i++) {
    const k = (t * 0.5 + i / 2) % 1;
    out += at(Math.sin(t * 2 + i * 3) * 6 + i * 8, -k * 20, art.effect('heart', k * 0.9), `scale(0.7)`);
  }
  return out;
}

function sparks(t: number): string {
  let out = '';
  for (let i = 0; i < 4; i++) {
    const k = (t * 1.1 + i / 4) % 1;
    out += `<circle cx="${f(Math.sin(t * 5 + i * 2) * 10)}" cy="${f(-k * 36)}" r="${f(1.6 - k)}" fill="#ffb347" opacity="${f(1 - k)}"/>`;
  }
  return out;
}

/** The bear (or nothing while he's in the bath). Returns layers, plus the y of furniture he must be drawn with. */
function bearLayer(s: GameState): Layer | null {
  const b = s.homeBear;
  const t = s.time;
  const home = s.progress.home;
  const a = homeAnim();
  const towel = s.time < a.towelUntil;
  const performing = b.action !== null && b.path.length === 0 && b.actionTimer > 0;
  const def = b.action ? HOME_ACTIONS.find((d) => d.id === b.action) : undefined;
  const k = performing && def && def.seconds > 0 ? 1 - b.actionTimer / def.seconds : 0; // 0..1 progress
  const mood: DrawCharacterOpts['mood'] = home.energy < 25 ? 'sleepy' : 'happy';
  const ch = (o: Partial<DrawCharacterOpts>) =>
    art.character(HOME_BEAR_LOOK, { pose: 'stand', mood, facing: b.facing, ...(towel ? { towel: true } : {}), ...o });

  if (b.path.length) {
    return { y: b.y, svg: at(b.x, b.y, ch({ pose: 'walk', walkPhase: b.walkPhase }), sway(b.walkPhase)) };
  }
  if (performing) {
    switch (b.action) {
      case 'bath':
        return null; // inside the bathroom
      case 'sleep': {
        const quilt = home.placed.bed;
        const bed = HOME_SPOTS.sleep;
        const body = at(BED_LIE.x, BED_LIE.y, art.character(HOME_BEAR_LOOK, { pose: 'lie', mood: 'sleepy', facing: 1 }),
          breathe(t * 0.5, 0, 0.03));
        return {
          y: bed.y,
          svg: body + at(bed.x, bed.y, art.bedBlanket(quilt, s.theme)) + at(BED_LIE.x - 4, BED_LIE.y - 26, zzz(t)),
        };
      }
      case 'read': {
        // drawn by the armchair layer (chair, bear, chair front)
        return null;
      }
      case 'eat': {
        const table = home.furniture.includes('dining_table');
        const bounce = `translate(0 ${f(-Math.abs(Math.sin(t * 7)) * 2.5)})`;
        if (table) {
          return { y: FURNITURE_SPOTS.dining_table.y + 0.5, svg: at(SIT.eat.x, SIT.eat.y, ch({ pose: 'sit', facing: 1, holding: 'chopsticks' }), bounce) };
        }
        return { y: b.y, svg: at(b.x, b.y, ch({ holding: 'bowl' }), bounce) };
      }
      case 'cook': {
        const st = HOME_SPOTS.cook;
        const wob = `rotate(${(Math.sin(t * 7) * 3).toFixed(1)})`;
        return {
          y: b.y,
          svg: at(b.x, b.y, ch({ holding: 'spatula', facing: 1 }), wob)
            + at(st.x, st.y - 80, steam(t)) + at(st.x - 6, st.y - 74, sizzle(t)),
        };
      }
      case 'call_mom':
        return {
          y: b.y,
          svg: at(b.x, b.y, ch({ holding: 'phone' }), `rotate(${(Math.sin(t * 1.5) * 2).toFixed(1)})`)
            + at(b.x + 10 * b.facing, b.y - 74, floatingHearts(t)),
        };
      case 'warm':
        return {
          y: FURNITURE_SPOTS.fireplace.y + 0.5,
          svg: at(SIT.warm.x, SIT.warm.y, ch({ pose: 'sit', facing: -1 }), breathe(t, 1.4, 0.025)),
        };
      case 'save': {
        // coin arcs from the paw up into the jar
        const jar = HOME_SPOTS.save;
        const x0 = b.x + 10 * b.facing, y0 = b.y - 48, x1 = jar.x, y1 = jar.y - 16;
        const e = Math.min(1, k * 1.15);
        const cx = x0 + (x1 - x0) * e;
        const cy = y0 + (y1 - y0) * e - Math.sin(e * Math.PI) * 30;
        const coin = e < 1 ? at(cx, cy, art.effect('coin', 0.3), `scale(0.8) rotate(${f(e * 360)})`) : '';
        return {
          y: b.y,
          svg: at(b.x, b.y, ch({}), `translate(0 ${f(-Math.abs(Math.sin(t * 8)) * 3)})`) + coin,
        };
      }
      default:
        break;
    }
  }
  return { y: b.y, svg: at(b.x, b.y, ch({}), breathe(t, 0)) };
}

function furnitureLayer(s: GameState, id: FurnitureId): Layer {
  const home = s.progress.home;
  const b = s.homeBear;
  const t = s.time;
  const p = FURNITURE_SPOTS[id];
  const a = homeAnim();
  const performing = b.action !== null && b.path.length === 0 && b.actionTimer > 0;
  let svg = at(p.x, p.y, art.furniture(id, s.theme, {
    meal: id === 'dining_table' ? home.meal : null,
    fireOn: home.fireOn,
    time: t,
  }));
  if (id === 'dining_table' && performing && b.action === 'eat' && a.snack) {
    svg += at(p.x, p.y - 40, art.product(a.snack));
  }
  if (id === 'fireplace' && home.fireOn) svg += at(p.x, p.y - 70, sparks(t));
  if (id === 'armchair' && performing && b.action === 'read') {
    svg += at(SIT.read.x, SIT.read.y,
      art.character(HOME_BEAR_LOOK, { pose: 'sit', mood: 'happy', facing: -1, holding: 'book' }), breathe(t, 1))
      + at(p.x, p.y, art.furnitureFront('armchair', s.theme));
  }
  return { y: p.y, svg };
}

/** Bear (walking / doing actions), furniture, savings jar, spot icons, bath door, effects, homeFront. */
export function homeDynamic(s: GameState): string {
  const t = s.time;
  const home = s.progress.home;
  const b = s.homeBear;
  const out: string[] = [];

  // shooting star across the window
  const star = s.shootingStar;
  if (star) out.push(`<g clip-path="url(#${STAR_CLIP})">${at(star.x, star.y, art.shootingStar(star.t))}</g>`);

  // savings jar on its shelf
  const jar = HOME_SPOTS.save;
  out.push(at(jar.x, jar.y, art.savingsJar(Math.min(1, home.savings / Math.max(1, home.dreamGoal)), t)));

  // a cooked meal waiting on the stove when there's no table (hidden while it's being eaten from the bowl)
  const eatingNow = b.action === 'eat' && b.path.length === 0 && b.actionTimer > 0;
  if (home.meal && !home.furniture.includes('dining_table') && !eatingNow) {
    out.push(at(HOME_SPOTS.cook.x - 14, HOME_SPOTS.cook.y - 76, art.dish(home.meal)));
  }

  // the morning newspaper lies flat on the floor (always under the bear)
  out.push(at(HOME_NEWSPAPER.x, HOME_NEWSPAPER.y, art.newspaperOnFloor(s.progress.newsReadDay !== s.progress.day, t)));

  // y-sorted: furniture + bear + corner / pet decor
  const sorted: Layer[] = [];
  for (const id of Object.keys(FURNITURE_SPOTS) as FurnitureId[]) {
    if (home.furniture.includes(id)) sorted.push(furnitureLayer(s, id));
  }
  const bear = bearLayer(s);
  if (bear) sorted.push(bear);
  const corner = home.placed.corner;
  if (corner) {
    const a = HOME_ANCHOR.corner;
    sorted.push({ y: a.y, svg: at(a.x, a.y, art.homeItem(corner, s.theme)) });
  }
  const pet = home.placed.pet;
  if (pet) {
    const a = HOME_ANCHOR.pet;
    const extra = pet === 'kitten' ? breathe(t, 2.3, 0.035) + ` translate(0 ${f(-Math.max(0, Math.sin(t * 1.7)) * 2)})` : '';
    sorted.push({ y: a.y, svg: at(a.x, a.y, art.homeItem(pet, s.theme), extra) });
  }
  sorted.sort((a, c) => a.y - c.y);
  for (const o of sorted) out.push(o.svg);

  // bath door overlay (steam while Mocha is inside)
  const bathing = b.action === 'bath' && b.path.length === 0 && b.actionTimer > 0;
  out.push(at(HOME_SPOTS.bath.x, HOME_SPOTS.bath.y, art.bathDoor(bathing, t)));

  // floating icons over furniture whose action is available right now
  const busy = b.action;
  for (const def of HOME_ACTIONS) {
    if (def.id === 'calendar' || busy === def.id) continue;
    if (!homeActionAvailable(home, def.id, s.progress)) continue;
    const p = homeIconPos(def.id);
    const phase = t * 2 + p.x * 0.05;
    const pulse = (Math.sin(phase) + 1) / 2;
    out.push(at(p.x, p.y + Math.sin(phase) * 3, spotIcon(def.id, pulse)));
  }

  // journal hotspot reaction (a tiny wiggle / sparkle on the tapped thing)
  if (s.reaction) {
    const sp = SECRET_SPOTS[s.reaction.spot];
    if (sp && sp.scene === s.scene) out.push(at(sp.x, sp.y, art.secretReaction(s.reaction.spot, s.reaction.t)));
  }

  // effects
  for (const e of s.effects) out.push(at(e.x, e.y, art.effect(e.kind, Math.min(1, e.age / e.life), e.text)));

  out.push(art.homeFront(s.theme, t));
  return out.join('');
}
