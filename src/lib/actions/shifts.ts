"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data/profiles";
import { createSwapRequest, deleteShift, respondToShift, setShiftNote } from "@/lib/data/shifts";
import { notify } from "@/lib/data/notifications";

function revalidateSchedule() {
  revalidatePath("/today");
  revalidatePath("/schedule");
}

export async function acceptShiftAction(shiftId: string): Promise<void> {
  const supabase = await createClient();
  await respondToShift(supabase, shiftId, { status: "accepted" });
  revalidateSchedule();
}

export async function declineShiftAction(shiftId: string): Promise<void> {
  const supabase = await createClient();
  await respondToShift(supabase, shiftId, { status: "declined" });
  revalidateSchedule();
}

export async function claimShiftAction(shiftId: string): Promise<void> {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) throw new Error("Not signed in");
  await respondToShift(supabase, shiftId, { status: "accepted", assignee_id: profile.id });
  revalidateSchedule();
}

export async function proposeSwapAction(
  shiftId: string,
  toProfileId: string,
  shiftSummary: string,
): Promise<void> {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) throw new Error("Not signed in");

  await createSwapRequest(supabase, { shift_id: shiftId, from_profile: profile.id, to_profile: toProfileId });
  await notify(
    supabase,
    toProfileId,
    `${profile.full_name} asked you to cover a shift`,
    shiftSummary,
  );
  revalidateSchedule();
}

export async function deleteShiftAction(shiftId: string): Promise<void> {
  const supabase = await createClient();
  await deleteShift(supabase, shiftId);
  revalidateSchedule();
}

export async function saveShiftNoteAction(shiftId: string, note: string): Promise<void> {
  const supabase = await createClient();
  await setShiftNote(supabase, shiftId, note.trim() || null);
  revalidateSchedule();
}
