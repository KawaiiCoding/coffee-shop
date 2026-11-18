/* Scene renderer: static layer (rebuilt on decor/theme change) + dynamic layer (~30fps). */
import * as art from '../art';
import type { Chore, DecorId, DecorSlot, DrawCharacterOpts, GameApi, GameState, TableStyle, CharacterLook } from '../types';
import { BARISTA, DECOR_ANCHOR, READY_SPOTS, TABLES } from '../layout';
import { isMessChore, seatPoint, type GuestInt } from './game';
import { homeDynamic, homeStatic } from './render-home';
import { BARISTA_LOOK, WAITER_LOOK } from './looks';

export interface SceneRenderer { render(): void; }

const NS = 'http://www.w3.org/2000/svg';
const STYLES: TableStyle[] = ['yarn', 'wood', 'teacup'];
const SEATED = new Set(['reading', 'ordering', 'waiting', 'eating']);
const f = (n: number) => (Math.round(n * 10) / 10).toString();
const at = (x: number, y: number, body: string, extra = '') =>
  (body ? `<g transform="translate(${f(x)} ${f(y)})${extra ? ' ' + extra : ''}">${body}</g>` : '');
/** Gentle breathing: squash/stretch around the feet. */
const breathe = (time: number, seed: number, amt = 0.018) => {
  const s = Math.sin(time * 2.2 + seed);
  return `scale(${(1 - amt * 0.5 * s).toFixed(3)} ${(1 + amt * s).toFixed(3)})`;
};
/** Walking sway: a little side-to-side lean in step with the feet. */
const sway = (phase: number) => `rotate(${(Math.sin(phase * Math.PI * 2) * 4).toFixed(1)})`;

