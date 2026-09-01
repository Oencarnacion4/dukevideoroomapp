import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data/profiles";
import { resolveWeekParam } from "@/lib/domain/time";
import { ProposeShiftForm } from "@/components/schedule/ProposeShiftForm";

export default async function ProposeShiftPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile || profile.role === "staff") redirect("/today");

  const { week } = await searchParams;
  const weekStart = resolveWeekParam(week);

  return <ProposeShiftForm weekStart={weekStart} />;
}
