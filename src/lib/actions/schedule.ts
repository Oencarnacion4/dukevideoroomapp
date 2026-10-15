"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data/profiles";
import { createShift, createGameShifts } from "@/lib/data/shifts";
import { notify } from "@/lib/data/notifications";
import { labelToPgTime, dayOfWeekFor } from "@/lib/domain/time";
import { GAME_ROLES, type ParsedGame } from "@/lib/domain/games";
import type { DayOfWeek, SessionType } from "@/lib/types";

export async function postShiftAction(input: {
  day: DayOfWeek;
  date: string;
  weekStart: string;
  start: string;
  end: string | null;
  session: SessionType;
  cameraRole: string | null;
  location: string;
  assigneeIds: string[];
  alsoOpen: boolean;
  openSignup: boolean;
  note: string;
}): Promise<void> {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile || (profile.role !== "lead" && profile.role !== "staff")) throw new Error("Not allowed");

  const note = input.note.trim() || null;
  const slots: (string | null)[] = [...input.assigneeIds];
  if (input.alsoOpen || slots.length === 0) slots.push(null);

  for (const assigneeId of slots) {
    await createShift(supabase, {
      day_of_week: input.day,
      date: input.date,
      start_time: labelToPgTime(input.start),
      end_time: input.end ? labelToPgTime(input.end) : null,
      session_type: input.session,
      camera_role: input.cameraRole,
      location: input.location,
      assignee_id: assigneeId,
      note,
      created_by: profile.id,
      open_signup: assigneeId === null && input.openSignup,
    });

    if (assigneeId) {
      await notify(
        supabase,
        assigneeId,
        `New shift: ${input.session}`,
        `${input.day} ${input.start} · ${input.location}`,
      );
    }
  }

  revalidatePath("/schedule");
  revalidatePath("/today");
  redirect(`/schedule?week=${input.weekStart}`);
}

/** Bulk-creates a season's worth of game shifts (3 role slots per game) from the import preview — admin-only. */
export async function importGamesAction(games: ParsedGame[]): Promise<{ error?: string; created?: number }> {
  if (games.length === 0) return { error: "Nothing to import." };

  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile || (profile.role !== "lead" && profile.role !== "staff")) return { error: "Not allowed." };

  await createGameShifts(
    supabase,
    games.map((g) => ({
      day_of_week: dayOfWeekFor(g.date),
      date: g.date,
      start_time: labelToPgTime(g.startLabel),
      opponent: g.opponent,
      home_away: g.homeAway,
      location: g.venue,
      roles: GAME_ROLES,
    })),
    profile.id,
  );

  revalidatePath("/schedule");
  revalidatePath("/today");
  return { created: games.length };
}
