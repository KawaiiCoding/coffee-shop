/* =====================================================================
   HOME SIMULATION — Mocha's evening at home.
   Pure-ish module: game.ts calls these; keep every export + signature.
   ===================================================================== */
import type {
  DishId, Effect, FurnitureId, GameEvent, GameState, HomeActionDef, HomeActionId, HomeBear, HomeItemDef, HomeItemId,
  HomeProgress, HomeSlot, IngredientId, Progress, SfxName, SnackId, StoryId,
} from '../types';
import { HOME_IDLE, HOME_NEWSPAPER, HOME_SPOTS } from '../layout';
import { MOM_LINES } from '../story';
import { DISHES, ECONOMY, SNACKS, START_HOME } from '../content/progression';
import type { ProgCtx } from './progression';
import { grantReward, progressEvent, tapShootingStar, updateProgression } from './progression';
import { secretEvent, secretTap } from './secrets';

const SAVE_AMOUNT = 10;

export const HOME_ACTIONS: HomeActionDef[] = [
  { id: 'cook', name: 'Cook', description: 'Whip up a dish from the pantry at the little stove.',
    cost: 0, energy: 0, happiness: 2, oncePerDay: false, seconds: 4 },
  { id: 'eat', name: 'Eat', description: 'Sit down and enjoy the meal you cooked. Nom!',
    cost: 0, energy: 20, happiness: 5, oncePerDay: false, seconds: 3.2 },
  { id: 'bath', name: 'Warm bath', description: 'Bubbles up to the ears. Soothes tired paws after a busy shift.',
    cost: 0, energy: 15, happiness: 10, oncePerDay: true, seconds: 4 },
  { id: 'call_mom', name: 'Call Mom', description: 'Hearing Mom\'s voice makes everything feel cosy again.',
    cost: 0, energy: 0, happiness: 20, oncePerDay: true, seconds: 4 },
  { id: 'read', name: 'Read a book', description: 'Curl up in the armchair with a good story.',
    cost: 0, energy: 5, happiness: 10, oncePerDay: true, seconds: 5 },
  { id: 'warm', name: 'Warm up', description: 'Sit on the rug by the crackly fire and toast your paws.',
    cost: 0, energy: 5, happiness: 8, oncePerDay: true, seconds: 5 },
  { id: 'save', name: 'Save for the bike', description: `Drop ${SAVE_AMOUNT} coins into the jar. One day it'll be a bicycle to ride to Mom's!`,
    cost: SAVE_AMOUNT, energy: 0, happiness: 0, oncePerDay: false, seconds: 1.2 },
  { id: 'sleep', name: 'Go to sleep', description: 'Snuggle into bed and rest up for tomorrow\'s shift.',
    cost: 0, energy: 40, happiness: 0, oncePerDay: false, seconds: 3 },
  { id: 'calendar', name: 'Calendar', description: 'See what day it is and which festival is coming.',
    cost: 0, energy: 0, happiness: 0, oncePerDay: false, seconds: 0 },
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
/** Savings dreams in order. The jar always saves toward the next one; reaching it buys it and empties the jar. */
export const DREAMS: { goal: number; name: string; icon: 'bike' | 'fire' }[] = [
  { goal: 300, name: 'A bicycle to visit Mom', icon: 'bike' },
  { goal: 200, name: 'A fireplace before the snow', icon: 'fire' },
];
/** Which dream the jar is saving for now (DREAMS.length = all dreams done). Bike done = dreamDone. */
export function dreamStage(h: HomeProgress): number {
  if (!h.dreamDone) return 0;
  return h.furniture.includes('fireplace') ? DREAMS.length : 1;
}

/** Everything home logic needs from the game (game.ts constructs it). */
export interface HomeCtx {
  state: GameState;
  progress: Progress;
  emit(e: GameEvent): void;
  save(): void;
  /** Called when the bear finishes 'sleep': game.ts starts the next work day. */
  onSleep(): void;
  /** Ask game.ts to play a story (e.g. 'dream' when the jar is full). */
  playStory(id: StoryId): void;
  /** Progression bridge (chapters, gifts, shooting stars). */
  prog: ProgCtx;
  /** Optional: tapping the stove / calendar in the scene asks the UI to open the recipe picker / calendar sheet. */
  openSheet?(sheet: 'cook' | 'calendar' | 'news' | 'journal'): void;
}

type Pt = { x: number; y: number };
const SLOTS: HomeSlot[] = ['wall', 'window', 'bed', 'rug', 'corner', 'pet'];
const ACTION_IDS: HomeActionId[] = ['cook', 'eat', 'bath', 'call_mom', 'read', 'save', 'sleep', 'warm', 'calendar'];
const FURNITURE_IDS: FurnitureId[] = ['phone', 'armchair', 'dining_table', 'fireplace', 'bookshelf', 'radio'];
const INGREDIENT_IDS: IngredientId[] = ['rice', 'egg', 'milk', 'flour', 'honey', 'curry_roux', 'noodles', 'veggies', 'tofu', 'strawberry', 'bread', 'miso'];
const SNACK_IDS: SnackId[] = ['melon_bread', 'pudding', 'canned_coffee', 'dango', 'onigiri_pack', 'ice_cream'];
const DISH_IDS: DishId[] = ['honey_toast', 'onigiri', 'omurice', 'curry_rice', 'ramen', 'pancakes', 'miso_soup', 'strawberry_parfait'];
const ACTION_SFX: Record<HomeActionId, SfxName> = {
  cook: 'cook', eat: 'eat', bath: 'door', call_mom: 'phone', read: 'page', save: 'jar', sleep: 'yawn', warm: 'crackle', calendar: 'tap',
};
/** Furniture an action needs before it can be done (and before its spot is tappable). */
export const ACTION_FURNITURE: Partial<Record<HomeActionId, FurnitureId>> = {
  call_mom: 'phone', read: 'armchair', warm: 'fireplace',
};
const WALK_SPEED = 110;
const FLOOR = { minX: 30, maxX: 330, minY: 270, maxY: 630 };
const AISLE_X = 180;
const TOWEL_SECONDS = 6;
/** Fire lit: +1 happiness every this many seconds at home. */
const FIRE_HAPPY_EVERY = 12;

/** Where the floating icon bubble of each action sits above its HOME_SPOTS point. */
const ICON_LIFT: Record<HomeActionId, number> = {
  bath: 132, cook: 92, sleep: 70, call_mom: 60, read: 84, save: 14, eat: 66, warm: 120, calendar: 40,
};
/** Generous tap rectangles over each piece of furniture's whole visual body (scene coords). */
const HIT_RECTS: Record<HomeActionId, { x: number; y: number; w: number; h: number }> = {
  bath:     { x: 0,   y: 120, w: 78,  h: 140 },
  save:     { x: 208, y: 98,  w: 60,  h: 62 },
  cook:     { x: 254, y: 164, w: 98,  h: 100 },
  calendar: { x: 138, y: 172, w: 60,  h: 66 },
  sleep:    { x: 16,  y: 372, w: 162, h: 92 },
  eat:      { x: 190, y: 316, w: 92,  h: 70 },
  call_mom: { x: 268, y: 392, w: 66,  h: 70 },
  warm:     { x: 10,  y: 494, w: 98,  h: 128 },
  read:     { x: 238, y: 532, w: 88,  h: 88 },
};
const ICON_HIT_R = 26;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const clampStat = (v: number) => clamp(Math.round(v), 0, 100);
const actionDef = (id: HomeActionId) => HOME_ACTIONS.find((a) => a.id === id)!;
const itemDef = (id: HomeItemId) => HOME_ITEMS.find((i) => i.id === id);
const dishDef = (id: DishId) => DISHES.find((d) => d.id === id);
const snackDef = (id: SnackId) => SNACKS.find((s) => s.id === id);
const hasFurniture = (home: HomeProgress, id: FurnitureId) => home.furniture.includes(id);
const nice = (id: string) => id.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());

