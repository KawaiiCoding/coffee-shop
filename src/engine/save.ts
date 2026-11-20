/* Progress persistence. Resilient to missing/corrupt JSON and throwing storage.
   v3 save; v2 and v1 saves are migrated (all progress kept, new v3 fields get their defaults). */
import type {
  DecorId, DecorSlot, DishId, FurnitureId, HomeProgress, IngredientId, Progress, RegularId, Settings, SnackId, Stats,
  StoryId, ThemeId, UpgradeId,
} from '../types';
import { DECOR, STARTER_DECOR, THEMES, UPGRADES } from './catalog';
import { STORIES } from '../story';
import { defaultHome, sanitizeHome } from './home';
import { CHAPTERS, DISHES, START_HOME } from '../content/progression';

export const SAVE_KEY = 'coffee-shop-save-v3';
/** Older saves; migrated once into SAVE_KEY when no v3 save exists. */
export const SAVE_KEY_V2 = 'coffee-shop-save-v2';
export const SAVE_KEY_V1 = 'coffee-shop-save-v1';
const storyIds = () => Object.keys(STORIES) as StoryId[];

export const DEFAULT_SETTINGS: Settings = {
  music: true, sfx: true, musicVolume: 0.6, sfxVolume: 0.8, hints: true,
};

const SLOTS: DecorSlot[] = ['ceiling', 'wall', 'back', 'corner', 'rug'];
/* id lists straight from the types (content arrays may be filled later / reordered) */
const REGULAR_IDS: RegularId[] = ['maple', 'cotton', 'fern', 'pip', 'crumb', 'pom', 'button'];
const DISH_IDS: DishId[] = ['honey_toast', 'onigiri', 'omurice', 'curry_rice', 'ramen', 'pancakes', 'miso_soup', 'strawberry_parfait'];
const INGREDIENT_IDS: IngredientId[] = ['rice', 'egg', 'milk', 'flour', 'honey', 'curry_roux', 'noodles', 'veggies', 'tofu', 'strawberry', 'bread', 'miso'];
const SNACK_IDS: SnackId[] = ['melon_bread', 'pudding', 'canned_coffee', 'dango', 'onigiri_pack', 'ice_cream'];
const FURNITURE_IDS: FurnitureId[] = ['phone', 'armchair', 'dining_table', 'fireplace', 'bookshelf', 'radio'];
const STAT_KEYS: (keyof Stats)[] = ['cooked', 'konbini', 'calls', 'wishes', 'served', 'daysPlayed'];

const num = (v: unknown, fallback: number, min = -Infinity, max = Infinity): number =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback;
const int = (v: unknown, fallback: number, min = -Infinity, max = Infinity) => Math.floor(num(v, fallback, min, max));
const bool = (v: unknown, fallback: boolean): boolean => (typeof v === 'boolean' ? v : fallback);
const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const oneOf = <T extends string>(list: readonly T[], v: unknown): v is T => typeof v === 'string' && (list as readonly string[]).includes(v);

const startRecipes = (): DishId[] => [...START_HOME.recipes] as DishId[];
const emptyStats = (): Stats => ({ cooked: 0, konbini: 0, calls: 0, wishes: 0, served: 0, daysPlayed: 0 });

/** The v3 home fields on top of home.ts' base home (a brand-new home = START_HOME). */
function newHome(): HomeProgress {
  return {
    ...defaultHome(),
    furniture: [...START_HOME.furniture],
    pantry: { ...START_HOME.pantry } as HomeProgress['pantry'],
    meal: null,
    books: START_HOME.books,
    fireOn: false,
  };
}

