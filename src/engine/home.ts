/* =====================================================================
   HOME SIMULATION — Mocha's evening at home.
   Pure-ish module: game.ts calls these; keep every export + signature.
   ===================================================================== */
import type {
  Effect, GameEvent, GameState, HomeActionDef, HomeActionId, HomeBear, HomeItemDef, HomeItemId, HomeProgress, HomeSlot,
  Progress, SfxName, StoryId,
} from '../types';
import { HOME_IDLE, HOME_SPOTS } from '../layout';
import { MOM_LINES } from '../story';

export const HOME_ACTIONS: HomeActionDef[] = [
  { id: 'cook', name: 'Cook dinner', description: 'A warm bowl of honey stew. Costs a little, but fills Mocha right up.',
    cost: 8, energy: 30, happiness: 5, oncePerDay: true, seconds: 3 },
  { id: 'bath', name: 'Warm bath', description: 'Bubbles up to the ears. Soothes tired paws after a busy shift.',
    cost: 0, energy: 15, happiness: 10, oncePerDay: true, seconds: 3 },
  { id: 'call_mom', name: 'Call Mom', description: 'Hearing Mom\'s voice makes everything feel cosy again.',
    cost: 0, energy: 0, happiness: 20, oncePerDay: true, seconds: 3 },
  { id: 'read', name: 'Read a book', description: 'Curl up in the armchair with a good story.',
    cost: 0, energy: 5, happiness: 10, oncePerDay: true, seconds: 3 },
  { id: 'save', name: 'Save for the bike', description: 'Drop 10 coins into the jar. One day it\'ll be a bicycle to ride to Mom\'s!',
    cost: 10, energy: 0, happiness: 0, oncePerDay: false, seconds: 1 },
  { id: 'sleep', name: 'Go to sleep', description: 'Snuggle into bed and rest up for tomorrow\'s shift.',
    cost: 0, energy: 40, happiness: 0, oncePerDay: false, seconds: 2 },
];

export const HOME_ITEMS: HomeItemDef[] = [
  { id: 'poster_coffee', slot: 'wall', name: 'Coffee poster', cost: 25, happiness: 3 },
  { id: 'photo_mom', slot: 'wall', name: 'Photo of Mom', cost: 15, happiness: 5 },
  { id: 'curtains_lace', slot: 'window', name: 'Lace curtains', cost: 30, happiness: 4 },
  { id: 'curtains_stars', slot: 'window', name: 'Starry curtains', cost: 45, happiness: 6 },
  { id: 'quilt_hearts', slot: 'bed', name: 'Heart quilt', cost: 40, happiness: 6 },
  { id: 'quilt_stars', slot: 'bed', name: 'Star quilt', cost: 55, happiness: 8 },
  { id: 'rug_round', slot: 'rug', name: 'Round rug', cost: 35, happiness: 4 },
  { id: 'rug_cloud', slot: 'rug', name: 'Cloud rug', cost: 50, happiness: 6 },
  { id: 'plant_big', slot: 'corner', name: 'Big plant', cost: 30, happiness: 4 },
  { id: 'lamp_moon', slot: 'corner', name: 'Moon lamp', cost: 40, happiness: 5 },
  { id: 'fishbowl', slot: 'pet', name: 'Fishbowl', cost: 60, happiness: 8 },
  { id: 'kitten', slot: 'pet', name: 'Kitten', cost: 120, happiness: 12 },
];
export const DREAM = { goal: 300, name: 'A bicycle to visit Mom' };

/** Everything home logic needs from the game. */
export interface HomeCtx {
  state: GameState;
  progress: Progress;
  emit(e: GameEvent): void;
  save(): void;
  /** Called when the bear finishes 'sleep': game.ts starts the next work day. */
  onSleep(): void;
  /** Ask game.ts to play a story (e.g. 'dream' when the jar is full). */
  playStory(id: StoryId): void;
}

type Pt = { x: number; y: number };
const SLOTS: HomeSlot[] = ['wall', 'window', 'bed', 'rug', 'corner', 'pet'];
const ACTION_IDS: HomeActionId[] = ['cook', 'bath', 'call_mom', 'read', 'save', 'sleep'];
const ACTION_SFX: Record<HomeActionId, SfxName> = {
  cook: 'cook', bath: 'splash', call_mom: 'phone', read: 'page', save: 'jar', sleep: 'yawn',
};
const WALK_SPEED = 110;
const FLOOR = { minX: 30, maxX: 330, minY: 270, maxY: 630 };
const AISLE_X = 180;
/** Visual centre of each piece of furniture (HOME_SPOTS are mostly bottom-centres) for tapping. */
const TAP_LIFT: Record<HomeActionId, number> = { bath: 60, save: 0, cook: 36, sleep: 26, call_mom: 22, read: 30 };

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const clampStat = (v: number) => clamp(Math.round(v), 0, 100);
const actionDef = (id: HomeActionId) => HOME_ACTIONS.find((a) => a.id === id)!;
const itemDef = (id: HomeItemId) => HOME_ITEMS.find((i) => i.id === id);

