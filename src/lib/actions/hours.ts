"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data/profiles";
import { deleteTimeEntry, logTimeEntry, updateTimeEntry } from "@/lib/data/time-entries";
import { roundClockedHours } from "@/lib/domain/hours";

export async function toggleClockAction(defaultLabel: string): Promise<{ loggedHours: number | null }> {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile || profile.role === "staff") throw new Error("Not allowed");

  let loggedHours: number | null = null;

  if (profile.clock_in_at) {
    const rawHours = (Date.now() - new Date(profile.clock_in_at).getTime()) / 3_600_000;
    const hours = roundClockedHours(rawHours);
    if (hours > 0) {
      await logTimeEntry(supabase, {
        profile_id: profile.id,
        date: new Date().toISOString().slice(0, 10),
        session_label: profile.clock_label ?? defaultLabel,
        hours,
        source: "clocked",
      });
      loggedHours = hours;
    }
    const { error } = await supabase
      .from("profiles")
      .update({ clock_in_at: null, clock_label: null })
      .eq("id", profile.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("profiles")
      .update({ clock_in_at: new Date().toISOString(), clock_label: defaultLabel })
      .eq("id", profile.id);
    if (error) throw error;
  }

  revalidatePath("/today");
  revalidatePath("/hours");
  return { loggedHours };
}

export async function logManualHoursAction(input: {
  date: string;
  sessionLabel: string;
  hours: number;
}): Promise<void> {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile || profile.role === "staff") throw new Error("Not allowed");

  await logTimeEntry(supabase, {
    profile_id: profile.id,
    date: input.date,
    session_label: input.sessionLabel,
    hours: input.hours,
    source: "manual",
  });

  revalidatePath("/hours");
}

export async function updateTimeEntryAction(input: {
  id: string;
  date: string;
  sessionLabel: string;
  hours: number;
}): Promise<{ error?: string }> {
  if (!input.sessionLabel.trim()) return { error: "Give it a label." };
  if (!(input.hours > 0)) return { error: "Hours has to be more than zero." };

  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile || profile.role === "staff") return { error: "Not allowed." };

  await updateTimeEntry(supabase, input.id, {
    date: input.date,
    session_label: input.sessionLabel.trim(),
    hours: input.hours,
  });
  revalidatePath("/hours");
  return {};
}

export async function deleteTimeEntryAction(id: string): Promise<void> {
  const supabase = await createClient();
  await deleteTimeEntry(supabase, id);
  revalidatePath("/hours");
}

/** Backdates the current clock-in to "N minutes ago" — for when you forgot to clock in on time. */
export async function editClockInAction(minutesAgo: number): Promise<{ error?: string }> {
  if (!Number.isFinite(minutesAgo) || minutesAgo < 1 || minutesAgo > 240) {
    return { error: "Pick somewhere between 1 minute and 4 hours ago." };
  }

  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile || profile.role === "staff") return { error: "Not allowed." };
  if (!profile.clock_in_at) return { error: "You're not clocked in right now." };

  const newClockInAt = new Date(Date.now() - minutesAgo * 60_000).toISOString();
  const { error } = await supabase
    .from("profiles")
    .update({ clock_in_at: newClockInAt })
    .eq("id", profile.id);
  if (error) throw error;

  revalidatePath("/today");
  revalidatePath("/hours");
  return {};
}

/** Bails out of a forgotten/mistaken clock-in without logging any hours for it. */
export async function cancelClockAction(): Promise<void> {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile || profile.role === "staff") throw new Error("Not allowed");

  const { error } = await supabase
    .from("profiles")
    .update({ clock_in_at: null, clock_label: null })
    .eq("id", profile.id);
  if (error) throw error;

  revalidatePath("/today");
  revalidatePath("/hours");
}
