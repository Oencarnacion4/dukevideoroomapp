import type { SessionType, TaskBucket } from "@/lib/types";

export const SESSIONS: SessionType[] = [
  "Full practice",
  "Game",
  "Half-court work",
  "Individual workouts",
  "Early lift",
  "Live scrimmage",
  "Film session prep",
  "Extra time",
];

/** Session type -> auto-derived location, ported verbatim from `LOCS`. */
export const SESSION_LOCATIONS: Partial<Record<SessionType, string>> = {
  "Early lift": "Weight room",
  Game: "Main arena",
  "Live scrimmage": "Main arena",
  "Individual workouts": "Auxiliary gym",
  "Film session prep": "Video room",
  "Extra time": "Video room",
};
export const DEFAULT_LOCATION = "Practice court";

export function locationFor(session: SessionType): string {
  return SESSION_LOCATIONS[session] ?? DEFAULT_LOCATION;
}

export const TASK_BUCKETS: { id: TaskBucket; label: string }[] = [
  { id: "assigned", label: "From coaches" },
  { id: "daily", label: "Daily" },
  { id: "practice", label: "During practice" },
  { id: "post", label: "Post-practice" },
  { id: "game", label: "Game day" },
  { id: "personal", label: "Mine" },
];

export interface PracticeStep {
  id: string;
  title: string;
  hint: string;
}

/** The nine practice-mode steps, ported verbatim from `PRACTICE`. */
export const PRACTICE_STEPS: PracticeStep[] = [
  { id: "p1", title: "Cameras up, framed, and recording 20 min early", hint: "Baseline first, then corner" },
  { id: "p2", title: "Slate the file: date, session type, personnel", hint: "Say it out loud on the mic too" },
  { id: "p3", title: "Confirm audio on the coach mic", hint: "Levels around −12 dB" },
  { id: "p4", title: "Mark warmup / stretch break", hint: "Tap as the horn sounds" },
  { id: "p5", title: "Mark each drill segment as it starts", hint: "Shell, closeouts, transition" },
  { id: "p6", title: "Flag every “pull that one” from staff", hint: "Note the player and the action" },
  { id: "p7", title: "Watch card space at the halfway point", hint: "Swap if under 20 min left" },
  { id: "p8", title: "Mark live scrimmage start and stop", hint: "Coaches watch this segment first" },
  { id: "p9", title: "Stop recording only after staff clears the floor", hint: "Post-practice talks get used" },
];

export function tagVariant(tag: string | null): "accent" | "outline" | "neutral" {
  if (tag === "Priority" || tag === "Required") return "accent";
  if (tag === "Live" || tag === "Game") return "outline";
  return "neutral";
}
