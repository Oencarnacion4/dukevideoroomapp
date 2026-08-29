import { createClient } from "@/lib/supabase/server";
import { getUnclaimedRosterNames } from "@/lib/data/profiles";
import { OverlayHeader } from "@/components/chrome/OverlayHeader";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default async function RegisterPage() {
  const supabase = await createClient();
  const unclaimed = await getUnclaimedRosterNames(supabase);

  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-(--color-bg)">
      <OverlayHeader eyebrow="Register" title="Join the video room" />
      <RegisterForm rosterNames={unclaimed.map((p) => p.full_name)} />
    </div>
  );
}
