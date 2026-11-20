/* HTML builders for the UI extras. Pure functions of game state. */
import type { DishDef, DishId, GameApi, IngredientId, KonbiniStockId, Popup, SnackId } from '../types';
import { priceOf } from '../engine/konbini';
import { DAYS_PER_GAME_DAY } from '../engine/calendar';
import { productSvg } from '../art';
import { esc, icon } from './util';
import {
  countdown, daysUntil, workDays, dishName, dishPic, eventSticker, payIcon, pic, popupFrom, productPic,
  rewardChip, SEASON_NAME, seasonIcon, stockDef, xIcon, type EventLike,
} from './x-shared';

/* -------------------------------- popup -------------------------------- */
const KIND_TAG: Record<Popup['kind'], string> = {
  gift: 'A gift!', unlock: 'New!', chapter: 'Chapter done!', wish: 'Wish come true', festival: 'Festival',
  secret: 'New journal page!',
};

export function popupHtml(game: GameApi, p: Popup): string {
  const f = popupFrom(game, p);
  const from = f.name && p.kind === 'gift' ? `From ${f.name}` : f.name;
  const chips = (p.rewards ?? []).map((r) => rewardChip(game, r)).join('');
  const isChapter = p.kind === 'chapter';
  const tag = isChapter
    ? (p.dream ? 'A dream came true!' : p.chapter ? `Chapter ${p.chapter} complete!` : 'Chapter done!')
    : KIND_TAG[p.kind] ?? '';
  const art = isChapter
    ? `<span class="xp-medal" aria-hidden="true">${xIcon([p.dream ? 'bike' : 'goal', 'star'], 'star', 'xp-big-ico')}</span>`
    : f.art;
  const next = isChapter
    ? (p.next ? `<p class="xp-next"><small>Next chapter</small><b>${esc(p.next)}</b></p>` : '<p class="xp-next"><b>The whole story, told. Thank you for playing!</b></p>')
    : '';
  return `
    <div class="xp-backdrop"></div>
    <div class="xp-card card xp-${p.kind}${f.star ? ' xp-star' : ''}${p.dream ? ' xp-dream' : ''}" role="dialog" aria-modal="true"
         aria-labelledby="xp-h" aria-describedby="xp-p" tabindex="-1">
      <span class="xp-tag">${esc(tag)}</span>
      <div class="xp-from">
        <span class="xp-halo">${art}</span>
        ${from && !isChapter ? `<span class="xp-name">${esc(from)}</span>` : ''}
      </div>
      <h2 id="xp-h" class="xp-title">${esc(p.title)}</h2>
      ${p.text ? `<p id="xp-p" class="xp-text">${esc(p.text)}</p>` : ''}
      ${chips ? `<ul class="xr-list" aria-label="You got">${chips}</ul>` : ''}
      ${next}
      <button class="btn btn-primary btn-big xp-yay" data-x="yay" data-xf="yay">${isChapter ? 'Hooray!' : 'Yay!'}</button>
    </div>`;
}

