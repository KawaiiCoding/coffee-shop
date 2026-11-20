import { DREAMS, dreamStage } from '../engine/home';
/* HTML builders for the story book, cleanup checklist, tutorial card and the
   bear's home (dock, dream card, "make it cozy" sheet).
   All interactivity goes through data-act attributes handled in index.ts. */
import { homeItemSvg, storyArtSvg } from '../art';
import { STORIES, TUTORIAL_STEPS } from '../story';
import type { Chore, FurnitureId, GameApi, HomeActionDef, HomeActionId, HomeProgress, HomeSlot, StoryId } from '../types';
import { art, esc, firstIcon, icon, type UiIcon } from './util';

const safe = <T>(f: () => T, d: T): T => { try { return f(); } catch { return d; } };

/** Mocha's own money ("Pay"): green pill with the yen-note 'pay' icon. Café coins are gold (see sheets.ts coins()). */
export const pay = (n: number, sign = '') =>
  `<span class="cost cost-pay" aria-label="${esc(`${sign}${n} pay`)}">${icon('pay')}<b>${sign}${esc(n)}</b></span>`;
/** @deprecated use pay() */
export const purse = pay;
/** Café coins: gold pill with the 'coin' icon. */
export const coins = (n: number, sign = '') =>
  `<span class="cost cost-coin" aria-label="${esc(`${sign}${n} café coins`)}">${icon('coin')}<b>${sign}${esc(n)}</b></span>`;

/* ------------------------------ story ------------------------------ */
export function storyHtml(id: StoryId, panel: number): string {
  const panels = STORIES[id] ?? [];
  if (!panels.length) return '';
  const i = Math.max(0, Math.min(panel, panels.length - 1));
  const p = panels[i];
  const lastPanel = i === panels.length - 1;
  const pic = art(() => storyArtSvg(p.art), 'story-art')
    || '<span class="story-art story-art-fb" aria-hidden="true"><i></i></span>';
  let dots = '';
  for (let k = 0; k < panels.length; k++) dots += `<i class="${k < i ? 'seen' : k === i ? 'on' : ''}"></i>`;
  return `
    <button class="story-skip" data-act="story-skip" data-focus="story-skip">Skip ${icon('play')}</button>
    <div class="story-book" data-act="story-next">
      <div class="story-page">
        <div class="story-frame">${pic}</div>
        <div class="story-card ${p.speaker ? 'said' : 'told'}" aria-live="polite">
          ${p.speaker ? `<span class="story-speaker">${esc(p.speaker)}</span>` : ''}
          <p>${esc(p.text)}</p>
        </div>
      </div>
    </div>
    <div class="story-foot">
      <div class="story-dots" role="img" aria-label="Page ${i + 1} of ${panels.length}">${dots}</div>
      <button class="btn btn-primary btn-big story-next ${lastPanel ? 'go' : ''}" data-act="story-next" data-focus="story-next">
        <span>${lastPanel ? 'Let’s go!' : 'Next'}</span>${lastPanel ? icon('heart') : icon('play')}
      </button>
    </div>`;
}

/* ------------------------------ cleanup ------------------------------ */
export function choreProgress(chores: Chore[] | undefined): { done: number; total: number } {
  let done = 0, total = 0;
  for (const c of chores ?? []) { total++; if (c.done) done++; }
  return { done, total };
}

/* ------------------------------ tutorial ------------------------------ */
/** A tiny row of ticks (no text): filled as each step is done, the current one glows. */
export function tutorialHtml(step: number, done: boolean[], pop: Set<number>): string {
  const dots = TUTORIAL_STEPS.map((t, i) => {
    const ok = !!done[i] || i < step;
    const cur = i === step && !ok;
    return `<i class="tdot ${ok ? 'ok' : ''} ${cur ? 'cur' : ''} ${ok && pop.has(i) ? 'pop' : ''}">${ok ? icon('check') : ''}</i>`;
  }).join('');
  const n = TUTORIAL_STEPS.filter((_, i) => !!done[i] || i < step).length;
  return `<span class="tdots" role="img" aria-label="First guest: ${n} of ${TUTORIAL_STEPS.length} steps done">${dots}</span>`;
}

export function tutorialDoneHtml(): string {
  return `<span class="tut-fin">${icon('heart')}<span>You’ve got it!</span></span>`;
}

export const TUTORIAL_COUNT = TUTORIAL_STEPS.length;

