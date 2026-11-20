/* =====================================================================
   GAZETTE ENGINE — "The Yarn Street Gazette", a fresh paper every morning at home.
   makeIssue is deterministic for (progress.day, year, progress, calendar). getIssue caches today's issue,
   todaySale() exposes its Hoshi Mart deal to konbini.ts (priceOf).
   ===================================================================== */
import type { CalendarInfo, KonbiniStockId, NewsArticle, NewsIssue, Progress, RegularId, Weather } from '../types';
import { ARTICLES, COMICS, HEADLINES, HOROSCOPES, SALE_LINES, WEATHER_LINES, type NewsTemplate } from '../content/news';
import { DISHES, GOODS, INGREDIENTS, REGULARS, SNACKS } from '../content/progression';
import { SECRETS } from '../content/secrets';
import { mulberry32 } from './rng';
import { DAYS_PER_GAME_DAY } from './calendar';

type Rng = () => number;
type Season = CalendarInfo['season'];

const NEWS_SEEN_CAP = 200;
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const WEATHER_WEIGHTS: Record<Season, Partial<Record<Weather, number>>> = {
  winter: { sunny: 3, cloudy: 3, snowy: 4, windy: 1.5, rainy: 0.5 },
  spring: { sunny: 4, cloudy: 2, rainy: 3, windy: 2 },
  summer: { sunny: 6, cloudy: 2, rainy: 1.5, windy: 1 },
  autumn: { sunny: 3, cloudy: 3, rainy: 3, windy: 2.5 },
};
const FALLBACK_WEATHER_LINE: Record<Weather, string> = {
  sunny: 'Sunny and bright. Perfect for an iced latte!',
  cloudy: 'Soft grey clouds. A good day for cocoa.',
  rainy: 'Pitter-patter rain. Bring an umbrella!',
  snowy: 'Fluffy snow all day. Mind the slippery steps!',
  windy: 'Breezy! Hold on to your hats.',
  starry: 'A clear night full of twinkly stars.',
};
const FALLBACK_HEADLINE: NewsArticle = {
  id: 'welcome', section: 'town', title: 'Good morning, Yarn Street!',
  text: 'The sun is up, the kettles are on, and the café smells of fresh coffee.',
};

const pick = <T>(rng: Rng, list: readonly T[]): T | undefined => (list.length ? list[Math.floor(rng() * list.length) % list.length] : undefined);

function weightedPick<T>(rng: Rng, list: readonly T[], weight: (t: T) => number): T | undefined {
  const total = list.reduce((s, t) => s + Math.max(0, weight(t)), 0);
  if (!(total > 0)) return pick(rng, list);
  let r = rng() * total;
  for (const t of list) {
    r -= Math.max(0, weight(t));
    if (r < 0) return t;
  }
  return list[list.length - 1];
}

interface NewsCond {
  day: number; chapter: number; season: Season; festivalSoon: boolean; konbiniOpen: boolean; friendMet: boolean; weather: Weather;
}

function matches(t: NewsTemplate, c: NewsCond): boolean {
  const w = t.when;
  if (!w) return true;
  if (w.minDay !== undefined && c.day < w.minDay) return false;
  if (w.maxDay !== undefined && c.day > w.maxDay) return false;
  if (w.chapterAtLeast !== undefined && c.chapter < w.chapterAtLeast) return false;
  if (w.season !== undefined && c.season !== w.season) return false;
  if (w.festivalSoon !== undefined && c.festivalSoon !== w.festivalSoon) return false;
  if (w.konbiniOpen !== undefined && c.konbiniOpen !== w.konbiniOpen) return false;
  if (w.friendMet !== undefined && c.friendMet !== w.friendMet) return false;
  if (w.weather !== undefined && c.weather !== w.weather) return false;
  return true;
}

/** Choose one template: unseen ones first (weighted), else the least recently printed. */
function choose(rng: Rng, pool: NewsTemplate[], seen: string[], exclude: Set<string>): NewsTemplate | undefined {
  const cands = pool.filter((t) => !exclude.has(t.key));
  if (!cands.length) return undefined;
  const fresh = cands.filter((t) => !seen.includes(t.key));
  const roll = rng(); // always consume, so later picks stay stable
  if (fresh.length) {
    const r2 = mulberry32(Math.floor(roll * 4294967296));
    return weightedPick(r2, fresh, (t) => t.weight ?? 1);
  }
  let best: NewsTemplate | undefined, bestIdx = Infinity;
  for (const t of cands) {
    const i = seen.lastIndexOf(t.key);
    if (i < bestIdx) { bestIdx = i; best = t; }
  }
  return best;
}