/* --------------------------- shop product card --------------------------- */
/** Tap a shelf in Hoshi Mart: the product shown big with its name, price and what it is for. */
export function productCardHtml(game: GameApi, id: KonbiniStockId): string {
  const d = stockDef(game, id);
  const c = game.catalog;
  let price = d.price;
  try { price = priceOf(id); } catch { /* keep list price */ }
  const onSale = price < d.price;
  let kind = '', what = '';
  if (d.kind === 'ingredient') {
    kind = 'Ingredient';
    const known = new Set(game.state.progress.recipes ?? []);
    const uses = (c.dishes ?? []).filter((x) => (x.ingredients as Record<string, number>)[id]);
    const mine = uses.filter((x) => known.has(x.id)).map((x) => x.name);
    what = mine.length ? `For cooking: ${mine.join(', ')}.`
      : uses.length ? 'For cooking. You will learn a recipe for it later.' : 'For cooking at home.';
  } else if (d.kind === 'snack') {
    kind = 'Snack';
    what = 'Ready to eat at home (tap Eat).';
  } else {
    kind = 'Little treat';
    what = id === 'book' ? 'A storybook to read in the armchair at home.' : 'Makes Mocha happy right away.';
  }
  const sn = c.snacks.find((x) => x.id === id);
  const gd = c.goods.find((x) => x.id === id);
  const stats = sn ? statTags(sn.energy, sn.happiness) : gd && id !== 'book' ? statTags(0, gd.happiness) : '';
  const have = (game.state.progress.home?.pantry as Record<string, number> | undefined)?.[id] ?? 0;
  const wallet = game.state.progress.home?.wallet ?? 0;
  return `
    <div class="xi-backdrop" data-x="card-close"></div>
    <div class="xi-card card" role="dialog" aria-modal="true" aria-labelledby="xi-h" tabindex="-1">
      <button class="ibtn xi-x" data-x="card-close" aria-label="Close">${icon('close')}</button>
      <span class="xi-kind">${esc(kind)}</span>
      ${pic(() => productSvg(id, 160), d.name, 'xi-pic')}
      <h2 id="xi-h" class="xi-name">${esc(d.name)}</h2>
      <p class="xi-what">${esc(what)}</p>
      ${stats ? `<div class="xs-stats xi-stats">${stats}</div>` : ''}
      ${have > 0 ? `<p class="xi-have">You have ${have} at home</p>` : ''}
      <div class="xi-buy">
        <span class="xi-price${price > wallet ? ' poor' : ''}" aria-label="${esc(`Price ${price} pay`)}">${payIcon()}<b>${price}</b>${onSale ? `<s>${d.price}</s><i>Sale!</i>` : ''}</span>
        <button class="btn btn-primary xi-add" data-x="card-add" data-xf="xi-add">${xIcon(['basket'], 'shop')}<span>Add to basket</span></button>
      </div>
    </div>`;
}

/* ------------------------------- recipes ------------------------------- */
export type RecipeTab = 'recipes' | 'snacks';

function sheetHead(title: string): string {
  return `<div class="sheet-head xs-head">
      <h2 id="xs-h">${esc(title)}</h2>
      <button class="ibtn" data-x="close" data-xf="close" aria-label="Close">${icon('close')}</button>
    </div>`;
}

function statTags(energy: number, happiness: number): string {
  const t = (ico: string, n: number, cls: string) => n
    ? `<span class="tag xs-stat ${cls}">${ico}${n > 0 ? '+' : ''}${n}</span>` : '';
  return t(icon('energy'), energy, 'xs-en') + t(icon('smile'), happiness, 'xs-ha');
}

function dishCard(game: GameApi, d: DishDef, pantry: Partial<Record<string, number>>): { html: string; ok: boolean } {
  let can: { ok: boolean; missing: Partial<Record<IngredientId, number>> } = { ok: false, missing: {} };
  try { can = game.canCook(d.id); } catch { /* engine not ready */ }
  const chips = (Object.keys(d.ingredients) as IngredientId[]).map((id) => {
    const need = d.ingredients[id] ?? 0;
    const have = pantry[id] ?? 0;
    const miss = (can.missing?.[id] ?? 0) > 0 || have < need;
    const name = stockDef(game, id).name;
    return `<li class="xs-ing${miss ? ' miss' : ''}" title="${esc(name)}">
        ${productPic(id, name, 'xs-ing-pic')}<span class="sr-only">${esc(name)}</span>
        <b>${Math.min(have, 99)}/${need}</b></li>`;
  }).join('');
  const name = d.name || dishName(game, d.id);
  return {
    ok: can.ok,
    html: `<li class="xs-card${can.ok ? ' ok' : ''}" data-xcard="${esc(d.id)}">
      ${dishPic(d.id, name, 'xs-dish')}
      <div class="xs-body">
        <h3>${esc(name)}</h3>
        <div class="xs-stats">${statTags(d.energy, d.happiness)}</div>
        <ul class="xs-ings" aria-label="Ingredients">${chips}</ul>
      </div>
      <button class="btn btn-small ${can.ok ? 'btn-primary' : ''} xs-cook" data-x="cook" data-id="${esc(d.id)}"
        data-xf="cook-${esc(d.id)}" ${can.ok ? '' : 'aria-disabled="true"'}>${icon('pot')}Cook</button>
    </li>`,
  };
}

