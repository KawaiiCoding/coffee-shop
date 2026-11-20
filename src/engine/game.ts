/* Core simulation: story flow, cleanup, guests, waiter, counter, day cycle, shop, home bridge, persistence. */
import type {
  Chore, ChoreKind, DayStats, DecorId, DishId, Effect, GameApi, GameEvent, GameState, Guest, HomeActionId, HomeItemId,
  KonbiniStockId, MenuItemId, RegularId, Scene, SecretEventId, Settings, SfxName, SnackId, StoryId, TableState, ThemeId,
  TutorialStepId, UpgradeId, Waiter, WaiterTask,
} from '../types';
import {
  AISLE_X, COUNTER, DECOR_ANCHOR, DOOR, DOOR_QUEUE, DOOR_SPOT, ENTRANCE, MACHINE, MESS_SPOTS, SEAT_OFFSET, TABLES,
  TABLE_HIT_R, WAITER_HOME,
} from '../layout';
import { STORIES, TUTORIAL_STEPS } from '../story';
import {
  DECOR, MENU, THEMES, UPGRADES, availableMenu, computeStars, decorDef, isFood, menuDef, pickOrder, resolveTheme,
  upgradeDef,
} from './catalog';
import { clearProgress, defaultProgress, loadProgress, saveProgress } from './save';
import { randomLook, regularLook } from './looks';
import * as home from './home';
import type { HomeCtx } from './home';
import * as konbini from './konbini';
import type { KonbiniCtx } from './konbini';
import * as prog from './progression';
import type { ProgCtx, ProgEvent } from './progression';
import { calendarInfo, worldDate } from './calendar';
import * as secrets from './secrets';
import { getIssue, markIssueRead } from './news';
import { SECRETS } from '../content/secrets';
import {
  CHAPTERS, DISHES, GOODS, INGREDIENTS, REGULARS, SEASON_EVENTS, SNACKS,
} from '../content/progression';

type Pt = { x: number; y: number };

/** Guest with engine-internal fields (renderer may read them via cast). */
export interface GuestInt extends Guest {
  path: Pt[];
  facing: 1 | -1;
  walkPhase: number;
  tip: number;
  /** Regular café friend this guest is (null = a random passer-by). */
  regular: RegularId | null;
}

export interface GameOptions {
  rng?: () => number;        // seeded RNG for tests
  now?: () => Date;          // clock for theme 'auto'
  dayLength?: number;        // seconds, default 60
}

export const WAITER_SPEED = 150;
export const GUEST_SPEED = 90;
export const READY_MAX = 4;
const TOP_ZONE_Y = 335;      // above the first table row: walk straight
const READING_TIME = 1.5;
const EATING_TIME = 3;
const MACHINE_FACTOR = [1, 0.8, 0.65, 0.5];
const QUEUE_MAX = 5;
const DOOR_QUEUE_MAX = DOOR_QUEUE.length;
/** Slow first days: index = day-1. */
const SPAWN_SLOW = [1.3, 1.2, 1.1];
const DRAIN_SLOW = [0.6, 0.75, 0.9];
const MESS_HP: Record<string, number> = { dust: 2, cobweb: 2, box: 1, spill: 3 };
const MESS_KINDS = new Set<ChoreKind>(['dust', 'cobweb', 'box', 'spill']);
export const isMessChore = (c: Chore) => MESS_KINDS.has(c.kind);
/** Ceiling decor chore point (spec), and where its ghost "+" badge sits for taps/hints. */
const CEILING_CHORE = { x: 180, y: 40 };
const CEILING_TAP = { x: 180, y: 64 };

export const seatPoint = (i: number): Pt => ({ x: TABLES[i].x + SEAT_OFFSET.x, y: TABLES[i].y + SEAT_OFFSET.y });
/** Point to tap / aim at for a table (visual centre of table + seated guest). */
export const tablePoint = (i: number): Pt => ({ x: TABLES[i].x, y: TABLES[i].y - 30 });
export const COUNTER_TAP: Pt = { x: 290, y: 262 };

/** Where to tap / aim at for a cleanup chore. */
export function choreTapPoint(c: Chore): Pt {
  if (c.kind === 'place_table' && c.table != null) return tablePoint(c.table);
  if (c.kind === 'place_decor') return c.slot === 'ceiling' ? { ...CEILING_TAP } : { x: c.x, y: c.y - 44 };
  if (c.kind === 'box') return { x: c.x, y: c.y - 8 };
  return { x: c.x, y: c.y };
}

/** Smooth curved route: a gentle S-curve that bends toward the aisle between
 *  the start and the goal, sampled into points, so walkers glide straight-ish
 *  to where they're going instead of turning at right angles. */
export function route(from: Pt, to: Pt): Pt[] {
  const dist = Math.hypot(to.x - from.x, to.y - from.y);
  if (dist < 4) return [{ x: to.x, y: to.y }];
  const flat = from.y <= TOP_ZONE_Y && to.y <= TOP_ZONE_Y;
  const pull = flat ? 0.15 : 0.55;              // how much the curve leans toward the aisle
  const lift = flat ? Math.min(14, dist * 0.08) : 0; // a soft arc for short hops
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const c1 = { x: lerp(from.x, AISLE_X, pull), y: lerp(from.y, to.y, 0.3) + lift };
  const c2 = { x: lerp(to.x, AISLE_X, pull), y: lerp(from.y, to.y, 0.7) + lift };
  const n = Math.max(4, Math.min(18, Math.round(dist / 14)));
  const pts: Pt[] = [];
  for (let i = 1; i <= n; i++) {
    const t = i / n, u = 1 - t;
    pts.push({
      x: u * u * u * from.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * to.x,
      y: u * u * u * from.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * to.y,
    });
  }
  pts[pts.length - 1] = { x: to.x, y: to.y };
  return pts;
}

/** Moves obj along path by dist (easing out near the end); returns true when the path is finished. */
function moveAlong(obj: { x: number; y: number; facing: 1 | -1; walkPhase: number }, path: Pt[], dist: number): boolean {
  let remaining = 0, px = obj.x, py = obj.y;
  for (const p of path) { remaining += Math.hypot(p.x - px, p.y - py); px = p.x; py = p.y; }
  if (remaining < 26) dist *= Math.max(0.35, remaining / 26);
  while (path.length && dist > 0) {
    const p = path[0];
    const dx = p.x - obj.x, dy = p.y - obj.y;
    const d = Math.hypot(dx, dy);
    if (Math.abs(dx) > 1.5) obj.facing = dx > 0 ? 1 : -1;
    if (d <= dist) {
      obj.x = p.x; obj.y = p.y; dist -= d; path.shift();
      obj.walkPhase = (obj.walkPhase + d / 40) % 1;
    } else {
      obj.x += (dx / d) * dist; obj.y += (dy / d) * dist;
      obj.walkPhase = (obj.walkPhase + dist / 40) % 1;
      dist = 0;
    }
  }
  return path.length === 0;
}

const count = (arr: MenuItemId[], id: MenuItemId) => arr.reduce((n, x) => n + (x === id ? 1 : 0), 0);
const sameTask = (a: WaiterTask, b: WaiterTask) =>
  a.kind === b.kind && (a.kind === 'pickup' || (a as { table: number }).table === (b as { table: number }).table);

