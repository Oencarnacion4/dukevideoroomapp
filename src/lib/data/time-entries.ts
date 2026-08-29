import type { SupabaseClient } from "@supabase/supabase-js";
import type { TimeEntry } from "@/lib/types";

export async function listTimeEntriesFor(supabase: SupabaseClient, profileId: string): Promise<TimeEntry[]> {
  const { data, error } = await supabase
    .from("time_entries")
    .select("*")
    .eq("profile_id", profileId)
    .order("date", { ascending: false });
  if (error) throw error;
  return data;
}

export async function listAllTimeEntries(supabase: SupabaseClient): Promise<TimeEntry[]> {
  const { data, error } = await supabase.from("time_entries").select("*");
  if (error) throw error;
  return data;
}

export function sumHours(entries: TimeEntry[], weekStart: string, weekEnd: string): number {
  return entries
    .filter((e) => e.date >= weekStart && e.date < weekEnd)
    .reduce((total, e) => total + Number(e.hours), 0);
}

export async function logTimeEntry(
  supabase: SupabaseClient,
  input: { profile_id: string; date: string; session_label: string; hours: number; source: "clocked" | "manual" },
): Promise<void> {
  const { error } = await supabase.from("time_entries").insert(input);
  if (error) throw error;
}
