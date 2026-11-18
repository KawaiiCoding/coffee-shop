/* Progress persistence. Resilient to missing/corrupt JSON and throwing storage. */
import type { DecorId, DecorSlot, Progress, Settings, ThemeId, UpgradeId } from '../types';
import { DECOR, STARTER_DECOR, THEMES, UPGRADES } from './catalog';

export const SAVE_KEY = 'coffee-shop-save-v1';

export const DEFAULT_SETTINGS: Settings = {
  music: true, sfx: true, musicVolume: 0.6, sfxVolume: 0.8, hints: true,
};

const SLOTS: DecorSlot[] = ['ceiling', 'wall', 'back', 'corner', 'rug'];

export function defaultProgress(): Progress {
  return {
    version: 1,
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

const num = (v: unknown, fallback: number, min = -Infinity, max = Infinity): number =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback;
const bool = (v: unknown, fallback: boolean): boolean => (typeof v === 'boolean' ? v : fallback);

/** Validate an untrusted parsed object into a Progress, falling back field by field. */
export function sanitizeProgress(raw: unknown): Progress {
  const p = defaultProgress();
  if (!raw || typeof raw !== 'object') return p;
  const r = raw as Record<string, unknown>;
  if (r.version !== undefined && r.version !== 1) return p;
  p.coins = Math.floor(num(r.coins, 0, 0));
  p.day = Math.floor(num(r.day, 1, 1));
  p.totalServed = Math.floor(num(r.totalServed, 0, 0));
  if (r.upgrades && typeof r.upgrades === 'object') {
    for (const u of UPGRADES) {
      const lv = (r.upgrades as Record<string, unknown>)[u.id];
      const n = Math.floor(num(lv, 0, 0, u.costs.length));
      if (n > 0) p.upgrades[u.id as UpgradeId] = n;
    }
  }
  if (Array.isArray(r.ownedDecor)) {
    const ids = new Set<DecorId>(p.ownedDecor);
    for (const id of r.ownedDecor) if (DECOR.some((d) => d.id === id)) ids.add(id as DecorId);
    p.ownedDecor = [...ids];
  }
  if (r.placed && typeof r.placed === 'object') {
    const pl = r.placed as Record<string, unknown>;
    for (const slot of SLOTS) {
      const id = pl[slot];
      if (id === null) p.placed[slot] = null;
      else if (DECOR.some((d) => d.id === id && d.slot === slot) && p.ownedDecor.includes(id as DecorId)) {
        p.placed[slot] = id as DecorId;
      }
    }
  }
  if (r.theme === 'auto' || THEMES.some((t) => t.id === r.theme)) p.theme = r.theme as ThemeId | 'auto';
  if (r.settings && typeof r.settings === 'object') {
    const s = r.settings as Record<string, unknown>;
    p.settings = {
      music: bool(s.music, DEFAULT_SETTINGS.music),
      sfx: bool(s.sfx, DEFAULT_SETTINGS.sfx),
      musicVolume: num(s.musicVolume, DEFAULT_SETTINGS.musicVolume, 0, 1),
      sfxVolume: num(s.sfxVolume, DEFAULT_SETTINGS.sfxVolume, 0, 1),
      hints: bool(s.hints, DEFAULT_SETTINGS.hints),
    };
  }
  p.tutorialDone = bool(r.tutorialDone, false);
  return p;
}

export function loadProgress(storage: Storage | null): Progress {
  if (!storage) return defaultProgress();
  try {
    const txt = storage.getItem(SAVE_KEY);
    if (!txt) return defaultProgress();
    return sanitizeProgress(JSON.parse(txt));
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
  try { storage.removeItem(SAVE_KEY); } catch { /* ignore */ }
}
