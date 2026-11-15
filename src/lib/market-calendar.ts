import type { Calendar } from "./backtest.ts";
import { traceFields } from "./market-trace.ts";

export function isCalendarDate(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  );
}
function shift(day: string, days: number) {
  return new Date(Date.parse(day + "T12:00:00Z") + days * 86400000)
    .toISOString()
    .slice(0, 10);
}
export function calendarBoundary(now: Date) {
  if (!Number.isFinite(now.valueOf())) throw new Error("INVALID_INPUT");
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const p = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  const today = `${p.year}-${p.month}-${p.day}`;
  const cycle = Number(p.hour) >= 9 ? today : shift(today, -1);
  return { cycle, eligibleThrough: shift(cycle, -1) };
}
export const freshnessCycle = (now: Date) => calendarBoundary(now).cycle;
/** Operational eligibility, not a provider finality assertion. */
export function eligibleSessions(sessions: string[], now: Date): string[] {
  const { eligibleThrough } = calendarBoundary(now);
  let previous = "";
  return sessions.filter((s) => {
    if (!isCalendarDate(s)) throw new Error("INVALID_INPUT");
    if (s <= previous) throw new Error("INVALID_INPUT");
    previous = s;
    return s <= eligibleThrough;
  });
}

export type CalendarRejection =
  "coverage" | "malformed" | "no_eligible_session";
export function rejectCalendar(reason: CalendarRejection): never {
  console.error(
    JSON.stringify({
      event: "market_calendar_rejected",
      reason,
      ...traceFields(),
    }),
  );
  throw new Error("CALENDAR_UNAVAILABLE");
}
/** Coverage is checked query coverage, never inferred from the last session. */
export function checkedCalendar(
  calendar: Calendar,
  start: string,
  now: Date,
  limit = 1300,
) {
  if (
    calendar?.complete !== true ||
    calendar.finalityVerified !== true ||
    typeof calendar.provenance !== "string" ||
    !calendar.provenance.trim() ||
    !isCalendarDate(calendar.from) ||
    !isCalendarDate(calendar.through) ||
    calendar.from > calendar.through ||
    !Array.isArray(calendar.sessions) ||
    calendar.sessions.length > limit
  )
    return rejectCalendar("malformed");
  if (
    calendar.from > start ||
    calendar.through < calendarBoundary(now).eligibleThrough
  )
    return rejectCalendar("coverage");
  let sessions: string[];
  try {
    sessions = eligibleSessions(calendar.sessions, now);
    if (
      calendar.sessions.some((s) => s < calendar.from || s > calendar.through)
    )
      throw new Error();
  } catch {
    return rejectCalendar("malformed");
  }
  if (!sessions.length) return rejectCalendar("no_eligible_session");
  return sessions;
}
