/* HTML builders for the story book, cleanup checklist, tutorial card and the
   bear's home (dock, dream card, "make it cozy" sheet).
   All interactivity goes through data-act attributes handled in index.ts. */
import { homeItemSvg, storyArtSvg } from '../art';
import { STORIES, TUTORIAL_STEPS } from '../story';
import type { Chore, GameApi, HomeActionDef, HomeActionId, HomeProgress, HomeSlot, StoryId } from '../types';
import { art, esc, icon, type UiIcon } from './util';

const safe = <T>(f: () => T, d: T): T => { try { return f(); } catch { return d; } };

export const purse = (n: number, sign = '') =>
  `<span class="cost cost-purse">${icon('purse')}<b>${sign}${esc(n)}</b></span>`;

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
  cook: 'pot', bath: 'bath', call_mom: 'phone', read: 'book', save: 'jar', sleep: 'moon',
};
const ACTION_SHORT: Record<HomeActionId, string> = {
  cook: 'Cook', bath: 'Bath', call_mom: 'Call Mom', read: 'Read', save: 'Save', sleep: 'Sleep',
};

function actionBtn(game: GameApi, a: HomeActionDef, busy: HomeActionId | null): string {
  const can = safe(() => game.canDoHomeAction(a.id), { ok: false, reason: 'Not right now' });
  const short = ACTION_SHORT[a.id] ?? a.name;
  const doneToday = game.state.progress.home?.doneToday?.includes(a.id) ?? false;
  const why = can.ok ? a.description : (can.reason ?? 'Not right now');
  const label = `${a.name}${a.cost > 0 ? `, costs ${a.cost}` : ''}. ${why}`;
  return `
    <button class="act ${can.ok ? '' : 'off'} ${busy === a.id ? 'doing' : ''} ${doneToday ? 'done' : ''}"
      data-act="home-act" data-id="${esc(a.id)}" data-focus="act-${esc(a.id)}"
      aria-disabled="${!can.ok}" title="${esc(why)}" aria-label="${esc(label)}">
      <span class="act-ring">${icon(ACTION_ICON[a.id] ?? 'star')}${doneToday ? `<span class="act-done">${icon('check')}</span>` : ''}</span>
      <span class="act-name">${esc(short)}</span>
      ${a.cost > 0 ? `<span class="act-cost">${icon('purse')}${esc(a.cost)}</span>` : ''}
    </button>`;
}

/** Bottom dock: every home action except sleep, plus the "Make it cozy" button. */
export function homeDockHtml(game: GameApi): string {
  const busy = game.state.homeBear?.action ?? null;
  const acts = game.catalog.homeActions.filter((a) => a.id !== 'sleep').map((a) => actionBtn(game, a, busy)).join('');
  return `${acts}
    <button class="act act-cozy" data-act="open" data-sheet="home" data-focus="act-cozy" aria-label="Make it cozy: decorate your home">
      <span class="act-ring">${icon('decor')}</span><span class="act-name">Cozy</span>
    </button>`;
}

export function sleepHtml(game: GameApi): string {
  const def = game.catalog.homeActions.find((a) => a.id === 'sleep');
  if (!def) return '';
  const can = safe(() => game.canDoHomeAction('sleep'), { ok: true } as { ok: boolean; reason?: string });
  const why = can.ok ? def.description : (can.reason ?? 'Not right now');
  return `
    <button class="sleep-btn ${can.ok ? '' : 'off'} ${game.state.homeBear?.action === 'sleep' ? 'doing' : ''}"
      data-act="home-act" data-id="sleep" data-focus="act-sleep" aria-disabled="${!can.ok}" title="${esc(why)}"
      aria-label="${esc(`Sleep, then start the next day. ${can.ok ? '' : why}`)}">
      ${icon('moon')}<span class="sleep-t"><b>Sleep</b><small>→ next day</small></span>
    </button>`;
}

export function dreamHtml(h: HomeProgress): string {
  const goal = Math.max(1, h.dreamGoal || 1);
  const k = Math.max(0, Math.min(1, (h.savings ?? 0) / goal));
  if (h.dreamDone) {
    return `<div class="dream done">${icon('bike')}<div class="dream-body"><b>Dream come true!</b>
      <span>Mocha rode his bicycle to Mom</span></div>${icon('heart')}</div>`;
  }
  return `
    <div class="dream">
      ${icon('bike')}
      <div class="dream-body">
        <span class="dream-t"><b>Dream:</b> a bicycle to visit Mom</span>
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
          : `<span class="tag ${afford ? '' : 'tag-poor'}">${purse(it.cost)}</span>`;
      const label = placed ? `${it.name}, placed` : owned ? `Place ${it.name}` : `Buy ${it.name} for ${it.cost}`;
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
    <div class="sheet-wallet">You have ${purse(wallet)}</div>
    ${groups || '<p class="empty">Nothing to buy yet.</p>'}`;
}