/* -------------------------------- home -------------------------------- */
export const ACTION_ICON: Record<HomeActionId, UiIcon> = {
  cook: 'pot', eat: 'bowl', bath: 'bath', call_mom: 'phone', read: 'book', save: 'jar', sleep: 'moon',
  warm: 'fire', calendar: 'calendar',
};
const ACTION_SHORT: Record<HomeActionId, string> = {
  cook: 'Cook', eat: 'Eat', bath: 'Bath', call_mom: 'Call Mom', read: 'Read', save: 'Save', sleep: 'Sleep',
  warm: 'Warm up', calendar: 'Calendar',
};
/** Dock order (most used first). Locked ones move to the end; extras overflow into "more". */
const DOCK_ORDER: (HomeActionId | 'konbini')[] = ['cook', 'eat', 'bath', 'save', 'konbini', 'read', 'call_mom', 'warm'];
/** Round buttons in the dock row besides "more" and Sleep. */
const DOCK_MAIN = 5;

export interface HomeUi { more: boolean; chip: boolean; /** show the one-time "shops are in here" pointer on More */ coachMore?: boolean }

const hasSnack = (game: GameApi) => {
  const pantry = game.state.progress.home?.pantry ?? {};
  return game.catalog.snacks.some((sn) => (pantry[sn.id] ?? 0) > 0);
};
/** Eat with nothing cooked but a snack in the pantry: the button opens the snack picker. */
export const eatOpensSnacks = (game: GameApi) => !game.state.progress.home?.meal && hasSnack(game);

/** Why an action can't be done yet because something is missing at home.
 *  null = available, 'hide' = don't show the button at all. */
export function homeLock(game: GameApi, id: HomeActionId): string | null | 'hide' {
  const h = game.state.progress.home;
  const has = (f: FurnitureId) => (h?.furniture ?? []).includes(f);
  switch (id) {
    case 'call_mom': return has('phone') ? null : 'Mocha needs a phone to call Mom';
    case 'read':
      if (!has('armchair')) return 'Mocha needs a comfy armchair to read in';
      if ((h?.books ?? 0) <= 0) return game.state.progress.konbiniOpen ? 'No books yet. Buy one at Hoshi Mart' : 'Mocha has no books yet';
      return null;
    case 'warm': return has('fireplace') ? null : 'hide';
    case 'eat': return null; // always there: a cooked meal, a snack, or a nudge to cook
    default: return null;
  }
}

interface DockBtn { key: string; html: string; locked: boolean }

function actionBtn(game: GameApi, a: HomeActionDef, busy: HomeActionId | null, lock: string | null): DockBtn {
  let can = lock ? { ok: false, reason: lock } : safe(() => game.canDoHomeAction(a.id), { ok: false, reason: 'Not right now' });
  if (a.id === 'eat' && !lock && busy === null && eatOpensSnacks(game)) can = { ok: true };
  const short = ACTION_SHORT[a.id] ?? a.name;
  const doneToday = game.state.progress.home?.doneToday?.includes(a.id) ?? false;
  const why = can.ok ? a.description : (can.reason ?? 'Not right now');
  const label = `${a.name}${a.cost > 0 ? `, costs ${a.cost} pay` : ''}. ${lock ? `Locked: ${lock}` : why}`;
  const html = `
    <button class="act ${can.ok ? '' : 'off'} ${lock ? 'locked' : ''} ${busy === a.id ? 'doing' : ''} ${doneToday ? 'done' : ''}"
      data-act="home-act" data-id="${esc(a.id)}" data-focus="act-${esc(a.id)}"
      aria-disabled="${!can.ok}" title="${esc(why)}" aria-label="${esc(label)}">
      <span class="act-ring">${icon(ACTION_ICON[a.id] ?? 'star')}
        ${doneToday ? `<span class="act-done">${icon('check')}</span>` : ''}
        ${lock ? `<span class="act-lock">${icon('lock')}</span>` : ''}
        ${a.cost > 0 && !lock ? `<span class="act-cost">${esc(a.cost)}</span>` : ''}
      </span>
      <span class="act-name">${esc(short)}</span>
    </button>`;
  return { key: a.id, html, locked: !!lock };
}

function konbiniBtn(): DockBtn {
  return {
    key: 'konbini', locked: false,
    html: `
    <button class="act act-konbini" data-act="go-konbini" data-focus="act-konbini" aria-label="Walk to Hoshi Mart, the corner shop">
      <span class="act-ring">${icon('konbini')}</span><span class="act-name">Shop</span>
    </button>`,
  };
}

function simpleBtn(act: string, key: string, ic: UiIcon, name: string, label: string, extra = ''): string {
  return `
    <button class="act act-${key}" data-act="${act}" ${extra} data-focus="act-${key}" aria-label="${esc(label)}">
      <span class="act-ring">${icon(ic)}</span><span class="act-name">${esc(name)}</span>
    </button>`;
}

