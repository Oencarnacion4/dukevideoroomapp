// Time helpers ported from the prototype's Component class
// (design/Video Room.dc.html), operating on the "3:00 PM" label format
// used throughout the UI and builder <select> options.

import type { DayOfWeek } from "@/lib/types";

/** Every 5 minutes from 5:00 AM to 10:00 PM, adapted from `timeOpts()`. */
export const TIME_OPTIONS: string[] = (() => {
  const out: string[] = [];
  for (let m = 5 * 60; m <= 22 * 60; m += 5) {
    const h = Math.floor(m / 60);
    const mm = m % 60;
    const ap = h < 12 ? "AM" : "PM";
    const hh = h % 12 === 0 ? 12 : h % 12;
    out.push(`${hh}:${String(mm).padStart(2, "0")} ${ap}`);
  }
  return out;
})();

/** "3:00 PM" -> 900 (minutes since midnight). Ported from `toMin()`. */
export function toMinutes(label: string): number | null {
  const m = /(\d+):(\d+)\s*(AM|PM)/.exec(label);
  if (!m) return null;
  let h = Number(m[1]) % 12;
  if (m[3] === "PM") h += 12;
  return h * 60 + Number(m[2]);
}

/** 900 -> "3:00 PM". Inverse of toMinutes, for values not in TIME_OPTIONS. */
export function minutesToLabel(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60) % 24;
  const mm = totalMinutes % 60;
  const ap = h < 12 ? "AM" : "PM";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${String(mm).padStart(2, "0")} ${ap}`;
}

/**
 * "Open end" if there's no end time, else a duration like "2h 30m".
 * Ported from `spanLabel()`.
 */
export function spanLabel(start: string, end: string | null): string {
  if (end === null) return "Open end";
  const a = toMinutes(start);
  const b = toMinutes(end);
  if (a == null || b == null || b <= a) return "Open end";
  const d = b - a;
  const h = Math.floor(d / 60);
  const mm = d % 60;
  return (h ? `${h}h` : "") + (mm ? `${h ? " " : ""}${mm}m` : "");
}

/** Postgres `time` column ("15:00:00") -> UI label ("3:00 PM"). */
export function pgTimeToLabel(pgTime: string): string {
  const [hStr, mStr] = pgTime.split(":");
  const h = Number(hStr);
  const mm = Number(mStr);
  return minutesToLabel(h * 60 + mm);
}

/** UI label ("3:00 PM") -> Postgres `time` column ("15:00:00"). */
export function labelToPgTime(label: string): string {
  const mins = toMinutes(label);
  if (mins == null) throw new Error(`Not a valid time label: ${label}`);
  const h = Math.floor(mins / 60);
  const mm = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}:00`;
}

/** Hours between two labels, or null for an open-ended shift. */
export function durationHours(start: string, end: string | null): number | null {
  if (end === null) return null;
  const a = toMinutes(start);
  const b = toMinutes(end);
  if (a == null || b == null || b <= a) return null;
  return (b - a) / 60;
}

export const DAYS: readonly DayOfWeek[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** The DAYS abbreviation for a "YYYY-MM-DD" date, e.g. "2026-09-08" -> "Tue". */
export function dayOfWeekFor(dateStr: string): DayOfWeek {
  const jsDay = new Date(`${dateStr}T00:00:00`).getDay(); // 0 = Sunday
  return DAYS[(jsDay + 6) % 7];
}

/** Monday of the week containing `date`, as "YYYY-MM-DD". */
export function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date);
  const dow = d.getDay(); // 0 = Sunday
  const diffToMonday = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + diffToMonday);
  return d.toISOString().slice(0, 10);
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** "2026-09-08" -> "Sep 8" */
export function formatShortDate(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatWeekLabel(weekStart: string): string {
  const d = new Date(`${weekStart}T00:00:00`);
  const month = d.toLocaleDateString("en-US", { month: "short" });
  return `Week of ${month} ${d.getDate()}`;
}

/** Resolves a "?week=YYYY-MM-DD" search param to a valid Monday, falling back to the current week. */
export function resolveWeekParam(week: string | undefined): string {
  if (week && /^\d{4}-\d{2}-\d{2}$/.test(week) && !Number.isNaN(new Date(`${week}T00:00:00`).getTime())) {
    return getWeekStart(new Date(`${week}T00:00:00`));
  }
  return getWeekStart();
}
