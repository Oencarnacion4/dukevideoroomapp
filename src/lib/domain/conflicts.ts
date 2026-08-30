import { pgTimeToLabel, toMinutes } from "./time";
import type { Availability, DayOfWeek } from "@/lib/types";

export interface AvailabilityBlock {
  id: string;
  profile_id: string;
  day_of_week: DayOfWeek;
  start_time: string | null; // "3:00 PM" label, or null when all_day
  end_time: string | null;
  all_day: boolean;
  label: string;
}

/** DB row (Postgres `time` strings) -> the label-based shape conflict checking uses. */
export function toAvailabilityBlock(a: Availability): AvailabilityBlock {
  return {
    id: a.id,
    profile_id: a.profile_id,
    day_of_week: a.day_of_week,
    start_time: a.start_time ? pgTimeToLabel(a.start_time) : null,
    end_time: a.end_time ? pgTimeToLabel(a.end_time) : null,
    all_day: a.all_day,
    label: a.label,
  };
}

/**
 * [start, end] in minutes-since-midnight for a shift. An open-ended shift
 * (no end time) is treated as a 150-minute window from its start — a
 * heuristic for conflict-checking only, ported verbatim from the prototype.
 */
export function shiftWindow(start: string, end: string | null): [number, number] {
  const s = toMinutes(start);
  if (s == null) throw new Error(`Not a valid time label: ${start}`);
  const e = end === null ? s + 150 : toMinutes(end);
  return [s, e == null || e <= s ? s + 150 : e];
}

/**
 * The block that conflicts with a shift on the given day and window, or
 * null. A block conflicts when the day matches and either it's all-day or
 * the time ranges overlap. Ported verbatim from `conflictFor()`.
 */
export function conflictFor(
  blocks: AvailabilityBlock[],
  day: DayOfWeek,
  window: [number, number],
): AvailabilityBlock | null {
  return (
    blocks.find((bl) => {
      if (bl.day_of_week !== day) return false;
      if (bl.all_day) return true;
      const blStart = toMinutes(bl.start_time!);
      const blEnd = toMinutes(bl.end_time!);
      if (blStart == null || blEnd == null) return false;
      return blStart < window[1] && blEnd > window[0];
    }) ?? null
  );
}
