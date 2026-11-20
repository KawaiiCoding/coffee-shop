/* =====================================================================
   PROGRESSION — chapters, friendship + gifts, rewards, season-event gifts, shooting stars.
   game.ts / home.ts / konbini.ts call these.

   Popups: only one is shown at a time (state.popup). Others wait in a pending queue.
   Chapters wrap up one at a time and only at a calm moment (tryChapter): the chapter's story
   plays first, then its "chapter complete" card (storyFinished). Nothing interrupts a café day.
   ===================================================================== */
import type {
  DecorSlot, GameEvent, GameState, GoalCheck, Popup, Progress, RegularId, Reward, Stats, StoryId,
} from '../types';
import { CHAPTERS, ECONOMY, REGULARS, SEASON_EVENTS } from '../content/progression';
import { HOME_WINDOW } from '../art/home-room';
import { HOME_ITEMS } from './home';
import { decorDef } from './catalog';
import { calendarInfo, daysUntil, DAYS_PER_GAME_DAY, worldDate } from './calendar';

export interface ProgCtx {
  state: GameState; progress: Progress;
  emit(e: GameEvent): void; save(): void; playStory(id: StoryId): void;
}
export type ProgEvent =
  | { kind: 'served'; regular: RegularId | null; favourite: boolean; happy: boolean }
  | { kind: 'dayStart' } | { kind: 'dayEnd' }
  | { kind: 'cooked'; dish: string } | { kind: 'konbini' } | { kind: 'call' } | { kind: 'saved' }
  | { kind: 'dream' } | { kind: 'homeItem' } | { kind: 'wish' } | { kind: 'enterHome' };

/* ---------- module state ---------- */
let ownerState: GameState | null = null;
let pending: Popup[] = [];
/** "Chapter complete" cards waiting for their story to finish (story first, then the reward card). */
let afterStory = new Map<StoryId, Popup>();
const recentRegulars: RegularId[] = [];
const STAR_SECONDS = 2.2;

/** Drop queues that belong to a previous GameState (e.g. after resetSave created a new one). */
function own(ctx: ProgCtx) {
  if (ownerState !== ctx.state) {
    ownerState = ctx.state;
    pending = [];
    afterStory = new Map();
  }
}

/** Forget every waiting popup / chapter card (reset, back to title). */
export function resetQueues(): void {
  pending = [];
  afterStory = new Map();
}

function ensure(p: Progress) {
  const stats: Partial<Stats> = p.stats ?? {};
  p.stats = {
    cooked: stats.cooked ?? 0, konbini: stats.konbini ?? 0, calls: stats.calls ?? 0,
    wishes: stats.wishes ?? 0, served: stats.served ?? 0, daysPlayed: stats.daysPlayed ?? 0,
  };
  p.friendship ??= {};
  p.giftsReceived ??= [];
  p.recipes ??= [];
  p.chapter ??= 0;
  const h = p.home;
  h.furniture ??= [];
  h.pantry ??= {};
  h.books ??= 0;
}

/* ---------- popups ---------- */
function popupSfx(p: Popup): 'gift' | 'unlock' | 'wish' | 'chime' {
  switch (p.kind) {
    case 'gift': return 'gift';
    case 'chapter': case 'unlock': case 'secret': return 'unlock';
    case 'wish': return 'wish';
    default: return p.rewards.length ? 'gift' : 'chime';
  }
}

function display(ctx: ProgCtx, popup: Popup) {
  ctx.state.popup = popup;
  ctx.emit({ type: 'popup' });
  ctx.emit({ type: 'sfx', name: popupSfx(popup) });
}

function showPopup(ctx: ProgCtx, popup: Popup) {
  own(ctx);
  if (ctx.state.popup) pending.push(popup);
  else display(ctx, popup);
}

/** Queue a popup behind any popup already showing. */
export function queuePopup(ctx: ProgCtx, popup: Popup): void { showPopup(ctx, popup); }

/** Called by game.ts from dismissPopup: shows the next waiting popup, if any. */
export function nextPopup(ctx: ProgCtx): void {
  own(ctx);
  ctx.state.popup = null;
  const next = pending.shift();
  if (next) display(ctx, next);
}