function stockName(id: KonbiniStockId): string {
  const d = INGREDIENTS.find((x) => x.id === id) ?? SNACKS.find((x) => x.id === id) ?? GOODS.find((x) => x.id === id);
  return d?.name ?? id.replace(/_/g, ' ');
}

interface Fill { friend: string; friendId: RegularId | null; dish: string; festival: string; days: string; served: string; item: string; percent: string }

const fillText = (s: string, f: Fill, friendName = f.friend) => s
  .replace(/\{friend\}/g, friendName).replace(/\{dish\}/g, f.dish).replace(/\{festival\}/g, f.festival)
  .replace(/\{days\}/g, f.days).replace(/\{served\}/g, f.served).replace(/\{item\}/g, f.item).replace(/\{percent\}/g, f.percent);

function toArticle(t: NewsTemplate, f: Fill): NewsArticle {
  const regDef = t.regular ? REGULARS.find((r) => r.id === t.regular) : undefined;
  const friendName = regDef ? regDef.name : f.friend;
  const usesFriend = /\{friend\}/.test(t.title + t.text);
  const a: NewsArticle = {
    id: t.key, section: t.section, title: fillText(t.title, f, friendName), text: fillText(t.text, f, friendName),
  };
  if (t.sticker) a.sticker = t.sticker;
  if (t.regular) a.regular = t.regular;
  else if (usesFriend && f.friendId) a.regular = f.friendId;
  return a;
}