let nextEffectId = 1_000_000; // separate range from the café's effect ids
function addEffect(state: GameState, kind: Effect['kind'], x: number, y: number, text?: string) {
  const e: Effect = { id: nextEffectId++, kind, x, y, age: 0, life: kind === 'sparkle' ? 0.8 : 1.4 };
  if (text !== undefined) e.text = text;
  state.effects.push(e);
}

export function defaultHome(): HomeProgress {
  return {
    wallet: 0, savings: 0, dreamGoal: DREAM.goal, dreamDone: false, energy: 80, happiness: 60,
    owned: [], placed: { wall: null, window: null, bed: null, rug: null, corner: null, pet: null }, doneToday: [],
  };
}

/** Validate a parsed save's home object, falling back field by field. */
export function sanitizeHome(raw: unknown): HomeProgress {
  const d = defaultHome();
  if (!raw || typeof raw !== 'object') return d;
  const r = raw as Record<string, unknown>;
  const num = (v: unknown, fb: number, lo: number, hi: number) =>
    (typeof v === 'number' && Number.isFinite(v) ? clamp(v, lo, hi) : fb);
  const isItem = (v: unknown): v is HomeItemId => typeof v === 'string' && HOME_ITEMS.some((i) => i.id === v);
  const isAction = (v: unknown): v is HomeActionId => typeof v === 'string' && (ACTION_IDS as string[]).includes(v);

  d.wallet = Math.floor(num(r.wallet, d.wallet, 0, 1e9));
  d.savings = Math.floor(num(r.savings, d.savings, 0, 1e9));
  d.dreamGoal = Math.floor(num(r.dreamGoal, d.dreamGoal, 1, 1e9));
  d.dreamDone = typeof r.dreamDone === 'boolean' ? r.dreamDone : d.dreamDone;
  d.energy = num(r.energy, d.energy, 0, 100);
  d.happiness = num(r.happiness, d.happiness, 0, 100);
  if (Array.isArray(r.owned)) d.owned = [...new Set(r.owned.filter(isItem))];
  if (r.placed && typeof r.placed === 'object') {
    const p = r.placed as Record<string, unknown>;
    for (const slot of SLOTS) {
      const v = p[slot];
      if (isItem(v) && d.owned.includes(v) && itemDef(v)!.slot === slot) d.placed[slot] = v;
    }
  }
  if (Array.isArray(r.doneToday)) d.doneToday = [...new Set(r.doneToday.filter(isAction))];
  return d;
}

export function newHomeBear(): HomeBear {
  return { x: 180, y: 380, facing: 1, walkPhase: 0, path: [], action: null, actionTimer: 0 };
}

/* ---------- walking ---------- */
/** Smooth curved route: a soft S-curve leaning toward the middle of the room. */
function route(from: Pt, to: Pt): Pt[] {
  const dist = Math.hypot(to.x - from.x, to.y - from.y);
  if (dist < 4) return [{ x: to.x, y: to.y }];
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const pull = 0.35;
  const c1 = { x: lerp(from.x, AISLE_X, pull), y: lerp(from.y, to.y, 0.3) };
  const c2 = { x: lerp(to.x, AISLE_X, pull), y: lerp(from.y, to.y, 0.7) };
  const n = Math.max(4, Math.min(18, Math.round(dist / 14)));
  const pts: Pt[] = [];
  for (let i = 1; i <= n; i++) {
    const t = i / n, u = 1 - t;
    pts.push({
      x: u * u * u * from.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * to.x,
      y: clamp(u * u * u * from.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * to.y, FLOOR.minY, FLOOR.maxY),
    });
  }
  pts[pts.length - 1] = { x: to.x, y: to.y };
  return pts;
}