/** Called by game.ts when a story ends: a finished chapter's reward card follows its story. */
export function storyFinished(ctx: ProgCtx, id: StoryId): void {
  own(ctx);
  const popup = afterStory.get(id);
  if (!popup) return;
  afterStory.delete(id);
  showPopup(ctx, popup);
}

/* ---------- rewards ---------- */
/** Apply a reward to progress (pay → wallet, tips → coins, furniture, items, books, recipes...). */
export function grantReward(ctx: ProgCtx, r: Reward): void {
  const p = ctx.progress;
  ensure(p);
  const home = p.home;
  let decorChanged = false;
  switch (r.kind) {
    case 'pay': home.wallet += Math.max(0, Math.round(r.amount)); break;
    case 'tips': p.coins += Math.max(0, Math.round(r.amount)); break;
    case 'furniture':
      if (!home.furniture.includes(r.id)) { home.furniture.push(r.id); decorChanged = true; }
      break;
    case 'homeItem': {
      if (!home.owned.includes(r.id)) home.owned.push(r.id);
      const def = HOME_ITEMS.find((i) => i.id === r.id);
      if (def && !home.placed[def.slot]) { home.placed[def.slot] = r.id; decorChanged = true; }
      break;
    }
    case 'decor': {
      if (!p.ownedDecor.includes(r.id)) p.ownedDecor.push(r.id);
      const def = decorDef(r.id);
      if (def) {
        const slot: DecorSlot = def.slot;
        if (!p.placed[slot]) { p.placed[slot] = r.id; decorChanged = true; }
      }
      break;
    }
    case 'book': home.books += 1; break;
    case 'ingredient': home.pantry[r.id] = (home.pantry[r.id] ?? 0) + Math.max(0, r.amount); break;
    case 'recipe': if (!p.recipes.includes(r.id)) p.recipes.push(r.id); break;
    case 'happiness': home.happiness = Math.max(0, Math.min(100, Math.round(home.happiness + r.amount))); break;
  }
  ctx.emit({ type: 'progress' });
  if (decorChanged || r.kind === 'furniture' || r.kind === 'homeItem' || r.kind === 'decor') ctx.emit({ type: 'decor' });
  ctx.save();
}

function grantAll(ctx: ProgCtx, rs: Reward[]) { for (const r of rs) grantReward(ctx, r); }

/* ---------- friendship ---------- */
export function friendLevel(p: Progress, id: RegularId): number {
  const pts = p.friendship?.[id] ?? 0;
  return Math.floor(pts / Math.max(1, ECONOMY.pointsPerLevel));
}

function checkGifts(ctx: ProgCtx, id: RegularId) {
  const p = ctx.progress;
  const def = REGULARS.find((r) => r.id === id);
  if (!def) return;
  const lv = friendLevel(p, id);
  def.gifts.forEach((g, i) => {
    const key = `${id}:${i}`;
    if (g.at > lv || p.giftsReceived.includes(key)) return;
    p.giftsReceived.push(key);
    grantReward(ctx, g.reward);
    showPopup(ctx, { kind: 'gift', from: id, title: `${def.name} brought a gift!`, text: g.line, rewards: [g.reward] });
  });
}

/* ---------- chapters ---------- */
function cookedMarker(dish: string) { return `cooked:${dish}`; }

/** 0..1 progress toward a goal. */
function goalProgress(p: Progress, c: GoalCheck): number {
  const frac = (have: number, need: number) => (need <= 0 ? 1 : Math.max(0, Math.min(1, have / need)));
  const s = p.stats;
  switch (c.kind) {
    case 'day': return frac(p.day, c.day);
    case 'served': return frac(Math.max(s.served, p.totalServed ?? 0), c.count);
    case 'friend': {
      const pts = p.friendship[c.id] ?? 0;
      return frac(pts, c.level * Math.max(1, ECONOMY.pointsPerLevel));
    }
    case 'cooked':
      if (c.dish && !p.giftsReceived.includes(cookedMarker(c.dish))) return Math.min(0.99, frac(s.cooked, c.count));
      return frac(s.cooked, c.count);
    case 'konbini': return frac(s.konbini, c.count);
    case 'calls': return frac(s.calls, c.count);
    case 'wishes': return frac(s.wishes, c.count);
    case 'savings': return frac(p.home.savings, c.amount);
    case 'dream': return p.home.dreamDone ? 1 : frac(p.home.savings, p.home.dreamGoal);
    case 'furniture':
      if (p.home.furniture.includes(c.id)) return 1;
      // the fireplace is a savings dream: show how full the jar is
      return c.id === 'fireplace' && p.home.dreamDone ? Math.min(0.99, frac(p.home.savings, p.home.dreamGoal)) : 0;
    case 'homeItems': return frac(p.home.owned.length, c.count);
  }
}

