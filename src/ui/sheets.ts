/* HTML builders for the overlay screens and bottom sheets.
   All interactivity goes through data-act attributes handled in index.ts. */
import {
  character, counterBack, counterFront, decor, decorSvg, itemSvg, roomBack, sceneDefs, seat, table, titleArtSvg, upgradeSvg,
} from '../art';
import { BARISTA_LOOK } from '../engine/looks';
import { DAYS_PER_GAME_DAY } from '../engine/calendar';
import { BARISTA, DECOR_ANCHOR, TABLES } from '../layout';
import type { DecorId, DecorSlot, DayStats, GameApi, MenuItemId, TableStyle, ThemeId, UpgradeId } from '../types';
import { coins, currentGoal, goalChipHtml, homeItemsHtml, pay } from './screens';
import { art, esc, firstIcon, icon } from './util';

export type SheetKind = 'pause' | 'upgrades' | 'decor' | 'settings' | 'home' | 'help';

export type UpgradeTab = 'cafe' | 'menu' | 'style';

export interface UiState {
  decorSlot: DecorSlot;
  confirmTitle: boolean;
  confirmReset: boolean;
  /** Selected tab in the Upgrades sheet. */
  upTab?: UpgradeTab;
  /** Decor item shown in the Decor sheet's café preview (null = the café as it is). */
  decorPreview?: DecorId | null;
  /** One-time pointer at the Upgrades / Decorate buttons on the day-complete card. */
  coachShop?: boolean;
}

export const SLOTS: { id: DecorSlot; label: string }[] = [
  { id: 'ceiling', label: 'Ceiling' },
  { id: 'wall', label: 'Wall' },
  { id: 'back', label: 'Back wall' },
  { id: 'corner', label: 'Corner' },
  { id: 'rug', label: 'Rug' },
];

export const SHEET_TITLES: Record<SheetKind, string> = {
  pause: 'Paused', upgrades: 'Upgrades', decor: 'Decorate', settings: 'Settings', home: 'Make it cozy', help: 'How to play',
};

/** "You have [coin] 120 Café coins" line at the top of café shops. */
const coinWallet = (n: number) => `<div class="sheet-wallet">You have ${coins(n)}<span class="cur-name cur-coin">Café coins</span></div>`;

