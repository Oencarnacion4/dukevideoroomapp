import type { HomeAway, SessionType, Shift, TimeEntry } from "@/lib/types";
import { toMinutes } from "./time";

/** The three jobs covered per game — reuses the existing (previously unused) shifts.camera_role field. */
export const GAME_ROLES = ["Minutes", "Stats", "Offense-Defense"] as const;

/** Claiming a game that would put you this many (or more) ahead of whoever's claimed the fewest triggers a confirm step. */
export const GAME_SIGNUP_GAP_WARNING = 2;

export const DEFAULT_GAME_TIME = "7:00 PM";

export interface ParsedGame {
  date: string; // YYYY-MM-DD
  opponent: string;
  homeAway: HomeAway;
  venue: string;
  startLabel: string;
  timeIsPlaceholder: boolean;
}

export interface ParseError {
  line: number;
  text: string;
  reason: string;
}

function parseDate(raw: string): string | null {
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (iso) return raw;
  const slash = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/.exec(raw);
  if (slash) {
    const [, mStr, dStr, yStr] = slash;
    const year = yStr.length === 2 ? Number(`20${yStr}`) : Number(yStr);
    const month = Number(mStr);
    const day = Number(dStr);
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  return null;
}

function parseHomeAway(raw: string): HomeAway | null {
  const v = raw.trim().toLowerCase();
  if (v === "home" || v === "h") return "home";
  if (v === "away" || v === "a") return "away";
  if (v === "neutral" || v === "n") return "neutral";
  return null;
}

/**
 * Parses pasted season-schedule lines of the form
 * "Date, Opponent, Home/Away/Neutral, Venue, Time" — Venue and Time are
 * optional (Venue defaults by home/away, Time defaults to DEFAULT_GAME_TIME
 * and is flagged so the preview can call it out as a placeholder).
 */
export function parseGameSchedule(text: string): { games: ParsedGame[]; errors: ParseError[] } {
  const games: ParsedGame[] = [];
  const errors: ParseError[] = [];

  const lines = text.split("\n");
  lines.forEach((rawLine, i) => {
    const line = rawLine.trim();
    if (!line) return;

    const parts = line.split(",").map((p) => p.trim());
    const [dateRaw, opponentRaw, homeAwayRaw, venueRaw, timeRaw] = parts;

    const date = dateRaw ? parseDate(dateRaw) : null;
    if (!date) {
      errors.push({ line: i + 1, text: line, reason: "Couldn't read the date — use M/D/YYYY or YYYY-MM-DD." });
      return;
    }

    const opponent = opponentRaw?.trim();
    if (!opponent) {
      errors.push({ line: i + 1, text: line, reason: "Missing opponent." });
      return;
    }

    const homeAway = homeAwayRaw ? parseHomeAway(homeAwayRaw) : null;
    if (!homeAway) {
      errors.push({ line: i + 1, text: line, reason: "Third field needs to be home, away, or neutral." });
      return;
    }

    const venue = venueRaw?.trim() || (homeAway === "home" ? "Cameron Indoor Stadium" : "TBD");

    const timeIsPlaceholder = !timeRaw?.trim();
    const startLabel = timeIsPlaceholder ? DEFAULT_GAME_TIME : timeRaw.trim();
    if (toMinutes(startLabel) == null) {
      errors.push({ line: i + 1, text: line, reason: `Couldn't read the time "${timeRaw}" — use "7:00 PM" style.` });
      return;
    }

    games.push({ date, opponent, homeAway, venue, startLabel, timeIsPlaceholder });
  });

  return { games, errors };
}

export interface GameStat {
  profileId: string;
  /** Signed up for (accepted a game-day role) — live, used for the sign-up fairness nudge. */
  claimed: number;
  /** Actually clocked in for, verified via a linked, approved time entry — the trustworthy season total. */
  worked: number;
}

/** Per-person claimed/worked counts across every game shift (any role) in the season. */
export function computeGameStats(
  gameShifts: Pick<Shift, "id" | "status" | "assignee_id">[],
  timeEntries: Pick<TimeEntry, "profile_id" | "status" | "shift_id">[],
): Record<string, GameStat> {
  const stats: Record<string, GameStat> = {};
  const get = (id: string) => (stats[id] ??= { profileId: id, claimed: 0, worked: 0 });

  for (const s of gameShifts) {
    if (s.status === "accepted" && s.assignee_id) get(s.assignee_id).claimed += 1;
  }

  const gameShiftIds = new Set(gameShifts.map((s) => s.id));
  const counted = new Set<string>();
  for (const e of timeEntries) {
    if (e.status !== "approved" || !e.shift_id || !gameShiftIds.has(e.shift_id)) continue;
    const key = `${e.profile_id}:${e.shift_id}`;
    if (counted.has(key)) continue;
    counted.add(key);
    get(e.profile_id).worked += 1;
  }

  return stats;
}

/**
 * Null if claiming is unremarkable. Otherwise a message for a confirm step —
 * claiming is never blocked outright, just made to require a second tap once
 * someone's noticeably ahead of whoever's claimed the fewest games.
 */
export function gameClaimWarning(
  stats: Record<string, GameStat>,
  claimantId: string,
  eligibleProfileIds: string[],
): string | null {
  const counts = eligibleProfileIds.map((id) => stats[id]?.claimed ?? 0);
  const min = counts.length > 0 ? Math.min(...counts) : 0;
  const mine = stats[claimantId]?.claimed ?? 0;
  if (mine + 1 - min < GAME_SIGNUP_GAP_WARNING) return null;
  return `You've already signed up for ${mine} game${mine === 1 ? "" : "s"} this season — others are still at ${min}. Claim this one too?`;
}

/** "vs. North Carolina" / "at Georgia Tech" / "North Carolina (neutral)" — falls back to the session type for non-games. */
export function gameTitle(shift: {
  session_type: SessionType;
  opponent: string | null;
  home_away: HomeAway | null;
}): string {
  if (!shift.opponent) return shift.session_type;
  if (shift.home_away === "away") return `at ${shift.opponent}`;
  if (shift.home_away === "neutral") return `${shift.opponent} (neutral)`;
  return `vs. ${shift.opponent}`;
}
