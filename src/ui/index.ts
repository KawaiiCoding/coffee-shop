/* =====================================================================
   UI ENTRY — app frame, scene svg, HUD, title / day-end screens,
   bottom nav, bottom sheets, toasts. Plain DOM; styles in ui.css.
   ===================================================================== */
import './ui.css';
import { palette } from '../art';
import type { AudioApi, GameApi, GameState, HomeActionId, HomeItemId, Settings, ThemeId } from '../types';
import {
  dayEndHtml, displayDay, SHEET_TITLES, sheetBodyHtml, titleHtml, type SheetKind, type UiState,
} from './sheets';
import {
  choreProgress, currentGoal, homeChipHtml, homeDockHtml, homeLock, storyHtml,
  TUTORIAL_COUNT, tutorialDoneHtml, tutorialHtml, type HomeUi,
} from './screens';
import { mountExtras, type Extras } from './extras';
import { mountJournal, type JournalUI } from './x-journal';
import { mountNews, type NewsUI } from './x-news';
import { burst, icon, pulseClass, qs } from './util';

export { createAudio } from './audio';

export interface MountedUI {
  /** The <svg viewBox="0 0 360 720"> the engine renderer draws the café into. */
  sceneSvg: SVGSVGElement;
  /** Called every animation frame after the scene renders (cheap HUD updates only). */
  frame(): void;
}

const SVG_NS = 'http://www.w3.org/2000/svg';