/** Centre of the floating icon bubble for an action (render-home draws it here). */
export function homeIconPos(id: HomeActionId): Pt {
  const s = HOME_SPOTS[id];
  return { x: s.x, y: s.y - ICON_LIFT[id] };
}

/** Is the furniture for this spot in the room (fixed pieces always are)? */
export function spotPresent(home: HomeProgress, id: HomeActionId): boolean {
  const need = ACTION_FURNITURE[id];
  if (id === 'eat') return true; // eating works without a table (standing by the stove)
  return !need || hasFurniture(home, need);
}

/* ---------- transient animation state (read by render-home) ---------- */
export interface HomeAnim {
  /** Dish being cooked right now. */
  cooking: DishId | null;
  /** Snack being eaten (eat action started by eatSnack). */
  snack: SnackId | null;
  /** state.time until which the bear wears his towel. */
  towelUntil: number;
}
const anim: HomeAnim = { cooking: null, snack: null, towelUntil: 0 };
let fireAcc = 0;
export function homeAnim(): Readonly<HomeAnim> { return anim; }

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
    furniture: [...START_HOME.furniture],
    pantry: { ...START_HOME.pantry },
    meal: null,
    books: START_HOME.books,
    fireOn: false,
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
  const isFurn = (v: unknown): v is FurnitureId => typeof v === 'string' && (FURNITURE_IDS as string[]).includes(v);

  d.wallet = Math.floor(num(r.wallet, d.wallet, 0, 1e9));
  d.savings = Math.floor(num(r.savings, d.savings, 0, 1e9));
  d.dreamGoal = Math.floor(num(r.dreamGoal, d.dreamGoal, 1, 1e9));
  d.dreamDone = typeof r.dreamDone === 'boolean' ? r.dreamDone : d.dreamDone;
  // (dreamGoal is re-synced to the current dream below, once furniture is known)
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
  if (Array.isArray(r.furniture)) d.furniture = [...new Set(r.furniture.filter(isFurn))];
  if (r.pantry && typeof r.pantry === 'object') {
    const p = r.pantry as Record<string, unknown>;
    const out: HomeProgress['pantry'] = {};
    for (const id of [...INGREDIENT_IDS, ...SNACK_IDS]) {
      const n = Math.floor(num(p[id], 0, 0, 999));
      if (n > 0) out[id] = n;
    }
    d.pantry = out;
  }
  d.meal = typeof r.meal === 'string' && (DISH_IDS as string[]).includes(r.meal) ? (r.meal as DishId) : null;
  d.books = Math.floor(num(r.books, d.books, 0, 999));
  d.fireOn = typeof r.fireOn === 'boolean' ? r.fireOn && d.furniture.includes('fireplace') : false;
  { const cur = DREAMS[dreamStage(d)]; if (cur) d.dreamGoal = cur.goal; }
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

