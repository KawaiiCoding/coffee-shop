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
  bonusText, choreProgress, dreamHtml, homeDockHtml, sleepHtml, storyHtml,
  TUTORIAL_COUNT, tutorialDoneHtml, tutorialHtml,
} from './screens';
import { burst, icon, pulseClass, qs } from './util';

export { createAudio } from './audio';

export interface MountedUI {
  /** The <svg viewBox="0 0 360 720"> the engine renderer draws the café into. */
  sceneSvg: SVGSVGElement;
  /** Called every animation frame after the scene renders (cheap HUD updates only). */
  frame(): void;
}

const SVG_NS = 'http://www.w3.org/2000/svg';
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
            <div class="hud-coins"><span class="sr-only">Coins</span>${icon('coin')}<b>0</b></div>
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
            <div class="hud-coins hud-wallet"><span class="sr-only">Wallet</span>${icon('purse')}<b>0</b></div>
          </header>
          <div class="home-bonus" hidden></div>
          <div class="float-top">
            <div class="tut" hidden></div>
            <div class="hint" hidden></div>
            <div class="toasts" role="status" aria-live="polite"></div>
          </div>
          <section class="screen screen-title" hidden></section>
          <section class="screen screen-dayend" hidden></section>
          <div class="home-bottom" hidden>
            <div class="home-row"><div class="dream-wrap"></div><div class="sleep-wrap"></div></div>
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
  const wallet = qs(homeTop, '.hud-wallet');
  const walletN = qs(wallet, 'b');
  const energyEl = qs(homeTop, '.stat-energy');
  const happyEl = qs(homeTop, '.stat-happy');
  const bonusEl = qs(root, '.home-bonus');
  const homeBottom = qs(root, '.home-bottom');
  const dreamWrap = qs(root, '.dream-wrap');
  const sleepWrap = qs(root, '.sleep-wrap');
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
  const ui: UiState = { decorSlot: 'ceiling', confirmTitle: false, confirmReset: false };
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
    const m = game.state.mode;
    const el = m === 'title' ? titleEl : m === 'dayEnd' ? dayEndEl : null;
    const sel = m === 'story' ? '[data-focus="story-next"]' : m === 'home' ? '[data-focus="act-sleep"]' : '[data-focus="start"]';
    ((el ?? (m === 'story' ? storyEl : m === 'home' ? homeBottom : null))
      ?.querySelector(sel) as HTMLElement | null)?.focus({ preventScroll: true });
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
      case 'open': tap(); openSheet(t.dataset.sheet as SheetKind, t); break;
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
      case 'slot': tap(); ui.decorSlot = id as UiState['decorSlot']; refreshSheet(); break;
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
    let can: { ok: boolean; reason?: string } = { ok: true };
    try { can = game.canDoHomeAction(id); } catch { /* let the engine decide */ }
    if (!can.ok || !game.homeAction(id)) {
      try { audio.playSfx('error'); } catch { /* ignore */ }
      pulseClass(el, 'shake');
      toast(can.reason || 'Not right now');
    } else {
      pulseClass(el, 'bump');
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
    const b = (e.target as Element).closest('.btn, .ibtn, .tab, .dec-card, .seg, .switch-row, .act, .sleep-btn, .story-skip');
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
      if (open) { e.preventDefault(); closeSheet(); } else if (game.state.mode === 'playing') { game.pause(); sync(); }
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
  function toast(text: string): void {
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = text;
    toasts.appendChild(el);
    while (toasts.children.length > 3) toasts.firstElementChild?.remove();
    setTimeout(() => el.classList.add('out'), 2300);
    setTimeout(() => el.remove(), 2700);
  }

  game.subscribe((e) => {
    if (e.type === 'toast') toast(e.text);
    else if (e.type === 'progress') queueRefresh();
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
    mode: '' as GameState['mode'] | '', theme: '' as ThemeId | '', day: -1, coins: -1,
    k: -1, door: null as boolean | null, hint: null as string | null,
    story: '', chores: '', tut: '', tutDone: [] as boolean[],
    home: '', wallet: -1, bonus: '',
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

  function onMode(prev: GameState['mode'] | '', m: GameState['mode']): void {
    root.dataset.mode = m;
    const play = m === 'playing' || m === 'paused';
    hud.hidden = !play;
    pauseBtn.hidden = m !== 'playing';
    nav.hidden = !(m === 'title' || m === 'dayEnd');
    titleEl.hidden = m !== 'title';
    dayEndEl.hidden = m !== 'dayEnd';
    storyEl.hidden = m !== 'story';
    readyBar.hidden = m !== 'cleanup';
    homeTop.hidden = m !== 'home';
    bonusEl.hidden = m !== 'home';
    homeBottom.hidden = m !== 'home';
    if (!play) hideTutorial();
    if (open && m !== 'paused') hideSheet();
    if (m === 'paused' && !open) openSheet('pause', pauseBtn);
    if (m === 'title' || m === 'dayEnd') refreshScreens();
    last.story = ''; last.chores = ''; last.home = '';
    setNavActive();
    last.day = -1; // force HUD refresh
    if (prev !== '' && !open && m !== 'playing' && m !== 'cleanup') {
      queueMicrotask(() => { if (!open && game.state.mode === m) focusScreen(); });
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

  function syncHome(s: GameState): void {
    const h = s.progress.home;
    if (!h) return;
    if (h.wallet !== last.wallet) {
      if (last.wallet >= 0 && h.wallet > last.wallet) pulseClass(wallet, 'bump');
      last.wallet = h.wallet;
      walletN.textContent = String(h.wallet);
    }
    const key = [h.wallet, h.savings, h.dreamGoal, h.dreamDone, Math.round(h.energy), Math.round(h.happiness),
      (h.doneToday ?? []).join(), s.homeBear?.action ?? '', s.homeBear?.actionTimer ? 1 : 0].join('|');
    if (key === last.home) return;
    last.home = key;
    setMeter(energyEl, h.energy);
    setMeter(happyEl, h.happiness);
    const b = bonusText(game);
    if (b !== last.bonus) { last.bonus = b; bonusEl.textContent = b; }
    render(dreamWrap, dreamHtml(h));
    render(sleepWrap, sleepHtml(game));
    render(dock, homeDockHtml(game));
  }

  /** Cheap per-frame sync: only touches the DOM when a value changed. */
  function sync(): void {
    const s = game.state;
    if (s.theme !== last.theme) {
      last.theme = s.theme;
      applyTheme(s.theme);
      if (last.mode) { refreshScreens(); refreshSheet(); }
    }
    if (s.mode !== last.mode) {
      const prev = last.mode;
      last.mode = s.mode;
      onMode(prev, s.mode);
    }
    syncCoins();
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
    else if (s.mode === 'home') syncHome(s);
    syncTutorial(s);
    const hintMode = s.mode === 'playing' || s.mode === 'cleanup' || s.mode === 'home';
    const h = hintMode && s.hint && s.hint.text && s.progress.settings.hints !== false ? s.hint.text : null;
    if (h !== last.hint) {
      last.hint = h;
      hint.hidden = !h;
      if (h) { hint.textContent = h; pulseClass(hint, 'in'); }
    }
  }

  sync();

  return { sceneSvg: svg, frame: sync };
}