export function recipesHtml(game: GameApi, tab: RecipeTab): string {
  const p = game.state.progress;
  const h = p.home;
  const pantry = (h?.pantry ?? {}) as Partial<Record<string, number>>;
  const segs = `<div class="segs xs-segs" role="tablist">
      <button class="seg${tab === 'recipes' ? ' on' : ''}" role="tab" aria-selected="${tab === 'recipes'}" data-x="tab" data-id="recipes" data-xf="tab-recipes">Recipes</button>
      <button class="seg${tab === 'snacks' ? ' on' : ''}" role="tab" aria-selected="${tab === 'snacks'}" data-x="tab" data-id="snacks" data-xf="tab-snacks">Snacks</button>
    </div>`;
  let body = '';
  if (tab === 'recipes') {
    const known = new Set<DishId>(p.recipes ?? []);
    const defs = (game.catalog.dishes ?? []).filter((d) => known.has(d.id));
    // Recipes the catalogue doesn't describe yet still show (no ingredients).
    for (const id of known) if (!defs.some((d) => d.id === id)) defs.push({ id, name: dishName(game, id), ingredients: {}, energy: 0, happiness: 0 });
    const cards = defs.map((d) => dishCard(game, d, pantry));
    const anyOk = cards.some((c) => c.ok);
    const meal = h?.meal ? `<p class="xs-note">${icon('heart')}${esc(dishName(game, h.meal))} is ready to eat!</p>` : '';
    const hint = anyOk ? '' : `<div class="xs-hint">${xIcon(['basket'], 'shop')}<span>Buy ingredients at Hoshi Mart</span>
        ${p.konbiniOpen ? `<button class="btn btn-small btn-soft" data-x="mart" data-xf="mart">Go</button>` : ''}</div>`;
    body = meal + hint + (cards.length
      ? `<ul class="xs-list">${cards.map((c) => c.html).join('')}</ul>`
      : '<p class="empty">No recipes yet.</p>');
  } else {
    const eat = typeof game.eatSnack === 'function';
    const snacks = (game.catalog.snacks ?? []).filter((s) => (pantry[s.id] ?? 0) > 0);
    body = snacks.length ? `<ul class="xs-list">${snacks.map((s) => `
        <li class="xs-card xs-snack" data-xcard="${esc(s.id)}">
          ${productPic(s.id as SnackId, s.name, 'xs-dish')}
          <div class="xs-body"><h3>${esc(s.name)} <small>×${pantry[s.id]}</small></h3>
            <div class="xs-stats">${statTags(s.energy, s.happiness)}</div></div>
          ${eat ? `<button class="btn btn-small btn-primary xs-cook" data-x="snack" data-id="${esc(s.id)}" data-xf="snack-${esc(s.id)}">Eat</button>` : ''}
        </li>`).join('')}</ul>`
      : `<div class="xs-hint">${xIcon(['basket'], 'shop')}<span>No snacks. Hoshi Mart has some!</span></div>`;
  }
  return sheetHead(tab === 'snacks' ? 'Snack time!' : 'What shall we cook?') + `<div class="sheet-body xs-body-scroll">${segs}${body}</div>`;
}

/* ------------------------------- calendar ------------------------------- */
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WD = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function events(game: GameApi): EventLike[] {
  const list: EventLike[] = [...(game.catalog.seasonEvents ?? [])];
  const c = game.state.calendar;
  if (!list.length && c?.next) {
    const t = new Date(Date.UTC(c.date.year, c.date.month - 1, c.date.day + c.next.daysLeft));
    list.push({ id: c.next.id, name: c.next.name, blurb: c.next.blurb, month: t.getUTCMonth() + 1, day: t.getUTCDate() });
  }
  return list;
}

