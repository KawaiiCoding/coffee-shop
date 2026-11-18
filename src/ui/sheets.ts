/* HTML builders for the overlay screens and bottom sheets.
   All interactivity goes through data-act attributes handled in index.ts. */
import { decorSvg, itemSvg, titleArtSvg, upgradeSvg } from '../art';
import type { DecorSlot, DayStats, GameApi, MenuItemId, UpgradeId } from '../types';
import { homeItemsHtml, purse } from './screens';
import { art, esc, icon } from './util';

export type SheetKind = 'pause' | 'upgrades' | 'decor' | 'settings' | 'home';

export interface UiState {
  decorSlot: DecorSlot;
  confirmTitle: boolean;
  confirmReset: boolean;
}

export const SLOTS: { id: DecorSlot; label: string }[] = [
  { id: 'ceiling', label: 'Ceiling' },
  { id: 'wall', label: 'Wall' },
  { id: 'back', label: 'Back wall' },
  { id: 'corner', label: 'Corner' },
  { id: 'rug', label: 'Rug' },
];

export const SHEET_TITLES: Record<SheetKind, string> = {
  pause: 'Paused', upgrades: 'Upgrades', decor: 'Decorate', settings: 'Settings', home: 'Make it cozy',
};

const coins = (n: number) => `<span class="cost">${icon('coin')}<b>${esc(n)}</b></span>`;

/** Day shown in the UI: the running day while playing, otherwise the next day to play. */
export function displayDay(game: GameApi): number {
  const s = game.state;
  if (s.mode === 'playing' || s.mode === 'paused') return s.dayStats?.day || s.progress.day;
  if (s.mode === 'dayEnd' && s.lastDay) return s.lastDay.day;
  return s.progress.day;
}

/* ------------------------------ title ------------------------------ */
export function titleHtml(game: GameApi): string {
  const pic = art(() => titleArtSvg(game.state.theme), 'title-art');
  const fresh = !(game.state.progress.storySeen ?? []).includes('intro');
  return `
    <button class="ibtn title-settings" data-act="open" data-sheet="settings" aria-label="Settings">${icon('settings')}</button>
    <div class="title-inner">
      ${pic || '<span class="title-art title-art-fb" aria-hidden="true"><i></i></span>'}
      <h1 class="title-name">Coffee Shop</h1>
      <p class="title-sub">a cozy little café</p>
      <button class="btn btn-primary btn-big" data-act="start" data-focus="start">${
        fresh ? `${icon('play')}<span>Start the story</span>` : 'Open the café'}</button>
      <span class="day-pill"><span>Day ${esc(displayDay(game))}</span></span>
    </div>`;
}

/* ---------------------------- day end ---------------------------- */
export function dayEndHtml(game: GameApi, st: DayStats | null): string {
  const stats = st ?? game.state.dayStats;
  let stars = '';
  for (let i = 0; i < 3; i++) {
    const on = i < (stats?.stars ?? 0);
    stars += `<span class="star ${on ? 'on' : 'off'}" style="--i:${i}">${icon(on ? 'star' : 'star_empty')}</span>`;
  }
  const label = `${stats?.stars ?? 0} of 3 stars`;
  return `
    <div class="card dayend-card" role="dialog" aria-modal="false" aria-labelledby="dayend-h">
      <h2 id="dayend-h" class="card-h">Day ${esc(stats?.day ?? displayDay(game))} complete!</h2>
      <div class="stars" role="img" aria-label="${label}">${stars}</div>
      <ul class="stats">
        <li><span>Guests served</span><b>${esc(stats?.served ?? 0)}</b></li>
        <li><span>Left unhappy</span><b>${esc(stats?.lost ?? 0)}</b></li>
        <li><span>Tips earned</span><b>${coins(stats?.tips ?? 0)}</b></li>
        <li class="pay-line"><span>${icon('purse')}Your pay</span><b>${purse(stats?.salary ?? 0, '+')}</b></li>
      </ul>
      <div class="row dayend-go">
        <button class="btn btn-soft" data-act="start" data-focus="next">Next day</button>
        <button class="btn btn-primary btn-go" data-act="go-home" data-focus="start">${icon('home')}<span>Go home</span></button>
      </div>
      <div class="quick">
        <button class="btn btn-soft" data-act="open" data-sheet="upgrades">${icon('shop')}<span>Upgrades</span></button>
        <button class="btn btn-soft" data-act="open" data-sheet="decor">${icon('decor')}<span>Decorate</span></button>
      </div>
    </div>`;
}

