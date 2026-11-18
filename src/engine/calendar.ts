/* =====================================================================
   CALENDAR — real-world date → season, theme, upcoming festival.
   ===================================================================== */
import type { CalendarInfo, SeasonEventDef, ThemeId } from '../types';
import { SEASON_EVENTS } from '../content/progression';

const DAY_MS = 86_400_000;
/** Days after the event the festival theme keeps showing. */
const AFTER_DAYS = 3;

/** Whole-day number for a calendar date (UTC based, so DST never shifts it). */
const dayNum = (y: number, m: number, d: number): number => Math.round(Date.UTC(y, m - 1, d) / DAY_MS);
const todayNum = (now: Date): number => dayNum(now.getFullYear(), now.getMonth() + 1, now.getDate());

function seasonOf(month: number): CalendarInfo['season'] {
  if (month === 12 || month <= 2) return 'winter';
  if (month <= 5) return 'spring';
  if (month <= 8) return 'summer';
  return 'autumn';
}

/** Days until the next occurrence of the event (0 = today), wrapping into next year. Also returns that occurrence's year. */
export function daysUntil(ev: SeasonEventDef, now: Date): { daysLeft: number; year: number } {
  const t = todayNum(now);
  const y = now.getFullYear();
  const thisYear = dayNum(y, ev.month, ev.day);
  if (thisYear >= t) return { daysLeft: thisYear - t, year: y };
  return { daysLeft: dayNum(y + 1, ev.month, ev.day) - t, year: y + 1 };
}

export function calendarInfo(now: Date): CalendarInfo {
  const month = now.getMonth() + 1;
  let next: CalendarInfo['next'] = null;
  let today: CalendarInfo['today'] = null;
  for (const ev of SEASON_EVENTS) {
    const { daysLeft } = daysUntil(ev, now);
    if (daysLeft === 0) today = ev.id;
    if (!next || daysLeft < next.daysLeft) next = { id: ev.id, name: ev.name, daysLeft, blurb: ev.blurb };
  }
  return {
    date: { year: now.getFullYear(), month, day: now.getDate(), weekday: now.getDay() },
    season: seasonOf(month),
    next,
    today,
  };
}

/** Theme for 'auto' on this date (festival lead-up wins, else season). */
export function autoTheme(now: Date): ThemeId {
  const t = todayNum(now);
  const y = now.getFullYear();
  let best: { theme: ThemeId; dist: number } | null = null;
  for (const ev of SEASON_EVENTS) {
    if (!ev.theme) continue;
    for (const yy of [y - 1, y, y + 1]) {
      const e = dayNum(yy, ev.month, ev.day);
      if (t >= e - Math.max(0, ev.leadDays) && t <= e + AFTER_DAYS) {
        const dist = Math.abs(e - t);
        if (!best || dist < best.dist) best = { theme: ev.theme, dist };
      }
    }
  }
  if (best) return best.theme;
  const m = now.getMonth() + 1;
  if (m >= 3 && m <= 5) return 'spring';
  if (m >= 6 && m <= 8) return 'summer';
  return 'everyday';
}