/** Where the bear goes to do an action (eating without a table happens by the stove). */
function standFor(home: HomeProgress, id: HomeActionId): Pt {
  if (id === 'eat' && !hasFurniture(home, 'dining_table')) return HOME_SPOTS.cook.stand;
  return HOME_SPOTS[id].stand;
}

/** Entering home (after goHome / coming back from the konbini): reset the bear position. */
export function enterHome(ctx: HomeCtx): void {
  const b = ctx.state.homeBear;
  const home = ctx.progress.home;
  // an interrupted action is resolved kindly: the dish finishes, an uneaten snack goes back in the pantry
  if (anim.cooking && !home.meal) home.meal = anim.cooking;
  if (anim.snack) home.pantry[anim.snack] = (home.pantry[anim.snack] ?? 0) + 1;
  anim.cooking = null; anim.snack = null; anim.towelUntil = 0;
  fireAcc = 0;
  b.x = 60; b.y = 290; b.facing = 1; b.walkPhase = 0;
  b.action = null; b.actionTimer = 0;
  b.path = route({ x: b.x, y: b.y }, HOME_IDLE);
  progressEvent(ctx.prog, { kind: 'enterHome' });
}

/* ---------- cooking ---------- */
/** Recipe known + enough pantry ingredients. `missing` lists what is short. */
export function canCook(ctx: HomeCtx, id: DishId): { ok: boolean; missing: Partial<Record<IngredientId, number>> } {
  const missing: Partial<Record<IngredientId, number>> = {};
  const def = dishDef(id);
  if (!def || !ctx.progress.recipes.includes(id)) return { ok: false, missing };
  const pantry = ctx.progress.home.pantry;
  for (const [ing, need] of Object.entries(def.ingredients) as [IngredientId, number][]) {
    const have = pantry[ing] ?? 0;
    if (have < need) missing[ing] = need - have;
  }
  return { ok: Object.keys(missing).length === 0 && !ctx.progress.home.meal, missing };
}

