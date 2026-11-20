/* KONBINI RENDERER — "Hoshi Mart". Keep exports + signatures.
   render.ts calls konbiniStatic() when the static layer is rebuilt and the scene is 'konbini',
   and konbiniDynamic() every frame for the moving parts. */
import * as art from '../art';
import type { GameState, KonbiniStockId } from '../types';
import { KONBINI_CLERK, KONBINI_PAY_SPOT, KONBINI_SLOTS, SECRET_SPOTS } from '../layout';
import { HOME_BEAR_LOOK } from './render-home';
import { basketPos, konbiniAnim, priceOf, stockLayout } from './konbini';
import { todaySale } from './news';

const f = (n: number) => (Math.round(n * 10) / 10).toString();
const at = (x: number, y: number, body: string, extra = '') =>
  (body ? `<g transform="translate(${f(x)} ${f(y)})${extra ? ' ' + extra : ''}">${body}</g>` : '');
const breathe = (time: number, seed: number, amt = 0.018) => {
  const s = Math.sin(time * 2.2 + seed);
  return `scale(${(1 - amt * 0.5 * s).toFixed(3)} ${(1 + amt * s).toFixed(3)})`;
};
const sway = (phase: number) => `rotate(${(Math.sin(phase * Math.PI * 2) * 4).toFixed(1)})`;

const PRODUCT_SCALE = 0.9;
const BASKET_SCALE = 0.32;
const BACK_SCALE = 0.66;
const FONT = `'Baloo 2', 'Hiragino Maru Gothic ProN', 'Yu Gothic', sans-serif`;

/** A slot drawn as a little stocked group: 2 smaller copies behind (higher, partly hidden), the front one full size. */
function stockedGroup(id: KonbiniStockId, x: number, y: number, seed: number): string {
  const p = art.product(id);
  const lean = (seed % 3) - 1; // a touch of variety so rows don't look stamped
  return at(x - 8, y - 5, p, `scale(${BACK_SCALE}) rotate(${-3 + lean})`)
    + at(x + 8, y - 5, p, `scale(${BACK_SCALE}) rotate(${3 + lean})`)
    + `<ellipse cx="${f(x)}" cy="${f(y + 12)}" rx="12" ry="2" fill="#6b4a3a" opacity=".12"/>`
    + at(x, y + 1, p, `scale(${PRODUCT_SCALE})`);
}

/** Tiny cream shelf-edge price tag (pink with a little dot when it's today's Gazette deal). */
function shelfTag(id: KonbiniStockId, x: number, y: number): string {
  const label = `${priceOf(id)}`;
  const sale = todaySale();
  const onSale = !!sale && sale.item === id;
  const w = 9 + label.length * 4.6;
  return at(x, y + 17,
    `<rect x="${f(-w / 2)}" y="-4.5" width="${f(w)}" height="9" rx="2" fill="${onSale ? '#ffdfe3' : '#fff8ee'}"`
    + ` stroke="${onSale ? '#e58a94' : '#c9a98a'}" stroke-width=".8"/>`
    + (onSale ? `<circle cx="${f(-w / 2)}" cy="-4.5" r="2.2" fill="#e5606e"/>` : '')
    + `<text x="0" y="2.6" text-anchor="middle" font-size="7.2" font-weight="800" font-family="${FONT}" fill="${onSale ? '#c4506a' : '#6b4a3a'}">${label}</text>`);
}

/** defs + the store + every product sitting in its slot (stock is endless, so this never changes).
 *  Hot-case products are drawn in the dynamic layer so the clerk never covers them. */
export function konbiniStatic(s: GameState): string {
  const layout = stockLayout();
  let products = '', tags = '';
  KONBINI_SLOTS.forEach((slot, i) => {
    const id = layout[i];
    if (!id || slot.area === 'hot') return;
    products += stockedGroup(id, slot.x, slot.y, i);
    tags += shelfTag(id, slot.x, slot.y);
  });
  return `<defs>${art.konbiniDefs(s.theme)}</defs>` + art.konbiniBack(s.theme) + products + tags;
}

