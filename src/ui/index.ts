/* =====================================================================
   UI ENTRY — app frame, scene svg, HUD, title / day-end screens,
   bottom nav, bottom sheets, toasts. Plain DOM; styles in ui.css.
   ===================================================================== */
import './ui.css';
import { palette } from '../art';
import type { AudioApi, GameApi, GameState, Settings, ThemeId } from '../types';
import {
  dayEndHtml, displayDay, SHEET_TITLES, sheetBodyHtml, titleHtml, type SheetKind, type UiState,
} from './sheets';
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
          <div class="float-top">
            <div class="hint" hidden></div>
            <div class="toasts" role="status" aria-live="polite"></div>
          </div>
          <section class="screen screen-title" hidden></section>
          <section class="screen screen-dayend" hidden></section>
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
    const m = svg.getScreenCTM();
    if (!m) return;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const p = pt.matrixTransform(m.inverse());
    game.tapScene(p.x, p.y);
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
  let unlocked = false;
  const unlock = () => {
    if (unlocked) return;
    unlocked = true;
    try { audio.unlock(); } catch { /* ignore */ }
  };
  root.addEventListener('pointerdown', unlock, { capture: true });
  root.addEventListener('keydown', unlock, { capture: true });

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
  }

  function refreshAll(): void {
    refreshQueued = false;
    const a = document.activeElement as HTMLInputElement | null;
    if (open && a && a.type === 'range' && sheetBody.contains(a)) { deferRefresh = true; return; }
    refreshSheet();
    if (game.state.mode === 'title') render(titleEl, titleHtml(game));
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
    const el = game.state.mode === 'title' ? titleEl : game.state.mode === 'dayEnd' ? dayEndEl : null;
    (el?.querySelector('[data-focus="start"]') as HTMLElement | null)?.focus({ preventScroll: true });
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
    const b = (e.target as Element).closest('.btn, .ibtn, .tab, .dec-card, .seg, .switch-row');
    if (b && !(b as HTMLButtonElement).disabled) pulseClass(b, 'squish');
  });
  uiEl.addEventListener('animationend', (e) => {
    const t = e.target as Element;
    if (e.animationName === 'cs-squish') t.classList.remove('squish');
    if (e.animationName === 'cs-shake') t.classList.remove('shake');
    if (e.animationName === 'cs-bump') t.classList.remove('bump');
  });

  /* ------------------------------ keyboard ------------------------------ */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (open) { e.preventDefault(); closeSheet(); } else if (game.state.mode === 'playing') { game.pause(); sync(); }
      return;
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
  };

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
    nav.hidden = play;
    titleEl.hidden = m !== 'title';
    dayEndEl.hidden = m !== 'dayEnd';
    if (m === 'playing' && open) hideSheet();
    if (m === 'paused' && !open) openSheet('pause', qs<HTMLElement>(hud, '.hud-pause'));
    if ((m === 'title' || m === 'dayEnd') && open === 'pause') hideSheet();
    if (m === 'title' || m === 'dayEnd') {
      refreshScreens();
      if (!open && prev !== '') focusScreen();
    }
    setNavActive();
    last.day = -1; // force HUD refresh
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
    const h = s.mode === 'playing' && s.hint && s.hint.text && s.progress.settings.hints !== false ? s.hint.text : null;
    if (h !== last.hint) {
      last.hint = h;
      hint.hidden = !h;
      if (h) { hint.textContent = h; pulseClass(hint, 'in'); }
    }
  }

  sync();

  return { sceneSvg: svg, frame: sync };
}
