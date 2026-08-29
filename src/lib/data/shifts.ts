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
  },
): Promise<void> {
  const status: ShiftStatus = input.assignee_id ? "pending" : "open";
  const { error } = await supabase.from("shifts").insert({ ...input, status });
  if (error) throw error;
}

export async function respondToShift(
  supabase: SupabaseClient,
  shiftId: string,
  patch: { status: ShiftStatus; assignee_id?: string; note?: string | null },
): Promise<void> {
  const { error } = await supabase.from("shifts").update(patch).eq("id", shiftId);
  if (error) throw error;
}

export async function setShiftNote(supabase: SupabaseClient, shiftId: string, note: string | null): Promise<void> {
  const { error } = await supabase.from("shifts").update({ note }).eq("id", shiftId);
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