/** The clerk's cute speech bubble; the tail points at their head. */
function speechBubble(text: string, age: number, t: number, small: boolean): string {
  const fs = small ? 9.5 : 12;
  const w = text.length * fs * 0.62 + (small ? 16 : 26), h = small ? 17 : 23;
  const tipX = KONBINI_CLERK.x - 8, tipY = KONBINI_CLERK.y - (small ? 84 : 82);
  const cx = Math.min(356 - w / 2, tipX - (small ? 10 : 20));
  const bx = Math.max(cx - w / 2 + 12, Math.min(cx + w / 2 - 12, tipX)) - tipX;
  // pop in with a little overshoot, float, fade out at the end
  const k = Math.min(1, age / 0.22);
  const pop = k < 1 ? 0.5 + 0.5 * k + Math.sin(k * Math.PI) * 0.18 : 1;
  const fade = t > 0.85 ? Math.max(0, 1 - (t - 0.85) / 0.15) : 1;
  const bob = Math.sin(age * 3) * 1.2;
  const left = cx - tipX - w / 2;
  const body = `<path d="M${f(bx - 5)},${f(-8.5)} L0,0 L${f(bx + 5)},${f(-8.5)}z" fill="#fff8ee" stroke="#6b4a3a" stroke-width="1.6"/>`
    + `<rect x="${f(left)}" y="${f(-8 - h)}" width="${f(w)}" height="${f(h)}" rx="${f(h / 2)}" fill="#fff8ee" stroke="#6b4a3a" stroke-width="1.6"/>`
    + `<path d="M${f(bx - 4)},${f(-8.6)} L${f(bx + 4)},${f(-8.6)}" stroke="#fff8ee" stroke-width="2.4"/>`
    + (small ? '' : `<circle cx="${f(left + 9)}" cy="${f(-8 - h / 2)}" r="2.2" fill="#f4b8c0"/><circle cx="${f(left + w - 9)}" cy="${f(-8 - h / 2)}" r="2.2" fill="#f4b8c0"/>`)
    + `<text x="${f(cx - tipX)}" y="${f(-8 - h / 2 + fs * 0.36)}" text-anchor="middle" font-size="${fs}" font-weight="800"`
    + ` font-family="${FONT}" fill="#6b4a3a">${text}</text>`;
  return at(tipX, tipY + bob, `<g opacity="${f(fade)}">${body}</g>`, `scale(${pop.toFixed(3)})`);
}

/** A shopper's tiny thought bubble with the product they're eyeing. */
function thoughtBubble(id: KonbiniStockId, x: number, y: number, facing: number, age: number): string {
  const k = Math.min(1, age / 0.25);
  const pop = k < 1 ? 0.4 + 0.6 * k + Math.sin(k * Math.PI) * 0.2 : 1;
  const d = facing >= 0 ? 1 : -1;
  const bob = Math.sin(age * 2.6) * 1.2;
  const body = `<circle cx="${-4 * d}" cy="-2" r="2" fill="#fff" stroke="#6b4a3a" stroke-width="1"/>`
    + `<circle cx="${-1 * d}" cy="-8" r="3" fill="#fff" stroke="#6b4a3a" stroke-width="1.1"/>`
    + `<circle cx="${6 * d}" cy="-24" r="13" fill="#fff" stroke="#6b4a3a" stroke-width="1.4"/>`
    + at(6 * d, -24, art.product(id), 'scale(.58)');
  return at(x + 6 * d, y - 80 + bob, body, `scale(${pop.toFixed(3)})`);
}

function clerkSvg(s: GameState, bearAtCounter: boolean, greeting: boolean, thanking: boolean, speaking: boolean): string {
  const t = s.time;
  const body = art.character(art.CLERK_LOOK, { pose: 'stand', mood: 'happy', facing: -1 });
  let extra: string;
  if (thanking) {
    // a little bow
    extra = `rotate(${f(-Math.max(0, Math.sin(t * 5)) * 7)})`;
  } else if (bearAtCounter || greeting) {
    // cheerful wave-wiggle with a tiny hop
    extra = `translate(0 ${f(-Math.abs(Math.sin(t * 7)) * 2.5)}) rotate(${f(Math.sin(t * 9) * 5)})`;
  } else {
    extra = `translate(0 ${f(Math.sin(t * 1.6) * 1.2)}) ${breathe(t, 0.7, 0.022)}`;
  }
  let note = '';
  if ((greeting || thanking || bearAtCounter) && !speaking) {
    const k = (t * 0.8) % 1;
    note = `<text x="${f(-18 - k * 6)}" y="${f(-74 - k * 16)}" font-size="13" font-weight="700" font-family="sans-serif"`
      + ` fill="#e58a94" opacity="${f(k < 0.2 ? k / 0.2 : 1 - (k - 0.2) / 0.8)}">♪</text>`;
  }
  return at(KONBINI_CLERK.x, KONBINI_CLERK.y, body, extra) + at(KONBINI_CLERK.x, KONBINI_CLERK.y, note);
}

function priceTag(x: number, y: number, price: number, t: number): string {
  const label = `${price}`;
  const w = 18 + label.length * 6;
  const bob = Math.sin(t * 3) * 2;
  return at(x, y - 28 + bob,
    `<path d="M0,6 L-4,1 L4,1z" fill="#fff8ee" stroke="#6b4a3a" stroke-width="1.2"/>`
    + `<rect x="${f(-w / 2)}" y="-11" width="${f(w)}" height="13" rx="6.5" fill="#fff8ee" stroke="#6b4a3a" stroke-width="1.2"/>`
    + `<circle cx="${f(-w / 2 + 6)}" cy="-4.5" r="3.2" fill="#f2c94c" stroke="#b8862b" stroke-width=".8"/>`
    + `<text x="${f(3)}" y="-1" text-anchor="middle" font-size="9.5" font-weight="700" font-family="sans-serif" fill="#6b4a3a">${label}</text>`);
}