export function calendarHtml(game: GameApi): string {
  const c = game.state.calendar;
  const now = new Date();
  const date = c?.date ?? { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate(), weekday: now.getDay() };
  const season = c?.season ?? 'winter';
  const evs = events(game);
  const { year, month, day } = date;
  const first = new Date(year, month - 1, 1).getDay();
  const count = new Date(year, month, 0).getDate();
  const byDay = new Map<number, EventLike>();
  for (const e of evs) if (e.month === month) byDay.set(e.day, e);

  let cells = WD.map((w) => `<span class="xc-wd" aria-hidden="true">${w}</span>`).join('');
  for (let i = 0; i < first; i++) cells += '<span class="xc-cell xc-pad" aria-hidden="true"></span>';
  for (let d = 1; d <= count; d++) {
    const ev = byDay.get(d);
    const cls = ['xc-cell', d === day ? 'today' : '', d < day ? 'past' : '', ev ? 'ev' : ''].filter(Boolean).join(' ');
    const label = `${MONTHS[month - 1]} ${d}${d === day ? ', today' : ''}${ev ? `, ${ev.name}` : ''}`;
    cells += `<span class="${cls}"><span class="sr-only">${esc(label)}</span><b aria-hidden="true">${d}</b>${ev ? eventSticker(ev, 'xc-stk') : ''}</span>`;
  }

  const up = evs.map((e) => ({ e, n: daysUntil(date, e.month, e.day) }))
    .sort((a, b) => a.n - b.n).slice(0, 4);
  const today = c?.today ? evs.find((e) => e.id === c.today) : undefined;
  const upcoming = up.length ? `<h3 class="set-h xc-h">Upcoming</h3><ul class="xc-up">${up.map(({ e, n }) => `
      <li class="xc-ev${n === 0 ? ' now' : ''}">
        ${eventSticker(e, 'xc-ev-ico')}
        <div><b>${esc(countdown(e.name, n))}</b>${e.blurb ? `<small>${esc(e.blurb)}</small>` : ''}</div>
        ${n > 0 ? `<span class="xc-n" aria-hidden="true">${workDays(n)}<small>d</small></span>` : ''}
      </li>`).join('')}</ul>` : '';

  return sheetHead('Calendar') + `<div class="sheet-body">
      <div class="xc-top">
        <span class="xc-season xc-${season}">${seasonIcon(season)}${esc(SEASON_NAME[season] ?? season)}</span>
        <span class="xc-month">${esc(MONTHS[month - 1])} <small>Year ${Math.max(1, year - 2023)}</small></span>
      </div>
      ${today ? `<p class="xs-note xc-today">${eventSticker(today)}Today is ${esc(today.name)}!</p>` : ''}
      <div class="xc-grid" role="group" aria-label="${esc(`${MONTHS[month - 1]} ${year}`)}">${cells}</div>
      ${upcoming}
      <p class="xc-note">Time flies on Yarn Street: each work day hops ${DAYS_PER_GAME_DAY} days on the calendar, so the seasons keep changing.</p>
    </div>`;
}

/* ------------------------------- konbini bar ------------------------------- */
export function konbiniHtml(game: GameApi, bumped: Set<string>): string {
  const s = game.state;
  const basket = s.konbini?.basket ?? [];
  const total = game.basketTotal();
  const wallet = s.progress.home?.wallet ?? 0;
  const poor = total > wallet;
  const items = basket.length ? basket.map((b) => {
    const d = stockDef(game, b.id);
    return `<li><button class="xk-item${bumped.has(b.id) ? ' xk-pop' : ''}" data-x="unbasket" data-id="${esc(b.id)}"
        data-xf="kb-${esc(b.id)}" aria-label="Put back ${esc(d.name)} (${b.qty})">
        ${productPic(b.id, d.name, 'xk-pic')}${b.qty > 1 ? `<b class="xk-q">×${b.qty}</b>` : ''}
        <i class="xk-x" aria-hidden="true">${icon('close')}</i></button></li>`;
  }).join('') : `<li class="xk-empty">Tap a shelf to shop!</li>`;
  // one compact row: [home] [basket thumbnails, scroll sideways] [total over a small pay button]
  return `
    <button class="ibtn xk-home" data-x="home" data-xf="kb-home" aria-label="Walk home">${icon('home')}</button>
    <ul class="xk-items" aria-label="Basket">${items}</ul>
    <div class="xk-side">
      <span class="xk-total${poor ? ' poor' : ''}" aria-label="Total ${total}, you have ${wallet}">
        ${payIcon()}<b>${total}</b><small>/ ${wallet}</small></span>
      <button class="btn btn-primary xk-pay" data-x="pay" data-xf="kb-pay" ${basket.length ? '' : 'disabled'}
        aria-label="Pay at the counter">${payIcon()}Pay</button>
    </div>`;
}