/** Moves the bear along its path by dist (easing out near the end); true when finished. */
function moveAlong(b: HomeBear, dist: number): boolean {
  let remaining = 0, px = b.x, py = b.y;
  for (const p of b.path) { remaining += Math.hypot(p.x - px, p.y - py); px = p.x; py = p.y; }
  if (remaining < 26) dist *= Math.max(0.35, remaining / 26);
  while (b.path.length && dist > 0) {
    const p = b.path[0];
    const dx = p.x - b.x, dy = p.y - b.y;
    const d = Math.hypot(dx, dy);
    if (Math.abs(dx) > 1.5) b.facing = dx > 0 ? 1 : -1;
    if (d <= dist) {
      b.x = p.x; b.y = p.y; dist -= d; b.path.shift();
      b.walkPhase = (b.walkPhase + d / 40) % 1;
    } else {
      b.x += (dx / d) * dist; b.y += (dy / d) * dist;
      b.walkPhase = (b.walkPhase + dist / 40) % 1;
      dist = 0;
    }
  }
  return b.path.length === 0;
}

/** Entering home (after goHome): reset the bear position. */
export function enterHome(ctx: HomeCtx): void {
  const b = ctx.state.homeBear;
  b.x = 60; b.y = 290; b.facing = 1; b.walkPhase = 0;
  b.action = null; b.actionTimer = 0;
  b.path = route({ x: b.x, y: b.y }, HOME_IDLE);
}

/** Whether an action is worth showing today (not done yet, affordable). Ignores whether the bear is busy. */
export function homeActionAvailable(home: HomeProgress, id: HomeActionId): boolean {
  const def = actionDef(id);
  if (def.oncePerDay && home.doneToday.includes(id)) return false;
  return home.wallet >= def.cost;
}

export function canDoHomeAction(ctx: HomeCtx, id: HomeActionId): { ok: boolean; reason?: string } {
  const def = HOME_ACTIONS.find((a) => a.id === id);
  if (!def) return { ok: false, reason: 'Unknown action' };
  const home = ctx.progress.home;
  if (ctx.state.homeBear.action !== null) return { ok: false, reason: 'Mocha is busy' };
  if (def.oncePerDay && home.doneToday.includes(id)) return { ok: false, reason: 'Already done today' };
  if (home.wallet < def.cost) return { ok: false, reason: 'Not enough money in your wallet' };
  return { ok: true };
}

/** Start an action: walk to HOME_SPOTS[id].stand, then perform for `seconds`, then apply effects. */
export function homeAction(ctx: HomeCtx, id: HomeActionId): boolean {
  const check = canDoHomeAction(ctx, id);
  if (!check.ok) {
    ctx.emit({ type: 'sfx', name: 'error' });
    if (check.reason) ctx.emit({ type: 'toast', text: check.reason });
    return false;
  }
  const b = ctx.state.homeBear;
  b.action = id;
  b.actionTimer = 0;
  b.path = route({ x: b.x, y: b.y }, HOME_SPOTS[id].stand);
  ctx.emit({ type: 'sfx', name: 'tap' });
  return true;
}

/** Tap in the home scene (scene coords): tapping furniture starts its action. */
export function homeTap(ctx: HomeCtx, x: number, y: number): void {
  let best: HomeActionId | null = null, bestD = 50;
  for (const id of ACTION_IDS) {
    const s = HOME_SPOTS[id];
    const d = Math.min(Math.hypot(x - s.x, y - s.y), Math.hypot(x - s.x, y - (s.y - TAP_LIFT[id])));
    if (d < bestD) { bestD = d; best = id; }
  }
  if (best) { homeAction(ctx, best); return; }
  const b = ctx.state.homeBear;
  if (b.action !== null || y <= FLOOR.minY) return;
  const to = { x: clamp(x, FLOOR.minX, FLOOR.maxX), y: clamp(y, FLOOR.minY, FLOOR.maxY) };
  b.path = route({ x: b.x, y: b.y }, to);
}

