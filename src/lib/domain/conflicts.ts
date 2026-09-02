import { pgTimeToLabel, toMinutes } from "./time";
import type { Availability, AvailabilityKind, DayOfWeek } from "@/lib/types";

export interface AvailabilityBlock {
  id: string;
  profile_id: string;
  day_of_week: DayOfWeek;
  /** Set for a one-time block (matches this exact date only); null means recurring weekly by day_of_week. */
  specific_date: string | null;
  start_time: string | null; // "3:00 PM" label, or null when all_day
  end_time: string | null;
  all_day: boolean;
  label: string;
  kind: AvailabilityKind;
}

/** DB row (Postgres `time` strings) -> the label-based shape conflict checking uses. */
export function toAvailabilityBlock(a: Availability): AvailabilityBlock {
  return {
    id: a.id,
    profile_id: a.profile_id,
    day_of_week: a.day_of_week,
    specific_date: a.specific_date,
    start_time: a.start_time ? pgTimeToLabel(a.start_time) : null,
    end_time: a.end_time ? pgTimeToLabel(a.end_time) : null,
    all_day: a.all_day,
    label: a.label,
    kind: a.kind,
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
 * The block that conflicts with a shift on the given day/date and window,
 * or null. A one-time block (specific_date set) only matches that exact
 * calendar date; a recurring block (specific_date null) matches every
 * occurrence of that day of week. Either way, a conflict requires the day
 * to match and either the block being all-day or the time ranges
 * overlapping.
 *
 * Touching at the exact boundary (a class ending the same minute a shift
 * starts, or vice versa) counts as a conflict too — there's no real travel
 * time between them, so it's flagged rather than treated as back-to-back
 * and free.
 */
export function conflictFor(
  blocks: AvailabilityBlock[],
  day: DayOfWeek,
  date: string,
  window: [number, number],
): AvailabilityBlock | null {
  return (
    blocks.find((bl) => {
      const dayMatches = bl.specific_date ? bl.specific_date === date : bl.day_of_week === day;
      if (!dayMatches) return false;
      if (bl.all_day) return true;
      const blStart = toMinutes(bl.start_time!);
      const blEnd = toMinutes(bl.end_time!);
      if (blStart == null || blEnd == null) return false;
      return blStart <= window[1] && blEnd >= window[0];
    }) ?? null
  );
}

/**
 * The earliest timed (non-all-day) block on this day/date that starts at
 * or after `afterMinutes` — i.e. what a person has to leave for later that
 * same day. Used to show "free until 4:30 PM" for someone who is clear of
 * the shift itself but has something coming up, not just a yes/no check.
 */
export function nextCommitmentAfter(
  blocks: AvailabilityBlock[],
  day: DayOfWeek,
  date: string,
  afterMinutes: number,
): AvailabilityBlock | null {
  let best: AvailabilityBlock | null = null;
  let bestStart = Infinity;
  for (const bl of blocks) {
    const dayMatches = bl.specific_date ? bl.specific_date === date : bl.day_of_week === day;
    if (!dayMatches || bl.all_day || !bl.start_time) continue;
    const start = toMinutes(bl.start_time);
    if (start == null || start < afterMinutes) continue;
    if (start < bestStart) {
      bestStart = start;
      best = bl;
    }
  }
  return best;
}
