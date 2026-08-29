"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data/profiles";
import { logTimeEntry } from "@/lib/data/time-entries";
import { roundClockedHours } from "@/lib/domain/hours";

export async function toggleClockAction(defaultLabel: string): Promise<void> {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile || profile.role === "staff") throw new Error("Not allowed");

  if (profile.clock_in_at) {
    const rawHours = (Date.now() - new Date(profile.clock_in_at).getTime()) / 3_600_000;
    const hours = roundClockedHours(rawHours);
    await logTimeEntry(supabase, {
      profile_id: profile.id,
      date: new Date().toISOString().slice(0, 10),
      session_label: profile.clock_label ?? defaultLabel,
      hours,
      source: "clocked",
    });
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
