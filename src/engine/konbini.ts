/* =====================================================================
   KONBINI SIMULATION — "Hoshi Mart", a cosy little corner shop.
   game.ts calls these; keep every export + signature.
   Tap a product → Mocha walks over, hops, and it flies into the basket.
   Tap the counter / clerk → walk to the till and pay from the wallet.
   Tap the door → leave (ctx.onLeave()).
   ===================================================================== */
import type {
  CharacterLook, Effect, GameEvent, GameState, HomeBear, IngredientId, KonbiniGoodId, KonbiniStockId, Progress, SecretEventId, SnackId, StoryId,
} from '../types';
import {
  KONBINI_AISLE, KONBINI_BROWSE, KONBINI_CLERK, KONBINI_COFFEE, KONBINI_COUNTER, KONBINI_DOOR, KONBINI_ENTER, KONBINI_PAY_SPOT,
  KONBINI_SLOTS, KONBINI_TABLE,
} from '../layout';
import { GOODS, INGREDIENTS, REGULARS, SNACKS } from '../content/progression';
import { progressEvent } from './progression';
import { todaySale } from './news';
import { randomLook, regularLook } from './looks';

export interface KonbiniCtx {
  state: GameState; progress: Progress; emit(e: GameEvent): void; save(): void; onCheckout(): void; onLeave(): void;
  /** Optional: lets chapter completions triggered by a checkout play their story (passed on to progressEvent). */
  playStory?(id: StoryId): void;
  /** Optional journal hooks (game.ts wires them to the secrets engine). */
  secretEvent?(ev: SecretEventId): void;
  secretTap?(x: number, y: number): boolean;
}

type Pt = { x: number; y: number };

/* ---------- catalogue ---------- */
const ALL_INGREDIENTS: IngredientId[] = ['rice', 'egg', 'milk', 'flour', 'honey', 'curry_roux', 'noodles', 'veggies', 'tofu', 'strawberry', 'bread', 'miso'];
const ALL_SNACKS: SnackId[] = ['melon_bread', 'pudding', 'canned_coffee', 'dango', 'onigiri_pack', 'ice_cream'];
const ALL_GOODS: KonbiniGoodId[] = ['book', 'magazine', 'flowers', 'postcard'];
/** Used only while the content catalogues are still empty. */
const FALLBACK_PRICE = 4;

const ingredientDef = (id: KonbiniStockId) => INGREDIENTS.find((d) => d.id === id);
const snackDef = (id: KonbiniStockId) => SNACKS.find((d) => d.id === id);
const goodDef = (id: KonbiniStockId) => GOODS.find((d) => d.id === id);
const isIngredient = (id: KonbiniStockId): id is IngredientId => (ALL_INGREDIENTS as string[]).includes(id);
const isSnack = (id: KonbiniStockId): id is SnackId => (ALL_SNACKS as string[]).includes(id);
const isGood = (id: KonbiniStockId): id is KonbiniGoodId => (ALL_GOODS as string[]).includes(id);
const inCatalog = (id: KonbiniStockId) => !!(ingredientDef(id) || snackDef(id) || goodDef(id));

export function priceOf(id: KonbiniStockId): number {
  const d = ingredientDef(id) ?? snackDef(id) ?? goodDef(id);
  const base = d ? Math.max(0, Math.round(d.price)) : FALLBACK_PRICE;
  const sale = todaySale(); // today's Gazette deal
  if (sale && sale.item === id && base > 0) return Math.max(1, Math.round(base * (1 - sale.percent / 100)));
  return base;
}

/* ---------- shelf layout ---------- */
/** The dream layout, one product per KONBINI_SLOTS index (26): every one of the 22 products at least once,
 *  a few cute repeats only to fill. Order = layout.ts slot order. */
const DESIRED: KonbiniStockId[] = [
  // wall shelves (3 rows x 3): goods on top, fresh bread & fruit, then pantry repeats
  'book', 'flowers', 'magazine',
  'bread', 'strawberry', 'veggies',
  'noodles', 'honey', 'rice',
  // drinks fridge (2x2)
  'milk', 'canned_coffee',
  'egg', 'tofu',
  // middle aisle gondola (2 boards x 4)
  'rice', 'flour', 'noodles', 'curry_roux',
  'miso', 'honey', 'magazine', 'postcard',
  // snack table
  'melon_bread', 'dango', 'onigiri_pack',
  // case on the counter
  'pudding', 'ice_cream',
];
/** Every product the shop can carry (fallback order for refilling gaps). */
const PRIORITY: KonbiniStockId[] = [...ALL_INGREDIENTS, 'book', ...ALL_SNACKS, 'flowers', 'magazine', 'postcard'];