/** The home dock: one slim row of round buttons, "more" for rarely used ones, and Sleep at the end. */
export function homeDockHtml(game: GameApi, ui: HomeUi): { row: string; more: string } {
  const s = game.state;
  const busy = s.homeBear?.action ?? null;
  const defs = new Map(game.catalog.homeActions.map((a) => [a.id, a] as const));
  const btns: DockBtn[] = [];
  for (const id of DOCK_ORDER) {
    if (id === 'konbini') { if (s.progress.konbiniOpen) btns.push(konbiniBtn()); continue; }
    const def = defs.get(id);
    if (!def) continue;
    const lock = homeLock(game, id);
    if (lock === 'hide') continue;
    btns.push(actionBtn(game, def, busy, lock));
  }
  // Available first (stable), locked ones last.
  const sorted = [...btns.filter((b) => !b.locked), ...btns.filter((b) => b.locked)];
  const main = sorted.slice(0, DOCK_MAIN);
  const over = sorted.slice(DOCK_MAIN);
  const moreItems = over.map((b) => b.html).join('')
    + simpleBtn('open', 'cozy', 'decor', 'Cozy shop', 'Make it cozy: buy things for your home', 'data-sheet="home"')
    + simpleBtn('calendar', 'calendar', 'calendar', 'Calendar', 'Open the calendar')
    + simpleBtn('journal', 'journal', firstIcon(['journal', 'book']), 'Journal', 'Open Mocha’s journal')
    + simpleBtn('news', 'news', firstIcon(['newspaper', 'news', 'sun']), 'Paper', 'Read today’s newspaper')
    + simpleBtn('open', 'help', 'star', 'Help', 'How to play: where to buy and upgrade', 'data-sheet="help"');
  const moreBtn = `
    <button class="act act-more ${ui.more ? 'on' : ''}" data-act="home-more" data-focus="act-more"
      aria-expanded="${ui.more}" aria-label="More things to do">
      <span class="act-ring">${ui.more ? icon('close') : icon('more')}</span><span class="act-name">More</span>
      ${ui.coachMore && !ui.more ? '<span class="coach-tip coach-up" aria-hidden="true">Cozy shop &amp; more!</span>' : ''}
    </button>`;
  return { row: main.map((b) => b.html).join('') + moreBtn + sleepHtml(game), more: moreItems };
}

export function sleepHtml(game: GameApi): string {
  const def = game.catalog.homeActions.find((a) => a.id === 'sleep');
  if (!def) return '';
  const can = safe(() => game.canDoHomeAction('sleep'), { ok: true } as { ok: boolean; reason?: string });
  const why = can.ok ? def.description : (can.reason ?? 'Not right now');
  return `
    <button class="act act-sleep ${can.ok ? '' : 'off'} ${game.state.homeBear?.action === 'sleep' ? 'doing' : ''}"
      data-act="home-act" data-id="sleep" data-focus="act-sleep" aria-disabled="${!can.ok}" title="${esc(why)}"
      aria-label="${esc(`Sleep, then start the next day. ${can.ok ? '' : why}`)}">
      <span class="act-ring">${icon('moon')}</span><span class="act-name">Sleep</span>
    </button>`;
}

/* ------------------------------ goal chip ------------------------------ */
type Goal = { chapter: number; title: string; goal: string; progress: number } | null;
export const currentGoal = (game: GameApi): Goal => safe(() => game.currentGoal(), null);
const pct = (k: number) => Math.max(0, Math.min(1, Number.isFinite(k) ? k : 0));

/** "Chapter 3 · Cook 3 meals" + mini progress bar. Used at home and on the day-complete card. */
export function goalChipHtml(g: Goal, cls = ''): string {
  if (!g) return '';
  const k = pct(g.progress);
  const a11y = `Chapter ${g.chapter + 1}, ${g.title}: ${g.goal}. ${Math.round(k * 100)} percent done`;
  return `
    <span class="goal-chip ${cls}" ${cls.includes('in-chip') ? '' : `role="img" aria-label="${esc(a11y)}"`}>
      ${icon('goal')}
      <span class="goal-t"><b>Chapter ${esc(g.chapter + 1)}</b> · ${esc(g.goal)}</span>
      <span class="mini-bar" aria-hidden="true"><i style="transform:scaleX(${k.toFixed(3)})"></i></span>
    </span>`;
}

/** The goal + dream card that drops down from the round Goal button in the home top bar (closed = nothing on screen). */
export function homeChipHtml(game: GameApi, open: boolean): string {
  if (!open) return '';
  const h = game.state.progress.home;
  const g = currentGoal(game);
  const goalRow = g ? `
    <div class="goal-big">
      ${icon('goal')}
      <div class="goal-body">
        <span class="goal-kicker">Chapter ${esc(g.chapter + 1)} · ${esc(g.title)}</span>
        <b>${esc(g.goal)}</b>
        <span class="dream-bar"><i style="transform:scaleX(${pct(g.progress).toFixed(3)})"></i></span>
      </div>
    </div>` : '';
  return `
    <div class="chip-panel" role="group" aria-label="Goal and dream">
      ${goalRow}
      ${h ? dreamHtml(h) : ''}
      <p class="chip-bonus">${esc(bonusText(game))}</p>
    </div>`;
}

