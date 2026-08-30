import type { SupabaseClient } from "@supabase/supabase-js";
import type { Availability, DayOfWeek } from "@/lib/types";

export async function listAvailabilityFor(supabase: SupabaseClient, profileId: string): Promise<Availability[]> {
  const { data, error } = await supabase
    .from("availability")
    .select("*")
    .eq("profile_id", profileId)
    .order("day_of_week")
    .order("start_time");
  if (error) throw error;
  return data;
}

export async function listAllAvailability(supabase: SupabaseClient): Promise<Availability[]> {
  const { data, error } = await supabase.from("availability").select("*");
  if (error) throw error;
  return data;
}

export async function addAvailabilityBlocks(
  supabase: SupabaseClient,
  profileId: string,
  days: DayOfWeek[],
  start: string | null,
  end: string | null,
  allDay: boolean,
  label: string,
): Promise<void> {
  const rows = days.map((day) => ({
    profile_id: profileId,
    day_of_week: day,
    start_time: allDay ? null : start,
    end_time: allDay ? null : end,
    all_day: allDay,
    label,
  }));
  const { error } = await supabase.from("availability").insert(rows);
  if (error) throw error;
}

export async function removeAvailabilityBlock(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("availability").delete().eq("id", id);
  if (error) throw error;
}
