import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profile } from "@/lib/types";

/** Unanswered shifts + 2, until the crew member has opened Alerts once. */
export async function getBadgeCount(supabase: SupabaseClient, profile: Profile): Promise<number> {
  const { count, error } = await supabase
    .from("shifts")
    .select("id", { count: "exact", head: true })
    .eq("assignee_id", profile.id)
    .eq("status", "pending");
  if (error) throw error;

  return (count ?? 0) + (profile.alerts_seen_at ? 0 : 2);
}