function anyCookable(progress: Progress): boolean {
  const pantry = progress.home.pantry;
  return progress.recipes.some((id) => {
    const def = dishDef(id);
    return !!def && (Object.entries(def.ingredients) as [IngredientId, number][]).every(([ing, n]) => (pantry[ing] ?? 0) >= n);
  });
}
function anySnack(home: HomeProgress): boolean {
  return SNACK_IDS.some((id) => (home.pantry[id] ?? 0) > 0);
}

function fail(ctx: HomeCtx, reason: string): false {
  ctx.emit({ type: 'sfx', name: 'error' });
  ctx.emit({ type: 'toast', text: reason });
  return false;
}

/** After the player picks a recipe: uses the ingredients, the bear cooks at the stove, then home.meal is set. */
export function cookDish(ctx: HomeCtx, id: DishId): boolean {
  const b = ctx.state.homeBear;
  if (b.action !== null) return fail(ctx, 'Mocha is busy');
  if (ctx.progress.home.meal) return fail(ctx, 'Eat your meal first');
  const check = canCook(ctx, id);
  if (!check.ok) return fail(ctx, ctx.progress.recipes.includes(id) ? 'Missing ingredients' : 'Recipe not known yet');
  const def = dishDef(id)!;
  const pantry = ctx.progress.home.pantry;
  for (const [ing, n] of Object.entries(def.ingredients) as [IngredientId, number][]) {
    const left = (pantry[ing] ?? 0) - n;
    if (left > 0) pantry[ing] = left; else delete pantry[ing];
  }
  anim.cooking = id;
  b.action = 'cook';
  b.actionTimer = 0;
  b.path = route({ x: b.x, y: b.y }, HOME_SPOTS.cook.stand);
  ctx.emit({ type: 'sfx', name: 'tap' });
  ctx.emit({ type: 'progress' });
  ctx.save();
  return true;
}

/** Eat a konbini snack from the pantry (at the dining table, or standing by the stove). */
export function eatSnack(ctx: HomeCtx, id: SnackId): boolean {
  const b = ctx.state.homeBear;
  const home = ctx.progress.home;
  if (b.action !== null) return fail(ctx, 'Mocha is busy');
  const have = home.pantry[id] ?? 0;
  if (have <= 0) return fail(ctx, 'None left');
  if (have > 1) home.pantry[id] = have - 1; else delete home.pantry[id];
  anim.snack = id;
  b.action = 'eat';
  b.actionTimer = 0;
  b.path = route({ x: b.x, y: b.y }, standFor(home, 'eat'));
  ctx.emit({ type: 'sfx', name: 'tap' });
  ctx.emit({ type: 'progress' });
  return true;
}

/* ---------- fireplace ---------- */
export function setFire(ctx: HomeCtx, on: boolean): boolean {
  const home = ctx.progress.home;
  if (on && !hasFurniture(home, 'fireplace')) return fail(ctx, 'No fireplace yet');
  if (home.fireOn === on) return true;
  home.fireOn = on;
  fireAcc = 0;
  ctx.emit({ type: 'sfx', name: on ? 'crackle' : 'tap' });
  if (on) addEffect(ctx.state, 'sparkle', HOME_SPOTS.warm.x, HOME_SPOTS.warm.y - 50);
  ctx.emit({ type: 'progress' });
  ctx.save();
  return true;
}

/* ---------- availability ---------- */
/** Why an action can't be done right now (ignoring whether the bear is busy), or null. */
function blockReason(progress: Progress, id: HomeActionId): string | null {
  const home = progress.home;
  const def = HOME_ACTIONS.find((a) => a.id === id);
  if (!def) return 'Unknown action';
  switch (id) {
    case 'calendar': return null;
    case 'cook':
      if (home.meal) return 'Eat your meal first';
      if (!anyCookable(progress) && !anySnack(home)) return Object.keys(home.pantry).length ? 'Need more groceries' : 'Pantry is empty';
      return null;
    case 'eat':
      return home.meal ? null : 'Nothing cooked yet';
    case 'call_mom':
      if (!hasFurniture(home, 'phone')) return 'No phone yet';
      if (home.doneToday.includes(id)) return 'Already called Mom today';
      return null;
    case 'read':
      if (!hasFurniture(home, 'armchair')) return 'No armchair yet';
      if (home.books <= 0) return 'Need a book';
      if (home.doneToday.includes(id)) return 'Read enough today';
      return null;
    case 'warm':
      if (!hasFurniture(home, 'fireplace')) return 'No fireplace yet';
      if (home.doneToday.includes(id)) return 'Already toasty today';
      return null;
    case 'bath':
      if (home.doneToday.includes(id)) return 'Already had a bath';
      return null;
    case 'save':
      return home.wallet >= def.cost ? null : `Need ${def.cost} coins`;
    default:
      if (def.oncePerDay && home.doneToday.includes(id)) return 'Already done today';
      if (home.wallet < def.cost) return 'Not enough money';
      return null;
  }
}