/** What the UI shows: the game mode, except the konbini (mode 'konbini', or scene 'konbini' while at home). */
type View = GameState['mode'];
const viewOf = (s: GameState): View => (s.mode === 'konbini' || (s.mode === 'home' && s.scene === 'konbini') ? 'konbini' : s.mode);
const NAV: { id: 'cafe' | SheetKind; label: string; icon: Parameters<typeof icon>[0] }[] = [
  { id: 'cafe', label: 'Café', icon: 'cafe' },
  { id: 'upgrades', label: 'Upgrades', icon: 'shop' },
  { id: 'decor', label: 'Decor', icon: 'decor' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
];

export function mountUI(root: HTMLElement, game: GameApi, audio: AudioApi): MountedUI {
  root.classList.add('cs-app');
  root.innerHTML = `
    <div class="cs-fit">
      <div class="cs-stage">
        <div class="cs-scene-wrap"></div>
        <div class="cs-ui">
          <header class="hud" hidden>
            <button class="ibtn hud-pause" data-act="pause" aria-label="Pause">${icon('pause')}</button>
            <div class="hud-mid">
              <span class="hud-day">Day 1</span>
              <div class="bar" role="progressbar" aria-label="Day progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
                <i class="bar-fill"></i><span class="bar-closed">Closed</span>
              </div>
            </div>
            <div class="hud-coins coin-pill" title="Café coins"><span class="sr-only">Café coins</span>${icon('coin')}<b>0</b></div>
          </header>
          <header class="hud hud-ready" hidden>
            <button class="ibtn" data-act="open" data-sheet="settings" aria-label="Settings">${icon('settings')}</button>
            <div class="hud-mid">
              <span class="hud-day">Getting ready <small class="ready-n">0/0</small></span>
              <div class="bar" role="progressbar" aria-label="Chores done" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
                <i class="bar-fill"></i>
              </div>
            </div>
          </header>
          <header class="hud hud-home" hidden>
            <button class="ibtn" data-act="open" data-sheet="settings" aria-label="Settings">${icon('settings')}</button>
            <div class="home-stats">
              <div class="stat stat-energy" role="meter" aria-label="Energy" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
                ${icon('energy')}<span class="mbar"><i></i></span><b>0</b>
              </div>
              <div class="stat stat-happy" role="meter" aria-label="Happiness" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
                ${icon('smile')}<span class="mbar"><i></i></span><b>0</b>
              </div>
            </div>
            <div class="hud-coins pay-pill" title="Mocha's pay"><span class="sr-only">Pay</span><span class="pill-lbl" aria-hidden="true">Pay</span>${icon('pay')}<b>0</b></div>
          </header>
          <header class="hud hud-konbini" hidden>
            <button class="btn btn-small btn-leave" data-act="leave-konbini" data-focus="leave" aria-label="Leave Hoshi Mart and walk home">${icon('back')}<span>Leave</span></button>
            <div class="hud-mid konbini-title">${icon('konbini')}<span class="hud-day">Hoshi Mart</span></div>
            <div class="hud-coins pay-pill" title="Mocha's pay"><span class="sr-only">Pay</span><span class="pill-lbl" aria-hidden="true">Pay</span>${icon('pay')}<b>0</b></div>
          </header>
          <div class="home-chips" hidden></div>
          <div class="float-top">
            <div class="tut" hidden></div>
            <div class="toasts" role="status" aria-live="polite"></div>
          </div>
          <div class="float-bottom"><div class="hint" hidden></div></div>
          <section class="screen screen-title" hidden></section>
          <section class="screen screen-dayend" hidden></section>
          <div class="home-bottom" hidden>
            <div class="dock-more" role="group" aria-label="More things to do" hidden></div>
            <nav class="dock" aria-label="Things to do at home"></nav>
          </div>
          <section class="screen-story" hidden aria-label="Story"></section>
          <div class="sheet-layer" hidden>
            <div class="backdrop" data-act="close"></div>
            <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="cs-sheet-h" tabindex="-1">
              <div class="sheet-head">
                <h2 id="cs-sheet-h"></h2>
                <button class="ibtn" data-act="close" aria-label="Close">${icon('close')}</button>
              </div>
              <div class="sheet-body"></div>
            </div>
          </div>
          <nav class="nav" hidden aria-label="Menu">
            ${NAV.map((n) => `<button class="tab" data-act="nav" data-sheet="${n.id}" data-tab="${n.id}">
              ${icon(n.icon)}<span>${n.label}</span></button>`).join('')}
          </nav>
        </div>
      </div>
    </div>`;

  const fit = qs(root, '.cs-fit');
  const stage = qs(root, '.cs-stage');
  const uiEl = qs(root, '.cs-ui');
  const hud = qs(root, '.hud');
  const hudDay = qs(root, '.hud-day');
  const bar = qs(root, '.bar');
  const barFill = qs(root, '.bar-fill');
  const hudCoins = qs(root, '.hud-coins');
  const hudCoinsN = qs(hudCoins, 'b');
  const hint = qs(root, '.hint');
  const toasts = qs(root, '.toasts');
  const titleEl = qs(root, '.screen-title');
  const dayEndEl = qs(root, '.screen-dayend');
  const layer = qs(root, '.sheet-layer');
  const sheet = qs(root, '.sheet');
  const sheetH = qs(root, '#cs-sheet-h');
  const sheetBody = qs(root, '.sheet-body');
  const nav = qs(root, '.nav');
  const pauseBtn = qs(hud, '.hud-pause');
  const readyBar = qs(root, '.hud-ready');
  const readyN = qs(readyBar, '.ready-n');
  const readyBarEl = qs(readyBar, '.bar');
  const readyFill = qs(readyBar, '.bar-fill');
  const tutEl = qs(root, '.tut');
  const homeTop = qs(root, '.hud-home');
  const konbiniTop = qs(root, '.hud-konbini');
  const payPills = Array.from(root.querySelectorAll<HTMLElement>('.pay-pill'));
  const energyEl = qs(homeTop, '.stat-energy');
  const happyEl = qs(homeTop, '.stat-happy');
  const chipsEl = qs(root, '.home-chips');
  const homeBottom = qs(root, '.home-bottom');
  const moreEl = qs(root, '.dock-more');
  const dock = qs(root, '.dock');

  const storyEl = qs(root, '.screen-story');

  /* ---------------------------- scene svg ---------------------------- */
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 360 720');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.setAttribute('class', 'cs-scene');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'Your café');
  qs(root, '.cs-scene-wrap').appendChild(svg);

  svg.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    // Map the tap through the viewBox by hand: Safari's getScreenCTM is unreliable for CSS-scaled svgs.
    const r = svg.getBoundingClientRect();
    const vb = svg.viewBox.baseVal;
    if (!r.width || !r.height || !vb || !vb.width) return;
    const k = Math.min(r.width / vb.width, r.height / vb.height); // preserveAspectRatio meet
    const ox = r.left + (r.width - vb.width * k) / 2, oy = r.top + (r.height - vb.height * k) / 2;
    game.tapScene(vb.x + (e.clientX - ox) / k, vb.y + (e.clientY - oy) / k);
  });
  svg.addEventListener('contextmenu', (e) => e.preventDefault());

  /* --------------------------- fit to screen --------------------------- */
  function layout(): void {
    const cs = getComputedStyle(fit);
    const w = fit.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const h = fit.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    const u = Math.max(0.2, Math.min(w / 360, h / 720));
    // Use the phone's full height: on screens taller than 1:2 the scene grows
    // (more wall above, more floor below) instead of showing empty bands.
    const sceneH = Math.max(720, h / u);
    const extra = sceneH - 720;
    const top = extra * 0.4;
    svg.setAttribute('viewBox', `0 ${(-top).toFixed(1)} 360 ${sceneH.toFixed(1)}`);
    stage.style.width = `${Math.floor(360 * u)}px`;
    stage.style.height = `${Math.floor(sceneH * u)}px`;
    stage.style.setProperty('--u', `${u}px`);
  }
  // Wall and floor colour beyond the 0..720 drawing, under everything the renderer adds.
  const backdrop = document.createElementNS(SVG_NS, 'g');
  backdrop.innerHTML = '<rect class="bd-wall" x="-50" y="-3000" width="460" height="3250"/>'
    + '<rect class="bd-floor" x="-50" y="250" width="460" height="3000"/>';
  svg.appendChild(backdrop);
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(layout).observe(fit);
  window.addEventListener('resize', layout);
  window.addEventListener('orientationchange', () => setTimeout(layout, 200));
  layout();

  // No pinch zoom (iOS ignores user-scalable=no); double-tap zoom is off via touch-action in CSS.
  document.addEventListener('gesturestart', (e) => e.preventDefault());

  /* ----------------------------- audio unlock ----------------------------- */
  // iOS Safari only lets sound start inside touchend/click, so try on every gesture
  // until a click/touchend/keydown has happened (pointerdown alone may not count).
  let unlocked = false;
  const unlock = (e: Event) => {
    if (unlocked) return;
    try { audio.unlock(); } catch { /* ignore */ }
    if (e.type !== 'pointerdown') unlocked = true;
  };
  for (const ev of ['pointerdown', 'touchend', 'click', 'keydown']) root.addEventListener(ev, unlock, { capture: true });

  /* ------------------------------ ui state ------------------------------ */
  const ui: UiState = { decorSlot: 'ceiling', confirmTitle: false, confirmReset: false, upTab: 'cafe', decorPreview: null };
  const homeUi: HomeUi = { more: false, chip: false };

  /* ------------------------------ extras ------------------------------ */
  // Konbini basket bar, recipe picker, popups and the calendar live in extras.ts, mounted into
  // .cs-ui (same stacking context). Its z-indexes: konbini bar 20, its sheets 45 (above ours at 40),
  // popups 60 (above everything here). It uses data-x attributes, so our data-act handler ignores it.
  let extras: Extras = { frame() {}, openRecipes() {}, openCalendar() {} };
  try { extras = mountExtras(uiEl, game, audio); } catch (err) { console.error('extras failed to mount', err); }
  // Mocha's journal and the newspaper: own sheets at z 45 (x-journal.ts / x-news.ts, data-j / data-n attributes).
  let journal: JournalUI = { open() {}, frame() {} };
  let news: NewsUI = { open() {}, frame() {} };
  try { journal = mountJournal(uiEl, game, audio); } catch (err) { console.error('journal failed to mount', err); }
  try { news = mountNews(uiEl, game, audio); } catch (err) { console.error('news failed to mount', err); }
  const ex = (f: () => void) => { try { f(); } catch (err) { console.error(err); } };
  let open: SheetKind | null = null;
  let opener: HTMLElement | null = null;
  let deferRefresh = false;
  let refreshQueued = false;

  /** Replace innerHTML, keeping focus on the element with the same data-focus key and scroll. */
  function render(el: HTMLElement, html: string): void {
    const active = document.activeElement as HTMLElement | null;
    const key = active && el.contains(active) ? active.dataset.focus : undefined;
    const scroller = el === sheetBody ? sheetBody : null;
    const top = scroller?.scrollTop ?? 0;
    el.innerHTML = html;
    if (scroller) scroller.scrollTop = top;
    if (key) (el.querySelector(`[data-focus="${CSS.escape(key)}"]`) as HTMLElement | null)?.focus({ preventScroll: true });
  }

  function refreshSheet(): void {
    if (!open) return;
    sheetH.textContent = SHEET_TITLES[open];
    render(sheetBody, sheetBodyHtml(open, game, ui));
  }

  function refreshScreens(): void {
    const m = game.state.mode;
    if (m === 'title') render(titleEl, titleHtml(game));
    if (m === 'dayEnd') render(dayEndEl, dayEndHtml(game, game.state.lastDay));
    last.story = ''; last.chores = ''; last.home = ''; // re-render on the next frame
  }

  function refreshAll(): void {
    refreshQueued = false;
    const a = document.activeElement as HTMLInputElement | null;
    if (open && a && a.type === 'range' && sheetBody.contains(a)) { deferRefresh = true; return; }
    refreshSheet();
    if (game.state.mode === 'title') render(titleEl, titleHtml(game));
    last.home = '';
    syncCoins();
  }
  const queueRefresh = () => {
    if (refreshQueued) return;
    refreshQueued = true;
    queueMicrotask(() => { if (refreshQueued) refreshAll(); });
  };

  function setNavActive(): void {
    const id = open && open !== 'pause' ? open : 'cafe';
    nav.querySelectorAll<HTMLElement>('.tab').forEach((t) => {
      const on = t.dataset.tab === id;
      t.classList.toggle('on', on);
      if (on) t.setAttribute('aria-current', 'page'); else t.removeAttribute('aria-current');
    });
  }

  function openSheet(kind: SheetKind, from?: HTMLElement | null): void {
    if (!open) opener = from ?? (document.activeElement as HTMLElement | null);
    open = kind;
    ui.confirmTitle = false;
    ui.confirmReset = false;
    if (kind === 'decor') ui.decorPreview = null;
    layer.hidden = false;
    layer.dataset.kind = kind;
    sheet.classList.remove('in');
    pulseClass(sheet, 'in');
    refreshSheet();
    setNavActive();
    sheet.focus({ preventScroll: true });
  }

  function hideSheet(): void {
    open = null;
    layer.hidden = true;
    sheetBody.innerHTML = '';
    setNavActive();
    const o = opener;
    opener = null;
    if (o && o.isConnected) o.focus({ preventScroll: true });
    else focusScreen();
  }

  /** Close the current sheet; while paused, sub-sheets return to the pause sheet. */
  function closeSheet(): void {
    if (!open) return;
    const m = game.state.mode;
    if (m === 'paused' && open !== 'pause') { openSheet('pause'); return; }
    if (m === 'paused' && open === 'pause') { hideSheet(); game.resume(); sync(); return; }
    hideSheet();
  }

  function focusScreen(): void {
    // Auto-focus after a sheet/popup closes: no focus ring (it boxed the Sleep / Leave buttons on touch screens).
    const opts = { preventScroll: true, focusVisible: false } as FocusOptions;
    const m = game.state.mode;
    const el = m === 'title' ? titleEl : m === 'dayEnd' ? dayEndEl : null;
    const v = viewOf(game.state);
    if (v === 'konbini') { (konbiniTop.querySelector('[data-focus="leave"]') as HTMLElement | null)?.focus(opts); return; }
    const sel = m === 'story' ? '[data-focus="story-next"]' : m === 'home' ? '[data-focus="act-sleep"]' : '[data-focus="start"]';
    ((el ?? (m === 'story' ? storyEl : m === 'home' ? homeBottom : null))
      ?.querySelector(sel) as HTMLElement | null)?.focus(opts);
  }

  /* --------------------------- settings / audio --------------------------- */
  function patchSettings(patch: Partial<Settings>): void {
    game.setSettings(patch);
    try { audio.applySettings({ ...game.state.progress.settings, ...patch }); } catch { /* ignore */ }
  }

  function goToTitle(): void {
    const g = game as GameApi & { quitToTitle?: () => void; toTitle?: () => void };
    if (typeof g.quitToTitle === 'function') g.quitToTitle();
    else if (typeof g.toTitle === 'function') g.toTitle();
    else (game.state as GameState).mode = 'title';
  }

  /* ------------------------------- actions ------------------------------- */
  const tap = () => { try { audio.playSfx('tap'); } catch { /* ignore */ } };

  uiEl.addEventListener('click', (e) => {
    const t = (e.target as Element).closest<HTMLElement>('[data-act]');
    if (!t || !uiEl.contains(t) || (t as HTMLButtonElement).disabled) return;
    const id = t.dataset.id ?? '';
    switch (t.dataset.act) {
      case 'pause': tap(); game.pause(); sync(); break;
      case 'resume': tap(); hideSheet(); game.resume(); sync(); break;
      case 'start': tap(); if (open) hideSheet(); game.startDay(); sync(); break;
      case 'open': tap(); homeUi.more = false; last.home = ''; openSheet(t.dataset.sheet as SheetKind, t); break;
      case 'nav': {
        tap();
        const k = t.dataset.sheet as 'cafe' | SheetKind;
        if (k === 'cafe') { if (open) hideSheet(); focusScreen(); } else if (open !== k) openSheet(k, t);
        break;
      }
      case 'close': tap(); closeSheet(); break;
      case 'story-next': storyNext(); break;
      case 'story-skip': tap(); game.storySkip(); sync(); break;
      case 'go-home': tap(); if (open) hideSheet(); game.goHome(); sync(); break;
      case 'home-act': homeAct(id as HomeActionId, t); break;
      case 'home-more': tap(); homeUi.more = !homeUi.more; last.home = ''; sync(); break;
      case 'home-chip': tap(); homeUi.chip = !homeUi.chip; last.home = ''; sync(); break;
      case 'calendar': tap(); homeUi.more = false; last.home = ''; ex(() => extras.openCalendar()); break;
      case 'journal': tap(); homeUi.more = false; last.home = ''; if (open) hideSheet(); ex(() => journal.open()); break;
      case 'news': tap(); homeUi.more = false; last.home = ''; if (open) hideSheet(); ex(() => news.open()); break;
      case 'go-konbini': tap(); homeUi.more = false; if (open) hideSheet(); ex(() => game.goTo('konbini')); sync(); break;
      case 'leave-konbini': tap(); ex(() => game.goTo('home')); sync(); break;
      case 'home-item': {
        const h = game.state.progress.home;
        const owned = h?.owned?.includes(id as HomeItemId) ?? false;
        let ok = true;
        if (owned) { game.placeHomeItem(id as HomeItemId); tap(); } else ok = game.buyHomeItem(id as HomeItemId);
        refreshAll();
        const card = sheetBody.querySelector<HTMLElement>(`[data-focus="hi-${CSS.escape(id)}"]`);
        if (ok) burst(card); else pulseClass(card, 'shake');
        break;
      }
      case 'title-ask': tap(); ui.confirmTitle = true; refreshSheet(); focusKey('title-cancel'); break;
      case 'title-cancel': tap(); ui.confirmTitle = false; refreshSheet(); focusKey('title-ask'); break;
      case 'title-yes': tap(); ui.confirmTitle = false; hideSheet(); goToTitle(); sync(); break;
      case 'buy-up': {
        const ok = game.buyUpgrade(id as never);
        refreshAll();
        const card = sheetBody.querySelector<HTMLElement>(`[data-card="${CSS.escape(id)}"]`);
        if (ok) burst(card); else pulseClass(card, 'shake');
        break;
      }
      case 'slot': tap(); ui.decorSlot = id as UiState['decorSlot']; ui.decorPreview = null; refreshSheet(); break;
      case 'up-tab': tap(); ui.upTab = id as NonNullable<UiState['upTab']>; refreshSheet(); break;
      case 'dec-pick': {
        // Tap a decor card: try it in the café preview (tap again to go back to the café as it is).
        tap();
        ui.decorPreview = ui.decorPreview === id ? null : (id as NonNullable<UiState['decorPreview']>);
        refreshSheet();
        if (ui.decorPreview) pulseClass(sheetBody.querySelector('.dec-preview'), 'pv-pop');
        break;
      }
      case 'decor': {
        const p = game.state.progress;
        const owned = p.ownedDecor.includes(id as never);
        let ok = true;
        if (owned) game.placeDecor(id as never); else ok = game.buyDecor(id as never);
        if (owned) tap();
        refreshAll();
        const card = sheetBody.querySelector<HTMLElement>(`[data-focus="dec-${CSS.escape(id)}"]`);
        if (ok) burst(card); else pulseClass(card, 'shake');
        break;
      }
      case 'toggle': {
        const k = id as 'music' | 'sfx' | 'hints';
        patchSettings({ [k]: !game.state.progress.settings[k] });
        tap();
        refreshSheet();
        break;
      }
      case 'theme': tap(); game.setTheme(id as ThemeId | 'auto'); refreshSheet(); break;
      case 'reset-ask': tap(); ui.confirmReset = true; refreshSheet(); focusKey('reset-cancel'); break;
      case 'reset-cancel': tap(); ui.confirmReset = false; refreshSheet(); focusKey('reset-ask'); break;
      case 'reset-yes':
        tap(); ui.confirmReset = false;
        game.resetSave();
        try { audio.applySettings(game.state.progress.settings); } catch { /* ignore */ }
        hideSheet(); sync(); refreshScreens();
        break;
    }
  });

  /* ------------------------------- story ------------------------------- */
  let storyLock = 0;
  function storyNext(): void {
    const now = performance.now();
    if (now < storyLock) return; // a quick double tap shouldn't skip a page
    storyLock = now + 320;
    game.storyNext(); // the engine plays the page-turn sound
    sync();
  }

  /* -------------------------------- home -------------------------------- */
  function homeAct(id: HomeActionId, el: HTMLElement): void {
    const fail = (why: string) => {
      try { audio.playSfx('error'); } catch { /* ignore */ }
      pulseClass(el, 'shake');
      toast(why);
    };
    const lock = id === 'sleep' ? null : homeLock(game, id);
    if (id === 'calendar') { tap(); homeUi.more = false; ex(() => extras.openCalendar()); }
    else if (lock) fail(lock === 'hide' ? 'Not right now' : lock);
    else {
      let can: { ok: boolean; reason?: string } = { ok: true };
      try { can = game.canDoHomeAction(id); } catch { /* let the engine decide */ }
      if (!can.ok) fail(can.reason || 'Not right now');
      else if (!game.homeAction(id)) { pulseClass(el, 'shake'); } // the engine already toasted why
      else {
        pulseClass(el, 'bump');
        homeUi.more = false;
        if (id === 'cook') ex(() => extras.openRecipes()); // Mocha walks to the stove, the recipe picker opens
      }
    }
    last.home = '';
    sync();
  }

  function focusKey(key: string): void {
    (sheetBody.querySelector(`[data-focus="${key}"]`) as HTMLElement | null)?.focus({ preventScroll: true });
  }

  uiEl.addEventListener('input', (e) => {
    const t = e.target as HTMLInputElement;
    const key = t.dataset?.vol as 'musicVolume' | 'sfxVolume' | undefined;
    if (!key) return;
    patchSettings({ [key]: Number(t.value) });
  });
  uiEl.addEventListener('change', (e) => {
    const t = e.target as HTMLInputElement;
    if (!t.dataset?.vol) return;
    if (t.dataset.vol === 'sfxVolume') { try { audio.playSfx('coin'); } catch { /* ignore */ } }
    if (deferRefresh) { deferRefresh = false; t.blur(); refreshAll(); }
  });

  // Pressed "squish" on any button.
  uiEl.addEventListener('pointerdown', (e) => {
    const b = (e.target as Element).closest('.btn, .ibtn, .tab, .dec-card, .seg, .switch-row, .act, .home-chip, .cal-chip, .story-skip');
    if (b && !(b as HTMLButtonElement).disabled) pulseClass(b, 'squish');
  });
  uiEl.addEventListener('animationend', (e) => {
    const t = e.target as Element;
    if (e.animationName === 'cs-squish') t.classList.remove('squish');
    if (e.animationName === 'cs-shake') t.classList.remove('shake');
    if (e.animationName === 'cs-bump') t.classList.remove('bump');
    if (e.animationName === 'cs-tick') t.classList.remove('pop');
  });

  /* ------------------------------ keyboard ------------------------------ */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (open) { e.preventDefault(); closeSheet(); }
      else if (homeUi.more || homeUi.chip) { e.preventDefault(); homeUi.more = false; homeUi.chip = false; last.home = ''; sync(); }
      else if (game.state.mode === 'playing') { game.pause(); sync(); }
      return;
    }
    if (!open && game.state.mode === 'story' && (e.key === 'ArrowRight' || e.key === 'PageDown')) {
      e.preventDefault(); storyNext(); return;
    }
    if (e.key === 'Tab' && open) {
      const f = Array.from(sheet.querySelectorAll<HTMLElement>('button:not([disabled]), input, [tabindex="0"]'))
        .filter((el) => el.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      const a = document.activeElement;
      if (e.shiftKey && (a === first || a === sheet || !sheet.contains(a))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (a === last || !sheet.contains(a))) { e.preventDefault(); first.focus(); }
    }
  });

  /* ------------------------------- toasts ------------------------------- */
  /** One short message at a time, never over a story page or a popup, and no repeats. */
  let lastToast = '', lastToastAt = 0;
  function toast(text: string): void {
    const s = game.state;
    if (s.mode === 'story' || s.popup) return;               // never cover a story or a popup
    const now = performance.now();
    if (text === lastToast && now - lastToastAt < 3000) return; // don't repeat the same message
    lastToast = text; lastToastAt = now;
    toasts.replaceChildren();                                  // only one visible at a time
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = text;
    toasts.appendChild(el);
    setTimeout(() => el.classList.add('out'), 1900);
    setTimeout(() => el.remove(), 2300);
  }

  game.subscribe((e) => {
    // a story or popup takes over the screen: clear any message still showing
    if ((game.state.mode === 'story' || game.state.popup) && toasts.childElementCount) toasts.replaceChildren();
    if (e.type === 'toast') toast(e.text);
    else if (e.type === 'progress') queueRefresh();
    else if ((e as { type: string }).type === 'sheet') {
      // The player tapped the stove / calendar in the home scene.
      const k = (e as unknown as { sheet?: string }).sheet;
      homeUi.more = false; last.home = '';
      if (open) hideSheet();
      if (k === 'cook') ex(() => extras.openRecipes());
      else if (k === 'calendar') ex(() => extras.openCalendar());
      else if (k === 'news') ex(() => news.open());
      else if (k === 'journal') ex(() => journal.open());
    }
  });

  /* ---------------------------- theme colours ---------------------------- */
  let themeMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  function applyTheme(theme: ThemeId): void {
    let p;
    try { p = palette(theme); } catch { return; }
    const vars: Record<string, string> = {
      '--wall': p.wall, '--floor': p.floor, '--trim': p.trim, '--accent': p.accent,
      '--accent2': p.accent2, '--paper': p.paper, '--text': p.text, '--ink': p.ink,
    };
    for (const k in vars) if (vars[k]) root.style.setProperty(k, vars[k]);
    document.documentElement.style.background = p.wall;
    backdrop.querySelector('.bd-wall')?.setAttribute('fill', p.wall);
    backdrop.querySelector('.bd-floor')?.setAttribute('fill', p.floor);
    if (!themeMeta) {
      themeMeta = document.createElement('meta');
      themeMeta.name = 'theme-color';
      document.head.appendChild(themeMeta);
    }
    themeMeta.content = p.wall;
  }

  /* -------------------------------- frame -------------------------------- */
  const last = {
    mode: '' as View | '', theme: '' as ThemeId | '', day: -1, coins: -1,
    k: -1, door: null as boolean | null, hint: null as string | null,
    story: '', chores: '', tut: '', tutDone: [] as boolean[],
    home: '', wallet: -1,
  };
  let tutShown = false;
  let tutTimer = 0;

  function syncCoins(): void {
    const c = game.state.progress.coins;
    if (c === last.coins) return;
    if (last.coins >= 0 && c > last.coins) pulseClass(hudCoins, 'bump');
    last.coins = c;
    hudCoinsN.textContent = String(c);
  }

  function onMode(prev: View | '', v: View): void {
    root.dataset.mode = v;
    const m = game.state.mode;
    const play = m === 'playing' || m === 'paused';
    hud.hidden = !play;
    pauseBtn.hidden = m !== 'playing';
    nav.hidden = !(m === 'title' || m === 'dayEnd');
    titleEl.hidden = m !== 'title';
    dayEndEl.hidden = m !== 'dayEnd';
    storyEl.hidden = m !== 'story';
    readyBar.hidden = m !== 'cleanup';
    homeTop.hidden = v !== 'home';
    chipsEl.hidden = v !== 'home';
    homeBottom.hidden = v !== 'home';
    konbiniTop.hidden = v !== 'konbini';
    if (v !== 'home') { homeUi.more = false; homeUi.chip = false; }
    if (!play) hideTutorial();
    if (open && m !== 'paused') hideSheet();
    if (m === 'paused' && !open) openSheet('pause', pauseBtn);
    if (m === 'title' || m === 'dayEnd') refreshScreens();
    last.story = ''; last.chores = ''; last.home = '';
    setNavActive();
    last.day = -1; // force HUD refresh
    if (prev !== '' && !open && m !== 'playing' && m !== 'cleanup') {
      queueMicrotask(() => { if (!open && viewOf(game.state) === v) focusScreen(); });
    }
  }

  /* ---------------------------- cleanup sync ---------------------------- */
  function syncCleanup(s: GameState): void {
    const { done, total } = choreProgress(s.chores);
    const key = `${done}/${total}`;
    if (key === last.chores) return;
    last.chores = key;
    const k = total ? done / total : 0;
    readyFill.style.transform = `scaleX(${k})`;
    readyBarEl.setAttribute('aria-valuenow', String(Math.round(k * 100)));
    readyN.textContent = key;
  }

  /* --------------------------- tutorial sync --------------------------- */
  function hideTutorial(): void {
    if (tutTimer) { clearTimeout(tutTimer); tutTimer = 0; }
    tutShown = false; last.tut = '';
    tutEl.hidden = true;
    tutEl.classList.remove('out', 'fin');
  }

  function syncTutorial(s: GameState): void {
    const t = s.tutorial;
    const on = !!t && t.active && t.step < TUTORIAL_COUNT && (s.mode === 'playing' || s.mode === 'paused');
    if (on) {
      const done = t.done ?? [];
      const key = `${t.step}:${done.map((d) => (d ? 1 : 0)).join('')}`;
      if (tutShown && key === last.tut) return;
      if (tutTimer) { clearTimeout(tutTimer); tutTimer = 0; }
      const pop = new Set<number>();
      if (tutShown) done.forEach((d, i) => { if (d && !last.tutDone[i]) pop.add(i); });
      for (let i = 0; i < t.step; i++) if (!last.tutDone[i] && tutShown) pop.add(i);
      last.tut = key; last.tutDone = done.map((d, i) => !!d || i < t.step);
      tutEl.classList.remove('out', 'fin');
      render(tutEl, tutorialHtml(t.step, done, pop));
      if (!tutShown) { tutEl.hidden = false; pulseClass(tutEl, 'in'); }
      tutShown = true;
      return;
    }
    if (!tutShown) return;
    tutShown = false; last.tut = '';
    const finished = !!t && (t.step >= TUTORIAL_COUNT || (t.done ?? []).every(Boolean));
    if (!finished || s.mode !== 'playing') { hideTutorial(); return; }
    render(tutEl, tutorialDoneHtml());
    tutEl.classList.add('fin');
    pulseClass(tutEl, 'in');
    burst(tutEl);
    try { audio.playSfx('pop'); } catch { /* ignore */ }
    tutTimer = window.setTimeout(() => {
      tutEl.classList.add('out');
      tutTimer = window.setTimeout(() => { tutTimer = 0; tutEl.hidden = true; tutEl.classList.remove('out', 'fin'); }, 500);
    }, 1900);
  }

  /* ----------------------------- home sync ----------------------------- */
  function setMeter(el: HTMLElement, v: number): void {
    const n = Math.round(Math.max(0, Math.min(100, v)));
    (el.querySelector('.mbar i') as HTMLElement).style.transform = `scaleX(${n / 100})`;
    (el.querySelector('b') as HTMLElement).textContent = String(n);
    el.setAttribute('aria-valuenow', String(n));
    el.classList.toggle('low', n < 30);
    el.classList.toggle('high', n >= 70);
  }

  /** Mocha's pay, shown in the home and konbini top bars. */
  function syncPay(s: GameState): void {
    const w = s.progress.home?.wallet ?? 0;
    if (w === last.wallet) return;
    for (const el of payPills) {
      if (last.wallet >= 0 && w > last.wallet && !el.closest('[hidden]')) pulseClass(el, 'bump');
      (el.querySelector('b') as HTMLElement).textContent = String(w);
    }
    last.wallet = w;
  }

  function syncHome(s: GameState): void {
    const h = s.progress.home;
    if (!h) return;
    const g = currentGoal(game);
    const key = [h.wallet, h.savings, h.dreamGoal, h.dreamDone, Math.round(h.energy), Math.round(h.happiness),
      (h.doneToday ?? []).join(), s.homeBear?.action ?? '', s.homeBear?.actionTimer ? 1 : 0,
      (h.furniture ?? []).join(), h.meal ?? '', h.books ?? 0, h.fireOn ? 1 : 0, s.progress.konbiniOpen ? 1 : 0,
      g ? `${g.chapter}:${g.goal}:${Math.round((g.progress || 0) * 100)}` : '', homeUi.more ? 1 : 0, homeUi.chip ? 1 : 0].join('|');
    if (key === last.home) return;
    last.home = key;
    setMeter(energyEl, h.energy);
    setMeter(happyEl, h.happiness);
    render(chipsEl, homeChipHtml(game, homeUi.chip));
    const d = homeDockHtml(game, homeUi);
    render(dock, d.row);
    render(moreEl, d.more);
    moreEl.hidden = !homeUi.more;
  }

  /** Cheap per-frame sync: only touches the DOM when a value changed. */
  function sync(): void {
    const s = game.state;
    if (s.theme !== last.theme) {
      last.theme = s.theme;
      applyTheme(s.theme);
      if (last.mode) { refreshScreens(); refreshSheet(); }
    }
    const v = viewOf(s);
    if (v !== last.mode) {
      const prev = last.mode;
      last.mode = v;
      onMode(prev, v);
    }
    syncCoins();
    syncPay(s);
    if (s.mode === 'playing' || s.mode === 'paused') {
      const day = displayDay(game);
      if (day !== last.day) { last.day = day; hudDay.textContent = `Day ${day}`; }
      const k = s.dayLength > 0 ? Math.max(0, Math.min(1, s.dayTime / s.dayLength)) : 0;
      if (Math.abs(k - last.k) > 0.002 || (k === 1 && last.k !== 1)) {
        last.k = k;
        barFill.style.transform = `scaleX(${k})`;
        bar.setAttribute('aria-valuenow', String(Math.round(k * 100)));
      }
      if (s.doorOpen !== last.door) {
        last.door = s.doorOpen;
        bar.classList.toggle('closed', !s.doorOpen);
      }
    }
    if (s.mode === 'story') {
      const key = s.story ? `${s.story.id}:${s.story.panel}` : '';
      if (key !== last.story) {
        const first = last.story === '';
        last.story = key;
        render(storyEl, s.story ? storyHtml(s.story.id, s.story.panel) : '');
        if (first && !open) (storyEl.querySelector('[data-focus="story-next"]') as HTMLElement | null)?.focus({ preventScroll: true });
      }
    } else if (s.mode === 'cleanup') syncCleanup(s);
    else if (v === 'home') syncHome(s);
    syncTutorial(s);
    ex(() => extras.frame());
    ex(() => journal.frame());
    ex(() => news.frame());
    const hintMode = s.mode === 'playing' || s.mode === 'cleanup' || v === 'home' || v === 'konbini';
    const h = hintMode && s.hint && s.hint.text
      && (s.progress.settings.hints !== false || (s.mode === 'playing' && s.tutorial.active)) ? s.hint.text : null;
    if (h !== last.hint) {
      last.hint = h;
      hint.hidden = !h;
      if (h) { hint.textContent = h; pulseClass(hint, 'in'); }
    }
  }

  sync();

  return { sceneSvg: svg, frame: sync };
}
