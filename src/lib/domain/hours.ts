// Hour math, ported verbatim from the prototype (`fmtHours`, the progress
// bar / verdict logic described under "Hours math" in the handoff).

export const WEEKLY_MIN_HOURS = 10;
export const WEEKLY_CAP_HOURS = 15;
/** Where the 10-hour minimum tick sits on a 0-15 bar. */
export const MIN_TICK_PCT = (WEEKLY_MIN_HOURS / WEEKLY_CAP_HOURS) * 100;

/** Rounds to the quarter hour and formats as "2.5 h", "3 h", etc. */
export function fmtHours(n: number): string {
  const r = Math.round(n * 4) / 4;
  const trimmed = r % 1 === 0 ? r.toFixed(0) : r.toFixed(2).replace(/0$/, "");
  return `${trimmed} h`;
}

export function progressPct(totalHours: number): number {
  return Math.min(100, (totalHours / WEEKLY_CAP_HOURS) * 100);
}

export function fillColorVar(totalHours: number): string {
  return totalHours >= WEEKLY_MIN_HOURS ? "var(--color-accent)" : "var(--color-accent-400)";
}

export function hoursVerdict(totalHours: number): string {
  if (totalHours >= WEEKLY_CAP_HOURS) return "At the top of the range";
  if (totalHours >= WEEKLY_MIN_HOURS) return "In range — you are good";
  return `${fmtHours(WEEKLY_MIN_HOURS - totalHours)} short of the 10 h minimum`;
}

/** Clock-out rounding: nearest minute, not the old quarter-hour/15-min-floor. */
export function roundClockedHours(rawHours: number): number {
  return Math.max(0, Math.round(rawHours * 60) / 60);
}

/** A precise "3 min" / "1h 12m" label for a live or just-logged clock session. */
export function liveDurationLabel(hours: number): string {
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