/** Whether an action is worth showing today (furniture owned, not done yet, affordable). Ignores whether the bear is busy.
 *  Pass `progress` to also check recipes for 'cook'. */
export function homeActionAvailable(home: HomeProgress, id: HomeActionId, progress?: Progress): boolean {
  if (!progress && id === 'cook') return !home.meal && Object.keys(home.pantry).length > 0;
  const p: Progress = progress ? (progress.home === home ? progress : { ...progress, home }) : ({ home, recipes: [] } as unknown as Progress);
  return blockReason(p, id) === null;
}

export function canDoHomeAction(ctx: HomeCtx, id: HomeActionId): { ok: boolean; reason?: string } {
  if (!ACTION_IDS.includes(id)) return { ok: false, reason: 'Unknown action' };
  if (id !== 'calendar' && ctx.state.homeBear.action !== null) return { ok: false, reason: 'Mocha is busy' };
  const reason = blockReason(ctx.progress, id);
  return reason ? { ok: false, reason } : { ok: true };
}

/** Start an action: walk to its spot, then perform for `seconds`, then apply effects.
 *  'cook' only validates (the UI then opens the recipe picker and calls cookDish); 'calendar' does nothing (UI sheet). */
export function homeAction(ctx: HomeCtx, id: HomeActionId): boolean {
  if (id === 'calendar') return true;
  const check = canDoHomeAction(ctx, id);
  if (!check.ok) return fail(ctx, check.reason ?? 'Not now');
  if (id === 'cook') return true;
  const b = ctx.state.homeBear;
  b.action = id;
  b.actionTimer = 0;
  b.path = route({ x: b.x, y: b.y }, standFor(ctx.progress.home, id));
  ctx.emit({ type: 'sfx', name: 'tap' });
  return true;
}

/** Which action spot (if any) a scene point hits: furniture body or its icon bubble. Unowned furniture is not tappable. */
export function homeHitTest(progress: Progress, x: number, y: number): HomeActionId | null {
  const home = progress.home;
  let best: HomeActionId | null = null, bestD = Infinity;
  for (const id of ACTION_IDS) {
    if (!spotPresent(home, id)) continue;
    if (id === 'eat' && !hasFurniture(home, 'dining_table')) continue; // no table to tap
    const r = HIT_RECTS[id];
    const ic = homeIconPos(id);
    const icD = Math.hypot(x - ic.x, y - (ic.y - 19));
    const showsIcon = id !== 'calendar' && blockReason(progress, id) === null;
    let d = Infinity;
    if (showsIcon && icD <= ICON_HIT_R) d = icD * 0.5; // bubbles win ties
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
      d = Math.min(d, Math.hypot(x - (r.x + r.w / 2), y - (r.y + r.h / 2)));
    }
    if (d < bestD) { bestD = d; best = id; }
  }
  return best;
}

/** Tap in the home scene (scene coords): shooting star first, then furniture, else walk there. */
export function homeTap(ctx: HomeCtx, x: number, y: number): void {
  if (tapShootingStar(ctx.prog, x, y)) { secretEvent(ctx, 'wish'); return; }
  // the morning newspaper on the floor
  if (Math.hypot(x - HOME_NEWSPAPER.x, y - HOME_NEWSPAPER.y) <= HOME_NEWSPAPER.r) {
    ctx.emit({ type: 'sfx', name: 'page' });
    ctx.openSheet?.('news');
    return;
  }
  // secret hotspots sit on drawn things (jar, pillow, kettle...): they win over furniture bodies, never over action icon bubbles
  const onIcon = ACTION_IDS.some((id) => {
    if (id === 'calendar' || !spotPresent(ctx.progress.home, id) || blockReason(ctx.progress, id) !== null) return false;
    const ic = homeIconPos(id);
    return Math.hypot(x - ic.x, y - (ic.y - 19)) <= ICON_HIT_R;
  });
  if (!onIcon && secretTap(ctx, 'home', x, y)) return;
  const hit = homeHitTest(ctx.progress, x, y);
  if (hit === 'calendar') {
    ctx.emit({ type: 'sfx', name: 'page' });
    homeAction(ctx, 'calendar');
    ctx.openSheet?.('calendar');
    return;
  }
  if (hit === 'cook') {
    if (homeAction(ctx, 'cook')) { ctx.emit({ type: 'sfx', name: 'tap' }); ctx.openSheet?.('cook'); }
    return;
  }
  if (hit) { homeAction(ctx, hit); return; }
  const b = ctx.state.homeBear;
  if (b.action !== null || y <= FLOOR.minY - 20) return;
  const to = { x: clamp(x, FLOOR.minX, FLOOR.maxX), y: clamp(y, FLOOR.minY, FLOOR.maxY) };
  b.path = route({ x: b.x, y: b.y }, to);
}

