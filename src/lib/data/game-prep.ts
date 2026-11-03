import type { SupabaseClient } from "@supabase/supabase-js";
import type { GamePrepItemKey } from "@/lib/domain/game-prep";

export interface GamePrepItemRow {
  id: string;
  game_date: string;
  opponent: string;
  item_key: GamePrepItemKey;
  done: boolean;
  done_by: string | null;
  done_at: string | null;
}

export interface GameScoutRow {
  id: string;
  game_date: string;
  opponent: string;
  profile_id: string;
  assigned_by: string;
}

export interface GameScoutWithProfile extends GameScoutRow {
  profile: { id: string; full_name: string } | null;
}

/**
 * True if this looks like "table doesn't exist yet" rather than a real
 * failure — migration 0017 not run yet. PGRST205 ("Could not find the
 * table ... in the schema cache") is PostgREST's own code for this; 42P01
 * (undefined_table) is Postgres's, in case it ever reaches us unwrapped.
 */
function isMissingTable(error: { code?: string; message?: string }): boolean {
  return error.code === "PGRST205" || error.code === "42P01" || !!error.message?.includes("schema cache");
}

export async function listGamePrepItems(supabase: SupabaseClient): Promise<GamePrepItemRow[]> {
  const { data, error } = await supabase.from("game_prep_items").select("*");
  if (error) {
    if (isMissingTable(error)) return [];
    throw error;
  }
  return data;
}

export async function listGameScouts(supabase: SupabaseClient): Promise<GameScoutWithProfile[]> {
  const { data, error } = await supabase.from("game_scouts").select("*, profile:profile_id(id, full_name)");
  if (error) {
    if (isMissingTable(error)) return [];
    throw error;
  }
  return data as unknown as GameScoutWithProfile[];
}

/**
 * No row exists for an item until it's first toggled — this upserts rather
 * than updating by id, so it works the same whether the row already exists
 * (a prior toggle, or a reminder sweep that inserted a placeholder) or not
 * (first time anyone's touched this item, including games imported before
 * this feature existed).
 */
export async function setPrepItemDone(
  supabase: SupabaseClient,
  gameDate: string,
  opponent: string,
  itemKey: GamePrepItemKey,
  done: boolean,
  profileId: string,
): Promise<void> {
  const { error } = await supabase.from("game_prep_items").upsert(
    {
      game_date: gameDate,
      opponent,
      item_key: itemKey,
      done,
      done_by: done ? profileId : null,
      done_at: done ? new Date().toISOString() : null,
    },
    { onConflict: "game_date,opponent,item_key" },
  );
  if (error) throw error;
}

export async function addGameScout(
  supabase: SupabaseClient,
  gameDate: string,
  opponent: string,
  profileId: string,
  assignedBy: string,
): Promise<void> {
  const { error } = await supabase
    .from("game_scouts")
    .insert({ game_date: gameDate, opponent, profile_id: profileId, assigned_by: assignedBy });
  if (error) throw error;
}

export async function removeGameScout(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("game_scouts").delete().eq("id", id);
  if (error) throw error;
}
