"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data/profiles";
import { createShift } from "@/lib/data/shifts";
import { notify } from "@/lib/data/notifications";
import { labelToPgTime } from "@/lib/domain/time";
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
  assigneeId: string | null;
  note: string;
}): Promise<void> {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile || (profile.role !== "lead" && profile.role !== "staff")) throw new Error("Not allowed");

  await createShift(supabase, {
    day_of_week: input.day,
    date: input.date,
    start_time: labelToPgTime(input.start),
    end_time: input.end ? labelToPgTime(input.end) : null,
    session_type: input.session,
    camera_role: input.cameraRole,
    location: input.location,
    assignee_id: input.assigneeId,
    note: input.note.trim() || null,
    created_by: profile.id,
  });

  if (input.assigneeId) {
    await notify(
      supabase,
      input.assigneeId,
      `New shift: ${input.session}`,
      `${input.day} ${input.start} · ${input.location}`,
    );
  }

  revalidatePath("/schedule");
  revalidatePath("/today");
  redirect(`/schedule?week=${input.weekStart}`);
}
