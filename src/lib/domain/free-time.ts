// Pure "when2meet"-style grid logic: for every slot across the week, who
// on the crew is free vs. busy. Busy means a blocked-out availability
// block (class, "something came up") or an accepted shift overlapping
// that slot — nothing here touches the DB, so it's fully unit-testable.

import { shiftWindow } from "./conflicts";
import { toMinutes } from "./time";
import type { AvailabilityBlock } from "./conflicts";
import type { DayOfWeek } from "@/lib/types";

export interface CrewMember {
  id: string;
  full_name: string;
}

/** Shift fields already normalized to label-form times (see pgTimeToLabel) — this module never touches Postgres time strings directly. */
export interface BusyShift {
  assignee_id: string | null;
  status: string;
  date: string;
  start_time: string;
  end_time: string | null;
  session_type: string;
}

export interface SlotBusyEntry {
  id: string;
  reason: string;
}

export interface FreeSlot {
  startMin: number;
  endMin: number;
  freeIds: string[];
  busy: SlotBusyEntry[];
}

export interface FreeDay {
  day: DayOfWeek;
  date: string;
  slots: FreeSlot[];
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && aEnd > bStart;
}

export function computeFreeGrid(
  crew: CrewMember[],
  busyBlocks: AvailabilityBlock[],
  shifts: BusyShift[],
  days: readonly DayOfWeek[],
  dayDates: string[],
  windowStart: number,
  windowEnd: number,
  slotMinutes: number,
): FreeDay[] {
  return days.map((day, i) => {
    const date = dayDates[i];
    const slots: FreeSlot[] = [];

    for (let start = windowStart; start < windowEnd; start += slotMinutes) {
      const end = start + slotMinutes;
      const freeIds: string[] = [];
      const busy: SlotBusyEntry[] = [];

      for (const member of crew) {
        const block = busyBlocks.find((b) => {
          if (b.profile_id !== member.id) return false;
          const dayMatches = b.specific_date ? b.specific_date === date : b.day_of_week === day;
          if (!dayMatches) return false;
          if (b.all_day) return true;
          const bStart = toMinutes(b.start_time!);
          const bEnd = toMinutes(b.end_time!);
          if (bStart == null || bEnd == null) return false;
          return overlaps(start, end, bStart, bEnd);
        });
        if (block) {
          busy.push({ id: member.id, reason: block.label || "Busy" });
          continue;
        }

        const shift = shifts.find((s) => {
          if (s.assignee_id !== member.id || s.status !== "accepted" || s.date !== date) return false;
          const [sStart, sEnd] = shiftWindow(s.start_time, s.end_time);
          return overlaps(start, end, sStart, sEnd);
        });
        if (shift) {
          busy.push({ id: member.id, reason: shift.session_type });
          continue;
        }

        freeIds.push(member.id);
      }

      slots.push({ startMin: start, endMin: end, freeIds, busy });
    }

    return { day, date, slots };
  });
}