let layoutCache: { key: string; slots: (KonbiniStockId | null)[] } | null = null;

/** Item shown in each KONBINI_SLOTS index (null = empty slot). */
export function stockLayout(): (KonbiniStockId | null)[] {
  const key = `${INGREDIENTS.length}:${SNACKS.length}:${GOODS.length}:${KONBINI_SLOTS.length}`;
  if (layoutCache && layoutCache.key === key) return layoutCache.slots;

  let avail = PRIORITY.filter(inCatalog);
  if (avail.length === 0) avail = PRIORITY.slice(); // catalogues not filled yet: show everything
  const ok = (id: KonbiniStockId | null | undefined): id is KonbiniStockId => !!id && avail.includes(id);

  // 1) the dream layout, minus anything not in the catalogue
  const slots: (KonbiniStockId | null)[] = KONBINI_SLOTS.map((_, i) => (ok(DESIRED[i]) ? DESIRED[i] : null));
  const count = (id: KonbiniStockId) => slots.filter((x) => x === id).length;
  // 2) any available product that isn't shown yet takes an empty slot, else replaces a repeat
  for (const id of avail) {
    if (count(id)) continue;
    let i = slots.indexOf(null);
    if (i < 0) i = slots.findIndex((x, k) => !!x && count(x) > 1 && slots.indexOf(x) !== k);
    if (i < 0) break; // more products than slots
    slots[i] = id;
  }
  // 3) still-empty slots repeat their neighbours (or anything)
  slots.forEach((x, i) => {
    if (x) return;
    const near = slots[i - 1] ?? slots[i + 1] ?? avail[i % avail.length];
    slots[i] = near ?? null;
  });
  layoutCache = { key, slots };
  return slots;
}

/* ---------- live animation state (module-level: one konbini) ---------- */
interface FlyItem { id: KonbiniStockId; from: Pt; age: number; life: number }
interface Anim {
  queue: { slot: number; id: KonbiniStockId }[]; // products still to fetch (first = the one being walked to)
  walking: 'take' | 'pay' | 'free' | null;       // what the current path is for
  hop: number;                                   // seconds left of the pick-up hop (0 = none)
  hopSlot: number;
  checkoutPending: boolean;
  fly: FlyItem[];
  greet: number;                                 // seconds left of the clerk's welcome wave
  thanks: number;                                // seconds left of the clerk's thank-you bow
  bubble: ClerkBubble | null;                    // the clerk's speech bubble
}
interface ClerkBubble { text: string; age: number; life: number; small: boolean }
const anim: Anim = { queue: [], walking: null, hop: 0, hopSlot: -1, checkoutPending: false, fly: [], greet: 0, thanks: 0, bubble: null };

/* ---------- other shoppers (NPCs) ---------- */
type Walker = Pick<HomeBear, 'x' | 'y' | 'facing' | 'walkPhase' | 'path'>;
interface Shopper extends Walker {
  look: CharacterLook;
  basket: boolean;                       // carries a little basket
  phase: 'in' | 'walk' | 'look' | 'counter' | 'leave' | 'out';
  timer: number;                         // seconds left of the current pause / fade
  alpha: number;                         // 0..1 fade at the door
  stops: number;                         // shelves still to browse before heading off
  target: number;                        // KONBINI_BROWSE index being walked to / stood at (-1 = none)
  thought: KonbiniStockId | null;        // product in the little thought bubble
  thoughtAge: number;
  greeted: boolean;
}
let shoppers: Shopper[] = [];
let spawnTimer = 0;
const MAX_SHOPPERS = 2;
const NPC_SPEED = 64;
const NPC_FADE = 0.45;
/** Where an NPC waits at the till (right of the bear's pay spot). */
const NPC_PAY = { x: 316, y: 552 };

export const HOP_TIME = 0.4;
const FLY_TIME = 0.45;
const MAX_BASKET = 12;
const WALK_SPEED = 120;
const TAP_RADIUS = 26;

