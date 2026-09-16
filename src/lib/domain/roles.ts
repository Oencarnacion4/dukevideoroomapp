import type { Role } from "@/lib/types";

/** Interns and leads log/track hours; staff and masters students don't — they're not paid crew working toward a weekly target. */
export function tracksHours(role: Role): boolean {
  return role === "intern" || role === "lead";
}

/** Interns and leads work video-crew shifts; staff and masters students never get assigned or propose one. */
export function worksShifts(role: Role): boolean {
  return role === "intern" || role === "lead";
}
