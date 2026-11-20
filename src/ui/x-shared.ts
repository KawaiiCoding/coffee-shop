/* Shared helpers for the UI extras (popups, recipes, konbini bar, calendar). */
import {
  characterSvg, decorSvg, dishSvg, furnitureSvg, homeItemSvg, iconSvg, productSvg, type IconName,
} from '../art';
import { FURNITURE_INFO } from '../content/progression';
import type {
  CharacterLook, DishId, GameApi, KonbiniStockId, Popup, Reward, SeasonEventDef, SeasonEventId,
} from '../types';
import { esc, icon, type UiIcon } from './util';
import { DAYS_PER_GAME_DAY } from '../engine/calendar';

/* ------------------------------ icons ------------------------------ */
let unknownSvg: string | null = null;
const iconCache = new Map<string, string>();

/** Raw svg for an icon the art module may or may not draw yet ('' when it doesn't). */
function rawIcon(name: string): string {
  const hit = iconCache.get(name);
  if (hit !== undefined) return hit;
  let svg = '';
  try { svg = iconSvg(name as IconName, 48); } catch { svg = ''; }
  if (svg && name !== 'star_empty') {
    if (unknownSvg === null) { try { unknownSvg = iconSvg('star_empty', 48); } catch { unknownSvg = ''; } }
    if (svg === unknownSvg) svg = '';
  }
  iconCache.set(name, svg);
  return svg;
}

/** Icon span trying several art names in order, then a known UI icon as fallback. */
export function xIcon(names: string[], fallback: UiIcon, cls = ''): string {
  for (const n of names) {
    const svg = rawIcon(n);
    if (svg) return `<span class="ico ico-${esc(n)} ${cls}" aria-hidden="true">${svg}</span>`;
  }
  return icon(fallback, cls);
}

export const payIcon = (cls = '') => xIcon(['pay'], 'purse', cls);
export const coinIcon = (cls = '') => icon('coin', cls);

/* ------------------------------ pictures ------------------------------ */
function tryArt(fn: () => string): string {
  try { return fn() || ''; } catch { return ''; }
}

/** A picture box; falls back to a soft dot with the first letter when the art is missing. */
export function pic(markup: () => string, label: string, cls: string): string {
  const s = tryArt(markup);
  if (s) return `<span class="x-pic ${cls}" aria-hidden="true">${s}</span>`;
  const ch = esc((label.trim()[0] || '?').toUpperCase());
  return `<span class="x-pic x-pic-fb ${cls}" aria-hidden="true"><b>${ch}</b></span>`;
}

