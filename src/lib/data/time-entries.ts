import type { SupabaseClient } from "@supabase/supabase-js";
import type { TimeEntry, TimeEntrySource } from "@/lib/types";

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

/**
 * What an intern sees as their own running total: approved + still-pending
 * hours, so the number doesn't visibly drop the moment they clock out and
 * an entry lands in the review queue. Excludes anything a lead rejected.
 */
export function sumHours(entries: TimeEntry[], weekStart: string, weekEnd: string): number {
  return entries
    .filter((e) => e.date >= weekStart && e.date < weekEnd && e.status !== "rejected")
    .reduce((total, e) => total + Number(e.hours), 0);
}

/** What actually counts toward the target as far as a lead/staff can trust — approved only. */
export function sumApprovedHours(entries: TimeEntry[], weekStart: string, weekEnd: string): number {
  return entries
    .filter((e) => e.date >= weekStart && e.date < weekEnd && e.status === "approved")
    .reduce((total, e) => total + Number(e.hours), 0);
}

/** A QR tap at the Video Room is the only source that's physically verified, so it's auto-approved. Everything else is self-reported and needs a lead/staff sign-off. */
export async function logTimeEntry(
  supabase: SupabaseClient,
  input: { profile_id: string; date: string; session_label: string; hours: number; source: TimeEntrySource },
): Promise<void> {
  const { error } = await supabase.from("time_entries").insert({
    ...input,
    status: input.source === "tap" ? "approved" : "pending",
  });
  if (error) throw error;
}

/** Any edit puts an entry back up for review — otherwise an already-approved entry could be quietly inflated after the fact. */
export async function updateTimeEntry(
  supabase: SupabaseClient,
  id: string,
  patch: { date: string; session_label: string; hours: number },
): Promise<void> {
  const { error } = await supabase
    .from("time_entries")
    .update({ ...patch, status: "pending", reviewed_by: null, reviewed_at: null })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteTimeEntry(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("time_entries").delete().eq("id", id);
  if (error) throw error;
}

export async function reviewTimeEntry(
  supabase: SupabaseClient,
  id: string,
  reviewerId: string,
  decision: "approved" | "rejected",
): Promise<void> {
  const { error } = await supabase
    .from("time_entries")
    .update({ status: decision, reviewed_by: reviewerId, reviewed_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}