export function dreamHtml(h: HomeProgress): string {
  const dream = DREAMS[dreamStage(h)];
  if (!dream) {
    return `<div class="dream done">${icon('fire')}<div class="dream-body"><b>Dreams come true!</b>
      <span>A bicycle for Mom's hills and a fire for snowy nights</span></div>${icon('heart')}</div>`;
  }
  const goal = dream.goal;
  const k = Math.max(0, Math.min(1, (h.savings ?? 0) / goal));
  return `
    <div class="dream">
      ${icon(dream.icon)}
      <div class="dream-body">
        <span class="dream-t"><b>${h.dreamDone ? 'New dream' : 'Dream'}:</b> ${esc(dream.name.charAt(0).toLowerCase() + dream.name.slice(1))}</span>
        <span class="dream-bar" role="progressbar" aria-label="Savings" aria-valuemin="0" aria-valuemax="${goal}" aria-valuenow="${esc(h.savings ?? 0)}">
          <i style="transform:scaleX(${k.toFixed(3)})"></i>
        </span>
      </div>
      <span class="dream-n">${icon('jar')}<b>${esc(h.savings ?? 0)}</b><small>/${esc(goal)}</small></span>
    </div>`;
}

export function bonusText(game: GameApi): string {
  const b = safe(() => game.homeBonus(), { speed: 1, tips: 1 });
  const pct = (m: number) => Math.round((m - 1) * 100);
  const parts: string[] = [];
  const sp = pct(b.speed), tp = pct(b.tips);
  if (sp > 0) parts.push(`Rested: waiter +${sp}% speed`);
  else if (sp < 0) parts.push(`Tired: waiter ${sp}% speed`);
  if (tp > 0) parts.push(`Happy: tips +${tp}%`);
  else if (tp < 0) parts.push(`Gloomy: tips ${tp}%`);
  return parts.join(' · ') || 'Rest and have fun for a better day tomorrow';
}

/* -------------------------- "make it cozy" sheet -------------------------- */
const HOME_SLOTS: { id: HomeSlot; label: string }[] = [
  { id: 'wall', label: 'Wall' }, { id: 'window', label: 'Window' }, { id: 'bed', label: 'Bed' },
  { id: 'rug', label: 'Rug' }, { id: 'corner', label: 'Corner' }, { id: 'pet', label: 'Friend' },
];

export function homeItemsHtml(game: GameApi): string {
  const h = game.state.progress.home;
  const wallet = h?.wallet ?? 0;
  const groups = HOME_SLOTS.map((s) => {
    const items = game.catalog.homeItems.filter((it) => it.slot === s.id);
    if (!items.length) return '';
    const cards = items.map((it) => {
      const owned = h?.owned?.includes(it.id) ?? false;
      const placed = h?.placed?.[it.slot] === it.id;
      const afford = wallet >= it.cost;
      const pic = art(() => homeItemSvg(it.id, 72), 'dec-pic');
      const status = placed
        ? `<span class="tag tag-placed">${icon('check')}Placed</span>`
        : owned ? '<span class="tag tag-owned">Owned</span>'
          : `<span class="tag ${afford ? '' : 'tag-poor'}">${pay(it.cost)}</span>`;
      const label = placed ? `${it.name}, placed` : owned ? `Place ${it.name}` : `Buy ${it.name} for ${it.cost} pay`;
      return `
        <li>
          <button class="dec-card ${placed ? 'placed' : ''} ${owned ? 'owned' : ''} ${!owned && !afford ? 'poor' : ''}"
            data-act="home-item" data-id="${esc(it.id)}" data-focus="hi-${esc(it.id)}" aria-label="${esc(label)}"
            ${placed ? 'aria-pressed="true"' : ''}>
            ${pic || '<span class="dec-pic dec-pic-fb" aria-hidden="true"></span>'}
            <span class="dec-name">${esc(it.name)}</span>
            <span class="dec-meta"><span class="charm happy" aria-label="plus ${it.happiness} happiness">${icon('smile')}<b>+${esc(it.happiness)}</b></span>${status}</span>
          </button>
        </li>`;
    }).join('');
    return `<h3 class="set-h">${s.label}</h3><ul class="dec-grid">${cards}</ul>`;
  }).join('');
  return `
    <div class="charm-box">
      <div class="charm-total">${icon('smile')}<b>${esc(Math.round(h?.happiness ?? 0))}</b><span>happy</span></div>
      <p>Cozy things make Mocha happier, and happy bears earn bigger tips</p>
    </div>
    <div class="sheet-wallet">Your pay: ${pay(wallet)}</div>
    ${groups || '<p class="empty">Nothing to buy yet.</p>'}`;
}
