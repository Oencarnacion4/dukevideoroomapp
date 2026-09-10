import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data/profiles";
import { TapConfirm } from "@/components/hours/TapConfirm";

/**
 * The QR code posted in the Video Room points here. It's the one clock
 * source that's physically verified, so unlike the in-app Clock In button
 * it doesn't need lead/staff approval — see reviewTimeEntryAction.
 */
export default async function TapPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) redirect("/sign-in?next=/tap");
  if (profile.role === "staff") redirect("/today");

  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-(--color-accent-900) text-white">
      <div className="px-6 pt-14 pb-2 text-center">
        <p className="font-(family-name:--font-heading) text-[11px] font-medium tracking-[0.2em] text-(--color-accent-300) uppercase">
          Video room
        </p>
        <h1 className="font-(family-name:--font-heading) text-[28px] font-semibold">{profile.full_name.split(" ")[0]}</h1>
      </div>
      <TapConfirm clockInAt={profile.clock_in_at} clockLabel={profile.clock_label} clockSource={profile.clock_source} />
    </div>
  );
}