/** Little "Christmas in 12 days" chip (title screen) when a season event is ≤ 30 days away. */
export function calendarChipHtml(game: GameApi): string {
  const c = game.state.calendar;
  const n = c?.next;
  const today = c?.today ? game.catalog.seasonEvents?.find((e) => e.id === c.today) : null;
  let text = '', id = '';
  if (today) { text = `${today.name} today!`; id = today.id; }
  else if (n && n.daysLeft <= 30) {
    id = n.id;
    const w = Math.ceil(n.daysLeft / DAYS_PER_GAME_DAY);
    text = n.daysLeft <= 0 ? `${n.name} today!` : w <= 1 ? `${n.name} is next!` : `${n.name} in ${w} work days`;
  }
  if (!text) return '';
  const ic = firstIcon([id, c.season, 'calendar']);
  return `<button class="cal-chip" data-act="calendar" data-focus="cal-chip" aria-label="${esc(`${text} Open the calendar`)}">${icon(ic)}<span>${esc(text)}</span></button>`;
}

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
    <button class="ibtn title-help" data-act="open" data-sheet="help" aria-label="How to play"><b aria-hidden="true">?</b></button>
    <div class="title-inner">
      ${pic || '<span class="title-art title-art-fb" aria-hidden="true"><i></i></span>'}
      <h1 class="title-name">Coffee Shop</h1>
      <p class="title-sub">a cozy little café</p>
      <button class="btn btn-primary btn-big" data-act="start" data-focus="start">${
        fresh ? `${icon('play')}<span>Start the story</span>` : 'Open the café'}</button>
      <span class="day-pill"><span>Day ${esc(displayDay(game))}</span></span>
      ${safe(() => calendarChipHtml(game), '')}
    </div>`;
}

/* ---------------------------- day end ---------------------------- */
export function dayEndHtml(game: GameApi, st: DayStats | null, ui?: UiState): string {
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
        <li class="tips-line"><span>Tips <small class="cur-name cur-coin">Café coins</small></span><b>${coins(stats?.tips ?? 0, '+')}</b></li>
        <li class="pay-line"><span>Your pay</span><b>${pay(stats?.salary ?? 0, '+')}</b></li>
        ${stats?.treat ? `<li class="treat-line"><span>Snack from Button</span><b>${esc(game.catalog.snacks.find((x) => x.id === stats.treat)?.name ?? 'Snack')}</b></li>` : ''}
      </ul>
      ${goalChipHtml(safe(() => currentGoal(game), null), 'on-card')}
      <div class="row dayend-go">
        <button class="btn btn-soft" data-act="start" data-focus="next">Next day</button>
        <button class="btn btn-primary btn-go" data-act="go-home" data-focus="start">${icon('home')}<span>Go home</span></button>
      </div>
      <div class="quick ${ui?.coachShop ? 'coach' : ''}">
        ${ui?.coachShop ? `<span class="coach-tip" aria-hidden="true">Spend your tips ${icon('coin')} here!</span>` : ''}
        <button class="btn btn-soft" data-act="open" data-sheet="upgrades">${icon('shop')}<span>Upgrades</span></button>
        <button class="btn btn-soft" data-act="open" data-sheet="decor">${icon('decor')}<span>Decorate</span></button>
        <button class="btn btn-soft btn-help" data-act="open" data-sheet="help" aria-label="How to play"><b aria-hidden="true">?</b></button>
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
          <p>Go to the main menu? This day will end and its guests will leave. Café coins you collected are kept.</p>
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

export const UPGRADE_TABS: { id: UpgradeTab; label: string }[] = [
  { id: 'cafe', label: 'Café' },
  { id: 'menu', label: 'Menu' },
  { id: 'style', label: 'Style' },
];
/** Which tab an upgrade lives in (anything unlisted goes to "Café"). */
const UP_TAB: Partial<Record<UpgradeId, UpgradeTab>> = {
  menu_cocoa: 'menu', menu_matcha: 'menu', menu_cake: 'menu', menu_cookie: 'menu', table_style: 'style',
};
const upTabOf = (id: UpgradeId): UpgradeTab => UP_TAB[id] ?? 'cafe';

function upgradesHtml(game: GameApi, ui: UiState): string {
  const have = game.state.progress.coins;
  const tab = ui.upTab ?? 'cafe';
  const info = game.catalog.upgrades.map((u) => {
    const lvl = safe(() => game.upgradeLevel(u.id), 0);
    const max = u.costs.length;
    const maxed = lvl >= max;
    const cost = maxed ? 0 : u.costs[lvl];
    return { u, lvl, max, maxed, cost, afford: !maxed && have >= cost };
  });
  const tabs = UPGRADE_TABS.map((t) => {
    const on = t.id === tab;
    const dot = info.some((x) => x.afford && upTabOf(x.u.id) === t.id);
    return `
    <button class="seg up-tab ${on ? 'on' : ''}" role="tab" aria-selected="${on}"
      data-act="up-tab" data-id="${t.id}" data-focus="uptab-${t.id}"
      aria-label="${esc(dot ? `${t.label}, something you can buy` : t.label)}">${esc(t.label)}${
      dot ? '<i class="seg-dot" aria-hidden="true"></i>' : ''}</button>`;
  }).join('');
  const cards = info.filter((x) => upTabOf(x.u.id) === tab).map(({ u, lvl, max, maxed, cost, afford }) => {
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
            aria-label="${esc(btnLabel === 'Buy' ? `Buy ${u.name} for ${cost} café coins` : `${u.name}: ${btnLabel}`)}">${btnLabel}</button>
        </div>
      </li>`;
  }).join('');
  return `
    ${coinWallet(have)}
    <div class="segs up-tabs" role="tablist" aria-label="Upgrade kind">${tabs}</div>
    <ul class="up-list" role="tabpanel">${cards || '<li class="empty">No upgrades yet.</li>'}</ul>`;
}