/** Read-only view for render-konbini.ts. */
export function konbiniAnim(): {
  targetSlot: number; hopT: number; hopSlot: number; fly: { id: KonbiniStockId; from: Pt; t: number }[];
  greeting: boolean; thanking: boolean; paying: boolean;
  /** Clerk speech bubble (t = 0..1 through its life). */
  bubble: { text: string; t: number; age: number; small: boolean } | null;
  /** Other shoppers, for y-sorting with the bear. */
  shoppers: { look: CharacterLook; x: number; y: number; facing: 1 | -1; walkPhase: number; walking: boolean; basket: boolean;
    alpha: number; thought: KonbiniStockId | null; thoughtAge: number }[];
} {
  return {
    targetSlot: anim.queue.length ? anim.queue[0].slot : -1,
    hopT: anim.hop > 0 ? 1 - anim.hop / HOP_TIME : 0,
    hopSlot: anim.hop > 0 ? anim.hopSlot : -1,
    fly: anim.fly.map((f) => ({ id: f.id, from: f.from, t: Math.min(1, f.age / f.life) })),
    greeting: anim.greet > 0, thanking: anim.thanks > 0,
    paying: anim.walking === 'pay' || anim.checkoutPending,
    bubble: anim.bubble ? { text: anim.bubble.text, t: Math.min(1, anim.bubble.age / anim.bubble.life), age: anim.bubble.age, small: anim.bubble.small } : null,
    shoppers: shoppers.map((n) => ({
      look: n.look, x: n.x, y: n.y, facing: n.facing, walkPhase: n.walkPhase, walking: n.path.length > 0, basket: n.basket,
      alpha: n.alpha, thought: n.thought, thoughtAge: n.thoughtAge,
    })),
  };
}

/** Where the basket is relative to the bear's feet (the tiny stack + fly target). */
export function basketPos(b: HomeBear): Pt { return { x: b.x + b.facing * 6, y: b.y - 30 }; }