function statFx(ctx: HomeCtx, x: number, y: number, energy: number, happiness: number) {
  const st = ctx.state;
  if (happiness > 0) {
    addEffect(st, 'heart', x - 14, y);
    addEffect(st, 'text', x - 14, y - 18, `+${happiness} ♥`);
  }
  if (energy > 0) addEffect(st, 'text', x + 16, y - 4, `+${energy} ⚡`);
  addEffect(st, 'sparkle', x, y + 20);
}

function finishAction(ctx: HomeCtx, id: HomeActionId) {
  const { state, progress } = ctx;
  const home = progress.home;
  const b = state.homeBear;
  const def = actionDef(id);
  b.action = null;
  b.actionTimer = 0;
  const fx = b.x, fy = b.y - 70;

  if (id === 'cook') {
    const dish = anim.cooking;
    anim.cooking = null;
    if (!dish) return;
    home.meal = dish;
    home.happiness = clampStat(home.happiness + def.happiness);
    addEffect(state, 'sparkle', HOME_SPOTS.cook.x, HOME_SPOTS.cook.y - 80);
    addEffect(state, 'text', HOME_SPOTS.cook.x - 20, HOME_SPOTS.cook.y - 100, `${dishDef(dish)?.name ?? nice(dish)} ready!`);
    ctx.emit({ type: 'sfx', name: 'ding' });
    progressEvent(ctx.prog, { kind: 'cooked', dish });
    secretEvent(ctx, 'cooked');
    if (DISHES.length && DISHES.every((d) => ctx.progress.giftsReceived.includes(`cooked:${d.id}`))) secretEvent(ctx, 'cooked_all_recipes');
    ctx.emit({ type: 'progress' });
    ctx.save();
    return;
  }

  if (id === 'eat') {
    let energy = def.energy, happiness = def.happiness;
    if (anim.snack) {
      const s = snackDef(anim.snack);
      if (s) { energy = s.energy; happiness = s.happiness; }
      anim.snack = null;
      secretEvent(ctx, 'ate_snack');
    } else if (home.meal) {
      const d = dishDef(home.meal);
      if (d) { energy = d.energy; happiness = d.happiness; }
      home.meal = null;
    } else return;
    home.energy = clampStat(home.energy + energy);
    home.happiness = clampStat(home.happiness + happiness);
    statFx(ctx, fx, fy, energy, happiness);
    ctx.emit({ type: 'sfx', name: 'pop' });
    ctx.emit({ type: 'progress' });
    ctx.save();
    return;
  }

  if (home.wallet < def.cost) { // spent elsewhere while walking
    fail(ctx, 'Not enough money');
    return;
  }
  home.wallet -= def.cost;
  if (id === 'save') home.savings += def.cost;
  home.energy = clampStat(home.energy + def.energy);
  home.happiness = clampStat(home.happiness + def.happiness);
  if (def.oncePerDay && !home.doneToday.includes(id)) home.doneToday.push(id);

  if (id === 'save') {
    const jar = HOME_SPOTS.save;
    addEffect(state, 'sparkle', jar.x, jar.y - 6);
    addEffect(state, 'text', jar.x, jar.y - 30, `+${def.cost} saved`);
  } else if (def.cost > 0) {
    addEffect(state, 'text', fx + 26, fy + 14, `-${def.cost}`);
  }
  statFx(ctx, fx, fy, def.energy, def.happiness);

  if (id === 'bath') {
    anim.towelUntil = state.time + TOWEL_SECONDS;
    b.facing = 1;
    ctx.emit({ type: 'sfx', name: 'door' });
  }
  if (id === 'call_mom') {
    const line = MOM_LINES[Math.max(0, progress.day) % MOM_LINES.length];
    ctx.emit({ type: 'toast', text: `Mom: “${line}”` });
    progressEvent(ctx.prog, { kind: 'call' });
  }
  if (id === 'save') progressEvent(ctx.prog, { kind: 'saved' });
  if (id === 'bath') secretEvent(ctx, 'bath');
  if (id === 'call_mom') secretEvent(ctx, 'called_mom');
  if (id === 'read') secretEvent(ctx, 'read');
  if (id === 'warm') secretEvent(ctx, 'warmed');
  if (id === 'save') secretEvent(ctx, 'saved_coin');
  ctx.emit({ type: 'progress' });
  ctx.save();

  const stage = dreamStage(home);
  if (id === 'save' && stage < DREAMS.length && home.savings >= DREAMS[stage].goal) {
    // a dream is bought: the jar empties by its price; the chapter system plays the story / popup
    home.savings -= DREAMS[stage].goal;
    if (stage === 0) {
      home.dreamDone = true;
      progressEvent(ctx.prog, { kind: 'dream' });
    } else {
      grantReward(ctx.prog, { kind: 'furniture', id: 'fireplace' });
      progressEvent(ctx.prog, { kind: 'saved' });
    }
    const next = DREAMS[dreamStage(home)];
    home.dreamGoal = next ? next.goal : home.dreamGoal;
    ctx.emit({ type: 'progress' });
    ctx.save();
    return;
  }
  if (id === 'sleep') { secretEvent(ctx, 'slept'); ctx.onSleep(); }
}

