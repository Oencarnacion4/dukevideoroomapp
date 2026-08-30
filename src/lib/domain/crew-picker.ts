import { conflictFor, nextCommitmentAfter, shiftWindow, type AvailabilityBlock } from "./conflicts";
import { toMinutes } from "./time";
import type { DayOfWeek } from "@/lib/types";

export interface CrewOption {
  id: string;
  full_name: string;
  shiftCount: number;
}

export interface CrewOptionWithHint extends CrewOption {
  conflict: AvailabilityBlock | null;
  nextCommitment: AvailabilityBlock | null;
}

/** Annotates each crew option with its class conflict (if any) or, failing
 * that, when their next commitment starts that day — the same hint shown
 * in the shift builder, reused everywhere a shift needs a person picked. */
export function crewWithAvailabilityHints(
  crew: CrewOption[],
  availability: AvailabilityBlock[],
  day: DayOfWeek,
  date: string,
  startLabel: string,
  endLabel: string | null,
): CrewOptionWithHint[] {
  const win = shiftWindow(startLabel, endLabel);
  return crew.map((c) => {
    const blocks = availability.filter((b) => b.profile_id === c.id);
    const conflict = conflictFor(blocks, day, date, win);
    const nextCommitment = !conflict ? nextCommitmentAfter(blocks, day, date, toMinutes(startLabel) ?? 0) : null;
    return { ...c, conflict, nextCommitment };
  });
}
