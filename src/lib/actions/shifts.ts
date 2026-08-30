"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data/profiles";
import { createShift, createSwapRequest, deleteShift, respondToShift, setShiftNote } from "@/lib/data/shifts";
import { notify } from "@/lib/data/notifications";
import { labelToPgTime } from "@/lib/domain/time";
import type { DayOfWeek, SessionType } from "@/lib/types";

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

export async function assignShiftAction(
  shiftId: string,
  assigneeId: string,
  title: string,
  body: string,
): Promise<void> {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile || (profile.role !== "lead" && profile.role !== "staff")) throw new Error("Not allowed");
  await respondToShift(supabase, shiftId, { status: "pending", assignee_id: assigneeId });
  await notify(supabase, assigneeId, title, body);
  revalidateSchedule();
}

export async function addCoverAction(input: {
  day: DayOfWeek;
  date: string;
  startLabel: string;
  endLabel: string | null;
  session: SessionType;
  cameraRole: string | null;
  location: string;
  note: string | null;
  assigneeId: string;
}): Promise<void> {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile || (profile.role !== "lead" && profile.role !== "staff")) throw new Error("Not allowed");

  await createShift(supabase, {
    day_of_week: input.day,
    date: input.date,
    start_time: labelToPgTime(input.startLabel),
    end_time: input.endLabel ? labelToPgTime(input.endLabel) : null,
    session_type: input.session,
    camera_role: input.cameraRole,
    location: input.location,
    assignee_id: input.assigneeId,
    note: input.note,
    created_by: profile.id,
  });

  await notify(
    supabase,
    input.assigneeId,
    `New shift: ${input.session}`,
    `${input.day} ${input.startLabel} · ${input.location}`,
  );
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
