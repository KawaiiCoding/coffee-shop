/* =====================================================================
   THE YARN STREET GAZETTE — today's newspaper, full-screen paper sheet.
   Masthead, date + weather, headline, article columns, Hoshi Mart coupon,
   horoscope, a 3-panel mini comic and the "Mystery corner" hint.
   Mounted by src/ui/index.ts into .cs-ui (sheet z 45). Uses data-n attributes.
   Styles live in x-journal.css.
   ===================================================================== */
import './x-journal.css';
import { characterSvg, gazetteMastheadSvg, stickerSvg, weatherSvg } from '../art';
import { REGULARS } from '../content/progression';
import type { AudioApi, CharacterLook, GameApi, NewsArticle, NewsIssue, RegularDef, RegularId, SfxName } from '../types';
import { esc, icon, pulseClass } from './util';
import { productPic, stockDef } from './x-shared';

export interface NewsUI { open(): void; frame(): void }

const MOCHA: CharacterLook = { species: 'bear', color: '#d9a877', accessory: 'scarf', accentColor: '#e58a94', hat: 'none' };

const SECTION: Record<NewsArticle['section'], string> = {
  town: 'Town', cafe: 'Café', friends: 'Friends', konbini: 'Hoshi Mart', season: 'Season',
  mystery: 'Mystery', mom: 'Letters', fun: 'Fun',
};

const tryArt = (f: () => string): string => { try { return f() || ''; } catch { return ''; } };

