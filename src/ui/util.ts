/* Small DOM + art helpers shared by the UI modules. */
import { iconSvg, type IconName } from '../art';

export function esc(s: string | number): string {
  return String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!
  ));
}

/** Text fallbacks used while the art module returns '' for an icon.
 *  U+FE0E forces text (not emoji) presentation. */
const T = '\uFE0E';
/** Icons the UI uses that the art module may not draw yet (text fallback until it does). */
export type UiIcon = IconName
  | 'purse' | 'energy' | 'smile' | 'home' | 'moon' | 'pot' | 'bath' | 'phone' | 'book' | 'jar' | 'broom' | 'bike';

const GLYPH: Partial<Record<string, string>> = {
  play: '\u25B6' + T, music: '\u266A', music_off: '\u266A', sound: '\u266B', sound_off: '\u266B',
  cafe: '\u2302', shop: '\u2191', decor: '\u273F', settings: '\u2699' + T, star: '\u2605',
  star_empty: '\u2606', heart: '\u2665' + T, close: '\u2715', check: '\u2713', lock: '\u25A3',
  calendar: '\u25A6',
  purse: '\u00A4', energy: '\u26A1' + T, smile: '\u263A' + T, home: '\u2302', moon: '\u263E',
  pot: '\u2668' + T, bath: '\u2248', phone: '\u260E' + T, book: '\u25A4', jar: '\u25BF', broom: '\u2736', bike: '\u2609',
};

/** Unknown names make iconSvg draw star_empty; remember that markup to detect it. */
let unknownSvg: string | null = null;

/** An icon span. Size is nominal; CSS sizes the span (in scene units) and the svg fills it.
 *  Falls back to a CSS shape (coin, pause) or a text glyph when art returns ''. */
export function icon(name: UiIcon, cls = ''): string {
  let svg = '';
  try { svg = iconSvg(name as IconName, 48); } catch { svg = ''; }
  if (svg && name !== 'star_empty') {
    if (unknownSvg === null) { try { unknownSvg = iconSvg('star_empty', 48); } catch { unknownSvg = ''; } }
    if (svg === unknownSvg) svg = '';
  }
  const inner = svg
    || (name === 'coin' ? '<span class="fb-coin"></span>'
      : name === 'pause' ? '<span class="fb-pause"></span>'
        : `<span class="fb-glyph fb-${name}">${GLYPH[name] ?? '•'}</span>`);
  return `<span class="ico ico-${name} ${cls}" aria-hidden="true">${inner}</span>`;
}

/** Wraps possibly-empty art markup; returns '' when there is no art. */
export function art(markup: () => string, cls: string): string {
  let s = '';
  try { s = markup(); } catch { s = ''; }
  return s ? `<span class="${cls}" aria-hidden="true">${s}</span>` : '';
}

export function qs<T extends Element = HTMLElement>(root: ParentNode, sel: string): T {
  return root.querySelector(sel) as T;
}

/** Restart a one-shot CSS animation class. */
export function pulseClass(el: Element | null, cls: string): void {
  if (!el) return;
  el.classList.remove(cls);
  void (el as HTMLElement).offsetWidth;
  el.classList.add(cls);
}

export const reducedMotion = (): boolean =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Little confetti/sparkle burst appended to el (removed after it plays). */
export function burst(el: HTMLElement | null): void {
  if (!el) return;
  const b = document.createElement('span');
  b.className = 'burst';
  b.setAttribute('aria-hidden', 'true');
  if (!reducedMotion()) {
    let html = '';
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * 360 + (i % 2 ? 9 : -6);
      const d = 34 + (i % 3) * 14;
      html += `<i style="--a:${a}deg;--d:${d};--c:${i % 4}"></i>`;
    }
    b.innerHTML = html;
  }
  el.appendChild(b);
  setTimeout(() => b.remove(), 1000);
}
