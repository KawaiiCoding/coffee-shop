/* Core simulation: story flow, cleanup, guests, waiter, counter, day cycle, shop, home bridge, persistence. */
import type {
  Chore, ChoreKind, DayStats, DecorId, Effect, GameApi, GameEvent, GameState, Guest, HomeActionId, HomeItemId,
  MenuItemId, Settings, SfxName, StoryId, TableState, ThemeId, TutorialStepId, UpgradeId, Waiter, WaiterTask,
} from '../types';
import {
  AISLE_X, COUNTER, DECOR_ANCHOR, DOOR, DOOR_QUEUE, DOOR_SPOT, ENTRANCE, MACHINE, MESS_SPOTS, SEAT_OFFSET, TABLES,
  TABLE_HIT_R, WAITER_HOME,
} from '../layout';
import { STORIES, TUTORIAL_STEPS } from '../story';
import {
  DECOR, MENU, THEMES, UPGRADES, computeStars, decorDef, isFood, menuDef, pickOrder, resolveTheme, upgradeDef,
} from './catalog';
import { clearProgress, defaultProgress, loadProgress, saveProgress } from './save';
import { randomLook } from './looks';
import * as home from './home';
import type { HomeCtx } from './home';

type Pt = { x: number; y: number };

/** Guest with engine-internal fields (renderer may read them via cast). */
export interface GuestInt extends Guest {
  path: Pt[];
  facing: 1 | -1;
  walkPhase: number;
  tip: number;
}

export interface GameOptions {
  rng?: () => number;        // seeded RNG for tests
  now?: () => Date;          // clock for theme 'auto'
  dayLength?: number;        // seconds, default 120
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
const SPAWN_SLOW = [2.2, 1.7, 1.3];
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
  const now = opts.now ?? (() => new Date());
  const listeners = new Set<(e: GameEvent) => void>();
  const emit = (e: GameEvent) => {
    for (const fn of [...listeners]) { try { fn(e); } catch (err) { console.error(err); } }
  };
  const sfx = (name: SfxName) => emit({ type: 'sfx', name });
  const toast = (text: string) => emit({ type: 'toast', text });

