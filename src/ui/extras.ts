/* =====================================================================
   UI EXTRAS — popups (gifts / unlocks / chapters / wishes / festivals),
   recipe picker, konbini basket bar, calendar sheet.
   Mounted by src/ui/index.ts into the stage overlay (.cs-ui).
   Uses its own data-x attributes so the core's data-act handler never fires.
   ===================================================================== */
import './extras.css';
import type { AudioApi, DishId, GameApi, GameState, KonbiniStockId, Popup, SfxName, SnackId } from '../types';
import { burst, pulseClass, reducedMotion } from './util';
import { calendarHtml, konbiniHtml, popupHtml, productCardHtml, recipesHtml, type RecipeTab } from './x-views';

export interface Extras {
  frame(): void;                       // cheap per-frame sync
  openRecipes(tab?: 'recipes' | 'snacks'): void; // called when the player chooses Cook (or Eat with only snacks) at home
  /** Called with a journal page id when the player taps a "new journal page" note. */
  onOpenJournal?: (id: string) => void;
  openCalendar(): void;                // called when the player taps the calendar
}

type SheetKind = 'recipes' | 'calendar';

export function mountExtras(layer: HTMLElement, game: GameApi, audio: AudioApi): Extras {
  const root = document.createElement('div');
  root.className = 'x-root';
  root.innerHTML = `
    <div class="xk-bar" hidden role="region" aria-label="Basket"></div>
    <div class="xs-layer" hidden>
      <div class="backdrop" data-x="close"></div>
      <div class="sheet xs-sheet" role="dialog" aria-modal="true" aria-labelledby="xs-h" tabindex="-1"></div>
    </div>
    <div class="xi-layer" hidden></div>
    <button class="xn-note" data-x="note" hidden></button>
    <div class="xp-layer" hidden></div>`;
  layer.appendChild(root);

  const bar = root.querySelector('.xk-bar') as HTMLElement;
  const sLayer = root.querySelector('.xs-layer') as HTMLElement;
  const sheet = root.querySelector('.xs-sheet') as HTMLElement;
  const pLayer = root.querySelector('.xp-layer') as HTMLElement;
  const iLayer = root.querySelector('.xi-layer') as HTMLElement;
  const noteEl = root.querySelector('.xn-note') as HTMLButtonElement;

  const sfx = (n: SfxName) => { try { audio.playSfx(n); } catch { /* ignore */ } };

  /** Replace innerHTML keeping focus (by data-xf key) and the sheet body's scroll. */
  function render(el: HTMLElement, html: string): void {
    const a = document.activeElement as HTMLElement | null;
    const key = a && el.contains(a) ? a.dataset.xf : undefined;
    const sc = el.querySelector('.sheet-body') as HTMLElement | null;
    const top = sc?.scrollTop ?? 0;
    el.innerHTML = html;
    const sc2 = el.querySelector('.sheet-body') as HTMLElement | null;
    if (sc2) sc2.scrollTop = top;
    if (key) (el.querySelector(`[data-xf="${CSS.escape(key)}"]`) as HTMLElement | null)?.focus({ preventScroll: true });
  }

  /* ------------------------------- sheets ------------------------------- */
  let open: SheetKind | null = null;
  let tab: RecipeTab = 'recipes';
  let opener: HTMLElement | null = null;
  let sheetKey = '';

  function sheetStateKey(): string {
    const p = game.state.progress;
    if (open === 'recipes') return `${tab}|${JSON.stringify(p.home?.pantry ?? {})}|${(p.recipes ?? []).join()}|${p.home?.meal ?? ''}|${p.konbiniOpen}`;
    const c = game.state.calendar;
    return c ? `${c.date.year}-${c.date.month}-${c.date.day}|${c.today ?? ''}` : '';
  }

  function refreshSheet(): void {
    if (!open) return;
    sheetKey = sheetStateKey();
    sLayer.dataset.kind = open;
    render(sheet, open === 'recipes' ? recipesHtml(game, tab) : calendarHtml(game));
  }

  function openSheet(kind: SheetKind): void {
    if (!open) opener = document.activeElement as HTMLElement | null;
    open = kind;
    sLayer.hidden = false;
    refreshSheet();
    pulseClass(sheet, 'in');
    sheet.focus({ preventScroll: true });
  }

  function closeSheet(): void {
    if (!open) return;
    open = null;
    sLayer.hidden = true;
    sheet.innerHTML = '';
    const o = opener; opener = null;
    if (o && o.isConnected) o.focus({ preventScroll: true });
  }

  /* ------------------------------- popup ------------------------------- */
  let shown: Popup | null = null;
  let hideTimer = 0;

  function confetti(): void {
    if (reducedMotion()) return;
    const c = document.createElement('div');
    c.className = 'xp-confetti';
    c.setAttribute('aria-hidden', 'true');
    let html = '';
    for (let i = 0; i < 26; i++) {
      const x = (i * 37) % 100 + (i % 3) * 1.5;
      html += `<i style="--x:${x}%;--dl:${((i * 7) % 10) * 0.06}s;--r:${(i * 53) % 360}deg;--c:${i % 4};--s:${0.7 + (i % 3) * 0.25}"></i>`;
    }
    c.innerHTML = html;
    pLayer.appendChild(c);
    setTimeout(() => c.remove(), 2600);
  }

  function showPopup(p: Popup): void {
    if (hideTimer) { clearTimeout(hideTimer); hideTimer = 0; }
    pLayer.classList.remove('out');
    pLayer.innerHTML = popupHtml(game, p);
    pLayer.hidden = false;
    const card = pLayer.querySelector('.xp-card') as HTMLElement | null;
    if (card) pulseClass(card, 'in');
    if (p.kind === 'gift' || p.kind === 'chapter') { confetti(); if (p.dream) setTimeout(confetti, 500); burst(pLayer.querySelector('.xp-halo')); }
    else if (p.kind === 'wish' || p.kind === 'unlock') burst(pLayer.querySelector('.xp-halo'));
    // Let the pop-in start before moving focus (and avoid an accidental double-tap dismiss).
    pLayer.dataset.lock = String(performance.now() + 350);
    (pLayer.querySelector('[data-xf="yay"]') as HTMLElement | null)?.focus({ preventScroll: true });
  }

  function hidePopup(): void {
    if (pLayer.hidden) return;
    pLayer.classList.add('out');
    hideTimer = window.setTimeout(() => {
      hideTimer = 0;
      pLayer.hidden = true; pLayer.classList.remove('out'); pLayer.innerHTML = '';
    }, reducedMotion() ? 0 : 220);
  }

  /* --------------------- shop product card (tap a shelf) --------------------- */
  let cardId: KonbiniStockId | null = null;
  function showCard(id: KonbiniStockId): void {
    cardId = id;
    iLayer.innerHTML = productCardHtml(game, id);
    iLayer.hidden = false;
    pulseClass(iLayer.querySelector('.xi-card'), 'in');
    (iLayer.querySelector('[data-xf="xi-add"]') as HTMLElement | null)?.focus({ preventScroll: true });
  }
  function hideCard(): void {
    if (iLayer.hidden) return;
    cardId = null;
    iLayer.hidden = true;
    iLayer.innerHTML = '';
  }

  /* ------------------ "new journal page" note (not a popup) ------------------ */
  const notes: { id: string; title: string }[] = [];
  let noteId = '';
  let noteTimer = 0;
  function hideNote(): void {
    if (noteTimer) { clearTimeout(noteTimer); noteTimer = 0; }
    noteEl.hidden = true;
    noteId = '';
  }
  function syncNote(s: GameState): void {
    if (noteId || !notes.length) return;
    if (s.mode === 'story' || s.popup || s.mode === 'title') return; // wait for a free moment
    const n = notes.shift()!;
    noteId = n.id;
    noteEl.innerHTML = `<span class="xn-note-ico" aria-hidden="true">✦</span><span class="xn-note-t"><small>New journal page</small><b></b></span><span class="xn-note-go" aria-hidden="true">Read</span>`;
    (noteEl.querySelector('b') as HTMLElement).textContent = n.title;
    noteEl.setAttribute('aria-label', `New journal page: ${n.title}. Open the journal`);
    noteEl.hidden = false;
    pulseClass(noteEl, 'in');
    noteTimer = window.setTimeout(hideNote, 4200);
  }

  /* ------------------------------- konbini ------------------------------- */
  let barKey = '';
  let lastQty = new Map<string, number>();

  function syncKonbini(s: GameState): void {
    const basket = s.konbini?.basket ?? [];
    let total = 0;
    try { total = game.basketTotal(); } catch { /* ignore */ }
    const key = `${basket.map((b) => `${b.id}:${b.qty}`).join(',')}|${total}|${s.progress.home?.wallet ?? 0}`;
    if (key === barKey) return;
    const first = barKey === '';
    barKey = key;
    const bumped = new Set<string>();
    const now = new Map<string, number>();
    for (const b of basket) {
      now.set(b.id, b.qty);
      if (!first && b.qty > (lastQty.get(b.id) ?? 0)) bumped.add(b.id);
    }
    lastQty = now;
    render(bar, konbiniHtml(game, bumped));
    if (bumped.size) pulseClass(bar.querySelector('.xk-total'), 'bump');
  }

  /* ------------------------------- actions ------------------------------- */
  function fail(el: Element | null): void {
    sfx('error');
    pulseClass(el, 'shake');
  }

  root.addEventListener('click', (e) => {
    const t = (e.target as Element).closest<HTMLElement>('[data-x]');
    if (!t || !root.contains(t) || (t as HTMLButtonElement).disabled) return;
    const id = t.dataset.id ?? '';
    switch (t.dataset.x) {
      case 'yay': {
        if (performance.now() < Number(pLayer.dataset.lock || 0)) return;
        sfx('tap');
        game.dismissPopup();
        frame();
        break;
      }
      case 'close': sfx('tap'); closeSheet(); break;
      case 'card-close': sfx('tap'); hideCard(); break;
      case 'card-add': {
        const pid = cardId;
        hideCard();
        if (pid) { try { game.konbiniTake(pid); } catch (err) { console.error(err); } }
        frame();
        break;
      }
      case 'note': {
        const nid = noteId;
        hideNote();
        sfx('page');
        // the journal can't open over a running café day: pause is not worth it, the page waits in the book
        const m = game.state.mode;
        if (nid && (m === 'home' || m === 'konbini' || m === 'dayEnd')) { try { api.onOpenJournal?.(nid); } catch (err) { console.error(err); } }
        break;
      }
      case 'tab': sfx('tap'); tab = id as RecipeTab; refreshSheet(); break;
      case 'mart': sfx('tap'); closeSheet(); game.goTo('konbini'); break;
      case 'cook': {
        const card = t.closest('.xs-card');
        let ok = false;
        try { ok = game.canCook(id as DishId).ok && game.cookDish(id as DishId); } catch { ok = false; }
        if (!ok) { fail(card); refreshSheet(); break; }
        burst(card as HTMLElement | null);
        setTimeout(closeSheet, reducedMotion() ? 0 : 260);
        break;
      }
      case 'snack': {
        const card = t.closest('.xs-card');
        let ok = false;
        try { ok = game.eatSnack(id as SnackId); } catch { ok = false; }
        if (!ok) { fail(card); refreshSheet(); break; }
        burst(card as HTMLElement | null);
        setTimeout(closeSheet, reducedMotion() ? 0 : 260);
        break;
      }
      case 'unbasket': sfx('tap'); game.konbiniRemove(id as KonbiniStockId); frame(); break;
      case 'pay': {
        const ok = game.konbiniCheckout();
        if (!ok) fail(bar.querySelector('.xk-total'));
        else burst(bar.querySelector('.xk-pay'));
        frame();
        break;
      }
      case 'home': sfx('tap'); game.goTo('home'); frame(); break;
    }
  });

  // Squish feedback (also works if the core's pointerdown handler doesn't cover our elements).
  root.addEventListener('pointerdown', (e) => {
    const b = (e.target as Element).closest('.btn, .ibtn, .seg, .xk-item');
    if (b && !(b as HTMLButtonElement).disabled) pulseClass(b, 'squish');
  });
  root.addEventListener('animationend', (e) => {
    const t = e.target as Element;
    if (e.animationName === 'cs-squish') t.classList.remove('squish');
    if (e.animationName === 'cs-shake') t.classList.remove('shake');
    if (e.animationName === 'cs-bump') t.classList.remove('bump');
    if (e.animationName === 'x-pop') t.classList.remove('xk-pop');
  });

  // Escape / Tab trap for our dialogs (capture so the core doesn't also react, e.g. pause the day).
  document.addEventListener('keydown', (e) => {
    const box = !pLayer.hidden ? pLayer.querySelector('.xp-card') as HTMLElement | null
      : !iLayer.hidden ? iLayer.querySelector('.xi-card') as HTMLElement | null : open ? sheet : null;
    if (!box) return;
    if (e.key === 'Escape') {
      e.preventDefault(); e.stopImmediatePropagation();
      if (!pLayer.hidden) { game.dismissPopup(); frame(); } else if (!iLayer.hidden) hideCard(); else closeSheet();
      return;
    }
    if (e.key === 'Tab') {
      const f = Array.from(box.querySelectorAll<HTMLElement>('button:not([disabled])')).filter((el) => el.offsetParent !== null);
      e.stopImmediatePropagation();
      if (!f.length) { e.preventDefault(); return; }
      const a = document.activeElement, first = f[0], last = f[f.length - 1];
      if (e.shiftKey && (a === first || !box.contains(a) || a === box)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (a === last || !box.contains(a))) { e.preventDefault(); first.focus(); }
    }
  }, { capture: true });

  game.subscribe((e) => {
    if (e.type === 'konbiniPick') showCard(e.id);
    if (e.type === 'secret') notes.push({ id: e.id, title: e.title });
    if (e.type === 'progress' && open) queueMicrotask(() => { if (open && sheetStateKey() !== sheetKey) refreshSheet(); });
  });

  /* -------------------------------- frame -------------------------------- */
  let lastMode = '' as GameState['mode'] | '';

  function frame(): void {
    const s = game.state;
    if (s.popup !== shown) {
      shown = s.popup;
      if (shown) showPopup(shown); else hidePopup();
    }
    if (s.mode !== lastMode) {
      const prev = lastMode;
      lastMode = s.mode;
      root.dataset.mode = s.mode;
      bar.hidden = s.mode !== 'konbini';
      barKey = '';
      if (prev && open) closeSheet();
      hideCard();
      if (s.mode === 'story' || s.mode === 'title') hideNote();
    }
    syncNote(s);
    if (s.mode === 'konbini') syncKonbini(s);
    if (open && sheetStateKey() !== sheetKey) refreshSheet();
  }

  frame();

  const api: Extras = {
    frame,
    openRecipes(t = 'recipes') { tab = t; openSheet('recipes'); },
    openCalendar() { openSheet('calendar'); },
  };
  return api;
}
