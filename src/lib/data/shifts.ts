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
  },
): Promise<void> {
  const status: ShiftStatus = input.assignee_id ? "pending" : "open";
  const { error } = await supabase.from("shifts").insert({ ...input, status });
  if (error) {
    // Migration 0015 (open_signup column) may not have run yet on this
    // Supabase project — retry without it so posting a shift still works.
    if (input.open_signup !== undefined && error.message?.includes("open_signup")) {
      const rest: Record<string, unknown> = { ...input };
      delete rest.open_signup;
      const { error: retryError } = await supabase.from("shifts").insert({ ...rest, status });
      if (retryError) throw retryError;
      return;
    }
    throw error;
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
