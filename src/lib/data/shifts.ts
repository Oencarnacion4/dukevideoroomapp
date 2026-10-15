import type { SupabaseClient } from "@supabase/supabase-js";
import type { DayOfWeek, SessionType, Shift, ShiftStatus, SwapRequest } from "@/lib/types";

export interface ShiftWithAssignee extends Shift {
  assignee: { id: string; full_name: string } | null;
}

export async function listShifts(supabase: SupabaseClient, weekStart: string): Promise<ShiftWithAssignee[]> {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const { data, error } = await supabase
    .from("shifts")
    .select("*, assignee:assignee_id(id, full_name)")
    .gte("date", weekStart)
    .lt("date", weekEnd.toISOString().slice(0, 10))
    .order("date")
    .order("start_time");

  if (error) throw error;
  return data as unknown as ShiftWithAssignee[];
}

/** Every game shift (any role, any week) — the season is small enough to fetch in one go for the claimed/worked stats. */
export async function listGameShifts(supabase: SupabaseClient): Promise<Shift[]> {
  const { data, error } = await supabase.from("shifts").select("*").eq("session_type", "Game");
  if (error) throw error;
  return data;
}

/** The caller's accepted game shift for today, if any — used to link a clock-in to the specific game. */
export async function findTodaysGameShiftId(supabase: SupabaseClient, profileId: string): Promise<string | null> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("shifts")
    .select("id")
    .eq("assignee_id", profileId)
    .eq("date", today)
    .eq("session_type", "Game")
    .eq("status", "accepted")
    .limit(1)
    .maybeSingle();

  if (error) return null; // column may not exist yet pre-migration — fail quiet, not fatal to clocking in
  return data?.id ?? null;
}

export async function createShift(
  supabase: SupabaseClient,
  input: {
    day_of_week: DayOfWeek;
    date: string;
    start_time: string;
    end_time: string | null;
    session_type: SessionType;
    camera_role: string | null;
    location: string;
    assignee_id: string | null;
    note: string | null;
    created_by: string;
    /** Lets the slot stay open after someone claims it, so more than one person can join. Open rows only. */
    open_signup?: boolean;
    /** Game shifts only — who it's against and where, for the card title. */
    opponent?: string | null;
    home_away?: "home" | "away" | "neutral" | null;
  },
): Promise<void> {
  const status: ShiftStatus = input.assignee_id ? "pending" : "open";
  const optionalKeys = ["open_signup", "opponent", "home_away"] as const;
  let payload: Record<string, unknown> = { ...input, status };

  for (let attempt = 0; attempt <= optionalKeys.length; attempt++) {
    const { error } = await supabase.from("shifts").insert(payload);
    if (!error) return;
    // Migrations 0015/0016 (open_signup/opponent/home_away columns) may not
    // have run yet on this Supabase project — retry without whichever
    // column PostgREST says it can't find, so posting a shift still works.
    const missingKey = optionalKeys.find((key) => key in payload && error.message?.includes(`'${key}'`));
    if (!missingKey) throw error;
    payload = { ...payload };
    delete payload[missingKey];
  }
}

/** Bulk-creates the season's game shifts — one open row per GAME_ROLE per game, ready for self sign-up. */
export async function createGameShifts(
  supabase: SupabaseClient,
  games: {
    day_of_week: DayOfWeek;
    date: string;
    start_time: string;
    opponent: string;
    home_away: "home" | "away" | "neutral";
    location: string;
    roles: readonly string[];
  }[],
  createdBy: string,
): Promise<void> {
  for (const game of games) {
    for (const role of game.roles) {
      await createShift(supabase, {
        day_of_week: game.day_of_week,
        date: game.date,
        start_time: game.start_time,
        end_time: null,
        session_type: "Game",
        camera_role: role,
        location: game.location,
        assignee_id: null,
        note: null,
        created_by: createdBy,
        opponent: game.opponent,
        home_away: game.home_away,
      });
    }
  }
}

/** An intern proposing their own extra shift, distinct from an admin-built one — starts 'proposed', not 'pending'. */
export async function proposeShift(
  supabase: SupabaseClient,
  input: {
    day_of_week: DayOfWeek;
    date: string;
    start_time: string;
    end_time: string | null;
    location: string;
    note: string | null;
    profile_id: string;
  },
): Promise<void> {
  const { error } = await supabase.from("shifts").insert({
    day_of_week: input.day_of_week,
    date: input.date,
    start_time: input.start_time,
    end_time: input.end_time,
    session_type: "Extra time" satisfies SessionType,
    camera_role: null,
    location: input.location,
    assignee_id: input.profile_id,
    created_by: input.profile_id,
    note: input.note,
    status: "proposed" satisfies ShiftStatus,
  });
  if (error) throw error;
}

/**
 * Claims an open slot. A plain open slot is claimed in place (it goes from
 * unassigned to accepted, and disappears from "open" for everyone else). An
 * open_signup slot stays open — the claim adds a new accepted row alongside
 * it, via the claim_open_signup_shift() SECURITY DEFINER function, so the
 * next person can still tap Claim too. Falls back to a plain claim if that
 * column/function isn't there yet (migration 0015 not yet run).
 */
export async function claimShift(supabase: SupabaseClient, shiftId: string, profileId: string): Promise<void> {
  const { data: shift, error: lookupError } = await supabase
    .from("shifts")
    .select("open_signup")
    .eq("id", shiftId)
    .single();

  if (!lookupError && shift?.open_signup) {
    const { error } = await supabase.rpc("claim_open_signup_shift", { shift_id: shiftId });
    if (error) throw error;
    return;
  }

  await respondToShift(supabase, shiftId, { status: "accepted", assignee_id: profileId });
}

export async function respondToShift(
  supabase: SupabaseClient,
  shiftId: string,
  patch: { status: ShiftStatus; assignee_id?: string; note?: string | null },
): Promise<void> {
  const { error } = await supabase.from("shifts").update(patch).eq("id", shiftId);
  if (error) throw error;
}

export async function deleteShift(supabase: SupabaseClient, shiftId: string): Promise<void> {
  const { error } = await supabase.from("shifts").delete().eq("id", shiftId);
  if (error) throw error;
}

export async function setShiftNote(supabase: SupabaseClient, shiftId: string, note: string | null): Promise<void> {
  const { error } = await supabase.from("shifts").update({ note }).eq("id", shiftId);
  if (error) throw error;
}

/**
 * Corrects a shift's day/time/session/location/camera role in place —
 * deliberately never touches assignee_id or status, so an already
 * accepted/declined response survives fixing a mistake like the wrong time.
 */
export async function updateShift(
  supabase: SupabaseClient,
  shiftId: string,
  patch: {
    day_of_week: DayOfWeek;
    date: string;
    start_time: string;
    end_time: string | null;
    session_type: SessionType;
    camera_role: string | null;
    location: string;
  },
): Promise<void> {
  const { error } = await supabase.from("shifts").update(patch).eq("id", shiftId);
  if (error) throw error;
}

export async function createSwapRequest(
  supabase: SupabaseClient,
  input: { shift_id: string; from_profile: string; to_profile: string },
): Promise<void> {
  const { error } = await supabase.from("swap_requests").insert(input);
  if (error) throw error;
  await respondToShift(supabase, input.shift_id, { status: "swap_sent", assignee_id: input.from_profile });
}

export async function listSwapRequestsForShift(
  supabase: SupabaseClient,
  shiftId: string,
): Promise<SwapRequest[]> {
  const { data, error } = await supabase
    .from("swap_requests")
    .select("*")
    .eq("shift_id", shiftId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}