/** Build today's issue deterministically from (progress.day, progress, calendar); never repeats a piece in newsSeen when avoidable. */
export function makeIssue(p: Progress, cal: CalendarInfo): NewsIssue {
  const year = cal?.date?.year ?? new Date().getFullYear();
  const rng = mulberry32(((year * 7919) ^ (p.day * 104729) ^ 0x9e3779b9) >>> 0);
  const season: Season = cal?.season ?? 'spring';

  // weather (rolls always consumed in the same order)
  const ww = WEATHER_WEIGHTS[season];
  let weather: Weather = weightedPick(rng, Object.keys(ww) as Weather[], (w) => ww[w] ?? 0) ?? 'sunny';
  const starRoll = rng();
  const hour = new Date().getHours();
  const night = hour >= 20 || hour < 5;
  if (night && (weather === 'sunny' || weather === 'cloudy') && starRoll < 0.45) weather = 'starry';

  const metIds = (Object.keys(p.friendship ?? {}) as RegularId[]).filter((id) => REGULARS.some((r) => r.id === id));
  const cond: NewsCond = {
    day: p.day, chapter: p.chapter, season,
    festivalSoon: !!cal?.next && cal.next.daysLeft <= 14,
    konbiniOpen: !!p.konbiniOpen, friendMet: metIds.length > 0, weather,
  };

  // the Hoshi Mart deal
  const saleRoll = rng(), pctRoll = rng(), saleLineRoll = rng();
  let sale: NewsIssue['sale'] = null;
  const stock: KonbiniStockId[] = [
    ...INGREDIENTS.filter((d) => d.price > 0).map((d) => d.id),
    ...SNACKS.filter((d) => d.price > 0).map((d) => d.id),
    ...GOODS.filter((d) => d.price > 0).map((d) => d.id),
  ];
  const percent = 10 + Math.min(4, Math.floor(pctRoll * 5)) * 5; // 10..30
  if (p.konbiniOpen && stock.length) {
    const item = stock[Math.floor(saleRoll * stock.length) % stock.length];
    const name = stockName(item);
    const tpl = SALE_LINES.length ? SALE_LINES[Math.floor(saleLineRoll * SALE_LINES.length) % SALE_LINES.length] : '';
    const line = tpl
      ? tpl.replace(/\{item\}/g, name).replace(/\{percent\}/g, String(percent))
      : `${name}: ${percent}% off at Hoshi Mart today!`;
    sale = { item, percent, line };
  }

  // placeholders
  const friendRoll = rng(), dishRoll = rng();
  const friendId = metIds.length ? metIds[Math.floor(friendRoll * metIds.length) % metIds.length] : null;
  const known = DISHES.filter((d) => p.recipes?.includes(d.id));
  const dish = known.length ? known[Math.floor(dishRoll * known.length) % known.length].name : 'honey toast';
  const fill: Fill = {
    friend: friendId ? REGULARS.find((r) => r.id === friendId)!.name : 'a new face',
    friendId,
    dish,
    festival: cal?.next?.name ?? 'the next festival',
    days: cal?.next ? String(Math.max(1, Math.ceil(cal.next.daysLeft / DAYS_PER_GAME_DAY))) : 'a few', // work days
    served: String(p.stats?.served ?? 0),
    item: sale ? stockName(sale.item) : 'melon bread',
    percent: String(sale ? sale.percent : percent),
  };

  // pieces: the "seen" list as it was before today's paper was read (keeps the issue stable after reading)
  const nArticles = rng() < 0.5 ? 2 : 3;
  const pool = ARTICLES.filter((t) => matches(t, cond));
  let seen = Array.isArray(p.newsSeen) ? p.newsSeen : [];
  if (p.newsReadDay === p.day) seen = seen.slice(0, Math.max(0, seen.length - (1 + Math.min(nArticles, pool.length))));
  const used = new Set<string>();
  const hl = choose(rng, HEADLINES.filter((t) => matches(t, cond)), seen, used);
  const headline = hl ? toArticle(hl, fill) : { ...FALLBACK_HEADLINE };
  used.add(headline.id);
  const articles: NewsArticle[] = [];
  for (let i = 0; i < nArticles; i++) {
    const t = choose(rng, pool, seen, used);
    if (!t) break;
    used.add(t.key);
    articles.push(toArticle(t, fill));
  }

  const horoscope = pick(rng, HOROSCOPES) ?? 'Bears: a warm drink brings luck today.';
  const comic = pick(rng, COMICS) ?? ['Mocha opens the café.', 'A guest orders a latte.', 'Latte art: a tiny bear! ♥'];
  const lines = WEATHER_LINES[weather] ?? [];
  const weatherLine = pick(rng, lines) ?? FALLBACK_WEATHER_LINE[weather];

  // a cryptic nudge toward a page not found yet (~60% of days)
  const hintRoll = rng(), hintPick = rng();
  const missing = SECRETS.filter((s) => !(p.secrets ?? []).includes(s.id) && s.hint);
  const hint = hintRoll < 0.6 && missing.length ? missing[Math.floor(hintPick * missing.length) % missing.length].hint : null;

  const d = cal?.date;
  const dateLabel = d ? `${WEEKDAYS[d.weekday] ?? ''}, ${MONTHS[d.month - 1] ?? ''} ${d.day}` : `Day ${p.day}`;

  return {
    day: p.day, dateLabel, weather, weatherLine, headline, articles, sale, horoscope, hint,
    comic: { panels: [comic[0] ?? '', comic[1] ?? '', comic[2] ?? ''] },
  };
}

/* ---------- today's issue cache ---------- */
let cache: { progress: Progress; key: string; issue: NewsIssue } | null = null;

/** Today's issue, generated once per (progress, day, date) and then kept stable. */
export function getIssue(p: Progress, cal: CalendarInfo): NewsIssue {
  const key = `${p.day}|${cal?.date?.year}-${cal?.date?.month}-${cal?.date?.day}`;
  if (cache && cache.progress === p && cache.key === key) return cache.issue;
  const issue = makeIssue(p, cal);
  cache = { progress: p, key, issue };
  return issue;
}

/** The deal of the last issue generated (konbini priceOf applies it). */
export function todaySale(): NewsIssue['sale'] {
  return cache?.issue.sale ?? null;
}

/** Mark the issue as read: newsReadDay + its pieces go to the end of newsSeen (capped). Returns true the first time today. */
export function markIssueRead(p: Progress, issue: NewsIssue): boolean {
  const first = p.newsReadDay !== p.day;
  if (!Array.isArray(p.newsSeen)) p.newsSeen = [];
  if (first) {
    const ids = [issue.headline.id, ...issue.articles.map((a) => a.id)];
    p.newsSeen = p.newsSeen.filter((id) => !ids.includes(id));
    p.newsSeen.push(...ids);
    if (p.newsSeen.length > NEWS_SEEN_CAP) p.newsSeen = p.newsSeen.slice(-NEWS_SEEN_CAP);
  }
  p.newsReadDay = p.day;
  return first;
}
