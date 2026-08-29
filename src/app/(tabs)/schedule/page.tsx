import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data/profiles";
import { getAllProfiles } from "@/lib/data/profiles";
import { listShifts } from "@/lib/data/shifts";
import { getAppSettings } from "@/lib/data/settings";
import { getWeekStart } from "@/lib/domain/time";
import { ScheduleView } from "@/components/schedule/ScheduleView";

export default async function SchedulePage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) redirect("/sign-in");

  const weekStart = getWeekStart();
  const [shifts, crew, settings] = await Promise.all([
    listShifts(supabase, weekStart),
    getAllProfiles(supabase),
    getAppSettings(supabase),
  ]);

  return (
    <ScheduleView
      weekStart={weekStart}
      shifts={shifts}
      profile={profile}
      crew={crew}
      requireSwapOnDecline={settings.require_swap_on_decline}
    />
  );
}
