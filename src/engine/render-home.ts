/* HOME RENDERER. Keep exports + signatures.
   render.ts calls homeStatic() when the static layer is rebuilt and the scene is 'home',
   and homeDynamic() every frame (≈30fps) for the moving parts. */
import * as art from '../art';
import type { CharacterLook, GameState, HomeActionId, HomeSlot } from '../types';
import { HOME_ANCHOR, HOME_SPOTS } from '../layout';
import { HOME_ACTIONS, homeActionAvailable } from './home';

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

/** How far above HOME_SPOTS[id] the floating icon sits (spots are mostly furniture bottoms). */
const ICON_LIFT: Record<HomeActionId, number> = { bath: 132, cook: 92, sleep: 70, call_mom: 60, read: 84, save: 46 };
/** Where the bear sits on the bed while sleeping. */
const BED_SIT = { x: 112, y: 438 };

const placedItem = (s: GameState, slot: HomeSlot) => {
  const id = s.progress.home.placed[slot];
  if (!id) return '';
  const a = HOME_ANCHOR[slot];
  return at(a.x, a.y, art.homeItem(id, s.theme));
};

/** defs + room + placed home decor that never moves. */
export function homeStatic(s: GameState): string {
  return `<defs>${art.homeSceneDefs(s.theme)}</defs>`
    + art.homeBack(s.theme)
    + placedItem(s, 'rug')
    + placedItem(s, 'window')
    + placedItem(s, 'wall')
    + placedItem(s, 'bed');
}

function bearSvg(s: GameState): { y: number; svg: string } {
  const b = s.homeBear;
  const t = s.time;
  const performing = b.action !== null && b.path.length === 0 && b.actionTimer > 0;
  if (b.path.length) {
    return {
      y: b.y,
      svg: at(b.x, b.y, art.character(HOME_BEAR_LOOK, { pose: 'walk', mood: 'happy', facing: b.facing, walkPhase: b.walkPhase }),
        sway(b.walkPhase)),
    };
  }
  if (performing && b.action === 'sleep') {
    let z = '';
    for (let i = 0; i < 3; i++) {
      const k = ((t * 0.6 + i / 3) % 1);
      const op = k < 0.2 ? k / 0.2 : 1 - (k - 0.2) / 0.8;
      z += `<text x="${f(18 + k * 14 + i * 4)}" y="${f(-62 - k * 40)}" font-size="${f(10 + k * 8)}" font-weight="700"`
        + ` font-family="sans-serif" fill="#7f8fc9" opacity="${f(op)}">z</text>`;
    }
    const body = art.character(HOME_BEAR_LOOK, { pose: 'sit', mood: 'sleepy', facing: 1 });
    return { y: BED_SIT.y, svg: at(BED_SIT.x, BED_SIT.y, body, breathe(t * 0.5, 0, 0.03)) + at(BED_SIT.x, BED_SIT.y, z) };
  }
  if (performing && b.action === 'read') {
    return { y: b.y, svg: at(b.x, b.y, art.character(HOME_BEAR_LOOK, { pose: 'sit', mood: 'happy', facing: b.facing }), breathe(t, 1)) };
  }
  const body = art.character(HOME_BEAR_LOOK, { pose: 'stand', mood: 'happy', facing: b.facing });
  let extra = breathe(t, 0);
  if (performing && b.action === 'cook') extra = `rotate(${(Math.sin(t * 6) * 2).toFixed(1)})`;
  else if (performing && b.action === 'bath') extra = `rotate(${(Math.sin(t * 4) * 3).toFixed(1)})`;
  else if (performing && b.action === 'call_mom') extra = `rotate(${(Math.sin(t * 1.5) * 2).toFixed(1)})`;
  else if (performing && b.action === 'save') extra = `translate(0 ${f(-Math.abs(Math.sin(t * 8)) * 3)})`;
  return { y: b.y, svg: at(b.x, b.y, body, extra) };
}

/** Bear (walking / doing actions), savings jar fill, spot icons, effects, homeFront. */
export function homeDynamic(s: GameState): string {
  const t = s.time;
  const home = s.progress.home;
  const out: string[] = [];

  // savings jar on its shelf
  const jar = HOME_SPOTS.save;
  out.push(at(jar.x, jar.y, art.savingsJar(Math.min(1, home.savings / Math.max(1, home.dreamGoal)), t)));

  // y-sorted: bear + corner / pet decor
  const sorted: { y: number; svg: string }[] = [bearSvg(s)];
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
  sorted.sort((a, b) => a.y - b.y);
  for (const o of sorted) out.push(o.svg);

  // floating icons over furniture that can still be used today
  const busy = s.homeBear.action;
  for (const def of HOME_ACTIONS) {
    if (busy === def.id || !homeActionAvailable(home, def.id)) continue;
    const spot = HOME_SPOTS[def.id];
    const phase = t * 2 + spot.x * 0.05;
    const pulse = (Math.sin(phase) + 1) / 2;
    out.push(at(spot.x, spot.y - ICON_LIFT[def.id] + Math.sin(phase) * 3, art.homeSpotIcon(def.id, pulse)));
  }

  // effects
  for (const e of s.effects) out.push(at(e.x, e.y, art.effect(e.kind, Math.min(1, e.age / e.life), e.text)));

  out.push(art.homeFront(s.theme, t));
  return out.join('');
}