/* ----------------------------- decor ----------------------------- */
/* Live café preview at the top of the Decor sheet: a cropped mini scene built from the art
   module. The scene string (everything but the ring) is cached per theme + placement + table style. */
const PREVIEW_SLOTS: DecorSlot[] = ['rug', 'ceiling', 'wall', 'back', 'corner'];
const TABLE_STYLES: TableStyle[] = ['yarn', 'wood', 'teacup'];
/** Visible window of the preview, in scene units (matches the frame's CSS aspect-ratio 360 / 170). */
const PV_H = 170;
/** Scene y the preview centres on for each slot, and the highlight ring around that slot. */
const PV_FOCUS: Record<DecorSlot, { cy: number; ring: { x: number; y: number; rx: number; ry: number } }> = {
  ceiling: { cy: 60, ring: { x: 180, y: 58, rx: 172, ry: 36 } },
  wall: { cy: 120, ring: { x: DECOR_ANCHOR.wall.x, y: DECOR_ANCHOR.wall.y, rx: 40, ry: 38 } },
  back: { cy: 205, ring: { x: DECOR_ANCHOR.back.x, y: DECOR_ANCHOR.back.y - 48, rx: 54, ry: 56 } },
  corner: { cy: 318, ring: { x: DECOR_ANCHOR.corner.x, y: DECOR_ANCHOR.corner.y - 40, rx: 30, ry: 50 } },
  rug: { cy: 455, ring: { x: DECOR_ANCHOR.rug.x, y: DECOR_ANCHOR.rug.y, rx: 72, ry: 30 } },
};
const pvCache = new Map<string, string>();
const at = (x: number, y: number, body: string) => (body ? `<g transform="translate(${x} ${y})">${body}</g>` : '');

function previewScene(theme: ThemeId, placed: Partial<Record<DecorSlot, DecorId | null>>, style: TableStyle): string {
  const key = `${theme}|${style}|${PREVIEW_SLOTS.map((s) => placed[s] ?? '').join(',')}`;
  const hit = pvCache.get(key);
  if (hit !== undefined) return hit;
  const dec = (slot: DecorSlot) => {
    const id = placed[slot];
    return id ? at(DECOR_ANCHOR[slot].x, DECOR_ANCHOR[slot].y, safe(() => decor(id, theme), '')) : '';
  };
  const tables = TABLES.slice(0, 2).map((t) => at(t.x, t.y, safe(() => seat(style, theme)
    + table(style, theme, { item: null, coins: 0, highlight: false, pulse: 0 }), ''))).join('');
  const s = `<defs>${safe(() => sceneDefs(theme), '')}</defs>`
    + safe(() => roomBack(theme), '')
    + dec('rug') + dec('ceiling') + dec('wall') + dec('back')
    + safe(() => counterBack(theme), '')
    + at(BARISTA.x, BARISTA.y, safe(() => character(BARISTA_LOOK, { pose: 'stand', mood: 'happy', facing: -1 }), ''))
    + safe(() => counterFront(theme), '')
    + dec('corner') + tables;
  if (pvCache.size > 24) pvCache.clear();
  pvCache.set(key, s);
  return s;
}