  let progress = loadProgress(storage);
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
    story: null,
    chores: [],
    tutorial: newTutorial(),
    homeBear: home.newHomeBear(),
    progress,
    theme: resolveTheme(progress.theme, now()),
    dayTime: 0,
    dayLength: opts.dayLength ?? 120,
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
    const base = 7 + rng() * 3;
    const dayMul = Math.max(0.65, 1 - 0.03 * (progress.day - 1));
    return ((base * dayMul) / (1 + charm() * 0.02)) * (SPAWN_SLOW[slowIdx()] ?? 1);
  };

  const addEffect = (kind: Effect['kind'], x: number, y: number, text?: string) => {
    const life = kind === 'sparkle' ? 0.8 : kind === 'broom' ? 0.9 : 1.2;
    const e: Effect = { id: nextEffectId++, kind, x, y, age: 0, life };
    if (text !== undefined) e.text = text;
    state.effects.push(e);
  };

  /* ---------- home bridge ---------- */
  const ctx: HomeCtx = {
    get state() { return state; },
    get progress() { return progress; },
    emit,
    save,
    onSleep: () => startWorkDay(),
    playStory: (id: StoryId) => playStory(id),
  };

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
      toast("You've got it! More guests are coming.");
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
    const g: GuestInt = {
      id: nextGuestId++, look: randomLook(rng, state.theme), phase: 'entering', table: null,
      x: from.x, y: from.y, patience: 1, order: null, timer: 0, mood: 'calm', happy: false,
      path: route(from, DOOR_QUEUE[slot]), facing: 1, walkPhase: 0, tip: 0,
    };
    state.guests.push(g);
    doorQueue.push(g.id);
    sfx('bell');
  }

  function leavePath(g: GuestInt): Pt[] {
    return [...route(g, DOOR_SPOT), { x: ENTRANCE.x, y: ENTRANCE.y }];
  }

  function leaveCross(g: GuestInt) {
    const wasWaiting = g.phase === 'waiting';
    g.phase = 'leaving'; g.timer = 0; g.happy = false; g.mood = 'cross';
    state.dayStats.lost++;
    sfx('angry');
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
            g.order = state.tutorial.active ? 'latte' : pickOrder(rng, state.theme, level);
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
    state.scene = 'cafe';
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
        if (placeHit) { toast('Clean up the mess first'); sfx('error'); }
      }
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

  function tapScene(x: number, y: number) {
    if (state.mode === 'home') { home.homeTap(ctx, x, y); return; }
    if (state.mode === 'cleanup') { tapChore(x, y); return; }
    if (state.mode !== 'playing') return;
    // any guest waiting in the door queue can be picked
    let pick: GuestInt | null = null, pd = Infinity;
    for (const g of queued()) {
      const dx = Math.abs(x - g.x);
      if (dx < 26 && y > g.y - 88 && y < g.y + 10 && dx < pd) { pd = dx; pick = g; }
    }
    if (pick) {
      state.selectedGuest = state.selectedGuest === pick.id ? null : pick.id;
      sfx('tap');
      return;
    }
    if (x >= DOOR.x && x <= DOOR.x + DOOR.w && y >= DOOR.y && y <= DOOR.y + DOOR.h) {
      const front = frontGuest();
      if (front) { state.selectedGuest = front.id; sfx('tap'); }
      else if (!state.doorOpen) { toast('Door is closed for today'); sfx('error'); }
      return;
    }
    if (x >= COUNTER.x - 8 && y >= MACHINE.y - 20 && y <= COUNTER.y + COUNTER.h + 14) { tapCounter(); return; }
    const rp = DECOR_ANCHOR.back;
    if (progress.placed.back === 'record_player' && Math.abs(x - rp.x) < 42 && y > rp.y - 130 && y < rp.y + 6) {
      const music = !progress.settings.music;
      setSettings({ music });
      toast(music ? 'Music on' : 'Music off');
      sfx('tap');
      return;
    }
    let best = -1, bd = TABLE_HIT_R;
    for (const t of state.tables) {
      if (!t.unlocked) continue;
      const p = tablePoint(t.index);
      const d = Math.hypot(x - p.x, y - p.y);
      if (d < bd) { bd = d; best = t.index; }
    }
    if (best >= 0) { tapTable(best); return; }
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
    if (!progress.settings.hints) return null;
    const w = state.waiter;
    const gs = guests();
    if (waiterBusy()) return { text: 'On the way…', target: null };
    const serveG = gs.find((g) => g.phase === 'waiting' && g.order && w.tray.includes(g.order));
    if (serveG) return { text: 'Tap the table to serve', target: tablePoint(serveG.table!) };
    if (neededFromCounter().length && (w.tray.length < trayCap() || unneededOnTray() > 0)) {
      return { text: 'Tap the counter to pick up', target: { ...COUNTER_TAP } };
    }
    const ord = gs.find((g) => g.phase === 'ordering');
    if (ord) return { text: 'Tap the table to take the order', target: tablePoint(ord.table!) };
    const front = frontGuest();
    if (front) {
      const free = state.tables.find(tableFree);
      if (free) {
        const sel = state.selectedGuest != null && doorQueue.includes(state.selectedGuest);
        return sel
          ? { text: 'Tap a free table', target: tablePoint(free.index) }
          : { text: 'Tap the guest at the door', target: { x: front.x, y: front.y - 40 } };
      }
    }
    const coins = state.tables.find((t) => t.coins > 0);
    if (coins) return { text: 'Tap the coins', target: tablePoint(coins.index) };
    if (gs.some((g) => g.phase === 'waiting')) return { text: 'The barista is making it…', target: null };
    if (gs.some((g) => g.phase === 'eating')) return { text: 'Enjoying their treat…', target: null };
    if (gs.some((g) => g.phase === 'reading')) return { text: 'Reading the menu…', target: null };
    if (!state.doorOpen) return { text: 'Closing time…', target: null };
    return { text: 'Waiting for the next guest…', target: null };
  }

  /* ---------- story ---------- */
  function playStory(id: StoryId) {
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
    switch (st.id) {
      case 'intro': startCleanup(); break;
      case 'cleanup_done': startWorkDay(); break;
      case 'payday': state.mode = 'dayEnd'; break;
      case 'home_intro':
      case 'dream': state.scene = 'home'; state.mode = 'home'; break;
    }
    emit({ type: 'progress' });
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
    state.theme = resolveTheme(progress.theme, now());
    resetDay();
    state.scene = 'cafe';
    state.story = null;
    state.chores = [];
    bonus = home.homeBonus(progress.home);
    home.startWorkDay(progress.home);
    state.tutorial = newTutorial();
    if (progress.day === 1 && !progress.tutorialDone) {
      state.tutorial.active = true;
      spawnGuest();
    }
    state.mode = 'playing';
    state.hint = computeHint();
    save();
    emit({ type: 'decor' });
    emit({ type: 'progress' });
  }

  function endDay() {
    for (const t of state.tables) if (t.coins > 0) collectCoins(t.index);
    const s = state.dayStats;
    s.stars = computeStars(s.served, s.lost);
    s.salary = home.salaryFor(s.served, s.stars, s.day);
    progress.home.wallet += s.salary;
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
    sfx('dayEnd');
    emit({ type: 'dayEnd', stats: { ...s } });
    emit({ type: 'progress' });
    if (!progress.storySeen.includes('payday')) playStory('payday');
  }

  function update(dt: number) {
    if (!(dt > 0)) return;
    state.time += dt;
    for (const e of state.effects) e.age += dt;
    state.effects = state.effects.filter((e) => e.age < e.life);
    if (state.mode === 'home') { home.updateHome(ctx, dt); return; }
    if (state.mode === 'cleanup') {
      const w = state.waiter;
      if (w.path.length) moveAlong(w, w.path, waiterSpeed() * dt);
      return;
    }
    if (state.mode !== 'playing') return;

    if (!state.tutorial.active) state.dayTime += dt; // the clock waits while learning
    if (state.doorOpen && state.dayTime >= state.dayLength) {
      state.doorOpen = false;
      toast('Closing time! The door is closed for today');
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
    state.scene = 'cafe';
    state.story = null;
    state.chores = [];
    state.tutorial = newTutorial();
  }

  function resetSave() {
    clearProgress(storage);
    progress = defaultProgress();
    state.progress = progress;
    state.theme = resolveTheme(progress.theme, now());
    state.lastDay = null;
    state.homeBear = home.newHomeBear();
    toTitle();
    emit({ type: 'progress' });
    emit({ type: 'decor' });
  }

  const api: GameApi = {
    get state() { return state; },
    catalog: {
      menu: MENU, upgrades: UPGRADES, decor: DECOR, themes: THEMES,
      homeActions: home.HOME_ACTIONS, homeItems: home.HOME_ITEMS,
    },
    subscribe(fn) { listeners.add(fn); return () => { listeners.delete(fn); }; },
    update,
    startDay() {
      state.theme = resolveTheme(progress.theme, now());
      if (!progress.storySeen.includes('intro')) {
        resetDay();
        state.doorOpen = false;
        state.scene = 'cafe';
        playStory('intro');
        emit({ type: 'decor' });
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
      state.scene = 'home';
      state.hint = null;
      state.selectedGuest = null;
      home.enterHome(ctx);
      emit({ type: 'decor' });
      if (!progress.storySeen.includes('home_intro')) playStory('home_intro');
      else { state.mode = 'home'; emit({ type: 'progress' }); }
    },
    homeAction: (id: HomeActionId) => home.homeAction(ctx, id),
    buyHomeItem: (id: HomeItemId) => home.buyHomeItem(ctx, id),
    placeHomeItem: (id: HomeItemId) => home.placeHomeItem(ctx, id),
    homeBonus: () => home.homeBonus(progress.home),
    canDoHomeAction: (id: HomeActionId) => home.canDoHomeAction(ctx, id),
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