/* ----------------------------- pause ----------------------------- */
function pauseHtml(ui: UiState): string {
  return `
    <div class="stack">
      <button class="btn btn-primary btn-big" data-act="resume" data-focus="resume">${icon('play')}<span>Resume</span></button>
      <button class="btn btn-soft" data-act="open" data-sheet="settings">${icon('settings')}<span>Settings</span></button>
      ${ui.confirmTitle ? `
        <div class="confirm" role="group" aria-label="Leave this day?">
          <p>Go to the main menu? This day will end and its guests will leave. Coins you collected are kept.</p>
          <div class="row">
            <button class="btn btn-soft" data-act="title-cancel" data-focus="title-cancel">Stay</button>
            <button class="btn btn-danger" data-act="title-yes">Leave</button>
          </div>
        </div>`
    : '<button class="btn btn-ghost" data-act="title-ask" data-focus="title-ask">Back to main menu</button>'}
    </div>`;
}

/* ---------------------------- upgrades ---------------------------- */
const MENU_ITEM: Partial<Record<UpgradeId, MenuItemId>> = {
  menu_cocoa: 'cocoa', menu_matcha: 'matcha', menu_cake: 'cake', menu_cookie: 'cookie',
};

function upgradesHtml(game: GameApi): string {
  const have = game.state.progress.coins;
  const cards = game.catalog.upgrades.map((u) => {
    const lvl = safe(() => game.upgradeLevel(u.id), 0);
    const max = u.costs.length;
    const maxed = lvl >= max;
    const cost = maxed ? 0 : u.costs[lvl];
    const afford = !maxed && have >= cost;
    let pips = '';
    for (let i = 0; i < max; i++) pips += `<i class="${i < lvl ? 'on' : ''}"></i>`;
    const mi = MENU_ITEM[u.id];
    const pic = art(() => upgradeSvg(u.id, 56), 'up-pic') || (mi ? art(() => itemSvg(mi, 56), 'up-pic') : '');
    const btnLabel = maxed ? 'Maxed' : afford ? 'Buy' : 'Need more';
    return `
      <li class="up-card ${maxed ? 'maxed' : ''} ${pic ? 'has-pic' : ''}" data-card="${esc(u.id)}">
        ${pic}
        <div class="up-body">
          <h3>${esc(u.name)}</h3>
          <p>${esc(u.description)}</p>
          <div class="pips" role="img" aria-label="Level ${lvl} of ${max}">${pips}</div>
        </div>
        <div class="up-buy">
          ${maxed ? `<span class="maxed-tag">${icon('check')}Max</span>` : coins(cost)}
          <button class="btn btn-small ${afford ? 'btn-primary' : 'btn-off'}" data-act="buy-up" data-id="${esc(u.id)}"
            data-focus="up-${esc(u.id)}" ${afford ? '' : 'disabled'}
            aria-label="${esc(btnLabel === 'Buy' ? `Buy ${u.name} for ${cost} coins` : `${u.name}: ${btnLabel}`)}">${btnLabel}</button>
        </div>
      </li>`;
  }).join('');
  return `
    <div class="sheet-wallet">You have ${coins(have)}</div>
    <ul class="up-list">${cards || '<li class="empty">No upgrades yet.</li>'}</ul>`;
}

