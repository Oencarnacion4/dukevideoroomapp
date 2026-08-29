"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { addAvailabilityBlocks, removeAvailabilityBlock } from "@/lib/data/availability";
import { labelToPgTime } from "@/lib/domain/time";
import type { DayOfWeek } from "@/lib/types";

function revalidateAll(profileId: string) {
  revalidatePath(`/crew/${profileId}/classes`);
  revalidatePath("/classes");
  revalidatePath("/schedule");
  revalidatePath("/crew");
}

export async function addClassBlockAction(input: {
  profileId: string;
  days: DayOfWeek[];
  start: string;
  end: string;
  label: string;
}): Promise<{ error?: string }> {
  if (input.days.length === 0) return { error: "Pick at least one day." };
  const startMin = labelToPgTime(input.start);
  const endMin = labelToPgTime(input.end);
  if (endMin <= startMin) return { error: "End time has to be after the start." };

  const supabase = await createClient();
  await addAvailabilityBlocks(supabase, input.profileId, input.days, startMin, endMin, false, input.label);
  revalidateAll(input.profileId);
  return {};
}

export async function addAllDayBlockAction(input: {
  profileId: string;
  day: DayOfWeek;
  label: string;
}): Promise<void> {
  const supabase = await createClient();
  await addAvailabilityBlocks(supabase, input.profileId, [input.day], null, null, true, input.label || "Day off");
  revalidateAll(input.profileId);
}

export async function removeClassBlockAction(id: string, profileId: string): Promise<void> {
  const supabase = await createClient();
  await removeAvailabilityBlock(supabase, id);
  revalidateAll(profileId);
}