/** Clerk, counter front, bear with basket, price tag, flying products, effects, konbiniFront. */
export function konbiniDynamic(s: GameState): string {
  const t = s.time;
  const k = s.konbini;
  const b = k.bear;
  const a = konbiniAnim();
  const layout = stockLayout();
  const out: string[] = [];

  const bearAtCounter = !b.path.length && Math.hypot(b.x - KONBINI_PAY_SPOT.x, b.y - KONBINI_PAY_SPOT.y) < 40;
  out.push(clerkSvg(s, bearAtCounter, a.greeting, a.thanking, !!a.bubble && !a.bubble.small));
  let hotTags = '';
  KONBINI_SLOTS.forEach((slot, i) => {
    const id = layout[i];
    if (id && slot.area === 'hot') { out.push(stockedGroup(id, slot.x, slot.y, i)); hotTags += shelfTag(id, slot.x, slot.y); }
  });
  out.push(art.konbiniCounterFront(s.theme));
  out.push(hotTags);

  // everyone on the floor, y-sorted (all drawn over the counter front: nobody ever stands behind it)
  const walking = b.path.length > 0;
  const hop = a.hopT > 0 ? Math.sin(a.hopT * Math.PI) * 10 : 0;
  const people: { y: number; svg: string }[] = [];
  const body = art.character(HOME_BEAR_LOOK, {
    pose: walking ? 'walk' : 'stand', mood: 'happy', facing: b.facing, walkPhase: b.walkPhase, holding: 'basket',
  });
  const extra = walking ? sway(b.walkPhase) : hop > 0 ? `translate(0 ${f(-hop)})` : breathe(t, 0);
  people.push({ y: b.y, svg: at(b.x, b.y, body, extra) });
  a.shoppers.forEach((n, i) => {
    const nb = art.character(n.look, n.basket
      ? { pose: n.walking ? 'walk' : 'stand', mood: 'happy', facing: n.facing, walkPhase: n.walkPhase, holding: 'basket' }
      : { pose: n.walking ? 'walk' : 'stand', mood: 'happy', facing: n.facing, walkPhase: n.walkPhase });
    const nx = n.walking ? sway(n.walkPhase) : breathe(t, 1.7 + i * 2.3);
    const svg = at(n.x, n.y, nb, nx);
    people.push({ y: n.y, svg: n.alpha < 1 ? `<g opacity="${f(n.alpha)}">${svg}</g>` : svg });
  });
  people.sort((p, q) => p.y - q.y);
  for (const p of people) out.push(p.svg);
  // shoppers' thought bubbles float above everyone
  for (const n of a.shoppers) {
    if (n.thought && !n.walking && n.alpha > 0.9) out.push(thoughtBubble(n.thought, n.x, n.y, n.facing, n.thoughtAge));
  }

  // tiny stack of what's in the basket
  const bp = basketPos(b);
  const by = bp.y - hop;
  let stack = '', n = 0;
  for (const e of k.basket) {
    for (let q = 0; q < e.qty && n < 8; q++, n++) {
      const col = n % 3, row = Math.floor(n / 3);
      stack += at((col - 1) * 6 + (row % 2) * 3, -row * 5, art.product(e.id), `scale(${BASKET_SCALE})`);
    }
  }
  if (stack) out.push(at(bp.x, by, stack));

  // floating price tag over the product the bear is heading to
  if (a.targetSlot >= 0 && layout[a.targetSlot]) {
    const sl = KONBINI_SLOTS[a.targetSlot];
    out.push(priceTag(sl.x, sl.y, priceOf(layout[a.targetSlot]!), t));
  }

  // products flying into the basket (a little arc, shrinking as they land)
  for (const fl of a.fly) {
    const u = fl.t, e = 1 - (1 - u) * (1 - u);
    const x = fl.from.x + (bp.x - fl.from.x) * e;
    const y = fl.from.y + (by - fl.from.y) * e - Math.sin(u * Math.PI) * 30;
    const sc = PRODUCT_SCALE + (BASKET_SCALE - PRODUCT_SCALE) * e;
    out.push(at(x, y, art.product(fl.id), `scale(${sc.toFixed(3)}) rotate(${f(u * 200)})`));
  }

  // journal hotspot reaction (a tiny wiggle / sparkle on the tapped thing)
  if (s.reaction) {
    const sp = SECRET_SPOTS[s.reaction.spot];
    if (sp && sp.scene === s.scene) out.push(at(sp.x, sp.y, art.secretReaction(s.reaction.spot, s.reaction.t)));
  }

  // effects
  for (const ef of s.effects) out.push(at(ef.x, ef.y, art.effect(ef.kind, Math.min(1, ef.age / ef.life), ef.text)));

  out.push(art.konbiniFront(s.theme, t));
  // the clerk's speech bubble on top of everything
  if (a.bubble) out.push(speechBubble(a.bubble.text, a.bubble.age, a.bubble.t, a.bubble.small));
  return out.join('');
}