/* ----------------------------- decor ----------------------------- */
function decorHtml(game: GameApi, ui: UiState): string {
  const p = game.state.progress;
  const charm = safe(() => game.charm(), 0);
  const tabs = SLOTS.map((s) => `
    <button class="seg ${s.id === ui.decorSlot ? 'on' : ''}" role="tab" aria-selected="${s.id === ui.decorSlot}"
      data-act="slot" data-id="${s.id}" data-focus="slot-${s.id}">${s.label}</button>`).join('');
  const items = game.catalog.decor.filter((d) => d.slot === ui.decorSlot).map((d) => {
    const owned = p.ownedDecor.includes(d.id);
    const placed = p.placed?.[d.slot] === d.id;
    const afford = p.coins >= d.cost;
    const pic = art(() => decorSvg(d.id, game.state.theme, 72), 'dec-pic');
    const status = placed
      ? `<span class="tag tag-placed">${icon('check')}Placed</span>`
      : owned ? '<span class="tag tag-owned">Owned</span>'
        : `<span class="tag ${afford ? '' : 'tag-poor'}">${coins(d.cost)}</span>`;
    const hearts = `<span class="charm" aria-label="${d.charm} charm">${icon('heart')}<b>${esc(d.charm)}</b></span>`;
    const label = placed ? `${d.name}, placed`
      : owned ? `Place ${d.name}` : `Buy ${d.name} for ${d.cost} coins`;
    return `
      <li>
        <button class="dec-card ${placed ? 'placed' : ''} ${owned ? 'owned' : ''} ${!owned && !afford ? 'poor' : ''}"
          data-act="decor" data-id="${esc(d.id)}" data-focus="dec-${esc(d.id)}" aria-label="${esc(label)}"
          ${placed ? 'aria-pressed="true"' : ''}>
          ${pic || '<span class="dec-pic dec-pic-fb" aria-hidden="true"></span>'}
          <span class="dec-name">${esc(d.name)}</span>
          <span class="dec-meta">${hearts}${status}</span>
        </button>
      </li>`;
  }).join('');
  return `
    <div class="charm-box">
      <div class="charm-total">${icon('heart')}<b>${esc(charm)}</b><span>charm</span></div>
      <p>Charm brings more guests and bigger tips</p>
    </div>
    <div class="sheet-wallet">You have ${coins(p.coins)}</div>
    <div class="segs" role="tablist" aria-label="Decor spot">${tabs}</div>
    <ul class="dec-grid" role="tabpanel">${items || '<li class="empty">Nothing here yet.</li>'}</ul>`;
}

/* ---------------------------- settings ---------------------------- */
function sw(key: string, label: string, on: boolean, ic: string): string {
  return `
    <button class="switch-row" role="switch" aria-checked="${on}" data-act="toggle" data-id="${key}" data-focus="sw-${key}">
      ${ic}<span class="sw-label">${label}</span><span class="switch" aria-hidden="true"><i></i></span>
    </button>`;
}

function settingsHtml(game: GameApi, ui: UiState): string {
  const s = game.state.progress.settings;
  const theme = game.state.progress.theme;
  const seasons = [{ id: 'auto', name: 'Auto' }, ...game.catalog.themes.map((t) => ({ id: t.id, name: t.name }))]
    .map((t) => `<button class="seg ${theme === t.id ? 'on' : ''}" role="radio" aria-checked="${theme === t.id}"
      data-act="theme" data-id="${esc(t.id)}" data-focus="th-${esc(t.id)}">${esc(t.name)}</button>`).join('');
  const vol = (key: 'musicVolume' | 'sfxVolume', label: string, v: number, enabled: boolean) => `
    <label class="slider-row ${enabled ? '' : 'dim'}">
      <span class="sr-only">${label}</span>
      <input type="range" min="0" max="1" step="0.05" value="${v}" data-vol="${key}" aria-label="${label}">
    </label>`;
  return `
    <div class="set-group">
      ${sw('music', 'Music', s.music, icon(s.music ? 'music' : 'music_off'))}
      ${vol('musicVolume', 'Music volume', s.musicVolume, s.music)}
      ${sw('sfx', 'Sound effects', s.sfx, icon(s.sfx ? 'sound' : 'sound_off'))}
      ${vol('sfxVolume', 'Sound effects volume', s.sfxVolume, s.sfx)}
      ${sw('hints', 'Hints', s.hints, icon('star'))}
    </div>
    <h3 class="set-h">Season</h3>
    <div class="segs segs-wrap" role="radiogroup" aria-label="Season">${seasons}</div>
    <div class="set-group set-danger">
      ${ui.confirmReset ? `
        <div class="confirm" role="group" aria-label="Reset progress?">
          <p>Erase coins, upgrades and decor? This can't be undone.</p>
          <div class="row">
            <button class="btn btn-soft" data-act="reset-cancel" data-focus="reset-cancel">Keep</button>
            <button class="btn btn-danger" data-act="reset-yes">Erase</button>
          </div>
        </div>`
    : '<button class="btn btn-ghost" data-act="reset-ask" data-focus="reset-ask">Reset progress</button>'}
    </div>
    <p class="credits">Music: add your jazz tracks in public/music</p>`;
}

export function sheetBodyHtml(kind: SheetKind, game: GameApi, ui: UiState): string {
  switch (kind) {
    case 'pause': return pauseHtml(ui);
    case 'upgrades': return upgradesHtml(game);
    case 'decor': return decorHtml(game, ui);
    case 'settings': return settingsHtml(game, ui);
    case 'home': return homeItemsHtml(game);
  }
}

function safe<T>(f: () => T, d: T): T {
  try { return f(); } catch { return d; }
}
