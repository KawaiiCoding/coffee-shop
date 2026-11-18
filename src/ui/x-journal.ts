/* =====================================================================
   MOCHA'S JOURNAL — a little book of discovered secrets.
   Cover page, then two-page spreads (one secret per page, catalogue order)
   flipped with arrows, keys or a swipe. Locked pages show a hint.
   Mounted by src/ui/index.ts into .cs-ui (sheet layer z 45, like extras).
   Uses data-j attributes so neither the core's data-act nor extras' data-x fire.
   ===================================================================== */
import './x-journal.css';
import { journalCoverSvg, lockedStickerSvg, stickerSvg } from '../art';
import type { AudioApi, GameApi, SecretDef, SfxName } from '../types';
import { esc, firstIcon, icon, pulseClass, reducedMotion } from './util';

export interface JournalUI { open(): void; frame(): void }

type Entry = { def: SecretDef; found: boolean; foundIndex: number };

const SEEN_KEY = 'coffee-shop-journal-seen';
const DAYS_KEY = 'coffee-shop-journal-days';

function loadJson<T>(key: string, d: T): T {
  try { const s = localStorage.getItem(key); return s ? JSON.parse(s) as T : d; } catch { return d; }
}
function saveJson(key: string, v: unknown): void {
  try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* storage blocked */ }
}

const tryArt = (f: () => string): string => { try { return f() || ''; } catch { return ''; } };