/** Validate a saved home: base fields via home.ts, v3 fields here (field by field). */
function sanitizeHomeV3(raw: unknown, v3: boolean): HomeProgress {
  const base = newHome();
  const h: HomeProgress = { ...base, ...sanitizeHome(raw) };
  // home.ts may or may not know the v3 fields yet: (re)validate them here
  h.furniture = [...base.furniture];
  h.pantry = { ...base.pantry };
  h.meal = null;
  h.books = base.books;
  h.fireOn = false;
  if (!isObj(raw)) return h;
  if (!v3) {
    // v2 homes predate furniture/pantry: an old home starts with an empty set of furniture and the starter pantry
    h.furniture = [];
    h.books = 0;
    return h;
  }
  if (Array.isArray(raw.furniture)) h.furniture = [...new Set(raw.furniture.filter((f): f is FurnitureId => oneOf(FURNITURE_IDS, f)))];
  if (isObj(raw.pantry)) {
    const pantry: HomeProgress['pantry'] = {};
    for (const [k, v] of Object.entries(raw.pantry)) {
      if (!oneOf(INGREDIENT_IDS, k) && !oneOf(SNACK_IDS, k)) continue;
      const n = int(v, 0, 0, 999);
      if (n > 0) pantry[k as IngredientId | SnackId] = n;
    }
    h.pantry = pantry;
  }
  h.meal = oneOf(DISH_IDS, raw.meal) ? raw.meal : null;
  h.books = int(raw.books, base.books, 0, 999);
  h.fireOn = bool(raw.fireOn, false) && h.furniture.includes('fireplace');
  return h;
}

export function defaultProgress(): Progress {
  return {
    version: 3,
    chapter: 0,
    konbiniOpen: false,
    friendship: {},
    giftsReceived: [],
    recipes: startRecipes(),
    stats: emptyStats(),
    secrets: [],
    secretCounters: { _hints7: 1 },
    newsReadDay: 0,
    newsSeen: [],
    storySeen: [],
    cleanupDone: false,
    home: newHome(),
    coins: 0,
    day: 1,
    totalServed: 0,
    upgrades: {},
    ownedDecor: Object.values(STARTER_DECOR),
    placed: { ...STARTER_DECOR },
    theme: 'auto',
    settings: { ...DEFAULT_SETTINGS },
    tutorialDone: false,
  };
}

