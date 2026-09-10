"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data/profiles";
import { deleteTimeEntry, logTimeEntry, reviewTimeEntry, updateTimeEntry } from "@/lib/data/time-entries";
import { roundClockedHours } from "@/lib/domain/hours";
import { isNearVideoRoom } from "@/lib/domain/geo";
import type { Profile } from "@/lib/types";

export interface GeoPoint {
  lat: number;
  lng: number;
  accuracy?: number;
}

const VIDEO_ROOM_LABEL = "Video room";

async function clockOutAndLog(
  supabase: Awaited<ReturnType<typeof createClient>>,
  profile: Profile,
  source: "clocked" | "tap",
  locationVerified?: boolean,
): Promise<number | null> {
  const rawHours = (Date.now() - new Date(profile.clock_in_at!).getTime()) / 3_600_000;
  const hours = roundClockedHours(rawHours);
  if (hours > 0) {
    await logTimeEntry(supabase, {
      profile_id: profile.id,
      date: new Date().toISOString().slice(0, 10),
      session_label: profile.clock_label ?? (source === "tap" ? VIDEO_ROOM_LABEL : "Working remotely"),
      hours,
      source,
      ...(locationVerified !== undefined ? { location_verified: locationVerified } : {}),
    });
  }
  const { error } = await supabase
    .from("profiles")
    .update({ clock_in_at: null, clock_label: null, clock_source: null, clock_location_verified: null })
    .eq("id", profile.id);
  if (error) throw error;
  return hours > 0 ? hours : null;
}

/** The in-app Clock In button — for hours worked off-site (self-reported, so it lands pending for approval). */
export async function toggleClockAction(defaultLabel: string): Promise<{ loggedHours: number | null; error?: string }> {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile || profile.role === "staff") throw new Error("Not allowed");

  if (profile.clock_in_at) {
    if (profile.clock_source === "tap") {
      return { loggedHours: null, error: "You're tapped in at the Video Room — tap the QR code again to clock out." };
    }
    const loggedHours = await clockOutAndLog(supabase, profile, "clocked");
    revalidatePath("/today");
    revalidatePath("/hours");
    return { loggedHours };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ clock_in_at: new Date().toISOString(), clock_label: defaultLabel, clock_source: "clocked" })
    .eq("id", profile.id);
  if (error) throw error;

  revalidatePath("/today");
  revalidatePath("/hours");
  return { loggedHours: null };
}

/**
 * The QR tap station at the Video Room. GPS confirms presence when it's
 * available, but it isn't required — once a phone denies location there's
 * no way to re-prompt it short of digging through Settings, which isn't
 * reasonable to expect from the whole crew. So: a real GPS reading that
 * clearly places someone elsewhere still blocks *tapping in* (that's a
 * strong signal at the moment that matters), but no reading at all (denied,
 * or just unavailable indoors) lets it through — just marked unverified.
 *
 * Tapping OUT never checks location at all: someone who forgot to tap out
 * and has already left needs to be able to close their session out from
 * wherever they are, not get stuck with a runaway timer until they walk
 * back. The entry's location_verified reflects the tap-IN's result instead.
 */
export async function tapClockAction(
  location: GeoPoint | null,
): Promise<{ clockedIn: boolean; loggedHours: number | null; error?: string }> {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile || profile.role === "staff") throw new Error("Not allowed");

  if (profile.clock_in_at) {
    if (profile.clock_source !== "tap") {
      return {
        clockedIn: true,
        loggedHours: null,
        error: "You're already clocked in from the app — clock out there first, then tap in here.",
      };
    }
    const loggedHours = await clockOutAndLog(supabase, profile, "tap", profile.clock_location_verified ?? false);
    revalidatePath("/today");
    revalidatePath("/hours");
    return { clockedIn: false, loggedHours };
  }

  if (location && !isNearVideoRoom(location, location.accuracy)) {
    return {
      clockedIn: false,
      loggedHours: null,
      error: "That doesn't look like the Video Room — tap in once you're actually there.",
    };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      clock_in_at: new Date().toISOString(),
      clock_label: VIDEO_ROOM_LABEL,
      clock_source: "tap",
      clock_location_verified: !!location,
    })
    .eq("id", profile.id);
  if (error) throw error;

  revalidatePath("/today");
  revalidatePath("/hours");
  return { clockedIn: true, loggedHours: null };
}

export async function logManualHoursAction(input: {
  date: string;
  sessionLabel: string;
  hours: number;
}): Promise<{ error?: string }> {
  if (!input.date) return { error: "Pick a date." };
  if (!input.sessionLabel.trim()) return { error: "Give it a label." };
  if (!(input.hours > 0)) return { error: "Hours has to be more than zero." };

  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile || profile.role === "staff") return { error: "Not allowed." };

  await logTimeEntry(supabase, {
    profile_id: profile.id,
    date: input.date,
    session_label: input.sessionLabel.trim(),
    hours: input.hours,
    source: "manual",
  });

  revalidatePath("/hours");
  return {};
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

/** Lead/staff sign-off on a self-reported entry — the last step before it counts toward the weekly total. */
export async function reviewTimeEntryAction(id: string, decision: "approved" | "rejected"): Promise<{ error?: string }> {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile || (profile.role !== "lead" && profile.role !== "staff")) return { error: "Not allowed." };

  await reviewTimeEntry(supabase, id, profile.id, decision);
  revalidatePath("/hours");
  return {};
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
    .update({ clock_in_at: null, clock_label: null, clock_source: null, clock_location_verified: null })
    .eq("id", profile.id);
  if (error) throw error;

  revalidatePath("/today");
  revalidatePath("/hours");
}