function finishAction(ctx: HomeCtx, id: HomeActionId) {
  const { state, progress } = ctx;
  const home = progress.home;
  const b = state.homeBear;
  const def = actionDef(id);
  b.action = null;
  b.actionTimer = 0;
  if (home.wallet < def.cost) { // spent elsewhere while walking
    ctx.emit({ type: 'sfx', name: 'error' });
    ctx.emit({ type: 'toast', text: 'Not enough money in your wallet' });
    return;
  }
  home.wallet -= def.cost;
  if (id === 'save') home.savings += def.cost;
  home.energy = clampStat(home.energy + def.energy);
  home.happiness = clampStat(home.happiness + def.happiness);
  if (def.oncePerDay && !home.doneToday.includes(id)) home.doneToday.push(id);

  const fx = b.x, fy = b.y - 70;
  if (id === 'save') {
    const jar = HOME_SPOTS.save;
    addEffect(state, 'coin', jar.x, jar.y - 10);
    addEffect(state, 'text', jar.x, jar.y - 30, `+${def.cost} saved`);
  } else if (def.cost > 0) {
    addEffect(state, 'text', fx + 26, fy + 14, `-${def.cost}`);
  }
  if (def.happiness > 0) {
    addEffect(state, 'heart', fx - 14, fy);
    addEffect(state, 'text', fx - 14, fy - 18, `+${def.happiness} ♥`);
  }
  if (def.energy > 0) addEffect(state, 'text', fx + 16, fy - 4, `+${def.energy} ⚡`);
  addEffect(state, 'sparkle', fx, fy + 20);

  if (id === 'call_mom') {
    const line = MOM_LINES[Math.max(0, progress.day) % MOM_LINES.length];
    ctx.emit({ type: 'toast', text: `Mom: “${line}”` });
  }
  ctx.emit({ type: 'progress' });
  ctx.save();

  if (id === 'save' && !home.dreamDone && home.savings >= home.dreamGoal) {
    home.dreamDone = true;
    ctx.save();
    ctx.playStory('dream');
    return;
  }
  if (id === 'sleep') ctx.onSleep();
}

export function updateHome(ctx: HomeCtx, dt: number): void {
  if (!(dt > 0)) return;
  const b = ctx.state.homeBear;
  // (effects are aged by game.ts update() in every mode)
  if (b.path.length) {
    const arrived = moveAlong(b, WALK_SPEED * dt);
    if (!arrived) return;
  }
  if (b.action === null) return;
  if (b.actionTimer <= 0) {
    // just arrived at the spot: start performing
    const id = b.action;
    const spot = HOME_SPOTS[id];
    if (Math.abs(spot.x - b.x) > 2) b.facing = spot.x > b.x ? 1 : -1;
    b.actionTimer = actionDef(id).seconds;
    ctx.emit({ type: 'sfx', name: ACTION_SFX[id] });
    return;
  }
  b.actionTimer -= dt;
  if (b.actionTimer <= 0) finishAction(ctx, b.action);
}

export function buyHomeItem(ctx: HomeCtx, id: HomeItemId): boolean {
  const def = itemDef(id);
  const home = ctx.progress.home;
  if (!def) return false;
  if (home.owned.includes(id)) { placeHomeItem(ctx, id); return true; }
  if (home.wallet < def.cost) {
    ctx.emit({ type: 'sfx', name: 'error' });
    ctx.emit({ type: 'toast', text: 'Not enough money in your wallet' });
    return false;
  }
  home.wallet -= def.cost;
  home.owned.push(id);
  home.placed[def.slot] = id;
  home.happiness = clampStat(home.happiness + def.happiness);
  const b = ctx.state.homeBear;
  addEffect(ctx.state, 'heart', b.x, b.y - 70);
  addEffect(ctx.state, 'text', b.x, b.y - 88, `+${def.happiness} ♥`);
  ctx.emit({ type: 'sfx', name: 'buy' });
  ctx.emit({ type: 'progress' });
  ctx.emit({ type: 'decor' });
  ctx.save();
  return true;
}

export function placeHomeItem(ctx: HomeCtx, id: HomeItemId): void {
  const def = itemDef(id);
  const home = ctx.progress.home;
  if (!def || !home.owned.includes(id)) return;
  if (home.placed[def.slot] === id) return;
  home.placed[def.slot] = id;
  ctx.emit({ type: 'sfx', name: 'place' });
  ctx.emit({ type: 'decor' });
  ctx.emit({ type: 'progress' });
  ctx.save();
}

/** Café multipliers from how rested/happy the bear is: speed for the waiter, tips for coins. */
export function homeBonus(home: HomeProgress): { speed: number; tips: number } {
  const speed = home.energy < 25 ? 0.9 : home.energy >= 70 ? 1.1 : 1;
  const tips = 1 + Math.max(0, home.happiness - 50) / 250;
  return { speed, tips };
}

/** Called by game.ts when a work day starts: costs energy, resets doneToday. */
export function startWorkDay(home: HomeProgress): void {
  home.energy = clampStat(home.energy - 30);
  home.happiness = clampStat(home.happiness - 5);
  home.doneToday = [];
}

/** Salary for a finished day (added to home.wallet by game.ts). */
export function salaryFor(served: number, stars: number, day: number): number { return 15 + served * 3 + stars * 5 + Math.min(20, day); }