const CHORE_HINT: Record<string, string> = {
  dust: 'Tap the dust bunny to sweep it',
  cobweb: 'Tap the cobweb',
  box: 'Tap the box to carry it away',
  spill: 'Mop the spill',
  place_table: 'Tap to set up a table',
  decor_ceiling: 'Hang the bunting',
  decor_back: 'Set up the record player',
};

export function createGame(storage: Storage | null, opts: GameOptions = {}): GameApi {
  const rng = opts.rng ?? Math.random;
  let progress = loadProgress(storage);
  // Yarn Street has its own calendar: the date follows the game day, not the real world
  const now = opts.now ?? (() => worldDate(progress.day));
  const listeners = new Set<(e: GameEvent) => void>();
  let quiet = false; // swallow events while silently draining old state (resetSave)
  const emit = (e: GameEvent) => {
    if (quiet) return;
    for (const fn of [...listeners]) { try { fn(e); } catch (err) { console.error(err); } }
  };
  const sfx = (name: SfxName) => emit({ type: 'sfx', name });
  const toast = (text: string) => emit({ type: 'toast', text });

  let nextGuestId = 1;
  let nextEffectId = 1;
  let nextChoreId = 1;
  let spawnTimer = 1.5;
  let endGrace = 0;
  /** Guest ids waiting at the door, front first (index = DOOR_QUEUE slot). */
  let doorQueue: number[] = [];
  /** Café multipliers from the bear's home life, fixed when a work day starts. */
  let bonus = { speed: 1, tips: 1 };
  let pausedFrom: GameState['mode'] = 'playing';

  const level = (id: UpgradeId) => progress.upgrades[id] ?? 0;
  const newWaiter = (): Waiter => ({
    x: WAITER_HOME.x, y: WAITER_HOME.y, facing: 1, tray: [], path: [], task: null, queue: [], walkPhase: 0,
  });
  const makeTables = (): TableState[] =>
    TABLES.map((_, i) => ({ index: i, unlocked: i < 3 + level('tables'), guestId: null, item: null, coins: 0 }));
  const emptyStats = (): DayStats => ({ day: progress.day, served: 0, lost: 0, tips: 0, stars: 0, salary: 0 });
  const newTutorial = () => ({ active: false, step: 0, done: TUTORIAL_STEPS.map(() => false) });

  const state: GameState = {
    mode: 'title',
    scene: 'cafe',
    konbini: { basket: [], bear: home.newHomeBear() },
    popup: null,
    shootingStar: null,
    reaction: null,
    calendar: calendarInfo(now()),
    story: null,
    chores: [],
    tutorial: newTutorial(),
    homeBear: home.newHomeBear(),
    progress,
    theme: resolveTheme(progress.theme, now()),
    dayTime: 0,
    dayLength: opts.dayLength ?? 60,
    doorOpen: false,
    guests: [],
    waiter: newWaiter(),
    counter: { queue: [], brewing: null, ready: [] },
    tables: makeTables(),
    selectedGuest: null,
    hint: null,
    effects: [],
    dayStats: emptyStats(),
    lastDay: null,
    time: 0,
  };

  const save = () => saveProgress(storage, progress);
  const guests = () => state.guests as GuestInt[];
  const guestById = (id: number | null) => (id == null ? undefined : guests().find((g) => g.id === id));
  const queued = () => doorQueue.map((id) => guestById(id)).filter((g): g is GuestInt => !!g);
  const frontGuest = () => queued()[0];
  const tableFree = (t: TableState) => t.unlocked && t.guestId == null && t.coins === 0;
  const trayCap = () => 2 + level('tray');
  const charm = () => {
    let c = 0;
    for (const id of Object.values(progress.placed)) if (id) c += decorDef(id)?.charm ?? 0;
    return c;
  };
  const slowIdx = () => progress.day - 1;
  const difficulty = () => Math.min(1.8, 1 + 0.05 * (progress.day - 1));
  const drainMul = () => difficulty() * (1 - 0.12 * level('cushions')) * (DRAIN_SLOW[slowIdx()] ?? 1);
  const spawnGap = () => {
    const base = 5.5 + rng() * 2.5; // a day is one minute: guests come a little quicker
    const dayMul = Math.max(0.65, 1 - 0.03 * (progress.day - 1));
    return ((base * dayMul) / (1 + charm() * 0.02)) * (SPAWN_SLOW[slowIdx()] ?? 1);
  };

  const addEffect = (kind: Effect['kind'], x: number, y: number, text?: string) => {
    const life = kind === 'sparkle' ? 0.8 : kind === 'broom' ? 0.9 : 1.2;
    const e: Effect = { id: nextEffectId++, kind, x, y, age: 0, life };
    if (text !== undefined) e.text = text;
    state.effects.push(e);
  };

  /* ---------- progression / home / konbini bridges ---------- */
  const pctx: ProgCtx = {
    get state() { return state; },
    get progress() { return progress; },
    emit,
    save,
    playStory: (id: StoryId) => requestStory(id),
  };
  const progEvent = (ev: ProgEvent) => {
    try { prog.progressEvent(pctx, ev); } catch (err) { console.error(err); }
  };

  const ctx: HomeCtx & { prog: ProgCtx } = {
    get state() { return state; },
    get progress() { return progress; },
    prog: pctx,
    emit,
    save,
    onSleep: () => startWorkDay(),
    playStory: (id: StoryId) => requestStory(id),
    openSheet: (sheet: 'cook' | 'calendar' | 'news' | 'journal') => emit({ type: 'sheet', sheet }),
  };
  const secretEv = (ev: SecretEventId) => secrets.secretEvent(ctx, ev);

  const kctx: KonbiniCtx = {
    get state() { return state; },
    get progress() { return progress; },
    emit,
    save,
    onCheckout: () => { save(); emit({ type: 'progress' }); }, // konbini.ts sends the 'konbini' progress event itself
    onLeave: () => goTo('home'),
    playStory: (id: StoryId) => requestStory(id),
    secretEvent: (ev: SecretEventId) => secretEv(ev),
    secretTap: (x: number, y: number) => secrets.secretTap(ctx, 'konbini', x, y),
  };

  function setScene(scene: Scene) {
    state.scene = scene;
    emit({ type: 'scene', scene });
    emit({ type: 'decor' });
  }

  /* ---------- tutorial ---------- */
  function completeStep(id: TutorialStepId, at?: Pt) {
    const tut = state.tutorial;
    if (!tut.active) return;
    const idx = TUTORIAL_STEPS.findIndex((s) => s.id === id);
    if (idx < 0 || tut.done[idx]) return;
    tut.done[idx] = true;
    sfx('ding');
    const p = at ?? { x: 180, y: 330 };
    addEffect('sparkle', p.x, p.y);
    const next = tut.done.findIndex((d) => !d);
    tut.step = next < 0 ? TUTORIAL_STEPS.length : next;
    if (next < 0) {
      tut.active = false;
      progress.tutorialDone = true;
      save();
      secretEv('tutorial_done');
      // (the UI's tutorial ticks show a "You've got it!" moment; no toast)
      spawnTimer = spawnGap();
      emit({ type: 'progress' });
    }
  }

  /* ---------- supply / demand of items ---------- */
  const demand = (id: MenuItemId) => guests().filter((g) => g.phase === 'waiting' && g.order === id).length;
  const supply = (id: MenuItemId) => {
    const c = state.counter;
    return count(c.ready, id) + count(state.waiter.tray, id) + count(c.queue, id) + (c.brewing?.item === id ? 1 : 0);
  };
  /** Items on the counter that the waiter should carry (beyond what's already on the tray). */
  const neededFromCounter = (): MenuItemId[] => {
    const out: MenuItemId[] = [];
    const ready = [...state.counter.ready];
    const ids = new Set(guests().filter((g) => g.phase === 'waiting' && g.order).map((g) => g.order!));
    for (const id of ids) {
      const n = Math.min(Math.max(0, demand(id) - count(state.waiter.tray, id)), count(ready, id));
      for (let i = 0; i < n; i++) out.push(id);
    }
    return out;
  };
  const unneededOnTray = (): number => {
    let n = 0;
    for (const id of new Set(state.waiter.tray)) n += Math.max(0, count(state.waiter.tray, id) - demand(id));
    return n;
  };

  /* ---------- door queue ---------- */
  function reflowQueue() {
    doorQueue = doorQueue.filter((id) => !!guestById(id));
    doorQueue.forEach((id, i) => {
      const g = guestById(id)!;
      const p = DOOR_QUEUE[i];
      const last = g.path[g.path.length - 1] ?? { x: g.x, y: g.y };
      if (Math.hypot(last.x - p.x, last.y - p.y) > 1) g.path = route(g, p);
    });
  }
  function leaveQueue(g: GuestInt) {
    const i = doorQueue.indexOf(g.id);
    if (i < 0) return;
    doorQueue.splice(i, 1);
    if (state.selectedGuest === g.id) state.selectedGuest = null;
    reflowQueue();
  }

  /* ---------- guests ---------- */
  function spawnGuest() {
    const slot = Math.min(doorQueue.length, DOOR_QUEUE_MAX - 1);
    const from = { x: ENTRANCE.x, y: ENTRANCE.y };
    const reg = state.tutorial.active ? null : pickRegularGuest();
    const def = reg ? REGULARS.find((r) => r.id === reg) : undefined;
    const g: GuestInt = {
      id: nextGuestId++, look: def ? regularLook(def.look, state.theme) : randomLook(rng, state.theme),
      phase: 'entering', table: null,
      x: from.x, y: from.y, patience: 1, order: null, timer: 0, mood: 'calm', happy: false,
      path: route(from, DOOR_QUEUE[slot]), facing: 1, walkPhase: 0, tip: 0, regular: def ? def.id : null,
    };
    state.guests.push(g);
    doorQueue.push(g.id);
    sfx('bell');
    if (def && progress.friendship[def.id] === undefined) {
      // first visit ever: mark them as met (no toast: it covered the café; their hello lives in the newspaper)
      progress.friendship[def.id] = 0;
      save();
      if (REGULARS.filter((r) => r.id !== 'button').every((r) => progress.friendship[r.id] !== undefined)) secretEv('all_regulars_met');
    }
  }

  /** A regular friend for the next guest (never one already in the café). */
  function pickRegularGuest(): RegularId | null {
    let id: RegularId | null = null;
    try { id = prog.pickRegular(progress, progress.day, rng); } catch (err) { console.error(err); }
    if (!id || !REGULARS.some((r) => r.id === id)) return null;
    if (guests().some((g) => g.regular === id)) return null;
    return id;
  }

  function orderFor(g: GuestInt): MenuItemId {
    if (state.tutorial.active) return 'latte';
    const def = g.regular ? REGULARS.find((r) => r.id === g.regular) : undefined;
    if (def && rng() < 0.6) {
      const menu = availableMenu(state.theme, level);
      if (menu.includes(def.favourite)) return def.favourite;
    }
    return pickOrder(rng, state.theme, level);
  }

  function leavePath(g: GuestInt): Pt[] {
    return [...route(g, DOOR_SPOT), { x: ENTRANCE.x, y: ENTRANCE.y }];
  }

  function leaveCross(g: GuestInt) {
    const wasWaiting = g.phase === 'waiting';
    g.phase = 'leaving'; g.timer = 0; g.happy = false; g.mood = 'cross';
    state.dayStats.lost++;
    sfx('angry');
    secretEv('lost_guest');
    addEffect('angry', g.x, g.y - (g.table != null ? 60 : 84));
    if (state.selectedGuest === g.id) state.selectedGuest = null;
    leaveQueue(g);
    if (g.table != null) {
      const t = state.tables[g.table];
      t.guestId = null; t.item = null;
      if (wasWaiting && g.order) {
        const qi = state.counter.queue.indexOf(g.order);
        if (qi >= 0 && supply(g.order) > demand(g.order)) state.counter.queue.splice(qi, 1);
      }
    }
    g.path = leavePath(g);
    g.table = null;
  }

  function leaveHappy(g: GuestInt) {
    const t = state.tables[g.table!];
    t.guestId = null; t.item = null;
    t.coins += g.tip;
    g.phase = 'leaving'; g.timer = 0; g.happy = true; g.mood = 'happy';
    g.path = leavePath(g);
    g.table = null;
    if (level('tipjar') > 0) collectCoins(t.index);
    const def = g.regular ? REGULARS.find((r) => r.id === g.regular) : undefined;
    progEvent({ kind: 'served', regular: g.regular, favourite: !!def && g.order === def.favourite, happy: true });
    if (g.patience > 0.8) secretEv('served_perfect');
    if (g.regular) secretEv('served_regular');
    if (def && g.order === def.favourite) secretEv('served_favourite');
  }

  function collectCoins(i: number) {
    const t = state.tables[i];
    const n = t.coins;
    if (n <= 0) return;
    progress.coins += n;
    state.dayStats.tips += n;
    t.coins = 0;
    const p = tablePoint(i);
    addEffect('coin', p.x, p.y - 10, `+${n}`);
    sfx('coin');
    save(); // coins are kept even if the player closes the app mid-day
    emit({ type: 'progress' });
    completeStep('collect', p);
  }

  function seat(g: GuestInt, i: number) {
    const t = state.tables[i];
    leaveQueue(g);
    g.phase = 'toTable'; g.timer = 0; g.table = i;
    t.guestId = g.id;
    g.path = route(g, seatPoint(i));
    state.selectedGuest = null;
    sfx('seat');
    completeStep('seat', tablePoint(i));
  }

  function updateGuests(dt: number) {
    const drain = state.tutorial.active ? 0 : drainMul();
    for (const g of [...guests()]) {
      g.timer += dt;
      if (g.path.length) moveAlong(g, g.path, GUEST_SPEED * dt);
      switch (g.phase) {
        case 'entering':
          if (!g.path.length) { g.phase = 'door'; g.timer = 0; }
          break;
        case 'door':
          g.patience -= (dt / 25) * drain;
          break;
        case 'toTable':
          if (!g.path.length) {
            g.phase = 'reading'; g.timer = 0; g.facing = TABLES[g.table!].x < AISLE_X ? 1 : -1;
            g.order = orderFor(g);
          }
          break;
        case 'reading':
          if (g.timer >= READING_TIME) { g.phase = 'ordering'; g.timer = 0; }
          break;
        case 'ordering':
          g.patience -= (dt / 28) * drain;
          break;
        case 'waiting':
          g.patience -= (dt / 35) * drain;
          break;
        case 'eating':
          if (g.timer >= EATING_TIME) leaveHappy(g);
          break;
        case 'leaving':
          if (!g.path.length) state.guests.splice(state.guests.indexOf(g), 1);
          break;
      }
      if (g.phase === 'door' || g.phase === 'ordering' || g.phase === 'waiting') {
        g.mood = g.patience < 0.25 ? 'sleepy' : 'calm';
        if (g.patience <= 0) { g.patience = 0; leaveCross(g); }
      }
    }
  }

  function updateSpawn(dt: number) {
    if (!state.doorOpen || state.tutorial.active) return;
    if (spawnTimer > 0) spawnTimer -= dt;
    if (spawnTimer > 0) return;
    const free = state.tables.filter(tableFree).length;
    const q = doorQueue.length;
    if (q < DOOR_QUEUE_MAX && q < free) { spawnGuest(); spawnTimer = spawnGap(); }
  }

  /* ---------- counter ---------- */
  const brewTime = (id: MenuItemId) => Math.max(0.3, menuDef(id).brewSeconds * MACHINE_FACTOR[Math.min(3, level('machine'))]);

  function updateCounter(dt: number) {
    const c = state.counter;
    for (let i = 0; i < c.queue.length && c.ready.length < READY_MAX;) {
      if (isFood(c.queue[i])) { c.ready.push(c.queue.splice(i, 1)[0]); sfx('ding'); } else i++;
    }
    if (!c.brewing && c.ready.length < READY_MAX) {
      const idx = c.queue.findIndex((id) => !isFood(id));
      if (idx >= 0) { c.brewing = { item: c.queue.splice(idx, 1)[0], progress: 0 }; sfx('brew'); }
    }
    if (c.brewing) {
      c.brewing.progress = Math.min(1, c.brewing.progress + dt / brewTime(c.brewing.item));
      if (c.brewing.progress >= 1 && c.ready.length < READY_MAX) {
        c.ready.push(c.brewing.item);
        c.brewing = null;
        sfx('ding');
      }
    }
  }

  /* ---------- waiter ---------- */
  const waiterBusy = () => !!state.waiter.task || state.waiter.path.length > 0 || state.waiter.queue.length > 0;
  const pickupPending = () => {
    const w = state.waiter;
    return w.task?.kind === 'pickup' || w.queue.some((q) => q.kind === 'pickup');
  };
  const taskTarget = (t: WaiterTask): Pt => (t.kind === 'pickup' ? { x: 250, y: 318 } : TABLES[t.table].serve);
  const waiterSpeed = () => WAITER_SPEED * (1 + 0.15 * level('shoes')) * bonus.speed;

  function startTask(task: WaiterTask) {
    const w = state.waiter;
    w.task = task;
    w.path = route(w, taskTarget(task));
  }

  function assign(task: WaiterTask): boolean {
    const w = state.waiter;
    if ((w.task && sameTask(w.task, task)) || w.queue.some((q) => sameTask(q, task))) { sfx('tap'); return true; }
    if (!w.task && !w.path.length) startTask(task);
    else {
      if (w.queue.length >= QUEUE_MAX) { toast('One thing at a time!'); sfx('error'); return false; }
      w.queue.push(task);
    }
    sfx('tap');
    return true;
  }

  function perform(task: WaiterTask) {
    const w = state.waiter;
    const c = state.counter;
    if (task.kind === 'pickup') {
      // put back items nobody is waiting for
      for (const id of [...new Set(w.tray)]) {
        let extra = count(w.tray, id) - demand(id);
        while (extra-- > 0 && c.ready.length < READY_MAX) { w.tray.splice(w.tray.indexOf(id), 1); c.ready.push(id); }
      }
      let picked = 0;
      for (const id of neededFromCounter()) {
        if (w.tray.length >= trayCap()) break;
        c.ready.splice(c.ready.indexOf(id), 1);
        w.tray.push(id);
        picked++;
      }
      if (picked) { sfx('pickup'); completeStep('pickup', { x: w.x, y: w.y - 70 }); }
      return;
    }
    const t = state.tables[task.table];
    const g = guestById(t.guestId);
    if (task.kind === 'take') {
      if (!g || g.phase !== 'ordering' || !g.order) return;
      g.phase = 'waiting'; g.timer = 0; g.patience = Math.min(1, g.patience + 0.25);
      sfx('order');
      if (supply(g.order) < demand(g.order)) {
        if (isFood(g.order) && c.ready.length < READY_MAX) { c.ready.push(g.order); sfx('ding'); }
        else c.queue.push(g.order);
      }
      completeStep('take', tablePoint(task.table));
    } else if (task.kind === 'serve') {
      if (!g || g.phase !== 'waiting' || !g.order) return;
      const ti = w.tray.indexOf(g.order);
      if (ti < 0) return;
      w.tray.splice(ti, 1);
      g.phase = 'eating'; g.timer = 0; g.mood = 'happy';
      t.item = g.order;
      g.tip = Math.max(1, Math.round(
        menuDef(g.order).price * (0.6 + 0.6 * g.patience) * (1 + charm() / 100) * bonus.tips));
      state.dayStats.served++;
      addEffect('heart', g.x, g.y - 60);
      sfx('serve');
      completeStep('serve', tablePoint(task.table));
    } else if (task.kind === 'collect') {
      collectCoins(task.table);
    }
  }

  function updateWaiter(dt: number) {
    const w = state.waiter;
    if (!w.task && w.queue.length) startTask(w.queue.shift()!);
    if (!w.task) return;
    if (moveAlong(w, w.path, waiterSpeed() * dt)) {
      const task = w.task;
      w.task = null;
      perform(task);
      if (w.queue.length) startTask(w.queue.shift()!);
    }
  }

  /* ---------- cleanup (getting the café ready) ---------- */
  function buildChores(): Chore[] {
    const out: Chore[] = [];
    for (const m of MESS_SPOTS) {
      const hp = MESS_HP[m.kind];
      out.push({ id: nextChoreId++, kind: m.kind, x: m.x, y: m.y, hp, maxHp: hp, done: false });
    }
    for (let i = 0; i < 3; i++) {
      out.push({ id: nextChoreId++, kind: 'place_table', x: TABLES[i].x, y: TABLES[i].y, hp: 1, maxHp: 1, table: i, done: false });
    }
    out.push({ id: nextChoreId++, kind: 'place_decor', x: CEILING_CHORE.x, y: CEILING_CHORE.y, hp: 1, maxHp: 1, slot: 'ceiling', done: false });
    const b = DECOR_ANCHOR.back;
    out.push({ id: nextChoreId++, kind: 'place_decor', x: b.x, y: b.y, hp: 1, maxHp: 1, slot: 'back', done: false });
    return out;
  }
  const messLeft = () => state.chores.some((c) => !c.done && isMessChore(c));
  /** Chores that can be tapped right now (mess first, then setting up). */
  const activeChores = () => {
    const mess = messLeft();
    return state.chores.filter((c) => !c.done && isMessChore(c) === mess);
  };

  function startCleanup() {
    state.theme = resolveTheme(progress.theme, now());
    resetDay();
    state.doorOpen = false;
    setScene('cafe');
    state.mode = 'cleanup';
    state.story = null;
    state.chores = buildChores();
    state.hint = cleanupHint();
    emit({ type: 'decor' });
    emit({ type: 'progress' });
  }

  function waiterSpotFor(c: Chore): Pt {
    if (c.kind === 'place_table' && c.table != null) return { ...TABLES[c.table].serve };
    if (c.kind === 'place_decor') return c.slot === 'ceiling' ? { x: 180, y: 300 } : { x: c.x + 40, y: 282 };
    const side = c.x < AISLE_X ? 30 : -30;
    return { x: Math.max(30, Math.min(330, c.x + side)), y: Math.max(275, Math.min(640, c.y + 4)) };
  }

  function tapChore(x: number, y: number) {
    let best: Chore | null = null, bd = Infinity;
    for (const c of activeChores()) {
      const p = choreTapPoint(c);
      const r = c.kind === 'cobweb' || c.kind === 'place_decor' || c.kind === 'place_table' ? 50 : 40;
      const d = Math.hypot(x - p.x, y - p.y);
      if (d <= r && d < bd) { bd = d; best = c; }
    }
    if (!best) {
      // tapped a "place" spot while mess remains
      if (messLeft()) {
        const placeHit = state.chores.some((c) => !c.done && !isMessChore(c)
          && Math.hypot(x - choreTapPoint(c).x, y - choreTapPoint(c).y) <= 50);
        if (placeHit) { toast('Clean up the mess first'); sfx('error'); return; }
      }
      secrets.secretTap(ctx, 'cafe', x, y);
      return;
    }
    const c = best;
    c.hp = Math.max(0, c.hp - 1);
    sfx(c.kind === 'box' ? 'pop' : isMessChore(c) ? 'sweep' : 'place');
    const p = choreTapPoint(c);
    if (c.kind === 'dust' || c.kind === 'cobweb' || c.kind === 'spill') {
      // one broom at a time per mess: replace any broom still swishing there
      state.effects = state.effects.filter((e) => !(e.kind === 'broom' && Math.hypot(e.x - p.x, e.y - p.y) < 20));
      addEffect('broom', p.x, p.y);
    }
    addEffect('sparkle', p.x, p.y);
    const w = state.waiter;
    w.path = route(w, waiterSpotFor(c));
    if (c.hp <= 0) {
      c.done = true;
      if (!isMessChore(c) && c.slot) emit({ type: 'decor' });
      if (state.chores.every((ch) => ch.done)) {
        progress.cleanupDone = true;
        save();
        state.hint = null;
        playStory('cleanup_done');
        return;
      }
    }
    state.hint = cleanupHint();
  }

  function cleanupHint(): GameState['hint'] {
    const c = activeChores()[0];
    if (!c) return null;
    const key = c.kind === 'place_decor' ? (c.slot === 'ceiling' ? 'decor_ceiling' : 'decor_back') : c.kind;
    return { text: CHORE_HINT[key], target: choreTapPoint(c) };
  }

  /* ---------- taps ---------- */
  function tapCounter() {
    const w = state.waiter;
    const c = state.counter;
    const hasNeeded = neededFromCounter().length > 0;
    const coming = !!c.brewing || c.queue.length > 0;
    if (!hasNeeded && !coming && unneededOnTray() === 0) { toast('Nothing to pick up yet'); sfx('error'); return; }
    if (w.tray.length >= trayCap() && unneededOnTray() === 0) { toast('Tray is full'); sfx('error'); return; }
    assign({ kind: 'pickup' });
  }

  function tapTable(i: number) {
    const t = state.tables[i];
    if (tableFree(t)) {
      const sel = guestById(state.selectedGuest);
      const g = sel && doorQueue.includes(sel.id) ? sel : frontGuest();
      if (g) seat(g, i);
      else sfx('error');
      return;
    }
    const g = guestById(t.guestId);
    if (g) {
      if (g.phase === 'ordering') { assign({ kind: 'take', table: i }); return; }
      if (g.phase === 'waiting') {
        if ((g.order && state.waiter.tray.includes(g.order)) || pickupPending()) assign({ kind: 'serve', table: i });
        else { toast('Pick up the order at the counter first'); sfx('error'); }
        return;
      }
      if (state.selectedGuest != null) toast('That table is taken');
      sfx('error');
      return;
    }
    if (t.coins > 0) { assign({ kind: 'collect', table: i }); return; }
    sfx('error');
  }

  /** Speech bubble anchor (bottom tip) of a guest, as drawn by render.ts; null when no bubble shows. */
  function bubbleAnchor(g: GuestInt): Pt | null {
    if (g.phase === 'door' || (g.phase === 'entering' && doorQueue.includes(g.id))) return { x: g.x, y: g.y - 84 };
    if ((g.phase === 'reading' || g.phase === 'ordering' || g.phase === 'waiting') && g.table != null) {
      const sp = seatPoint(g.table);
      return { x: sp.x, y: sp.y - 60 };
    }
    return null;
  }
  const BUBBLE_HALF_W = 30, BUBBLE_H = 60;
  const inBubble = (p: Pt, x: number, y: number) =>
    Math.abs(x - p.x) <= BUBBLE_HALF_W && y >= p.y - BUBBLE_H && y <= p.y + 8;

  function tapScene(x: number, y: number) {
    if (state.mode === 'home') { home.homeTap(ctx, x, y); return; } // shooting-star taps are checked first inside homeTap
    if (state.mode === 'konbini') { konbini.konbiniTap(kctx, x, y); return; }
    if (state.mode === 'cleanup') { tapChore(x, y); return; }
    if (state.mode !== 'playing') return;
    // speech bubbles are drawn on top: a tap on one counts as tapping that guest
    for (const g of guests()) {
      const b = bubbleAnchor(g);
      if (!b || !inBubble(b, x, y)) continue;
      if (g.table != null && g.phase !== 'leaving') { tapTable(g.table); return; }
      if (doorQueue.includes(g.id)) {
        state.selectedGuest = state.selectedGuest === g.id ? null : g.id;
        sfx('tap');
        return;
      }
    }
    // any guest waiting in the door queue can be picked
    let pick: GuestInt | null = null, pd = Infinity;
    for (const g of queued()) {
      const dx = Math.abs(x - g.x);
      if (dx < 28 && y > g.y - 92 && y < g.y + 12 && dx < pd) { pd = dx; pick = g; }
    }
    if (pick) {
      state.selectedGuest = state.selectedGuest === pick.id ? null : pick.id;
      sfx('tap');
      return;
    }
    if (x >= DOOR.x && x <= DOOR.x + DOOR.w && y >= DOOR.y && y <= DOOR.y + DOOR.h) {
      const front = frontGuest();
      if (!front && secrets.secretTap(ctx, 'cafe', x, y)) return; // the door bell
      if (front) { state.selectedGuest = front.id; sfx('tap'); }
      else if (!state.doorOpen) { toast('Door is closed for today'); sfx('error'); }
      return;
    }
    if (x >= COUNTER.x - 8 && y >= MACHINE.y - 20 && y <= COUNTER.y + COUNTER.h + 14) {
      // nothing to pick up: the tap may be on the barista / menu board hotspot instead
      const idle = !neededFromCounter().length && !state.counter.brewing && !state.counter.queue.length && unneededOnTray() === 0;
      if (idle && secrets.secretTap(ctx, 'cafe', x, y)) return;
      tapCounter(); return;
    }
    const rp = DECOR_ANCHOR.back;
    if (progress.placed.back === 'record_player' && Math.abs(x - rp.x) < 42 && y > rp.y - 130 && y < rp.y + 6) {
      const music = !progress.settings.music;
      setSettings({ music });
      toast(music ? 'Music on' : 'Music off');
      sfx('tap');
      secretEv('record_toggle');
      return;
    }
    let best = -1, bd = TABLE_HIT_R + 8;
    for (const t of state.tables) {
      if (!t.unlocked) continue;
      const p = tablePoint(t.index);
      const d = Math.hypot(x - p.x, y - p.y);
      if (d < bd) { bd = d; best = t.index; }
    }
    if (best >= 0) { tapTable(best); return; }
    if (state.selectedGuest == null && secrets.secretTap(ctx, 'cafe', x, y)) return;
    state.selectedGuest = null;
  }

  /* ---------- hints ---------- */
  function tutorialHint(): GameState['hint'] {
    const tut = state.tutorial;
    const step = TUTORIAL_STEPS[tut.step];
    if (!step) return null;
    const text = step.how;
    const gs = guests();
    const busy = waiterBusy();
    switch (step.id) {
      case 'seat': {
        const g = frontGuest();
        if (!g) return { text, target: null };
        const free = state.tables.find(tableFree);
        if (state.selectedGuest === g.id && free) return { text, target: tablePoint(free.index) };
        return { text, target: { x: g.x, y: g.y - 40 } };
      }
      case 'take': {
        const g = gs.find((x) => x.phase === 'ordering' && x.table != null);
        return { text, target: g && !busy ? tablePoint(g.table!) : null };
      }
      case 'pickup':
        return { text, target: neededFromCounter().length && !busy ? { ...COUNTER_TAP } : null };
      case 'serve': {
        const g = gs.find((x) => x.phase === 'waiting' && x.table != null);
        return { text, target: g && !busy ? tablePoint(g.table!) : null };
      }
      case 'collect': {
        const t = state.tables.find((x) => x.coins > 0);
        return { text, target: t && !busy ? tablePoint(t.index) : null };
      }
    }
  }

  function computeHint(): GameState['hint'] {
    if (state.mode !== 'playing') return null;
    if (state.tutorial.active) return tutorialHint();
    return coachHint();
  }

  /** The first few days: a gentle "what now?" when something has been waiting a moment (Hints setting on). */
  function coachHint(): GameState['hint'] {
    if (!progress.settings.hints || state.dayStats.day > 3) return null;
    if (waiterBusy()) return null;
    const gs = guests();
    const w = state.waiter;
    const serve = gs.find((g) => g.phase === 'waiting' && g.table != null && !!g.order && w.tray.includes(g.order));
    if (serve) return { text: 'Tap the table to serve the order', target: tablePoint(serve.table!) };
    if (neededFromCounter().length && w.tray.length < trayCap()) return { text: 'Order ready! Tap the counter to pick it up', target: { ...COUNTER_TAP } };
    const ord = gs.find((g) => g.phase === 'ordering' && g.table != null && g.timer > 2.5);
    if (ord) return { text: 'Tap the table to take the order', target: tablePoint(ord.table!) };
    const front = frontGuest();
    const free = state.tables.find(tableFree);
    if (front && front.phase === 'door' && free && (front.timer > 2.5 || state.selectedGuest === front.id)) {
      if (state.selectedGuest === front.id) return { text: 'Now tap a free table', target: tablePoint(free.index) };
      return { text: 'A guest! Tap them, then a free table', target: { x: front.x, y: front.y - 40 } };
    }
    const tip = state.tables.find((t) => t.coins > 0 && t.guestId == null);
    if (tip) return { text: 'Tap the coins to collect the tip', target: tablePoint(tip.index) };
    return null;
  }

  /** At home (first week, Hints on): one short line about what is worth doing right now. */
  function homeHint(): GameState['hint'] {
    if (!progress.settings.hints || progress.day > 8) return null;
    const h = progress.home;
    if (state.homeBear.action !== null || state.homeBear.path.length) return null;
    const can = (id: HomeActionId) => home.canDoHomeAction(ctx, id).ok;
    const say = (text: string): GameState['hint'] => ({ text, target: null });
    if (h.meal) return say('Dinner is ready! Tap Eat');
    if (h.energy < 45 && can('bath')) return say('Tired paws? A warm bath gives energy');
    if (can('call_mom')) return say('Call Mom: it makes Mocha very happy');
    if (h.energy < 75 && can('cook')) return say('Hungry? Tap Cook (or Eat for a snack)');
    if (progress.konbiniOpen && Object.keys(h.pantry).length === 0) return say('The pantry is empty. Tap Shop to visit Hoshi Mart');
    if (can('save') && h.wallet >= 20) return say('Drop some pay in the jar for your dream (Save)');
    if (can('read')) return say('A quiet read in the armchair?');
    return say('All done? Tap Sleep to start the next day');
  }
  /* ---------- story ---------- */
  /** Where to go back to after a story that has no fixed follow-up (chapter stories etc.). */
  let storyReturn: { mode: GameState['mode']; scene: Scene } | null = null;
  /** Stories asked for while busy (café day running, popup open, another story): played at the next calm moment. */
  let pendingStories: StoryId[] = [];
  const CALM_MODES = new Set<GameState['mode']>(['dayEnd', 'home', 'konbini']);
  /** Pacing: seconds of calm since the last story / popup / open menu, and a rest after each story,
   *  so pictures and cards never come back to back. */
  let quietFor = 0;
  let storyRest = 0;
  const CHAPTER_QUIET = 1.2;
  const STORY_REST = 6;
  const storyExists = (id: StoryId) => Array.isArray(STORIES[id]) && STORIES[id].length > 0;

  /** Play a story now if nothing else is going on, else queue it. */
  function requestStory(id: StoryId) {
    if (!storyExists(id)) return;
    if (state.story?.id === id || pendingStories.includes(id)) return;
    if (state.mode === 'story' || state.popup || !CALM_MODES.has(state.mode)) { pendingStories.push(id); return; }
    playStory(id);
  }

  function flushStories() {
    if (!CALM_MODES.has(state.mode) || state.popup) return;
    while (pendingStories.length) {
      const id = pendingStories.shift()!;
      if (storyExists(id)) { playStory(id); return; }
    }
  }

  function playStory(id: StoryId) {
    if (state.mode !== 'story') storyReturn = { mode: state.mode, scene: state.scene };
    state.mode = 'story';
    state.story = { id, panel: 0 };
    state.hint = null;
    state.selectedGuest = null;
    // show the messy café behind the intro
    if (id === 'intro' && !progress.cleanupDone) state.chores = buildChores();
    sfx('page');
    emit({ type: 'progress' });
  }

  function finishStory() {
    const st = state.story;
    if (!st) return;
    state.story = null;
    if (!progress.storySeen.includes(st.id)) progress.storySeen.push(st.id);
    save();
    const ret = storyReturn;
    storyReturn = null;
    switch (st.id) {
      case 'intro': startCleanup(); break;
      case 'cleanup_done': startWorkDay(); break;
      case 'payday': state.mode = 'dayEnd'; break;
      case 'home_intro':
      case 'dream':
        state.mode = 'home';
        if (state.scene !== 'home') setScene('home');
        break;
      default: {
        const mode = ret && ret.mode !== 'story' && ret.mode !== 'paused' ? ret.mode : 'home';
        const scene: Scene = ret ? ret.scene : 'home';
        state.mode = mode;
        if (state.scene !== scene) setScene(scene);
      }
    }
    storyRest = STORY_REST;
    quietFor = 0;
    // a finished chapter's "complete" card follows its story
    try { prog.storyFinished(pctx, st.id); } catch (err) { console.error(err); }
    emit({ type: 'progress' });
    if (!state.popup) flushStories();
  }

  /** At a calm moment at home / in the shop, wrap up a chapter whose goal is met (story, then its card). */
  function chapterTick(dt: number) {
    if (state.mode === 'story' || state.popup || state.uiBusy) { quietFor = 0; return; }
    quietFor += dt;
    if (storyRest > 0) { storyRest -= dt; return; }
    if (quietFor < CHAPTER_QUIET) return;
    if (state.mode !== 'home' && state.mode !== 'konbini') return;
    if (state.mode === 'home' && (state.homeBear.action !== null)) return;
    if (pendingStories.length) { flushStories(); return; }
    try { if (prog.chapterReady(progress)) prog.tryChapter(pctx); } catch (err) { console.error(err); }
  }

  /* ---------- day cycle ---------- */
  function resetDay() {
    state.dayTime = 0;
    state.doorOpen = true;
    state.guests = [];
    doorQueue = [];
    state.waiter = newWaiter();
    state.counter = { queue: [], brewing: null, ready: [] };
    state.tables = makeTables();
    state.selectedGuest = null;
    state.effects = [];
    state.dayStats = emptyStats();
    state.hint = null;
    spawnTimer = 1.5;
    endGrace = 0;
  }

  function startWorkDay() {
    state.calendar = calendarInfo(now());
    state.theme = resolveTheme(progress.theme, now());
    resetDay();
    state.story = null;
    state.shootingStar = null;
    state.konbini = { basket: [], bear: home.newHomeBear() };
    state.chores = [];
    bonus = home.homeBonus(progress.home);
    home.startWorkDay(progress.home);
    state.tutorial = newTutorial();
    if (progress.day === 1 && !progress.tutorialDone) {
      state.tutorial.active = true;
      spawnGuest();
    }
    state.mode = 'playing';
    setScene('cafe');
    progEvent({ kind: 'dayStart' });
    checkSeason();
    const fest = state.calendar.today;
    if (fest) {
      const key = `fest:${fest}:${state.calendar.date.year}`; // once per festival per year
      if (!progress.secretCounters[key]) { progress.secretCounters[key] = 1; secretEv('festival_day'); }
    }
    state.hint = computeHint();
    save();
    emit({ type: 'progress' });
  }

  function checkSeason() {
    try { prog.checkSeasonEvents(pctx); } catch (err) { console.error(err); }
  }

  function endDay() {
    for (const t of state.tables) if (t.coins > 0) collectCoins(t.index);
    const s = state.dayStats;
    s.stars = computeStars(s.served, s.lost);
    s.salary = home.salaryFor(s.served, s.stars, s.day);
    progress.home.wallet += s.salary;
    // until Hoshi Mart opens, Button packs a little something so Mocha always has a bite at home
    if (!progress.konbiniOpen && s.served > 0) {
      s.treat = 'melon_bread';
      progress.home.pantry.melon_bread = (progress.home.pantry.melon_bread ?? 0) + 1;
    }
    state.lastDay = { ...s };
    state.mode = 'dayEnd';
    state.doorOpen = false;
    state.waiter = newWaiter();
    state.counter = { queue: [], brewing: null, ready: [] };
    state.selectedGuest = null;
    state.hint = null;
    state.tutorial.active = false;
    progress.day++;
    progress.totalServed += s.served;
    if (s.served > 0) progress.tutorialDone = true;
    save();
    if (s.stars === 3) secretEv('day_three_stars');
    if (progress.home.wallet >= 300) secretEv('rich_wallet');
    sfx('dayEnd');
    emit({ type: 'dayEnd', stats: { ...s } });
    progEvent({ kind: 'dayEnd' });
    // one thing at a time: the first payday, or else a chapter finished today (its story, then its card).
    // Anything more waits for a calm moment at home.
    if (!progress.storySeen.includes('payday')) playStory('payday');
    else { try { prog.tryChapter(pctx); } catch (err) { console.error(err); } }
    emit({ type: 'progress' });
  }

  function update(dt: number) {
    if (!(dt > 0)) return;
    state.time += dt;
    for (const e of state.effects) e.age += dt;
    state.effects = state.effects.filter((e) => e.age < e.life);
    try { secrets.updateSecrets(ctx, dt); } catch (err) { console.error(err); }
    chapterTick(dt);
    // (home.updateHome runs updateProgression itself)
    if (state.mode === 'home') {
      if (state.popup) return; // a card is up: the evening waits
      home.updateHome(ctx, dt);
      if (state.mode === 'home') state.hint = homeHint();
      return;
    }
    try { prog.updateProgression(pctx, dt); } catch (err) { console.error(err); }
    if (state.mode === 'konbini') { konbini.updateKonbini(kctx, dt); return; }
    if (state.mode === 'cleanup') {
      const w = state.waiter;
      if (w.path.length) moveAlong(w, w.path, waiterSpeed() * dt);
      return;
    }
    if (state.mode !== 'playing') return;
    // a gift card is up: the café holds its breath (nobody loses patience while you read it)
    if (state.popup) return;

    if (!state.tutorial.active) state.dayTime += dt; // the clock waits while learning
    if (state.doorOpen && state.dayTime >= state.dayLength) {
      state.doorOpen = false;
      // (the day bar shows "Closed"; no toast)
    }
    updateSpawn(dt);
    updateGuests(dt);
    updateCounter(dt);
    updateWaiter(dt);

    if (!state.doorOpen && state.guests.length === 0) {
      endGrace += dt;
      const coinsLeft = state.tables.some((t) => t.coins > 0);
      if ((!coinsLeft && endGrace >= 1) || endGrace >= 6) { endDay(); return; }
    }
    state.hint = computeHint();
  }

  /* ---------- shop ---------- */
  function buyUpgrade(id: UpgradeId): boolean {
    const def = upgradeDef(id);
    if (!def) return false;
    const lv = level(id);
    if (lv >= def.costs.length) { toast('Already at max level'); sfx('error'); return false; }
    const cost = def.costs[lv];
    if (progress.coins < cost) { toast('Not enough coins'); sfx('error'); return false; }
    progress.coins -= cost;
    progress.upgrades[id] = lv + 1;
    if (id === 'tables') for (const t of state.tables) t.unlocked = t.index < 3 + level('tables');
    save();
    sfx('buy');
    secretEv('bought_upgrade');
    emit({ type: 'progress' });
    if (id === 'table_style') emit({ type: 'decor' });
    return true;
  }

  function placeDecor(id: DecorId) {
    const def = decorDef(id);
    if (!def || !progress.ownedDecor.includes(id)) { sfx('error'); return; }
    progress.placed[def.slot] = id;
    save();
    emit({ type: 'progress' });
    emit({ type: 'decor' });
  }

  function buyDecor(id: DecorId): boolean {
    const def = decorDef(id);
    if (!def) return false;
    if (progress.ownedDecor.includes(id)) { placeDecor(id); return true; }
    if (progress.coins < def.cost) { toast('Not enough coins'); sfx('error'); return false; }
    progress.coins -= def.cost;
    progress.ownedDecor.push(id);
    progress.placed[def.slot] = id;
    addEffect('sparkle', 180, 300);
    save();
    sfx('buy');
    secretEv('bought_decor');
    emit({ type: 'progress' });
    emit({ type: 'decor' });
    return true;
  }

  function setTheme(theme: ThemeId | 'auto') {
    progress.theme = theme;
    state.theme = resolveTheme(theme, now());
    save();
    emit({ type: 'progress' });
    emit({ type: 'decor' });
  }

  function setSettings(patch: Partial<Settings>) {
    Object.assign(progress.settings, patch);
    if (!progress.settings.hints && state.mode === 'playing' && !state.tutorial.active) state.hint = null;
    save();
    emit({ type: 'progress' });
  }

  function toTitle() {
    resetDay();
    state.doorOpen = false;
    state.mode = 'title';
    state.story = null;
    state.chores = [];
    state.tutorial = newTutorial();
    state.popup = null;
    state.shootingStar = null;
    state.reaction = null;
    state.konbini = { basket: [], bear: home.newHomeBear() };
    storyReturn = null;
    pendingStories = [];
    prog.resetQueues();
    setScene('cafe');
  }

  /* ---------- places: home ⇄ konbini ---------- */
  function goTo(scene: 'home' | 'konbini') {
    if (scene === 'konbini') {
      if (state.mode !== 'home') return;
      if (!progress.konbiniOpen) { toast("The konbini isn't open yet"); sfx('error'); return; }
      if (state.homeBear.action !== null) { toast('Mocha is busy'); sfx('error'); return; }
      state.shootingStar = null;
      state.konbini = { basket: [], bear: home.newHomeBear() };
      state.mode = 'konbini';
      state.hint = null;
      getIssue(progress, state.calendar); // today's Gazette sale applies to prices
      konbini.enterKonbini(kctx);
      setScene('konbini');
      sfx('door');
      emit({ type: 'progress' });
      return;
    }
    if (state.mode !== 'konbini') return;
    state.konbini.basket = [];
    state.mode = 'home';
    home.enterHome(ctx);
    setScene('home');
    sfx('door');
    checkSeason();
    emit({ type: 'progress' });
  }

  /* ---------- popups ---------- */
  function dismissPopup() {
    if (!state.popup) return;
    state.popup = null;
    quietFor = 0;
    try { prog.nextPopup(pctx); } catch (err) { console.error(err); } // the next waiting card, if any
    emit({ type: 'progress' });
  }

  /* ---------- cooking / fire (home.ts) ---------- */
  function setFire(on: boolean) {
    if (state.mode !== 'home') return;
    if (home.setFire(ctx, on)) emit({ type: 'decor' });
  }

  function resetSave() {
    prog.resetQueues();
    state.popup = null;
    pendingStories = [];
    clearProgress(storage);
    progress = defaultProgress();
    state.progress = progress;
    state.theme = resolveTheme(progress.theme, now());
    state.lastDay = null;
    state.homeBear = home.newHomeBear();
    state.calendar = calendarInfo(now());
    toTitle();
    emit({ type: 'progress' });
    emit({ type: 'decor' });
  }

  // festival-day gifts / "coming soon" popups when the game opens
  checkSeason();

  const api: GameApi = {
    get state() { return state; },
    catalog: {
      menu: MENU, upgrades: UPGRADES, decor: DECOR, themes: THEMES,
      homeActions: home.HOME_ACTIONS, homeItems: home.HOME_ITEMS,
      ingredients: INGREDIENTS, snacks: SNACKS, dishes: DISHES, goods: GOODS,
      regulars: REGULARS, chapters: CHAPTERS, seasonEvents: SEASON_EVENTS, secrets: SECRETS,
    },
    subscribe(fn) { listeners.add(fn); return () => { listeners.delete(fn); }; },
    update,
    startDay() {
      state.calendar = calendarInfo(now());
      state.theme = resolveTheme(progress.theme, now());
      if (!progress.storySeen.includes('intro')) {
        resetDay();
        state.doorOpen = false;
        setScene('cafe');
        playStory('intro');
        return;
      }
      if (!progress.cleanupDone) { startCleanup(); return; }
      startWorkDay();
    },
    storyNext() {
      const st = state.story;
      if (state.mode !== 'story' || !st) return;
      st.panel++;
      if (st.panel >= STORIES[st.id].length) finishStory();
      else { sfx('page'); emit({ type: 'progress' }); }
    },
    storySkip() {
      if (state.mode !== 'story' || !state.story) return;
      finishStory();
    },
    goHome() {
      if (state.mode === 'home' || state.mode === 'konbini') return;
      state.hint = null;
      state.selectedGuest = null;
      state.mode = 'home';
      setScene('home');
      if (!progress.storySeen.includes('home_intro')) playStory('home_intro');
      // (home.enterHome sends the 'enterHome' progress event; stories it triggers wait behind home_intro)
      home.enterHome(ctx);
      checkSeason();
      state.hint = null;
      emit({ type: 'progress' });
    },
    homeAction: (id: HomeActionId) => home.homeAction(ctx, id),
    buyHomeItem: (id: HomeItemId) => home.buyHomeItem(ctx, id),
    placeHomeItem: (id: HomeItemId) => home.placeHomeItem(ctx, id),
    homeBonus: () => home.homeBonus(progress.home),
    canDoHomeAction: (id: HomeActionId) => home.canDoHomeAction(ctx, id),
    goTo,
    cookDish: (id: DishId) => state.mode === 'home' && home.cookDish(ctx, id),
    canCook: (id: DishId) => home.canCook(ctx, id),
    konbiniTake: (id: KonbiniStockId) => konbini.konbiniTake(kctx, id),
    konbiniRemove: (id: KonbiniStockId) => konbini.konbiniRemove(kctx, id),
    konbiniCheckout: () => konbini.konbiniCheckout(kctx),
    basketTotal: () => konbini.basketTotal(kctx),
    dismissPopup,
    currentGoal: () => prog.currentGoal(progress),
    friendLevel: (id: RegularId) => prog.friendLevel(progress, id),
    setFire,
    eatSnack: (id: SnackId) => state.mode === 'home' && home.eatSnack(ctx, id),
    journal: () => secrets.journalEntries(progress),
    newspaper: () => getIssue(progress, state.calendar),
    readNewspaper() {
      const issue = getIssue(progress, state.calendar);
      const first = markIssueRead(progress, issue);
      if (first) {
        progress.home.happiness = Math.max(0, Math.min(100, Math.round(progress.home.happiness + 2)));
        secretEv('read_newspaper');
      }
      save();
      emit({ type: 'progress' });
    },
    quitToTitle() {
      save();
      toTitle();
      emit({ type: 'progress' });
      emit({ type: 'decor' });
    },
    pause() {
      if (state.mode === 'playing' || state.mode === 'cleanup') { pausedFrom = state.mode; state.mode = 'paused'; }
      save();
    },
    resume() { if (state.mode === 'paused') state.mode = pausedFrom; },
    tapScene,
    buyUpgrade,
    upgradeLevel: level,
    buyDecor,
    placeDecor,
    setTheme,
    setSettings,
    charm,
    resetSave,
  };
  return api;
}