function goalMet(p: Progress, c: GoalCheck): boolean {
  if (c.kind === 'dream') return p.home.dreamDone;
  if (c.kind === 'cooked' && c.dish && !p.giftsReceived.includes(cookedMarker(c.dish))) return false;
  return goalProgress(p, c) >= 1;
}

/** Is the current chapter's goal met (so it can be wrapped up at the next calm moment)? */
export function chapterReady(p: Progress): boolean {
  ensure(p);
  const ch = CHAPTERS[p.chapter];
  return !!ch && goalMet(p, ch.check);
}

const CALM = new Set<GameState['mode']>(['home', 'konbini', 'dayEnd']);

/** Wrap up the current chapter if its goal is met and nothing else is on screen: rewards, then its story,
 *  then the "chapter complete" card. One chapter at a time; returns true when one was completed. */
export function tryChapter(ctx: ProgCtx): boolean {
  own(ctx);
  const p = ctx.progress;
  const st = ctx.state;
  if (!CALM.has(st.mode) || st.popup || st.story) return false;
  if (!chapterReady(p)) return false;
  const ch = CHAPTERS[p.chapter];
  grantAll(ctx, ch.rewards);
  let text = ch.done ?? `Goal done: ${ch.goal}.`;
  if (ch.unlocks?.konbini && !p.konbiniOpen) {
    p.konbiniOpen = true;
    text += ' Hoshi Mart, the corner shop, is now open!';
  }
  p.chapter += 1;
  const nxt = CHAPTERS[p.chapter];
  const popup: Popup = { kind: 'chapter', title: ch.title, text, rewards: ch.rewards, chapter: ch.id };
  if (nxt) popup.next = nxt.goal;
  if (ch.check.kind === 'dream' || (ch.check.kind === 'furniture' && ch.check.id === 'fireplace')) popup.dream = true;
  ctx.emit({ type: 'progress' });
  ctx.save();
  if (ch.story) {
    afterStory.set(ch.story, popup);
    ctx.playStory(ch.story);
    // the story could not start (unknown id): don't lose the card
    if (ctx.state.mode !== 'story' && afterStory.get(ch.story) === popup) { afterStory.delete(ch.story); showPopup(ctx, popup); }
  } else showPopup(ctx, popup);
  return true;
}

/** Things Mocha does himself at home / in the shop: their chapter wraps up right away, while it is happening. */
const INSTANT = new Set<ProgEvent['kind']>(['call', 'cooked', 'konbini', 'saved', 'dream', 'homeItem', 'wish']);

/** Record an event: updates stats/friendship and grants gifts (sets state.popup). */
export function progressEvent(ctx: ProgCtx, ev: ProgEvent): void {
  own(ctx);
  const p = ctx.progress;
  ensure(p);
  const s = p.stats;
  switch (ev.kind) {
    case 'served':
      s.served += 1;
      if (ev.regular && ev.happy) {
        const add = ECONOMY.friendPointsServed + (ev.favourite ? ECONOMY.friendPointsFavourite : 0);
        p.friendship[ev.regular] = (p.friendship[ev.regular] ?? 0) + add;
        checkGifts(ctx, ev.regular);
      }
      break;
    case 'dayEnd': s.daysPlayed += 1; break;
    case 'cooked':
      s.cooked += 1;
      if (!p.giftsReceived.includes(cookedMarker(ev.dish))) p.giftsReceived.push(cookedMarker(ev.dish));
      break;
    case 'konbini': s.konbini += 1; break;
    case 'call': s.calls += 1; break;
    case 'wish': s.wishes += 1; break;
    default: break;
  }
  if (INSTANT.has(ev.kind)) tryChapter(ctx);
  ctx.save();
}

export function currentGoal(p: Progress): { chapter: number; title: string; goal: string; progress: number } | null {
  ensure(p);
  const ch = CHAPTERS[p.chapter];
  if (!ch) return null;
  return { chapter: p.chapter, title: ch.title, goal: ch.goal, progress: goalProgress(p, ch.check) };
}