function decorPreviewHtml(game: GameApi, ui: UiState): string {
  const p = game.state.progress;
  const slot = ui.decorSlot;
  const pick = ui.decorPreview ? game.catalog.decor.find((d) => d.id === ui.decorPreview && d.slot === slot) : undefined;
  const placed: Partial<Record<DecorSlot, DecorId | null>> = { ...(p.placed ?? {}) };
  if (pick) placed[slot] = pick.id;
  const style = TABLE_STYLES[Math.max(0, Math.min(2, safe(() => game.upgradeLevel('table_style'), 0)))];
  const scene = previewScene(game.state.theme, placed, style);
  const f = PV_FOCUS[slot];
  const y = Math.round(Math.max(0, Math.min(720 - PV_H, f.cy - PV_H / 2)));
  const r = f.ring;
  const trying = !!pick && p.placed?.[slot] !== pick.id;
  const ring = pick ? `<g class="pv-ring" aria-hidden="true">
      <ellipse cx="${r.x}" cy="${r.y}" rx="${r.rx}" ry="${r.ry}" class="pv-ring-glow"/>
      <ellipse cx="${r.x}" cy="${r.y}" rx="${r.rx}" ry="${r.ry}" class="pv-ring-line"/></g>` : '';
  const label = pick ? `Your café with the ${pick.name}` : 'Your café as it is now';
  return `
    <div class="dec-preview ${pick ? 'picking' : ''}">
      <svg class="pv-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 ${y} 360 400" preserveAspectRatio="xMidYMin slice"
        role="img" aria-label="${esc(label)}">${scene}${ring}</svg>
      ${trying ? `<span class="pv-ribbon" aria-hidden="true">${icon('star')}<span>Preview</span></span>` : ''}
      ${pick ? '' : '<span class="pv-hint" aria-hidden="true">Tap an item to try it here</span>'}
    </div>`;
}

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
    const sel = ui.decorPreview === d.id;
    const pic = art(() => decorSvg(d.id, game.state.theme, 72), 'dec-pic');
    const status = placed
      ? `<span class="tag tag-placed">${icon('check')}Placed</span>`
      : owned ? '<span class="tag tag-owned">Owned</span>'
        : `<span class="tag ${afford ? '' : 'tag-poor'}">${coins(d.cost)}</span>`;
    const hearts = `<span class="charm" aria-label="${d.charm} charm">${icon('heart')}<b>${esc(d.charm)}</b></span>`;
    const label = `${d.name}, ${placed ? 'placed' : owned ? 'owned' : `${d.cost} café coins`}. ${sel ? 'Showing in the preview' : 'Show in the preview'}`;
    let act = '';
    if (sel) {
      const can = placed ? false : owned || afford;
      const text = placed ? `${icon('check')}<span>Placed</span>` : owned ? '<span>Place it</span>'
        : `<span>Buy · </span>${coins(d.cost)}`;
      const aria = placed ? `${d.name} is placed` : owned ? `Place ${d.name}`
        : afford ? `Buy ${d.name} for ${d.cost} café coins` : `${d.name}: need ${d.cost} café coins`;
      act = `<button class="btn btn-small dec-act ${can ? 'btn-primary' : placed ? 'btn-soft' : 'btn-off'}" data-act="decor"
        data-id="${esc(d.id)}" data-focus="decact-${esc(d.id)}" aria-label="${esc(aria)}" ${can ? '' : 'disabled'}>${text}</button>`;
    }
    return `
      <li class="dec-cell ${sel ? 'sel' : ''}">
        <button class="dec-card ${placed ? 'placed' : ''} ${owned ? 'owned' : ''} ${!owned && !afford ? 'poor' : ''} ${sel ? 'sel' : ''}"
          data-act="dec-pick" data-id="${esc(d.id)}" data-focus="dec-${esc(d.id)}" aria-label="${esc(label)}"
          aria-pressed="${sel}">
          ${pic || '<span class="dec-pic dec-pic-fb" aria-hidden="true"></span>'}
          <span class="dec-name">${esc(d.name)}</span>
          <span class="dec-meta">${hearts}${status}</span>
        </button>
        ${act}
      </li>`;
  }).join('');
  return `
    ${safe(() => decorPreviewHtml(game, ui), '')}
    <div class="charm-box">
      <div class="charm-total">${icon('heart')}<b>${esc(charm)}</b><span>charm</span></div>
      <p>Charm brings more guests and bigger tips</p>
    </div>
    ${coinWallet(p.coins)}
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
          <p>Erase café coins, pay, upgrades and decor? This can't be undone.</p>
          <div class="row">
            <button class="btn btn-soft" data-act="reset-cancel" data-focus="reset-cancel">Keep</button>
            <button class="btn btn-danger" data-act="reset-yes">Erase</button>
          </div>
        </div>`
    : '<button class="btn btn-ghost" data-act="reset-ask" data-focus="reset-ask">Reset progress</button>'}
    </div>
    <button class="btn btn-soft set-help" data-act="open" data-sheet="help" data-focus="set-help"><b aria-hidden="true">?</b><span>How to play</span></button>
    <p class="credits">Music: add your jazz tracks in public/music</p>`;
}

/* ------------------------------ help ------------------------------ */
/** "How to play": the two kinds of money, where each is spent, and what to do when. Buttons jump straight there. */
function helpHtml(game: GameApi): string {
  const s = game.state;
  const atHome = s.mode === 'home';
  const konbini = s.progress.konbiniOpen;
  const step = (n: number, t: string) => `<li><i>${n}</i><span>${t}</span></li>`;
  return `
    <div class="help">
      <section class="help-card">
        <h3>${icon('cafe')}At the café</h3>
        <ol class="help-steps">
          ${step(1, 'Tap a guest at the door, then a free table.')}
          ${step(2, 'Tap their table to take the order.')}
          ${step(3, 'When it is on the counter, tap the counter.')}
          ${step(4, 'Tap the table to serve, then tap the coins.')}
        </ol>
        <p>A day lasts one minute. Quick service means bigger tips.</p>
      </section>
      <section class="help-card help-money">
        <h3>Two kinds of money</h3>
        <div class="help-row">${coins(0).replace('<b>0</b>', '<b>Tips</b>')}<span>Gold café coins from guests. They buy <b>café upgrades and decor</b>.</span></div>
        <div class="help-jump">
          <button class="btn btn-small btn-primary" data-act="open" data-sheet="upgrades" data-focus="help-up">${icon('shop')}<span>Upgrades</span></button>
          <button class="btn btn-small btn-primary" data-act="open" data-sheet="decor" data-focus="help-dec">${icon('decor')}<span>Decorate</span></button>
        </div>
        <p class="help-where">Find them on the main menu and on the “Day complete” card.</p>
        <div class="help-row">${pay(0).replace('<b>0</b>', '<b>Pay</b>')}<span>Green notes: Mocha’s own pay. It buys <b>food, things for home and dreams</b>.</span></div>
        <div class="help-jump">
          ${atHome ? `<button class="btn btn-small btn-primary" data-act="open" data-sheet="home" data-focus="help-cozy">${icon('decor')}<span>Cozy shop</span></button>` : ''}
          ${atHome && konbini ? `<button class="btn btn-small btn-primary" data-act="go-konbini" data-focus="help-mart">${icon('konbini')}<span>Hoshi Mart</span></button>` : ''}
        </div>
        <p class="help-where">At home: tap <b>More</b> for the Cozy shop${konbini ? ', <b>Shop</b> to walk to Hoshi Mart' : ' (Hoshi Mart opens on day 3)'}, and <b>Save</b> to fill the dream jar.</p>
      </section>
      <section class="help-card">
        <h3>${icon('home')}At home, in the evening</h3>
        <ul class="help-list">
          <li>${icon('bowl')}<span><b>Cook</b> and <b>Eat</b> (or eat a snack) for energy.</span></li>
          <li>${icon('bath')}<span><b>Bath</b>, <b>Call Mom</b>, <b>Read</b>: once a day, they make Mocha happy.</span></li>
          <li>${icon('energy')}<span>Rested bears walk faster. Happy bears earn bigger tips.</span></li>
          <li>${icon('goal')}<span>The round <b>Goal</b> button (top left) shows your chapter and dream.</span></li>
          <li>${icon('moon')}<span><b>Sleep</b> starts the next day.</span></li>
        </ul>
      </section>
    </div>`;
}

export function sheetBodyHtml(kind: SheetKind, game: GameApi, ui: UiState): string {
  switch (kind) {
    case 'help': return helpHtml(game);
    case 'pause': return pauseHtml(ui);
    case 'upgrades': return upgradesHtml(game, ui);
    case 'decor': return decorHtml(game, ui);
    case 'settings': return settingsHtml(game, ui);
    case 'home': return homeItemsHtml(game);
  }
}

function safe<T>(f: () => T, d: T): T {
  try { return f(); } catch { return d; }
}
