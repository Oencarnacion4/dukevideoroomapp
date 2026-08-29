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