/** Which regular (if any) should be the next café guest. rng() in [0,1). */
export function pickRegular(p: Progress, day: number, rng: () => number): RegularId | null {
  void p;
  const pool = REGULARS.filter((r) => r.id !== 'button' && r.firstDay <= day);
  if (!pool.length || rng() >= 0.35) return null;
  const fresh = pool.filter((r) => !recentRegulars.includes(r.id));
  const from = fresh.length ? fresh : pool;
  const pick = from[Math.floor(rng() * from.length) % from.length].id;
  recentRegulars.push(pick);
  while (recentRegulars.length > Math.min(3, Math.max(0, pool.length - 1))) recentRegulars.shift();
  return pick;
}

/* ---------- shooting stars ---------- */
function placeStar(star: { x: number; y: number; t: number }) {
  const W = HOME_WINDOW;
  star.x = W.x + 8 + star.t * (W.w - 16);
  star.y = W.y + 10 + star.t * (W.h * 0.55);
}

/** Per-frame: shooting star spawning/moving while at home at night (state.shootingStar). */
export function updateProgression(ctx: ProgCtx, dt: number): void {
  const st = ctx.state;
  if (!(dt > 0)) return;
  if (st.scene !== 'home') { st.shootingStar = null; return; }
  if (st.shootingStar) {
    st.shootingStar.t += dt / STAR_SECONDS;
    if (st.shootingStar.t >= 1) st.shootingStar = null;
    else placeStar(st.shootingStar);
    return;
  }
  if (st.mode !== 'home' || st.popup) return;
  // while a chapter asks for wishes, stars come every ~20s so nobody gets stuck waiting
  const goal = CHAPTERS[ctx.progress.chapter]?.check;
  const wantWish = goal?.kind === 'wishes' && ctx.progress.stats.wishes < goal.count;
  const perMinute = wantWish ? 3 : ECONOMY.shootingStarChancePerMinute;
  const chance = (perMinute / 60) * dt;
  if (Math.random() < chance) {
    const star = { x: 0, y: 0, t: 0 };
    placeStar(star);
    st.shootingStar = star;
    ctx.emit({ type: 'sfx', name: 'chime' });
  }
}

/** Tap at home on the window while a star is crossing → wish (reward + popup). Returns true if consumed. */
export function tapShootingStar(ctx: ProgCtx, x: number, y: number): boolean {
  const st = ctx.state;
  if (!st.shootingStar || st.scene !== 'home') return false;
  const W = HOME_WINDOW, m = 20;
  if (x < W.x - m || x > W.x + W.w + m || y < W.y - m || y > W.y + W.h + m) return false;
  st.shootingStar = null;
  const rewards = ECONOMY.wishReward;
  grantAll(ctx, rewards);
  showPopup(ctx, {
    kind: 'wish', from: 'star', title: 'You caught a shooting star!',
    text: 'Mocha closes both eyes and makes a quiet wish. Something good is on its way.', rewards,
  });
  progressEvent(ctx, { kind: 'wish' });
  return true;
}

/** Called once per real day when the game opens / a day starts: festival-day gifts and "coming soon" popups. */
export function checkSeasonEvents(ctx: ProgCtx): void {
  own(ctx);
  const p = ctx.progress;
  ensure(p);
  const now = worldDate(p.day);
  const cal = calendarInfo(now);
  ctx.state.calendar = cal;
  let changed = false;
  for (const ev of SEASON_EVENTS) {
    const { daysLeft, year } = daysUntil(ev, now);
    if (daysLeft < DAYS_PER_GAME_DAY) {
      const key = `event:${ev.id}:${year}`;
      if (p.giftsReceived.includes(key)) continue;
      p.giftsReceived.push(key);
      changed = true;
      const rewards = ev.gift ? [ev.gift] : [];
      grantAll(ctx, rewards);
      showPopup(ctx, { kind: 'festival', title: `Happy ${ev.name}!`, text: ev.blurb, rewards });
    }
    // (no "coming soon" popup: the calendar chip and the newspaper already announce festivals)
  }
  if (changed) { ctx.emit({ type: 'progress' }); ctx.save(); }
}
