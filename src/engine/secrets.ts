/* =====================================================================
   SECRETS ENGINE — Mocha's journal: hidden hotspots + game-moment counters unlock journal pages.
   game.ts / home.ts / konbini.ts call these. Content lives in src/content/secrets.ts.
   ===================================================================== */
import type {
  GameEvent, GameState, Popup, Progress, Scene, SecretDef, SecretEventId, SecretSpotId, SecretWhen, SfxName,
} from '../types';
import type { ProgCtx } from './progression';
import { grantReward, queuePopup } from './progression';
import { SECRETS } from '../content/secrets';
import { SECRET_SPOTS } from '../layout';

export interface SecretCtx { state: GameState; progress: Progress; emit(e: GameEvent): void; save(): void; prog: ProgCtx }

/** How long a hotspot reaction plays (seconds). */
const REACTION_SECONDS = 1.2;
/** Sound of a hotspot reaction (default 'pop'). */
const SPOT_SFX: Partial<Record<SecretSpotId, SfxName>> = {
  cafe_door_bell: 'bell', cafe_clock: 'tap', cafe_record: 'tap', cafe_barista: 'chime', cafe_menu_board: 'page',
  home_kettle: 'brew', home_jar: 'jar', home_fireplace: 'crackle', home_moon: 'chime',
  konbini_clerk: 'chime', konbini_coffee_machine: 'brew', konbini_star_sign: 'chime',
};

/* ---------- module state ---------- */
/** Taps per hotspot during the current scene stay. */
let tapScene: Scene | null = null;
let taps: Record<string, number> = {};
/** Time-of-day secrets are checked once per session (the first time Mocha is at home). */
let timeChecked = false;

function ensure(p: Progress) {
  if (!Array.isArray(p.secrets)) p.secrets = [];
  if (!p.secretCounters || typeof p.secretCounters !== 'object') p.secretCounters = {};
}

/** Is the optional `when` condition true right now? */
function whenOk(ctx: SecretCtx, w: SecretWhen | undefined): boolean {
  if (!w) return true;
  const { state, progress } = ctx;
  const cal = state.calendar;
  if (w.theme !== undefined && state.theme !== w.theme) return false;
  if (w.season !== undefined && cal?.season !== w.season) return false;
  if (w.festivalToday !== undefined && cal?.today !== w.festivalToday) return false;
  if (w.fireOn !== undefined && !!progress.home.fireOn !== w.fireOn) return false;
  if (w.minDay !== undefined && progress.day < w.minDay) return false;
  if (w.chapterAtLeast !== undefined && progress.chapter < w.chapterAtLeast) return false;
  const now = new Date();
  if (w.weekday !== undefined && now.getDay() !== w.weekday) return false;
  if (w.hourFrom !== undefined || w.hourTo !== undefined) {
    const h = now.getHours();
    const from = w.hourFrom, to = w.hourTo;
    // hourTo is exclusive; from > to wraps past midnight; from === to means just that hour
    let ok: boolean;
    if (from !== undefined && to !== undefined) {
      if (from === to) ok = h === from;
      else if (from < to) ok = h >= from && h < to;
      else ok = h >= from || h < to;
    } else if (from !== undefined) ok = h >= from;
    else ok = h < (to as number);
    if (!ok) return false;
  }
  return true;
}

/** Unlock a journal page: record it, grant its reward, queue the popup, save. */
function unlock(ctx: SecretCtx, def: SecretDef) {
  const p = ctx.progress;
  if (p.secrets.includes(def.id)) return;
  p.secrets.push(def.id);
  const rewards = def.reward ? [def.reward] : [];
  if (def.reward) {
    try { grantReward(ctx.prog, def.reward); } catch (err) { console.error(err); }
  }
  const popup: Popup = { kind: 'secret', title: 'New journal page!', text: def.title, rewards };
  // the popup plays the 'unlock' sound when it shows; if it has to wait its turn, chime now
  if (ctx.state.popup) ctx.emit({ type: 'sfx', name: 'unlock' });
  queuePopup(ctx.prog, popup);
  ctx.emit({ type: 'progress' });
  ctx.save();
}

/** A game moment happened (served_perfect, cooked, bath...). Counts it and unlocks matching secrets. */
export function secretEvent(ctx: SecretCtx, ev: SecretEventId): void {
  try {
    const p = ctx.progress;
    ensure(p);
    const n = (p.secretCounters[ev] ?? 0) + 1;
    p.secretCounters[ev] = n;
    let found = false;
    for (const def of SECRETS) {
      const tr = def.trigger;
      if (tr.kind !== 'event' || tr.event !== ev || p.secrets.includes(def.id)) continue;
      if (n < Math.max(1, tr.times) || !whenOk(ctx, tr.when)) continue;
      unlock(ctx, def);
      found = true;
    }
    if (!found) ctx.save();
  } catch (err) { console.error(err); }
}

/** A tap that nothing else used, in the given scene. Returns true if it hit a secret hotspot (plays a reaction). */
export function secretTap(ctx: SecretCtx, scene: 'cafe' | 'home' | 'konbini', x: number, y: number): boolean {
  try {
    const p = ctx.progress;
    ensure(p);
    if (tapScene !== scene) { tapScene = scene; taps = {}; }
    let best: SecretSpotId | null = null, bd = Infinity;
    for (const [id, s] of Object.entries(SECRET_SPOTS)) {
      if (s.scene !== scene) continue;
      const d = Math.hypot(x - s.x, y - s.y);
      if (d <= s.r && d < bd) { bd = d; best = id as SecretSpotId; }
    }
    if (!best) return false;
    const spot = best;
    ctx.state.reaction = { spot, t: 0 };
    ctx.emit({ type: 'sfx', name: SPOT_SFX[spot] ?? 'pop' });
    const n = (taps[spot] ?? 0) + 1;
    taps[spot] = n;
    for (const def of SECRETS) {
      const tr = def.trigger;
      if (tr.kind !== 'tap' || tr.spot !== spot || p.secrets.includes(def.id)) continue;
      if (n < Math.max(1, tr.times) || !whenOk(ctx, tr.when)) continue;
      unlock(ctx, def);
    }
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}

/** Per frame: advances state.reaction, checks time-of-day secrets (night owl / early bird) once per session. */
export function updateSecrets(ctx: SecretCtx, dt: number): void {
  const st = ctx.state;
  if (tapScene !== null && tapScene !== st.scene) { tapScene = st.scene; taps = {}; }
  const r = st.reaction;
  if (r) {
    const spot = SECRET_SPOTS[r.spot];
    if (!spot || spot.scene !== st.scene) st.reaction = null;
    else if (dt > 0) {
      r.t += dt / REACTION_SECONDS;
      if (r.t >= 1) st.reaction = null;
    }
  }
  if (!timeChecked && st.mode === 'home' && st.scene === 'home') {
    timeChecked = true;
    const h = new Date().getHours();
    if (h >= 0 && h < 5) secretEvent(ctx, 'night_owl');
    else if (h >= 5 && h < 8) secretEvent(ctx, 'early_bird');
  }
}

/** Every secret in catalogue order, with found state. foundIndex = discovery order (-1 when not found). */
export function journalEntries(p: Progress): { def: SecretDef; found: boolean; foundIndex: number }[] {
  const found = Array.isArray(p.secrets) ? p.secrets : [];
  return SECRETS.map((def) => {
    const i = found.indexOf(def.id);
    return { def, found: i >= 0, foundIndex: i };
  });
}