export function createRenderer(svg: SVGSVGElement, game: GameApi): SceneRenderer {
  const doc = svg.ownerDocument;
  const staticG = doc.createElementNS(NS, 'g');
  const dynG = doc.createElementNS(NS, 'g');
  staticG.setAttribute('class', 'scene-static');
  dynG.setAttribute('class', 'scene-dynamic');
  svg.appendChild(staticG);
  svg.appendChild(dynG);

  let staticDirty = true;
  let lastTheme = '';
  let lastScene = '';
  let lastFrame = -Infinity;
  game.subscribe((e) => { if (e.type === 'decor') staticDirty = true; });

  /* per-guest character markup cache, keyed by visual state */
  const cache = new Map<string, string>();
  function drawChar(id: string, look: CharacterLook, o: DrawCharacterOpts): string {
    const wp = o.walkPhase === undefined ? '' : Math.floor(o.walkPhase * 8);
    const key = `${id}|${o.pose}|${o.mood}|${o.facing}|${wp}|${o.carrying?.join(',') ?? ''}`;
    let s = cache.get(key);
    if (s === undefined) {
      if (cache.size > 400) cache.clear();
      s = art.character(look, o);
      cache.set(key, s);
    }
    return s;
  }

  const decorCache = new Map<string, string>();
  function decorStr(id: DecorId, th: GameState['theme']): string {
    const key = `${id}|${th}`;
    let v = decorCache.get(key);
    if (v === undefined) { v = art.decor(id, th); decorCache.set(key, v); }
    return v;
  }

  function buildStatic(s: GameState) {
    const th = s.theme;
    lastTheme = th;
    lastScene = s.scene;
    staticDirty = false;
    if (s.scene === 'home') { staticG.innerHTML = homeStatic(s); return; }
    const placed = s.progress.placed;
    const dec = (slot: DecorSlot) => {
      const id = placed[slot];
      return id ? at(DECOR_ANCHOR[slot].x, DECOR_ANCHOR[slot].y, art.decor(id, th)) : '';
    };
    staticG.innerHTML =
      `<defs>${art.sceneDefs(th)}</defs>` +
      art.roomBack(th) +
      dec('rug') + dec('wall') +
      art.counterBack(th);
  }

  /** Café not set up yet: tables / decor appear as their cleanup chores are done. */
  function setupState(s: GameState) {
    const ready = s.progress.cleanupDone;
    const placedChore = (pred: (c: Chore) => boolean) => ready || s.chores.some((c) => c.done && pred(c));
    return {
      table: (i: number) => i > 2 || placedChore((c) => c.kind === 'place_table' && c.table === i),
      decor: (slot: DecorSlot) => (slot !== 'ceiling' && slot !== 'back') || placedChore((c) => c.kind === 'place_decor' && c.slot === slot),
      messLeft: !ready && s.chores.some((c) => !c.done && isMessChore(c)),
    };
  }

  function buildDynamic(s: GameState): string {
    const th = s.theme;
    const pulse = (Math.sin(s.time * 5) + 1) / 2;
    const style = STYLES[Math.min(2, game.upgradeLevel('table_style'))];
    const guests = s.guests as GuestInt[];
    const out: string[] = [];
    const t = s.time;
    const placed = s.progress.placed;
    const setup = setupState(s);
    const cleaning = !s.progress.cleanupDone;

    // ceiling decor sways a little, like it's hanging on a string
    if (placed.ceiling && setup.decor('ceiling')) {
      const a = DECOR_ANCHOR.ceiling;
      out.push(at(a.x + Math.sin(t * 0.9) * 1.2, a.y + Math.sin(t * 1.3) * 1.5, decorStr(placed.ceiling, th),
        `rotate(${(Math.sin(t * 0.7) * 0.35).toFixed(2)} 180 0)`));
    }
    // back-wall furniture: record player bops to the music, the cat breathes
    if (placed.back && setup.decor('back')) {
      const a = DECOR_ANCHOR.back;
      const playing = s.progress.settings.music;
      let extra = '';
      if (placed.back === 'record_player' && playing) {
        const beat = Math.abs(Math.sin(t * Math.PI * 1.6));
        extra = `scale(${(1 + beat * 0.012).toFixed(3)} ${(1 + beat * 0.025).toFixed(3)})`;
      } else if (placed.back === 'cat_bed') extra = breathe(t * 0.6, 0, 0.03);
      out.push(at(a.x, a.y, decorStr(placed.back, th), extra));
      if (placed.back === 'record_player') out.push(at(a.x, a.y, art.musicNotes(t, playing)));
    }

    // cleanup: cobwebs on the wall, "place it here" ghosts for decor once the mess is gone
    if (cleaning) {
      for (const c of s.chores) {
        if (c.kind === 'cobweb' && !c.done) out.push(at(c.x, c.y, art.mess('cobweb', 1 - c.hp / c.maxHp, t)));
      }
      if (!setup.messLeft && s.mode === 'cleanup') {
        for (const c of s.chores) {
          if (c.done || c.kind !== 'place_decor') continue;
          if (c.slot === 'ceiling') out.push(at(DECOR_ANCHOR.ceiling.x, DECOR_ANCHOR.ceiling.y, art.placeGhost('decor_ceiling', pulse)));
          else out.push(at(c.x, c.y, art.placeGhost('decor_back', pulse)));
        }
      }
    }

    // barista + counter (bobs while brewing)
    const brewing = s.counter.brewing;
    out.push(at(BARISTA.x, BARISTA.y + (brewing ? -Math.abs(Math.sin(t * 6)) * 2 : 0), drawChar('barista', BARISTA_LOOK, {
      pose: 'stand', mood: brewing ? 'happy' : 'calm', facing: -1,
    }), brewing ? `rotate(${(Math.sin(t * 6) * 2).toFixed(1)})` : breathe(t, 1.3)));
    out.push(art.counterFront(th));
    out.push(art.brewIndicator(brewing ? brewing.progress : null, brewing ? brewing.item : null, s.time));
    s.counter.ready.forEach((id, i) => {
      const p = READY_SPOTS[i];
      if (p) out.push(at(p.x, p.y, art.item(id)));
    });

    // y-sorted world
    const doorGuestPresent = guests.some((g) => g.phase === 'door');
    const highlightFree = s.selectedGuest != null || doorGuestPresent;
    const sorted: { y: number; svg: string }[] = [];
    for (const t of s.tables) {
      if (!t.unlocked || !setup.table(t.index)) continue;
      const tp = TABLES[t.index];
      const g = guests.find((x) => x.id === t.guestId && SEATED.has(x.phase));
      let body = art.seat(style, th);
      if (g) {
        const sp = seatPoint(t.index);
        // eating guests do a happy little wiggle; everyone else breathes
        const eat = g.phase === 'eating';
        const now = s.time;
        const hop = eat ? -Math.abs(Math.sin(now * 5 + g.id)) * 2.5 : 0;
        body += at(sp.x - tp.x, sp.y - tp.y + hop, drawChar(`g${g.id}`, g.look, {
          pose: 'sit', mood: g.mood, facing: g.facing ?? 1,
        }), eat ? `rotate(${(Math.sin(now * 5 + g.id) * 3).toFixed(1)})` : breathe(now, g.id * 1.7));
      }
      const free = t.guestId == null && t.coins === 0;
      body += art.table(style, th, { item: t.item, coins: t.coins, highlight: highlightFree && free, pulse });
      sorted.push({ y: tp.y, svg: at(tp.x, tp.y, body) });
    }
    if (cleaning) {
      for (const c of s.chores) {
        if (c.done) continue;
        if (isMessChore(c)) {
          if (c.kind !== 'cobweb') {
            sorted.push({ y: c.kind === 'spill' ? c.y - 40 : c.y, svg: at(c.x, c.y, art.mess(c.kind as 'dust' | 'box' | 'spill', 1 - c.hp / c.maxHp, t)) });
          }
        } else if (c.kind === 'place_table' && !setup.messLeft && s.mode === 'cleanup') {
          sorted.push({ y: c.y, svg: at(c.x, c.y, art.placeGhost('table', pulse)) });
        }
      }
    }
    const corner = s.progress.placed.corner;
    if (corner) {
      sorted.push({ y: DECOR_ANCHOR.corner.y, svg: at(DECOR_ANCHOR.corner.x, DECOR_ANCHOR.corner.y, decorStr(corner, th),
        `rotate(${(Math.sin(t * 1.1) * 1.8).toFixed(2)})`) });
    }
    for (const g of guests) {
      if (SEATED.has(g.phase)) continue;
      const moving = (g.path?.length ?? 0) > 0;
      let body = '';
      if ((g.phase === 'door' || g.phase === 'entering') && s.selectedGuest === g.id) body += art.selectRing(pulse);
      body += drawChar(`g${g.id}`, g.look, {
        pose: moving ? 'walk' : 'stand', mood: g.mood, facing: g.facing ?? 1,
        walkPhase: moving ? g.walkPhase ?? 0 : undefined,
      });
      sorted.push({ y: g.y, svg: at(g.x, g.y, body, moving ? sway(g.walkPhase ?? 0) : breathe(t, g.id * 1.7)) });
    }
    const w = s.waiter;
    const wMoving = w.path.length > 0;
    sorted.push({
      y: w.y,
      svg: at(w.x, w.y, drawChar('waiter', WAITER_LOOK, {
        pose: wMoving ? 'walk' : 'stand', mood: 'happy', facing: w.facing,
        walkPhase: wMoving ? w.walkPhase : undefined, carrying: w.tray,
      }), wMoving ? sway(w.walkPhase) : breathe(t, 0.4)),
    });
    sorted.sort((a, b) => a.y - b.y);
    for (const e of sorted) out.push(e.svg);

    // bubbles
    for (const g of guests) {
      let kind: Parameters<typeof art.bubble>[0] | null = null;
      if (g.phase === 'door') kind = 'door';
      else if (g.phase === 'reading') kind = 'reading';
      else if (g.phase === 'ordering') kind = 'order';
      else if (g.phase === 'waiting') kind = 'waiting';
      else if (g.phase === 'leaving' && !g.happy) kind = 'angry';
      if (!kind) continue;
      let bx = g.x, by = g.y - 84;
      if (SEATED.has(g.phase) && g.table != null) {
        const sp = seatPoint(g.table);
        bx = sp.x; by = sp.y - 60;
      }
      // bubbles float gently; the "!" at the door bounces to get attention
      const fy = kind === 'door' ? -Math.abs(Math.sin(t * 4)) * 4 : Math.sin(t * 1.8 + g.id) * 1.5;
      out.push(at(bx, by + fy, art.bubble(kind, { item: g.order, patience: g.patience })));
    }

    // effects
    for (const e of s.effects) out.push(at(e.x, e.y, art.effect(e.kind, Math.min(1, e.age / e.life), e.text)));

    // hint marker
    if (s.hint?.target) out.push(at(s.hint.target.x, s.hint.target.y, art.tapMarker(pulse)));

    out.push(art.roomFront(th, s.time));
    return out.join('');
  }

  return {
    render() {
      const s = game.state;
      let force = false;
      if (staticDirty || s.theme !== lastTheme || s.scene !== lastScene) { buildStatic(s); force = true; }
      // throttle to ~30fps using game time (time keeps advancing in every mode)
      if (!force && s.time >= lastFrame && s.time - lastFrame < 1 / 30) return;
      lastFrame = s.time;
      dynG.innerHTML = s.scene === 'home' ? homeDynamic(s) : buildDynamic(s);
    },
  };
}
