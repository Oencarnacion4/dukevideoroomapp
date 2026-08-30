import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data/profiles";
import { getAllProfiles } from "@/lib/data/profiles";
import { listShifts } from "@/lib/data/shifts";
import { listAllAvailability } from "@/lib/data/availability";
import { getAppSettings } from "@/lib/data/settings";
import { resolveWeekParam } from "@/lib/domain/time";
import { toAvailabilityBlock } from "@/lib/domain/conflicts";
import { ScheduleView } from "@/components/schedule/ScheduleView";

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) redirect("/sign-in");

  const { week } = await searchParams;
  const weekStart = resolveWeekParam(week);

  const [shifts, crew, settings, availability] = await Promise.all([
    listShifts(supabase, weekStart),
    getAllProfiles(supabase),
    getAppSettings(supabase),
    listAllAvailability(supabase),
  ]);

  return (
    <ScheduleView
      weekStart={weekStart}
      shifts={shifts}
      profile={profile}
      crew={crew}
      availability={availability.map(toAvailabilityBlock)}
      requireSwapOnDecline={settings.require_swap_on_decline}
    />
  );
}
