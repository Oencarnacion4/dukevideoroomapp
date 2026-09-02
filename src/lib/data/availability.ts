import type { SupabaseClient } from "@supabase/supabase-js";
import type { Availability, AvailabilityKind, DayOfWeek } from "@/lib/types";

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

/**
 * "busy" blocks only (classes, days off) — what shift-conflict checking
 * should ever see. Filtered in JS, not `.eq("kind", ...)`, so this keeps
 * working even before migration 0010 (which adds the `kind` column) has
 * been run — every row is implicitly "busy" until then.
 */
export async function listAllAvailability(supabase: SupabaseClient): Promise<Availability[]> {
  const { data, error } = await supabase.from("availability").select("*");
  if (error) throw error;
  return (data ?? []).filter((row) => (row.kind ?? "busy") === "busy");
}

/** Every block, busy and planned — for the crew calendar, which shows both. */
export async function listAllAvailabilityAnyKind(supabase: SupabaseClient): Promise<Availability[]> {
  const { data, error } = await supabase.from("availability").select("*");
  if (error) throw error;
  return data;
}

/**
 * `kind` was added in migration 0010. If it hasn't run yet on this database,
 * inserting it fails — as a raw SQL "column does not exist" (Postgres
 * 42703) or, more often for an insert, PostgREST's own schema-cache-miss
 * error (PGRST204) — retry without it so blocking a class or a day off
 * keeps working either way.
 */
async function insertAvailabilityRows(
  supabase: SupabaseClient,
  rows: Array<Record<string, unknown>>,
): Promise<void> {
  const { error } = await supabase.from("availability").insert(rows);
  if (error && (error.code === "42703" || error.code === "PGRST204") && error.message.includes("kind")) {
    const fallbackRows = rows.map(({ kind: _kind, ...rest }) => rest);
    const { error: fallbackError } = await supabase.from("availability").insert(fallbackRows);
    if (fallbackError) throw fallbackError;
    return;
  }
  if (error) throw error;
}

export async function addAvailabilityBlocks(
  supabase: SupabaseClient,
  profileId: string,
  days: DayOfWeek[],
  start: string | null,
  end: string | null,
  allDay: boolean,
  label: string,
  kind: AvailabilityKind = "busy",
): Promise<void> {
  const rows = days.map((day) => ({
    profile_id: profileId,
    day_of_week: day,
    start_time: allDay ? null : start,
    end_time: allDay ? null : end,
    all_day: allDay,
    label,
    kind,
  }));
  await insertAvailabilityRows(supabase, rows);
}

/** A one-time block for a single calendar date — never recurs, unlike addAvailabilityBlocks(). */
export async function addOneTimeBlock(
  supabase: SupabaseClient,
  profileId: string,
  date: string,
  dayOfWeek: DayOfWeek,
  start: string | null,
  end: string | null,
  allDay: boolean,
  label: string,
  kind: AvailabilityKind = "busy",
): Promise<void> {
  await insertAvailabilityRows(supabase, [
    {
      profile_id: profileId,
      day_of_week: dayOfWeek,
      specific_date: date,
      start_time: allDay ? null : start,
      end_time: allDay ? null : end,
      all_day: allDay,
      label,
      kind,
    },
  ]);
}

export async function updateAvailabilityBlock(
  supabase: SupabaseClient,
  id: string,
  patch: { day_of_week: DayOfWeek; start_time: string; end_time: string; label: string },
): Promise<void> {
  const { error } = await supabase.from("availability").update(patch).eq("id", id);
  if (error) throw error;
}

export async function removeAvailabilityBlock(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("availability").delete().eq("id", id);
  if (error) throw error;
}