export function mountNews(layer: HTMLElement, game: GameApi, audio: AudioApi): NewsUI {
  const root = document.createElement('div');
  root.className = 'x-root xn-root';
  root.innerHTML = `
    <div class="xn-layer" hidden>
      <div class="xn-backdrop" data-n="close"></div>
      <div class="xn-sheet" role="dialog" aria-modal="true" aria-labelledby="xn-h" tabindex="-1">
        <div class="xn-head">
          <h2 id="xn-h">Today’s paper</h2>
          <button class="ibtn" data-n="close" aria-label="Close">${icon('close')}</button>
        </div>
        <div class="xn-body"></div>
        <div class="xn-foot"></div>
      </div>
    </div>`;
  layer.appendChild(root);

  const nLayer = root.querySelector('.xn-layer') as HTMLElement;
  const sheet = root.querySelector('.xn-sheet') as HTMLElement;
  const body = root.querySelector('.xn-body') as HTMLElement;
  const foot = root.querySelector('.xn-foot') as HTMLElement;
  const headH = root.querySelector('#xn-h') as HTMLElement;

  /* ---------- the paper rack: every paper Mocha has read is kept and can be read again ---------- */
  const RACK_KEY = 'coffee-shop-paper-rack';
  const RACK_MAX = 40;
  function loadRack(): NewsIssue[] {
    try {
      const raw = JSON.parse(localStorage.getItem(RACK_KEY) || '[]') as NewsIssue[];
      const today = game.state.progress.day;
      // papers "from the future" belong to an erased save
      return Array.isArray(raw) ? raw.filter((n) => n && typeof n.day === 'number' && n.day <= today && n.headline) : [];
    } catch { return []; }
  }
  function keep(issue: NewsIssue): void {
    try {
      const rack = loadRack().filter((n) => n.day !== issue.day);
      rack.unshift(issue);
      rack.sort((a, b) => b.day - a.day);
      localStorage.setItem(RACK_KEY, JSON.stringify(rack.slice(0, RACK_MAX)));
    } catch { /* storage blocked */ }
  }
  function rackHtml(): string {
    const today = game.state.progress.day;
    const rack = loadRack();
    const rows = rack.map((n) => {
      const wx = tryArt(() => weatherSvg(n.weather, 28));
      return `<li><button class="xn-rack-item" data-n="issue" data-id="${esc(n.day)}">
          <span class="xn-rack-day"><small>Day</small><b>${esc(n.day)}</b></span>
          <span class="xn-rack-txt"><small>${esc(n.dateLabel)}${n.day === today ? ' · today' : ''}</small><b>${esc(n.headline.title)}</b></span>
          ${wx ? `<span class="xn-wico" aria-hidden="true">${wx}</span>` : ''}
        </button></li>`;
    }).join('');
    return `<div class="xn-rack">
        <p class="xn-rack-intro">Every paper you read is kept here, newest on top.</p>
        ${rows ? `<ul class="xn-rack-list">${rows}</ul>` : '<p class="empty">No papers yet. Read today’s first!</p>'}
      </div>`;
  }

  const sfx = (n: SfxName) => { try { audio.playSfx(n); } catch { /* ignore */ } };

  const regular = (id: RegularId): RegularDef | undefined =>
    game.catalog.regulars?.find((r) => r.id === id) ?? REGULARS.find((r) => r.id === id);

  /** Sticker or friend portrait for an article ('' when it has neither). */
  function picFor(a: NewsArticle, cls: string, size: number): string {
    if (a.regular) {
      const r = regular(a.regular);
      const s = r ? tryArt(() => characterSvg(r.look, 'happy', size)) : '';
      if (s) return `<span class="${cls} xn-portrait" aria-hidden="true">${s}</span>`;
    }
    if (a.sticker) {
      const s = tryArt(() => stickerSvg(a.sticker!, size));
      if (s) return `<span class="${cls}" aria-hidden="true">${s}</span>`;
    }
    return '';
  }

  function articleHtml(a: NewsArticle): string {
    return `<article class="xn-art">
        ${picFor(a, 'xn-art-pic', 48)}
        <span class="xn-sec">${esc(SECTION[a.section] ?? a.section)}</span>
        <h3>${esc(a.title)}</h3>
        <p>${esc(a.text)}</p>
      </article>`;
  }

  function comicHtml(n: NewsIssue): string {
    const panels = n.comic?.panels;
    if (!panels || !panels.length) return '';
    const friend = regular(n.headline?.regular ?? n.articles?.find((a) => a.regular)?.regular ?? 'maple');
    const casts: { look: CharacterLook; mood: 'calm' | 'happy' | 'cross' | 'sleepy' }[] = [
      { look: MOCHA, mood: 'calm' },
      { look: friend?.look ?? MOCHA, mood: friend ? 'happy' : 'sleepy' },
      { look: MOCHA, mood: 'happy' },
    ];
    const cells = panels.slice(0, 3).map((t, i) => {
      const c = casts[i];
      const art = tryArt(() => characterSvg(c.look, c.mood, 64));
      return `<li class="xn-panel">
          <span class="xn-panel-n" aria-hidden="true">${i + 1}</span>
          <span class="xn-bubble">${esc(t)}</span>
          ${art ? `<span class="xn-panel-art" aria-hidden="true">${art}</span>` : ''}
        </li>`;
    }).join('');
    return `<section class="xn-box xn-comic-box" aria-label="Comic strip">
        <h3>Funnies</h3>
        <ol class="xn-comic" style="list-style:none;margin:0;padding:0">${cells}</ol>
      </section>`;
  }

  function couponHtml(n: NewsIssue): string {
    const sale = n.sale;
    if (!sale) return '';
    const d = stockDef(game, sale.item);
    return `<section class="xn-box xn-coupon" aria-label="${esc(`Hoshi Mart coupon: ${sale.percent} percent off ${d.name}`)}">
        <span class="xn-scissors" aria-hidden="true">✂︎</span>
        <span class="xn-pct" aria-hidden="true">${esc(sale.percent)}%<small>OFF</small></span>
        <div class="xn-coupon-txt">
          <b>Hoshi Mart: ${esc(d.name)}</b>
          <span>${esc(sale.line)}</span>
        </div>
        ${productPic(sale.item, d.name, 'xn-coupon-pic')}
      </section>`;
  }

  function paperHtml(n: NewsIssue): string {
    const mast = tryArt(() => gazetteMastheadSvg(320));
    const wx = tryArt(() => weatherSvg(n.weather, 32));
    const h = n.headline;
    const lead = h ? `
      <section class="xn-lead">
        <div class="xn-lead-txt">
          <span class="xn-kicker">${esc(SECTION[h.section] ?? 'News')}</span>
          <h3 class="xn-headline">${esc(h.title)}</h3>
          <p>${esc(h.text)}</p>
        </div>
        ${picFor(h, 'xn-lead-pic', 96)}
      </section>` : '';
    const cols = (n.articles ?? []).slice(0, 3).map(articleHtml).join('');
    const horo = n.horoscope ? `<section class="xn-box xn-horo"><h3>Stars say</h3><p>${esc(n.horoscope)}</p></section>` : '';
    const mystery = n.hint ? `<section class="xn-box xn-mystery"><h3>Mystery corner</h3><p>${esc(n.hint)}</p></section>` : '';
    return `
      ${mast ? `<span class="xn-mast" role="img" aria-label="The Yarn Street Gazette">${mast}</span>`
        : '<span class="xn-mast-fb">The Yarn Street Gazette</span>'}
      <div class="xn-dateline">
        <span class="xn-date">${esc(n.dateLabel)} · Day ${esc(n.day)}</span>
        <span class="xn-weather">${wx ? `<span class="xn-wico" aria-hidden="true">${wx}</span>` : ''}<span>${esc(n.weatherLine)}</span></span>
      </div>
      ${lead}
      <div class="xn-cols">
        ${cols}
        ${couponHtml(n)}
        ${horo}
        ${mystery}
      </div>
      ${comicHtml(n)}
      <p class="xn-end" aria-hidden="true">~ ♥︎ ~</p>`;
  }

  let isOpen = false;
  let opener: HTMLElement | null = null;

  /** Show one paper ('today' or an old one from the rack) or the rack itself. */
  function show(what: 'rack' | NewsIssue, isToday = false): void {
    const count = loadRack().length;
    if (what === 'rack') {
      headH.textContent = 'Paper rack';
      body.innerHTML = rackHtml();
      foot.innerHTML = '<button class="btn btn-soft" data-n="today">Today’s paper</button><button class="btn btn-primary" data-n="close">Close</button>';
    } else {
      headH.textContent = isToday ? 'Today’s paper' : `Day ${what.day} paper`;
      body.innerHTML = paperHtml(what);
      foot.innerHTML = `<button class="btn btn-soft" data-n="rack">Paper rack${count ? ` (${count})` : ''}</button>`
        + '<button class="btn btn-primary" data-n="close">Fold it up</button>';
    }
    body.scrollTop = 0;
  }

  function open(): void {
    let issue: NewsIssue | null = null;
    try { issue = game.newspaper(); } catch (err) { console.error('newspaper failed', err); }
    if (!issue) return;
    if (!isOpen) opener = document.activeElement as HTMLElement | null;
    isOpen = true;
    keep(issue);
    show(issue, true);
    nLayer.hidden = false;
    pulseClass(sheet, 'in');
    sheet.focus({ preventScroll: true });
    sfx('page');
    const p = game.state.progress;
    if ((p.newsReadDay ?? 0) !== p.day) { try { game.readNewspaper(); } catch (err) { console.error(err); } }
  }

  function close(): void {
    if (!isOpen) return;
    isOpen = false;
    nLayer.hidden = true;
    body.innerHTML = '';
    const o = opener; opener = null;
    if (o && o.isConnected && !o.closest('[hidden]')) o.focus({ preventScroll: true });
  }

  root.addEventListener('click', (e) => {
    const t = (e.target as Element).closest<HTMLElement>('[data-n]');
    if (!t || !root.contains(t)) return;
    switch (t.dataset.n) {
      case 'close': sfx('tap'); close(); break;
      case 'rack': sfx('page'); show('rack'); break;
      case 'today': { sfx('page'); try { show(game.newspaper(), true); } catch { close(); } break; }
      case 'issue': {
        const n = loadRack().find((x) => String(x.day) === t.dataset.id);
        if (n) { sfx('page'); show(n, n.day === game.state.progress.day); }
        break;
      }
    }
  });
  root.addEventListener('pointerdown', (e) => {
    const b = (e.target as Element).closest('.btn, .ibtn');
    if (b) pulseClass(b, 'squish');
  });
  root.addEventListener('animationend', (e) => {
    if (e.animationName === 'cs-squish') (e.target as Element).classList.remove('squish');
  });

  document.addEventListener('keydown', (e) => {
    if (!isOpen) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); close(); return; }
    if (e.key === 'Tab') {
      e.stopImmediatePropagation();
      const f = Array.from(sheet.querySelectorAll<HTMLElement>('button:not([disabled])')).filter((el) => el.offsetParent !== null);
      if (!f.length) { e.preventDefault(); return; }
      const a = document.activeElement, first = f[0], last = f[f.length - 1];
      if (e.shiftKey && (a === first || !sheet.contains(a) || a === sheet)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (a === last || !sheet.contains(a))) { e.preventDefault(); first.focus(); }
    }
  }, { capture: true });

  let lastMode = '';
  function frame(): void {
    const s = game.state;
    if (s.mode !== lastMode) {
      lastMode = s.mode;
      if (isOpen && s.mode !== 'home' && s.mode !== 'title' && s.mode !== 'paused') close();
    }
  }

  return { open, frame };
}