/** Validate an untrusted parsed object into a Progress, falling back field by field. */
export function sanitizeProgress(raw: unknown): Progress {
  const p = defaultProgress();
  if (!isObj(raw)) return p;
  const r = raw;
  const version = r.version === undefined ? 1 : r.version;
  if (version !== 1 && version !== 2 && version !== 3) return p;
  const v3 = version === 3;
  if (version === 1) {
    // v1 players already know the café: skip the opening story + cleanup, give them a fresh home
    p.storySeen = storyIds().filter((id) => id === 'intro' || id === 'cleanup_done' || id === 'payday');
    p.cleanupDone = true;
  } else {
    if (Array.isArray(r.storySeen)) p.storySeen = storyIds().filter((id) => (r.storySeen as unknown[]).includes(id));
    p.cleanupDone = bool(r.cleanupDone, false);
    p.home = sanitizeHomeV3(r.home, v3);
  }
  p.coins = int(r.coins, 0, 0);
  p.day = int(r.day, 1, 1);
  p.totalServed = int(r.totalServed, 0, 0);
  if (isObj(r.upgrades)) {
    for (const u of UPGRADES) {
      const n = int(r.upgrades[u.id], 0, 0, u.costs.length);
      if (n > 0) p.upgrades[u.id as UpgradeId] = n;
    }
  }
  if (Array.isArray(r.ownedDecor)) {
    const ids = new Set<DecorId>(p.ownedDecor);
    for (const id of r.ownedDecor) if (DECOR.some((d) => d.id === id)) ids.add(id as DecorId);
    p.ownedDecor = [...ids];
  }
  if (isObj(r.placed)) {
    for (const slot of SLOTS) {
      const id = r.placed[slot];
      if (id === null) p.placed[slot] = null;
      else if (DECOR.some((d) => d.id === id && d.slot === slot) && p.ownedDecor.includes(id as DecorId)) {
        p.placed[slot] = id as DecorId;
      }
    }
  }
  if (r.theme === 'auto' || THEMES.some((t) => t.id === r.theme)) p.theme = r.theme as ThemeId | 'auto';
  if (isObj(r.settings)) {
    const s = r.settings;
    p.settings = {
      music: bool(s.music, DEFAULT_SETTINGS.music),
      sfx: bool(s.sfx, DEFAULT_SETTINGS.sfx),
      musicVolume: num(s.musicVolume, DEFAULT_SETTINGS.musicVolume, 0, 1),
      sfxVolume: num(s.sfxVolume, DEFAULT_SETTINGS.sfxVolume, 0, 1),
      hints: bool(s.hints, DEFAULT_SETTINGS.hints),
    };
  }
  p.tutorialDone = bool(r.tutorialDone, false);

  if (v3) {
    p.chapter = int(r.chapter, 0, 0, CHAPTERS.length > 0 ? CHAPTERS.length : 1e6);
    p.konbiniOpen = bool(r.konbiniOpen, false);
    if (isObj(r.friendship)) {
      for (const id of REGULAR_IDS) {
        const v = r.friendship[id];
        if (typeof v === 'number' && Number.isFinite(v)) p.friendship[id] = Math.max(0, Math.floor(v));
      }
    }
    if (Array.isArray(r.giftsReceived)) {
      p.giftsReceived = [...new Set(r.giftsReceived.filter((g): g is string => typeof g === 'string' && g.length > 0 && g.length < 80))];
    }
    const recipes = new Set<DishId>(startRecipes());
    if (Array.isArray(r.recipes)) for (const d of r.recipes) if (oneOf(DISH_IDS, d)) recipes.add(d);
    // keep content order where possible
    const order = DISHES.length ? DISHES.map((d) => d.id) : DISH_IDS;
    p.recipes = [...order.filter((d) => recipes.has(d)), ...[...recipes].filter((d) => !order.includes(d))];
    if (isObj(r.stats)) {
      const st = r.stats;
      for (const k of STAT_KEYS) p.stats[k] = int(st[k], 0, 0);
    }
  }
  // v4 journal + gazette fields (any version may carry them; absent = defaults)
  const shortStr = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.length < 80;
  if (Array.isArray(r.secrets)) p.secrets = [...new Set(r.secrets.filter(shortStr))];
  if (isObj(r.secretCounters)) {
    for (const [k, v] of Object.entries(r.secretCounters)) {
      if (k.length > 0 && k.length < 80 && typeof v === 'number' && Number.isFinite(v)) p.secretCounters[k] = Math.max(0, Math.floor(v));
    }
  }
  // v7: hints used to be off by default; they are now short, timed help, so older saves get them switched on once
  if (!isObj(r.secretCounters) || !(r.secretCounters as Record<string, unknown>)._hints7) p.settings.hints = true;
  p.secretCounters._hints7 = 1;
  p.newsReadDay = int(r.newsReadDay, 0, 0);
  if (Array.isArray(r.newsSeen)) p.newsSeen = r.newsSeen.filter(shortStr).slice(-200);
  return p;
}

function readJson(storage: Storage, key: string): unknown {
  const txt = storage.getItem(key);
  if (!txt) return undefined;
  try { return JSON.parse(txt) as unknown; } catch { return undefined; }
}

export function loadProgress(storage: Storage | null): Progress {
  if (!storage) return defaultProgress();
  try {
    const cur = readJson(storage, SAVE_KEY);
    if (cur !== undefined) return sanitizeProgress(cur);
    let old = readJson(storage, SAVE_KEY_V2);
    if (old !== undefined) {
      if (isObj(old) && old.version === undefined) old.version = 2;
    } else {
      old = readJson(storage, SAVE_KEY_V1);
      if (old === undefined) return defaultProgress();
      if (isObj(old)) old.version = 1;
    }
    const p = sanitizeProgress(old);
    saveProgress(storage, p);
    return p;
  } catch {
    return defaultProgress();
  }
}

export function saveProgress(storage: Storage | null, p: Progress): void {
  if (!storage) return;
  try { storage.setItem(SAVE_KEY, JSON.stringify(p)); } catch { /* quota / private mode */ }
}

export function clearProgress(storage: Storage | null): void {
  if (!storage) return;
  try {
    storage.removeItem(SAVE_KEY);
    storage.removeItem(SAVE_KEY_V2);
    storage.removeItem(SAVE_KEY_V1);
  } catch { /* ignore */ }
}
