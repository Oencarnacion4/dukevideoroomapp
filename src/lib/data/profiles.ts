import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profile } from "@/lib/types";

/** The signed-in user's own profile row, joined on auth_user_id. */
export async function getCurrentProfile(supabase: SupabaseClient): Promise<Profile | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Full names of roster entries nobody has claimed yet — candidates for
 * matchRoster(). Reads the `public_roster` view (see migration 0004)
 * rather than `profiles` directly, since the register screen needs this
 * before the visitor has an account.
 */
export async function getUnclaimedRosterNames(supabase: SupabaseClient): Promise<
  { id: string; full_name: string }[]
> {
  const { data, error } = await supabase
    .from("public_roster")
    .select("id, full_name")
    .eq("claimed", false);

  if (error) throw error;
  return data;
}

export async function getAllProfiles(supabase: SupabaseClient): Promise<Profile[]> {
  const { data, error } = await supabase.from("profiles").select("*").order("full_name");
  if (error) throw error;
  return data;
}

/**
 * Deletes a crew member's profile. Postgres's own constraints (no cascade
 * on shifts.created_by / swap_requests, and the shifts open-slot check)
 * block removing anyone with real history on record, surfaced here as a
 * friendly error instead of a raw constraint-violation message.
 */
export async function removeProfile(supabase: SupabaseClient, profileId: string): Promise<{ error?: string }> {
  const { data, error } = await supabase.from("profiles").delete().eq("id", profileId).select("id");
  if (error) {
    return { error: "Can't remove — they have shifts, hours, or other history on record." };
  }
  if (!data || data.length === 0) {
    // RLS can silently filter a delete to zero rows instead of erroring.
    return { error: "Couldn't remove them — you may not have permission, or they're already gone." };
  }
  return {};
}
