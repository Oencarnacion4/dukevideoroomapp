import type { SupabaseClient } from "@supabase/supabase-js";
import type { Notification } from "@/lib/types";

export async function listNotifications(supabase: SupabaseClient): Promise<Notification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

/** Marks the crew's alerts as seen — resets the header badge's "+2 until visited" bump. */
export async function markAlertsSeen(supabase: SupabaseClient, profileId: string): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ alerts_seen_at: new Date().toISOString() })
    .eq("id", profileId);
  if (error) throw error;
}

/** Fans a notification out to another crew member via the SECURITY DEFINER function — never a direct insert. */
export async function notify(
  supabase: SupabaseClient,
  targetProfileId: string,
  title: string,
  body?: string,
): Promise<void> {
  const { error } = await supabase.rpc("create_notification", {
    target_profile_id: targetProfileId,
    p_title: title,
    p_body: body ?? null,
  });
  if (error) throw error;
}
