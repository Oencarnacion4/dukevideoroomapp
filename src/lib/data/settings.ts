import type { SupabaseClient } from "@supabase/supabase-js";

export interface AppSettings {
  staff_can_edit_classes: boolean;
  require_swap_on_decline: boolean;
}

export async function getAppSettings(supabase: SupabaseClient): Promise<AppSettings> {
  const { data, error } = await supabase
    .from("app_settings")
    .select("staff_can_edit_classes, require_swap_on_decline")
    .eq("id", true)
    .single();
  if (error) throw error;
  return data;
}