export function updateHome(ctx: HomeCtx, dt: number): void {
  if (!(dt > 0)) return;
  updateProgression(ctx.prog, dt);
  const home = ctx.progress.home;
  // a lit fire slowly cheers Mocha up
  if (home.fireOn && hasFurniture(home, 'fireplace')) {
    fireAcc += dt;
    if (fireAcc >= FIRE_HAPPY_EVERY) {
      fireAcc -= FIRE_HAPPY_EVERY;
      if (home.happiness < 100) {
        home.happiness = clampStat(home.happiness + 1);
        ctx.emit({ type: 'progress' });
      }
    }
  }
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
    const spot = id === 'eat' && !hasFurniture(home, 'dining_table') ? HOME_SPOTS.cook : HOME_SPOTS[id];
    if (id === 'eat' && hasFurniture(home, 'dining_table')) b.facing = 1;
    else if (id === 'warm') b.facing = -1;
    else if (Math.abs(spot.x - b.x) > 2) b.facing = spot.x > b.x ? 1 : -1;
    if (id === 'warm' && !home.fireOn) { home.fireOn = true; fireAcc = 0; ctx.emit({ type: 'progress' }); }
    b.actionTimer = Math.max(0.05, actionDef(id).seconds);
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
  if (home.wallet < def.cost) return fail(ctx, 'Not enough money in your wallet');
  home.wallet -= def.cost;
  home.owned.push(id);
  home.placed[def.slot] = id;
  home.happiness = clampStat(home.happiness + def.happiness);
  const b = ctx.state.homeBear;
  addEffect(ctx.state, 'heart', b.x, b.y - 70);
  addEffect(ctx.state, 'text', b.x, b.y - 88, `+${def.happiness} ♥`);
  ctx.emit({ type: 'sfx', name: 'buy' });
  progressEvent(ctx.prog, { kind: 'homeItem' });
  secretEvent(ctx, 'bought_home_item');
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

/** Called by game.ts when a work day starts: costs energy, resets doneToday, the fire burns out overnight. */
export function startWorkDay(home: HomeProgress): void {
  home.energy = clampStat(home.energy - 30);
  home.happiness = clampStat(home.happiness - 5);
  home.doneToday = [];
  home.fireOn = false;
}

/** Salary for a finished day (added to home.wallet by game.ts). */
export function salaryFor(served: number, stars: number, day: number): number {
  return ECONOMY.payBase + served * ECONOMY.payPerServed + stars * ECONOMY.payPerStar + Math.min(ECONOMY.payPerDayMax, day);
}