let nextEffectId = 2_000_000; // separate range from café (0..) and home (1e6..) effect ids
function addEffect(state: GameState, kind: Effect['kind'], x: number, y: number, text?: string) {
  const e: Effect = { id: nextEffectId++, kind, x, y, age: 0, life: kind === 'sparkle' ? 0.8 : 1.4 };
  if (text !== undefined) e.text = text;
  state.effects.push(e);
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const basketCount = (ctx: KonbiniCtx) => ctx.state.konbini.basket.reduce((n, e) => n + e.qty, 0);

/* ---------- walking (smooth curved routes around the aisle gondola, the table + the raised counter) ---------- */
const FLOOR = { minX: 22, maxX: 340, minY: 288, maxY: 624 };
/** 0 = back strip in front of the wall shelves / fridge (+ the corridor right of the gondola),
 *  1 = the strip between the gondola and the snack table, 2 = the front floor (table, hot case, till). */
const zoneOf = (p: Pt) => (p.y < KONBINI_AISLE.y || (p.y < 420 && p.x > KONBINI_AISLE.x + KONBINI_AISLE.w) ? 0 : p.y < 462 ? 1 : 2);
/** Points walkers pass through when crossing from zone i to zone i+1:
 *  down the corridor right of the gondola (left of the coffee machine), then the gap between the table and the counter. */
const PORTALS: Pt[][] = [
  [{ x: 252, y: 338 }, { x: 244, y: 440 }],
  [{ x: 219, y: 462 }, { x: 219, y: 534 }],
];

function waypoints(from: Pt, to: Pt): Pt[] {
  const za = zoneOf(from), zb = zoneOf(to);
  const pts: Pt[] = [from];
  if (za < zb) for (let z = za; z < zb; z++) pts.push(...PORTALS[z]);
  else if (za > zb) for (let z = za - 1; z >= zb; z--) pts.push(...PORTALS[z].slice().reverse());
  pts.push(to);
  // drop portal points the bear is already practically standing on
  return pts.filter((p, i) => i === 0 || i === pts.length - 1 || Math.hypot(p.x - from.x, p.y - from.y) > 14);
}

/** Catmull-Rom through the waypoints, sampled every ~13 units (plus a soft bow when walking straight). */
function route(from: Pt, to: Pt): Pt[] {
  if (Math.hypot(to.x - from.x, to.y - from.y) < 4) return [{ x: to.x, y: to.y }];
  let w = waypoints(from, to);
  if (w.length === 2) {
    // a gentle curve instead of a ruler-straight line
    const mx = (from.x + to.x) / 2, my = (from.y + to.y) / 2;
    const dx = to.x - from.x, dy = to.y - from.y, d = Math.hypot(dx, dy);
    const bow = Math.min(18, d * 0.12);
    w = [from, { x: mx - (dy / d) * bow, y: clamp(my + (dx / d) * bow * 0.5, FLOOR.minY, FLOOR.maxY) }, to];
  }
  const out: Pt[] = [];
  for (let i = 0; i < w.length - 1; i++) {
    const p0 = w[Math.max(0, i - 1)], p1 = w[i], p2 = w[i + 1], p3 = w[Math.min(w.length - 1, i + 2)];
    const n = Math.max(2, Math.round(Math.hypot(p2.x - p1.x, p2.y - p1.y) / 13));
    for (let k = 1; k <= n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      const c = (a: number, b: number, c2: number, d: number) =>
        0.5 * (2 * b + (-a + c2) * t + (2 * a - 5 * b + 4 * c2 - d) * t2 + (-a + 3 * b - 3 * c2 + d) * t3);
      out.push({ x: c(p0.x, p1.x, p2.x, p3.x), y: c(p0.y, p1.y, p2.y, p3.y) });
    }
  }
  out[out.length - 1] = { x: to.x, y: to.y };
  return out;
}

/** Moves the bear along its path by dist (easing out near the end); true when finished. */
function moveAlong(b: Walker, dist: number): boolean {
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

const walkTo = (b: Walker, to: Pt) => { b.path = route({ x: b.x, y: b.y }, to); };
const busy = () => anim.walking === 'take' || anim.walking === 'pay' || anim.hop > 0;

/* ---------- entering ---------- */
export function enterKonbini(ctx: KonbiniCtx): void {
  const k = ctx.state.konbini;
  const b = k.bear;
  b.x = KONBINI_ENTER.x; b.y = KONBINI_ENTER.y; b.facing = 1; b.walkPhase = 0;
  b.action = null; b.actionTimer = 0;
  k.basket = [];
  anim.queue = []; anim.fly = []; anim.hop = 0; anim.hopSlot = -1; anim.checkoutPending = false; anim.thanks = 0;
  anim.walking = 'free';
  walkTo(b, { x: KONBINI_ENTER.x + 52, y: KONBINI_ENTER.y + 26 }); // a couple of steps inside
  anim.greet = 2.5;
  say('いらっしゃいませ！', 2.5, false);
  shoppers = [];
  spawnTimer = 2.5 + Math.random() * 2.5; // the first other shopper wanders in a little later
  ctx.emit({ type: 'sfx', name: 'chime' });
  ctx.emit({ type: 'sfx', name: 'irasshaimase' });
  // (the clerk's いらっしゃいませ bubble greets the player; no toast)
  ctx.emit({ type: 'progress' });
}

/** The clerk speaks (a big bubble always wins over a small NPC greeting). */
function say(text: string, life: number, small: boolean): boolean {
  if (small && anim.bubble && !anim.bubble.small && anim.bubble.age < anim.bubble.life) return false;
  anim.bubble = { text, age: 0, life, small };
  return true;
}

/* ---------- other shoppers ---------- */
function shopperLook(ctx: KonbiniCtx): CharacterLook {
  const theme = ctx.state.theme;
  // friends the bear has already met sometimes pop in too
  const met = REGULARS.filter((r) => ctx.progress.friendship[r.id] !== undefined
    && !shoppers.some((n) => n.look.species === r.look.species && n.look.color === r.look.color));
  if (met.length && Math.random() < 0.4) return regularLook(met[Math.floor(Math.random() * met.length)].look, theme);
  return randomLook(Math.random, theme);
}

function spawnShopper(ctx: KonbiniCtx) {
  const n: Shopper = {
    look: shopperLook(ctx), basket: Math.random() < 0.55,
    x: KONBINI_ENTER.x, y: KONBINI_ENTER.y - 6, facing: 1, walkPhase: 0, path: [],
    phase: 'in', timer: NPC_FADE, alpha: 0, stops: 2 + Math.floor(Math.random() * 3), target: -1,
    thought: null, thoughtAge: 0, greeted: false,
  };
  shoppers.push(n); // quietly: only the bear's own entrance plays the chime + voice
}

/** Next shelf to browse: one nobody else (bear included) is standing at, preferably not the current one. */
function pickBrowse(ctx: KonbiniCtx, n: Shopper): number {
  const b = ctx.state.konbini.bear;
  const free = KONBINI_BROWSE.map((_, i) => i).filter((i) => {
    if (i === n.target) return false;
    const p = KONBINI_BROWSE[i];
    if (shoppers.some((o) => o !== n && o.target === i)) return false;
    return Math.hypot(p.x - b.x, p.y - b.y) > 30;
  });
  const pool = free.length ? free : KONBINI_BROWSE.map((_, i) => i).filter((i) => i !== n.target);
  return pool[Math.floor(Math.random() * pool.length)] ?? 0;
}

/** A product on a shelf near a browse point (for the thought bubble), and which way to face it. */
function productNear(p: Pt): { id: KonbiniStockId | null; x: number } {
  const layout = stockLayout();
  const near = KONBINI_SLOTS.map((sl, i) => ({ i, d: Math.hypot(sl.stand.x - p.x, sl.stand.y - p.y), x: sl.x }))
    .filter((c) => layout[c.i] && c.d < 60);
  if (!near.length) return { id: null, x: p.x };
  const c = near[Math.floor(Math.random() * near.length)];
  return { id: layout[c.i], x: c.x };
}

const jitter = (p: Pt, r: number): Pt => ({
  x: clamp(p.x + (Math.random() * 2 - 1) * r, FLOOR.minX, FLOOR.maxX), y: clamp(p.y + (Math.random() * 2 - 1) * r * 0.4, FLOOR.minY, FLOOR.maxY),
});

function nextErrand(ctx: KonbiniCtx, n: Shopper) {
  n.thought = null;
  if (n.stops > 0) {
    n.stops -= 1;
    n.target = pickBrowse(ctx, n);
    n.phase = 'walk';
    walkTo(n, jitter(KONBINI_BROWSE[n.target], 8));
  } else if (n.phase !== 'counter' && Math.random() < 0.55) {
    n.target = -1;
    n.phase = 'counter';
    n.timer = -1; // walking there
    walkTo(n, NPC_PAY);
  } else {
    n.target = -1;
    n.phase = 'leave';
    walkTo(n, { x: KONBINI_ENTER.x + 4, y: KONBINI_ENTER.y + 4 });
  }
}

function updateShoppers(ctx: KonbiniCtx, dt: number) {
  spawnTimer -= dt;
  if (spawnTimer <= 0) {
    if (shoppers.length < MAX_SHOPPERS) spawnShopper(ctx);
    spawnTimer = 7 + Math.random() * 9;
  }
  for (const n of shoppers) {
    if (n.thought) n.thoughtAge += dt;
    switch (n.phase) {
      case 'in':
        n.timer -= dt;
        n.alpha = clamp(1 - n.timer / NPC_FADE, 0, 1);
        if (!n.greeted && n.alpha > 0.5) { say('いらっしゃいませ♪', 1.6, true); n.greeted = true; }
        if (n.timer <= 0) { n.alpha = 1; nextErrand(ctx, n); }
        break;
      case 'walk':
        if (moveAlong(n, NPC_SPEED * dt)) {
          const near = productNear(KONBINI_BROWSE[n.target]);
          n.thought = near.id; n.thoughtAge = 0;
          if (Math.abs(near.x - n.x) > 3) n.facing = near.x > n.x ? 1 : -1;
          n.phase = 'look';
          n.timer = 1.8 + Math.random() * 2.2;
        }
        break;
      case 'look':
        n.timer -= dt;
        if (n.timer <= 0) nextErrand(ctx, n);
        break;
      case 'counter':
        if (n.timer < 0) {
          if (moveAlong(n, NPC_SPEED * dt)) {
            n.timer = 1.6;
            n.facing = 1;
          }
        } else {
          n.timer -= dt;
          if (n.timer <= 0) { say('ありがとうございました♪', 1.6, true); n.basket = false; nextErrand(ctx, n); }
        }
        break;
      case 'leave':
        if (moveAlong(n, NPC_SPEED * dt)) { n.phase = 'out'; n.timer = NPC_FADE; n.path = [{ x: KONBINI_ENTER.x, y: KONBINI_ENTER.y - 10 }]; }
        break;
      case 'out':
        moveAlong(n, 20 * dt);
        n.timer -= dt;
        n.alpha = clamp(n.timer / NPC_FADE, 0, 1);
        break;
    }
  }
  shoppers = shoppers.filter((n) => !(n.phase === 'out' && n.timer <= 0));
}

/* ---------- basket ---------- */
function nearestSlotOf(b: HomeBear, id: KonbiniStockId): number {
  const layout = stockLayout();
  let best = -1, bestD = Infinity;
  layout.forEach((sid, i) => {
    if (sid !== id) return;
    const s = KONBINI_SLOTS[i].stand;
    const d = Math.hypot(s.x - b.x, s.y - b.y);
    if (d < bestD) { bestD = d; best = i; }
  });
  return best;
}

function startNext(ctx: KonbiniCtx) {
  const b = ctx.state.konbini.bear;
  if (anim.queue.length) {
    anim.walking = 'take';
    walkTo(b, KONBINI_SLOTS[anim.queue[0].slot].stand);
  } else if (anim.checkoutPending) {
    anim.walking = 'pay';
    walkTo(b, KONBINI_PAY_SPOT);
  } else {
    anim.walking = null;
  }
}

/** Queue a product: the bear walks to its shelf, hops, and it lands in the basket. */
export function konbiniTake(ctx: KonbiniCtx, id: KonbiniStockId): boolean {
  const b = ctx.state.konbini.bear;
  const slot = nearestSlotOf(b, id);
  if (slot < 0) return false;
  if (basketCount(ctx) + anim.queue.length >= MAX_BASKET) {
    ctx.emit({ type: 'sfx', name: 'error' });
    ctx.emit({ type: 'toast', text: 'The basket is full!' });
    return false;
  }
  anim.queue.push({ slot, id });
  ctx.emit({ type: 'sfx', name: 'tap' });
  if (!busy()) startNext(ctx);
  return true;
}

export function konbiniRemove(ctx: KonbiniCtx, id: KonbiniStockId): void {
  const basket = ctx.state.konbini.basket;
  const i = basket.findIndex((e) => e.id === id);
  if (i < 0) return;
  basket[i].qty -= 1;
  if (basket[i].qty <= 0) basket.splice(i, 1);
  ctx.emit({ type: 'sfx', name: 'tap' });
  ctx.emit({ type: 'progress' });
}

export function basketTotal(ctx: KonbiniCtx): number {
  return ctx.state.konbini.basket.reduce((sum, e) => sum + priceOf(e.id) * e.qty, 0);
}

function putInBasket(ctx: KonbiniCtx, id: KonbiniStockId) {
  const basket = ctx.state.konbini.basket;
  const e = basket.find((x) => x.id === id);
  if (e) e.qty += 1; else basket.push({ id, qty: 1 });
  ctx.emit({ type: 'progress' });
}

/* ---------- paying ---------- */
/** Walk to the till and pay (after any products still being fetched). False if nothing to buy / can't afford. */
export function konbiniCheckout(ctx: KonbiniCtx): boolean {
  const queuedCost = anim.queue.reduce((s, q) => s + priceOf(q.id), 0);
  if (basketCount(ctx) + anim.queue.length === 0) {
    ctx.emit({ type: 'sfx', name: 'error' });
    ctx.emit({ type: 'toast', text: 'Your basket is empty' });
    return false;
  }
  if (ctx.progress.home.wallet < basketTotal(ctx) + queuedCost) {
    ctx.emit({ type: 'sfx', name: 'error' });
    ctx.emit({ type: 'toast', text: 'Not enough pay' });
    return false;
  }
  if (anim.checkoutPending || anim.walking === 'pay') return true;
  anim.checkoutPending = true;
  ctx.emit({ type: 'sfx', name: 'tap' });
  if (!busy()) startNext(ctx);
  return true;
}

function clampStat(v: number) { return clamp(Math.round(v), 0, 100); }

function pay(ctx: KonbiniCtx) {
  const { state, progress } = ctx;
  const home = progress.home;
  const k = state.konbini;
  const b = k.bear;
  anim.checkoutPending = false;
  b.facing = KONBINI_CLERK.x >= b.x ? 1 : -1;
  if (!k.basket.length) return;
  const total = basketTotal(ctx);
  if (home.wallet < total) {
    ctx.emit({ type: 'sfx', name: 'error' });
    ctx.emit({ type: 'toast', text: 'Not enough pay' });
    return;
  }
  home.wallet -= total;
  let joy = 0;
  for (const { id, qty } of k.basket) {
    if (isIngredient(id) || isSnack(id)) {
      home.pantry[id] = (home.pantry[id] ?? 0) + qty;
    } else if (isGood(id)) {
      if (id === 'book') home.books += qty;
      else joy += (goodDef(id)?.happiness ?? 2) * qty;
    }
  }
  if (joy > 0) home.happiness = clampStat(home.happiness + joy);
  const sale = todaySale();
  const boughtSale = !!sale && k.basket.some((e) => e.id === sale.item);
  const bigBasket = k.basket.reduce((n, e) => n + e.qty, 0) >= 8;
  k.basket = [];

  ctx.emit({ type: 'sfx', name: 'register' });
  const fx = b.x, fy = b.y - 70;
  if (total > 0) addEffect(state, 'text', fx + 22, fy + 10, `-${total}`);
  addEffect(state, 'coin', (b.x + KONBINI_CLERK.x) / 2, KONBINI_COUNTER.y - 8);
  addEffect(state, 'sparkle', KONBINI_CLERK.x, KONBINI_CLERK.y - 60);
  addEffect(state, 'sparkle', fx, fy + 16);
  if (joy > 0) {
    addEffect(state, 'heart', fx - 14, fy);
    addEffect(state, 'text', fx - 14, fy - 18, `+${joy} ♥`);
  }
  anim.thanks = 2.5;
  say('ありがとうございました！', 2.5, false);
  ctx.emit({ type: 'sfx', name: 'arigato' });
  // (the clerk's ありがとうございました bubble thanks the player; no toast)

  progressEvent({
    state, progress, emit: (e) => ctx.emit(e), save: () => ctx.save(),
    playStory: (id) => { if (ctx.playStory) ctx.playStory(id); },
  }, { kind: 'konbini' });
  ctx.onCheckout();
  ctx.secretEvent?.('konbini_checkout');
  if (bigBasket) ctx.secretEvent?.('konbini_big_basket');
  if (boughtSale) ctx.secretEvent?.('bought_sale_item');
  ctx.save();
  ctx.emit({ type: 'progress' });
}

/* ---------- taps ---------- */
const CLERK_TAP = { x: KONBINI_CLERK.x, y: KONBINI_CLERK.y - 34 };
const inRect = (x: number, y: number, r: { x: number; y: number; w: number; h: number }, pad = 0) =>
  x >= r.x - pad && x <= r.x + r.w + pad && y >= r.y - pad && y <= r.y + r.h + pad;

/** Taps in the konbini scene: shelves → take, counter → checkout, door → leave. */
export function konbiniTap(ctx: KonbiniCtx, x: number, y: number): void {
  const layout = stockLayout();
  let best = -1, bestD = TAP_RADIUS;
  KONBINI_SLOTS.forEach((s, i) => {
    if (!layout[i]) return;
    const d = Math.hypot(x - s.x, y - s.y);
    if (d < bestD) { bestD = d; best = i; }
  });
  const clerkD = Math.hypot(x - CLERK_TAP.x, y - CLERK_TAP.y);
  if (best >= 0 && clerkD >= bestD) {
    // walk to the tapped slot itself (not just the nearest one with that product)
    const id = layout[best]!;
    if (basketCount(ctx) + anim.queue.length >= MAX_BASKET) { konbiniTake(ctx, id); return; }
    anim.queue.push({ slot: best, id });
    ctx.emit({ type: 'sfx', name: 'tap' });
    if (!busy()) startNext(ctx);
    return;
  }
  // nothing to pay for: a tap on the clerk / counter can be a journal hotspot instead
  if (basketCount(ctx) + anim.queue.length === 0 && ctx.secretTap?.(x, y)) return;
  if (clerkD < 34 || inRect(x, y, KONBINI_COUNTER, 4)) { konbiniCheckout(ctx); return; }
  // door: the glass door is drawn above its bottom-centre (x, y)
  const door = { x: KONBINI_DOOR.x - KONBINI_DOOR.w / 2, y: KONBINI_DOOR.y - KONBINI_DOOR.h, w: KONBINI_DOOR.w, h: KONBINI_DOOR.h + 30 };
  if (inRect(x, y, door, 4)) { leave(ctx); return; }
  // journal hotspots (star sign, umbrella, coffee machine...) before strolling
  if (ctx.secretTap?.(x, y)) return;
  // plain floor: stroll there (when not on an errand)
  if (busy() || anim.checkoutPending || y < FLOOR.minY) return;
  if (inRect(x, y, KONBINI_TABLE, 6) || inRect(x, y, { x: KONBINI_COUNTER.x, y: KONBINI_COUNTER.y - 20, w: KONBINI_COUNTER.w, h: KONBINI_COUNTER.h + 4 })) return;
  if (inRect(x, y, { x: KONBINI_AISLE.x, y: KONBINI_AISLE.y + 20, w: KONBINI_AISLE.w, h: KONBINI_AISLE.h - 16 })) return; // the gondola itself
  if (inRect(x, y, { x: KONBINI_COFFEE.x, y: KONBINI_COFFEE.y, w: KONBINI_COFFEE.w, h: KONBINI_COFFEE.h - 6 })) return; // the coffee machine
  const b = ctx.state.konbini.bear;
  anim.walking = 'free';
  walkTo(b, { x: clamp(x, FLOOR.minX, FLOOR.maxX), y: clamp(y, FLOOR.minY, FLOOR.maxY) });
}

function leave(ctx: KonbiniCtx) {
  const k = ctx.state.konbini;
  k.basket = [];
  anim.queue = []; anim.fly = []; anim.hop = 0; anim.hopSlot = -1; anim.checkoutPending = false; anim.walking = null;
  anim.bubble = null; shoppers = [];
  k.bear.path = [];
  ctx.emit({ type: 'progress' });
  ctx.onLeave();
}

/* ---------- per frame ---------- */
export function updateKonbini(ctx: KonbiniCtx, dt: number): void {
  if (!(dt > 0)) return;
  const b = ctx.state.konbini.bear;
  if (anim.greet > 0) anim.greet = Math.max(0, anim.greet - dt);
  if (anim.thanks > 0) anim.thanks = Math.max(0, anim.thanks - dt);
  if (anim.bubble) { anim.bubble.age += dt; if (anim.bubble.age >= anim.bubble.life) anim.bubble = null; }
  updateShoppers(ctx, dt);
  for (const f of anim.fly) f.age += dt;
  anim.fly = anim.fly.filter((f) => f.age < f.life);

  // the pick-up hop
  if (anim.hop > 0) {
    const before = anim.hop;
    anim.hop = Math.max(0, anim.hop - dt);
    const mid = HOP_TIME * 0.5;
    if (before > mid && anim.hop <= mid) {
      const q = anim.queue.shift();
      if (q) {
        const s = KONBINI_SLOTS[q.slot];
        anim.fly.push({ id: q.id, from: { x: s.x, y: s.y }, age: 0, life: FLY_TIME });
        putInBasket(ctx, q.id);
        ctx.emit({ type: 'sfx', name: 'pop' });
        addEffect(ctx.state, 'sparkle', s.x, s.y);
      }
    }
    if (anim.hop <= 0) { anim.hopSlot = -1; startNext(ctx); }
    return;
  }

  if (b.path.length) {
    const arrived = moveAlong(b, WALK_SPEED * dt);
    if (!arrived) return;
    if (anim.walking === 'take' && anim.queue.length) {
      const s = KONBINI_SLOTS[anim.queue[0].slot];
      if (Math.abs(s.x - b.x) > 2) b.facing = s.x > b.x ? 1 : -1;
      anim.hop = HOP_TIME;
      anim.hopSlot = anim.queue[0].slot;
      return;
    }
    if (anim.walking === 'pay') { anim.walking = null; pay(ctx); startNext(ctx); return; }
    anim.walking = null;
  }
  if (anim.walking === null && (anim.queue.length || anim.checkoutPending)) startNext(ctx);
}