export function mountJournal(layer: HTMLElement, game: GameApi, audio: AudioApi): JournalUI {
  const root = document.createElement('div');
  root.className = 'x-root xj-root';
  root.innerHTML = `
    <button class="ibtn xj-title-btn" data-j="open" hidden aria-label="Mocha's journal">
      ${icon(firstIcon(['journal', 'book']))}<span class="xj-dot" hidden></span>
    </button>
    <div class="xj-layer" hidden>
      <div class="xj-backdrop" data-j="close"></div>
      <div class="xj-sheet" role="dialog" aria-modal="true" aria-labelledby="xj-h" tabindex="-1">
        <div class="xj-head">
          <h2 id="xj-h">Mocha’s Journal</h2>
          <button class="ibtn" data-j="close" aria-label="Close">${icon('close')}</button>
        </div>
        <div class="xj-book" aria-live="polite"></div>
        <div class="xj-foot"></div>
      </div>
    </div>`;
  layer.appendChild(root);

  const titleBtn = root.querySelector('.xj-title-btn') as HTMLButtonElement;
  const titleDot = root.querySelector('.xj-dot') as HTMLElement;
  const jLayer = root.querySelector('.xj-layer') as HTMLElement;
  const sheet = root.querySelector('.xj-sheet') as HTMLElement;
  const book = root.querySelector('.xj-book') as HTMLElement;
  const foot = root.querySelector('.xj-foot') as HTMLElement;

  const sfx = (n: SfxName) => { try { audio.playSfx(n); } catch { /* ignore */ } };

  /* ------------------------------ data ------------------------------ */
  const seen = new Set<string>(loadJson<string[]>(SEEN_KEY, []));
  /** Day a page was found on (only known for pages found while the game was running). */
  const days = loadJson<Record<string, number>>(DAYS_KEY, {});

  function entries(): Entry[] {
    try {
      const j = game.journal();
      if (Array.isArray(j) && j.length) return j;
    } catch { /* engine not ready */ }
    const found = game.state.progress.secrets ?? [];
    return (game.catalog.secrets ?? []).map((def) => {
      const i = found.indexOf(def.id);
      return { def, found: i >= 0, foundIndex: i };
    });
  }

  const isNew = (e: Entry) => e.found && !seen.has(e.def.id);

  /* ------------------------------ views ------------------------------ */
  // view 0 = cover; view v >= 1 shows entries 2(v-1) and 2(v-1)+1.
  let view = 0;
  let isOpen = false;
  let opener: HTMLElement | null = null;
  let flipping = 0;

  const spreads = (n: number) => Math.ceil(n / 2);

  function pageHtml(e: Entry | undefined, num: number, side: 'l' | 'r'): string {
    if (!e) {
      return `<div class="xj-page xj-${side} xj-blank" aria-hidden="true"><span class="xj-num">${num}</span></div>`;
    }
    const d = e.def;
    if (!e.found) {
      const lock = tryArt(() => lockedStickerSvg(96));
      return `
        <div class="xj-page xj-${side} xj-locked" role="group" aria-label="${esc(`Page ${num}: not found yet. Hint: ${d.hint}`)}">
          <span class="xj-stk xj-stk-lock" aria-hidden="true">${lock || '<b>?</b>'}</span>
          <h3 class="xj-t">???</h3>
          <p class="xj-hint">${esc(d.hint)}</p>
          <span class="xj-num">${num}</span>
        </div>`;
    }
    const stk = tryArt(() => stickerSvg(d.sticker, 96));
    const day = days[d.id];
    const when = day ? `found on day ${day}` : e.foundIndex >= 0 ? `page #${e.foundIndex + 1} found` : '';
    const fresh = isNew(e);
    return `
      <div class="xj-page xj-${side} xj-found${fresh ? ' xj-new' : ''}" role="group" aria-label="${esc(`Page ${num}: ${d.title}${fresh ? ', new' : ''}`)}">
        ${fresh ? '<span class="xj-ribbon" aria-hidden="true">NEW</span>' : ''}
        <span class="xj-stk" aria-hidden="true">${stk || `<b>${esc((d.title[0] || '?').toUpperCase())}</b>`}</span>
        <h3 class="xj-t">${esc(d.title)}</h3>
        <p class="xj-text">${esc(d.page)}</p>
        ${when ? `<span class="xj-when">${esc(when)}</span>` : ''}
        <span class="xj-num">${num}</span>
      </div>`;
  }

  function coverHtml(list: Entry[]): string {
    const total = list.length;
    const found = list.filter((e) => e.found).length;
    const fresh = list.filter(isNew).length;
    const cover = tryArt(() => journalCoverSvg(220));
    return `
      <div class="xj-cover" data-j="next" role="button" tabindex="0" aria-label="Open the journal">
        <span class="xj-cover-art" aria-hidden="true">${cover || '<span class="xj-cover-fb"><b>Journal</b></span>'}</span>
        <span class="xj-count"><b>${found}</b> / ${total} pages found</span>
        ${fresh ? `<span class="xj-fresh">${icon('star')}${fresh} new ${fresh === 1 ? 'page' : 'pages'}!</span>` : ''}
      </div>`;
  }

  function viewHtml(v: number, list: Entry[]): string {
    if (v === 0) return coverHtml(list);
    const i = (v - 1) * 2;
    return `<div class="xj-spread">${pageHtml(list[i], i + 1, 'l')}${pageHtml(list[i + 1], i + 2, 'r')}<i class="xj-spine" aria-hidden="true"></i></div>`;
  }

  function footHtml(v: number, list: Entry[]): string {
    const max = spreads(list.length);
    const label = v === 0 ? 'Cover' : `Pages ${(v - 1) * 2 + 1}–${Math.min(list.length, (v - 1) * 2 + 2)} of ${list.length}`;
    const firstNew = list.findIndex(isNew);
    const jump = v === 0 && firstNew >= 0
      ? `<button class="btn btn-small btn-primary xj-jump" data-j="jump" data-id="${Math.floor(firstNew / 2) + 1}">Read new</button>` : '';
    return `
      <button class="ibtn xj-arrow" data-j="prev" aria-label="Previous page" ${v <= 0 ? 'disabled' : ''}>${icon('back')}</button>
      <span class="xj-where">${esc(label)}</span>${jump}
      <button class="ibtn xj-arrow xj-arrow-r" data-j="next" aria-label="Next page" ${v >= max ? 'disabled' : ''}>${icon('back')}</button>`;
  }

  function markSeen(v: number, list: Entry[]): void {
    if (v === 0) return;
    let changed = false;
    for (const e of [list[(v - 1) * 2], list[(v - 1) * 2 + 1]]) {
      if (e && e.found && !seen.has(e.def.id)) { seen.add(e.def.id); changed = true; }
    }
    if (changed) { saveJson(SEEN_KEY, [...seen]); syncDot(list); }
  }

  let renderedKey = '';
  function stateKey(): string {
    return `${view}|${(game.state.progress.secrets ?? []).join(',')}`;
  }

  /** Render the current view (no animation). Pages become "seen" once shown; their ribbon stays until next render. */
  function show(still = false): void {
    const list = entries();
    book.classList.toggle('xj-still', still);
    view = Math.max(0, Math.min(view, spreads(list.length)));
    renderedKey = stateKey();
    book.innerHTML = viewHtml(view, list);
    book.dataset.view = view === 0 ? 'cover' : 'spread';
    const a = document.activeElement as HTMLElement | null;
    const key = a && foot.contains(a) ? a.dataset.j : undefined;
    foot.innerHTML = footHtml(view, list);
    if (key) {
      const b = foot.querySelector<HTMLButtonElement>(`[data-j="${key}"]:not([disabled])`)
        ?? foot.querySelector<HTMLButtonElement>('button:not([disabled])');
      b?.focus({ preventScroll: true });
    }
    markSeen(view, list);
  }

  /** Flip to view `to` with a page-turn (or a soft open/close for the cover). */
  function go(to: number): void {
    const list = entries();
    const max = spreads(list.length);
    to = Math.max(0, Math.min(to, max));
    if (to === view || !isOpen) return;
    const from = view;
    sfx('page');
    if (reducedMotion() || from === 0 || to === 0) {
      view = to;
      show();
      if (!reducedMotion()) pulseClass(book.firstElementChild, to === 0 ? 'xj-close-anim' : 'xj-open-anim');
      return;
    }
    if (flipping) { window.clearTimeout(flipping); flipping = 0; }
    const fwd = to > from;
    const oi = (from - 1) * 2, ni = (to - 1) * 2;
    // Underneath: the pages that stay visible during the turn.
    const under = fwd
      ? pageHtml(list[oi], oi + 1, 'l') + pageHtml(list[ni + 1], ni + 2, 'r')
      : pageHtml(list[ni], ni + 1, 'l') + pageHtml(list[oi + 1], oi + 2, 'r');
    // The turning leaf: front = page leaving, back = page arriving.
    const front = fwd ? pageHtml(list[oi + 1], oi + 2, 'r') : pageHtml(list[oi], oi + 1, 'l');
    const back = fwd ? pageHtml(list[ni], ni + 1, 'l') : pageHtml(list[ni + 1], ni + 2, 'r');
    book.innerHTML = `
      <div class="xj-spread">${under}<i class="xj-spine" aria-hidden="true"></i>
        <div class="xj-leaf ${fwd ? 'fwd' : 'bwd'}" aria-hidden="true">
          <div class="xj-face xj-front">${front}</div>
          <div class="xj-face xj-back">${back}</div>
        </div>
      </div>`;
    view = to;
    foot.innerHTML = footHtml(view, list);
    flipping = window.setTimeout(() => { flipping = 0; show(true); }, 560);
  }

  function openJournal(): void {
    if (isOpen) return;
    opener = document.activeElement as HTMLElement | null;
    isOpen = true;
    view = 0;
    jLayer.hidden = false;
    show();
    pulseClass(sheet, 'in');
    sheet.focus({ preventScroll: true });
  }

  function closeJournal(): void {
    if (!isOpen) return;
    isOpen = false;
    if (flipping) { window.clearTimeout(flipping); flipping = 0; }
    jLayer.hidden = true;
    book.innerHTML = ''; foot.innerHTML = '';
    const o = opener; opener = null;
    if (o && o.isConnected && !o.closest('[hidden]')) o.focus({ preventScroll: true });
  }

  /* ------------------------------ input ------------------------------ */
  let suppressClick = false;
  root.addEventListener('click', (e) => {
    const t = (e.target as Element).closest<HTMLElement>('[data-j]');
    if (!t || !root.contains(t) || (t as HTMLButtonElement).disabled) return;
    if (suppressClick) { suppressClick = false; return; }
    switch (t.dataset.j) {
      case 'open': sfx('tap'); openJournal(); break;
      case 'close': sfx('tap'); closeJournal(); break;
      case 'next': go(view + 1); break;
      case 'prev': go(view - 1); break;
      case 'jump': go(Number(t.dataset.id) || 1); break;
    }
  });

  root.addEventListener('pointerdown', (e) => {
    const b = (e.target as Element).closest('.btn, .ibtn');
    if (b && !(b as HTMLButtonElement).disabled) pulseClass(b, 'squish');
  });
  root.addEventListener('animationend', (e) => {
    const t = e.target as Element;
    if (e.animationName === 'cs-squish') t.classList.remove('squish');
    if (e.animationName === 'xj-open' || e.animationName === 'xj-close') t.classList.remove('xj-open-anim', 'xj-close-anim');
  });

  // Swipe the book to turn pages.
  let drag: { id: number; x: number; y: number } | null = null;
  book.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY };
  });
  book.addEventListener('pointermove', (e) => {
    if (!drag || drag.id !== e.pointerId || reducedMotion()) return;
    const dx = e.clientX - drag.x;
    if (Math.abs(dx) > 6) book.style.setProperty('--drag', `${Math.max(-1, Math.min(1, dx / 160))}`);
  });
  const endDrag = (e: PointerEvent) => {
    if (!drag || drag.id !== e.pointerId) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    drag = null;
    book.style.removeProperty('--drag');
    if (e.type === 'pointerup' && Math.abs(dx) > 36 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      suppressClick = true;
      window.setTimeout(() => { suppressClick = false; }, 0);
      go(view + (dx < 0 ? 1 : -1));
    }
  };
  book.addEventListener('pointerup', endDrag);
  book.addEventListener('pointercancel', endDrag);

  document.addEventListener('keydown', (e) => {
    if (!isOpen) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); closeJournal(); return; }
    if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); e.stopImmediatePropagation(); go(view + 1); return; }
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); e.stopImmediatePropagation(); go(view - 1); return; }
    if ((e.key === 'Enter' || e.key === ' ') && document.activeElement?.classList.contains('xj-cover')) {
      e.preventDefault(); e.stopImmediatePropagation(); go(1); return;
    }
    if (e.key === 'Tab') {
      e.stopImmediatePropagation();
      const f = Array.from(sheet.querySelectorAll<HTMLElement>('button:not([disabled]), [tabindex="0"]')).filter((el) => el.offsetParent !== null);
      if (!f.length) { e.preventDefault(); return; }
      const a = document.activeElement, first = f[0], last = f[f.length - 1];
      if (e.shiftKey && (a === first || !sheet.contains(a) || a === sheet)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (a === last || !sheet.contains(a))) { e.preventDefault(); first.focus(); }
    }
  }, { capture: true });

  /* ------------------------------ frame ------------------------------ */
  let lastFound: string[] | null = null;
  let lastMode = '';

  function syncDot(list: Entry[] = entries()): void {
    titleDot.hidden = !list.some(isNew);
  }

  function frame(): void {
    const s = game.state;
    const found = s.progress.secrets ?? [];
    if (!lastFound) lastFound = [...found];
    else if (found.length !== lastFound.length) {
      // Remember the day of pages found while we watch.
      let changed = false;
      for (const id of found) if (!lastFound.includes(id) && !days[id]) { days[id] = s.progress.day; changed = true; }
      if (changed) saveJson(DAYS_KEY, days);
      lastFound = [...found];
      syncDot();
    }
    if (s.mode !== lastMode) {
      lastMode = s.mode;
      titleBtn.hidden = s.mode !== 'title';
      if (!titleBtn.hidden) syncDot();
      if (isOpen && s.mode !== 'title' && s.mode !== 'home' && s.mode !== 'konbini' && s.mode !== 'paused') closeJournal();
    }
    if (isOpen && !flipping && stateKey() !== renderedKey) show(true);
  }

  frame();

  return { open: openJournal, frame };
}