/* ------------------------------ names ------------------------------ */
export const pretty = (id: string): string => {
  const s = id.replace(/_/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export function dishName(game: GameApi, id: DishId): string {
  return game.catalog.dishes?.find((d) => d.id === id)?.name ?? pretty(id);
}

export function stockDef(game: GameApi, id: KonbiniStockId): { name: string; price: number; kind: 'ingredient' | 'snack' | 'good' } {
  const c = game.catalog;
  const i = c.ingredients?.find((d) => d.id === id);
  if (i) return { name: i.name, price: i.price, kind: 'ingredient' };
  const s = c.snacks?.find((d) => d.id === id);
  if (s) return { name: s.name, price: s.price, kind: 'snack' };
  const g = c.goods?.find((d) => d.id === id);
  if (g) return { name: g.name, price: g.price, kind: 'good' };
  return { name: pretty(id), price: 0, kind: 'ingredient' };
}

export const productPic = (id: KonbiniStockId, name: string, cls: string) => pic(() => productSvg(id, 48), name, cls);
export const dishPic = (id: DishId, name: string, cls: string) => pic(() => dishSvg(id, 96), name, cls);

/* ------------------------------ looks ------------------------------ */
const MOM_LOOK: CharacterLook = {
  species: 'bear', color: '#c4916b', accessory: 'flower', accentColor: '#f4a9a8', hat: 'none',
};
const BUTTON_LOOK: CharacterLook = {
  species: 'cat', color: '#f6e6c8', accessory: 'bow', accentColor: '#9dbbe6', hat: 'none',
};

/** Portrait + display name for who a popup is from. */
export function popupFrom(game: GameApi, p: Popup): { art: string; name: string; star: boolean } {
  const from = p.from;
  if (from === 'star' || (!from && p.kind === 'wish')) {
    return { art: xIcon(['wish', 'star'], 'star', 'xp-big-ico'), name: 'A wish', star: true };
  }
  if (!from && p.kind === 'festival') {
    return { art: xIcon(['calendar'], 'calendar', 'xp-big-ico'), name: 'Festival', star: false };
  }
  if (!from) return { art: xIcon(['gift', 'star'], 'star', 'xp-big-ico'), name: '', star: false };
  let look: CharacterLook | undefined;
  let name = '';
  if (from === 'mom') { look = MOM_LOOK; name = 'Mom'; } else {
    const r = game.catalog.regulars?.find((x) => x.id === from);
    look = r?.look ?? (from === 'button' ? BUTTON_LOOK : undefined);
    name = r?.name ?? pretty(from);
  }
  const art = look ? tryArt(() => characterSvg(look!, 'happy', 120)) : '';
  return {
    art: art ? `<span class="xp-char" aria-hidden="true">${art}</span>` : xIcon(['gift'], 'heart', 'xp-big-ico'),
    name, star: false,
  };
}

/* ------------------------------ rewards ------------------------------ */
/** Small icon chip for a reward. */
export function rewardChip(game: GameApi, r: Reward): string {
  let picHtml = '';
  let label = '';
  switch (r.kind) {
    case 'pay': picHtml = payIcon(); label = `+${r.amount}`; break;
    case 'tips': picHtml = coinIcon(); label = `+${r.amount}`; break;
    case 'happiness': picHtml = icon('smile'); label = `+${r.amount}`; break;
    case 'book': picHtml = icon('book'); label = 'Book'; break;
    case 'furniture': {
      label = FURNITURE_INFO[r.id]?.name ?? pretty(r.id);
      picHtml = pic(() => furnitureSvg(r.id, 48), label, 'xr-pic');
      break;
    }
    case 'homeItem': {
      label = game.catalog.homeItems?.find((d) => d.id === r.id)?.name ?? pretty(r.id);
      picHtml = pic(() => homeItemSvg(r.id, 48), label, 'xr-pic');
      break;
    }
    case 'decor': {
      label = game.catalog.decor?.find((d) => d.id === r.id)?.name ?? pretty(r.id);
      picHtml = pic(() => decorSvg(r.id, game.state.theme, 48), label, 'xr-pic');
      break;
    }
    case 'ingredient': {
      const name = stockDef(game, r.id).name;
      picHtml = productPic(r.id, name, 'xr-pic');
      label = `${name} ×${r.amount}`;
      break;
    }
    case 'recipe': {
      const name = dishName(game, r.id);
      picHtml = dishPic(r.id, name, 'xr-pic');
      label = name;
      break;
    }
  }
  const tag = r.kind === 'recipe' ? '<small>Recipe</small>' : '';
  return `<li class="xr-chip xr-${r.kind}">${picHtml}<span class="xr-t">${tag}${esc(label)}</span></li>`;
}

/* ------------------------------ calendar ------------------------------ */
export const SEASON_NAME: Record<string, string> = { winter: 'Winter', spring: 'Spring', summer: 'Summer', autumn: 'Autumn' };

export function seasonOfMonth(m: number): 'winter' | 'spring' | 'summer' | 'autumn' {
  return m === 12 || m <= 2 ? 'winter' : m <= 5 ? 'spring' : m <= 8 ? 'summer' : 'autumn';
}

export function seasonIcon(season: string, cls = ''): string {
  return xIcon([season, `season_${season}`], season === 'winter' ? 'moon' : 'star', cls);
}

/** A festival sticker: the event's own icon if art has one, else its theme / season icon. */
export function eventSticker(ev: { id: SeasonEventId; theme?: string; month: number }, cls = ''): string {
  const names = [ev.id, `event_${ev.id}`];
  if (ev.theme) names.push(ev.theme);
  const s = seasonOfMonth(ev.month);
  names.push(s, `season_${s}`, 'gift');
  return xIcon(names, 'star', cls);
}

const dayNum = (y: number, m: number, d: number) => Math.round(Date.UTC(y, m - 1, d) / 86400000);

/** Days from `today` until the next occurrence of month/day (0 = today). */
export function daysUntil(today: { year: number; month: number; day: number }, month: number, day: number): number {
  const t = dayNum(today.year, today.month, today.day);
  let n = dayNum(today.year, month, day) - t;
  if (n < 0) n = dayNum(today.year + 1, month, day) - t;
  return n;
}

/** Work days until an event that is `n` calendar days away (the street's calendar hops a few days per work day). */
export const workDays = (n: number): number => Math.ceil(Math.max(0, n) / DAYS_PER_GAME_DAY);

export function countdown(name: string, n: number): string {
  const w = workDays(n);
  if (n <= 0) return `${name} is today!`;
  if (w <= 1) return `${name} is next!`;
  return `${name} in ${w} work days`;
}

export type EventLike = Pick<SeasonEventDef, 'id' | 'name' | 'month' | 'day' | 'blurb'> & { theme?: SeasonEventDef['theme'] };
