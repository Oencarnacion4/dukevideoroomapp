"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data/profiles";
import { createShift, createSwapRequest, deleteShift, proposeShift, respondToShift, setShiftNote } from "@/lib/data/shifts";
import { getAllProfiles } from "@/lib/data/profiles";
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

/** Deletes every shift row in a group at once — e.g. when the whole slot was posted at the wrong time. */
export async function deleteShiftGroupAction(shiftIds: string[]): Promise<void> {
  const supabase = await createClient();
  for (const id of shiftIds) {
    await deleteShift(supabase, id);
  }
  revalidateSchedule();
}

export async function saveShiftNoteAction(shiftId: string, note: string): Promise<void> {
  const supabase = await createClient();
  await setShiftNote(supabase, shiftId, note.trim() || null);
  revalidateSchedule();
}

export async function proposeShiftAction(input: {
  day: DayOfWeek;
  date: string;
  weekStart: string;
  startLabel: string;
  endLabel: string | null;
  location: string;
  note: string | null;
}): Promise<void> {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile || profile.role === "staff") throw new Error("Not allowed");

  await proposeShift(supabase, {
    day_of_week: input.day,
    date: input.date,
    start_time: labelToPgTime(input.startLabel),
    end_time: input.endLabel ? labelToPgTime(input.endLabel) : null,
    location: input.location,
    note: input.note,
    profile_id: profile.id,
  });

  const allProfiles = await getAllProfiles(supabase);
  const admins = allProfiles.filter((p) => p.id !== profile.id && (p.role === "lead" || p.role === "staff"));
  for (const admin of admins) {
    await notify(
      supabase,
      admin.id,
      `${profile.full_name} proposed extra time`,
      `${input.day} ${input.startLabel} · ${input.location} — needs your approval`,
    );
  }
  revalidateSchedule();
  redirect(`/schedule?week=${input.weekStart}`);
}

export async function approveProposedShiftAction(shiftId: string, assigneeId: string, shiftSummary: string): Promise<void> {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile || (profile.role !== "lead" && profile.role !== "staff")) throw new Error("Not allowed");

  await respondToShift(supabase, shiftId, { status: "accepted" });
  await notify(supabase, assigneeId, "Extra time approved", shiftSummary);
  revalidateSchedule();
}

export async function declineProposedShiftAction(shiftId: string, assigneeId: string, shiftSummary: string): Promise<void> {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile || (profile.role !== "lead" && profile.role !== "staff")) throw new Error("Not allowed");

  await respondToShift(supabase, shiftId, { status: "declined" });
  await notify(supabase, assigneeId, "Extra time declined", shiftSummary);
  revalidateSchedule();
}

export async function withdrawProposedShiftAction(shiftId: string): Promise<void> {
  const supabase = await createClient();
  await deleteShift(supabase, shiftId);
  revalidateSchedule();
}
