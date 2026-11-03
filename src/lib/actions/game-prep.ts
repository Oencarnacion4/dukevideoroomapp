"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data/profiles";
import { addGameScout, removeGameScout, setPrepItemDone } from "@/lib/data/game-prep";
import { notify } from "@/lib/data/notifications";
import type { GamePrepItemKey } from "@/lib/domain/game-prep";

function revalidateGamePrep() {
  revalidatePath("/game-prep");
}

/** Migration 0017 may not have run yet on this Supabase project — surface that as a normal error, not a crash. */
function friendlyError(error: unknown): string {
  const raw = error as { code?: string; message?: string } | Error;
  const message = raw instanceof Error ? raw.message : (raw?.message ?? String(error));
  const code = raw instanceof Error ? undefined : raw?.code;
  if (code === "PGRST205" || code === "42P01" || message.includes("schema cache")) {
    return "Game prep isn't set up on this Supabase project yet — the migration needs to be run first.";
  }
  return message;
}

export async function assignScoutAction(
  gameDate: string,
  opponent: string,
  profileId: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile || (profile.role !== "lead" && profile.role !== "staff")) return { error: "Not allowed." };

  try {
    await addGameScout(supabase, gameDate, opponent, profileId, profile.id);
    await notify(
      supabase,
      profileId,
      `You're scouting ${opponent}`,
      `Checklist and deadlines are on the Game Prep tab.`,
    );
  } catch (error) {
    return { error: friendlyError(error) };
  }

  revalidateGamePrep();
  return {};
}

export async function removeScoutAction(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile || (profile.role !== "lead" && profile.role !== "staff")) return { error: "Not allowed." };

  try {
    await removeGameScout(supabase, id);
  } catch (error) {
    return { error: friendlyError(error) };
  }

  revalidateGamePrep();
  return {};
}

/** The assigned scout(s) for that game, or an admin, can check an item — enforced by RLS either way. */
export async function togglePrepItemAction(
  gameDate: string,
  opponent: string,
  itemKey: GamePrepItemKey,
  done: boolean,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) return { error: "Not signed in." };

  try {
    await setPrepItemDone(supabase, gameDate, opponent, itemKey, done, profile.id);
  } catch (error) {
    return { error: friendlyError(error) };
  }

  revalidateGamePrep();
  return {};
}
