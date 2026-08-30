import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data/profiles";
import { listAvailabilityFor } from "@/lib/data/availability";
import { getAppSettings } from "@/lib/data/settings";
import { OverlayHeader } from "@/components/chrome/OverlayHeader";
import { AvailabilityEditor } from "@/components/availability/AvailabilityEditor";
import { DayOffCard } from "@/components/availability/DayOffCard";

export default async function ClassesEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) redirect("/sign-in");

  const isSelf = id === profile.id;
  const isAdmin = profile.role === "lead" || profile.role === "staff";
  if (!isSelf && !isAdmin) redirect("/today");

  const [target, blocks, settings] = await Promise.all([
    isSelf ? profile : supabase.from("profiles").select("*").eq("id", id).maybeSingle().then((r) => r.data),
    listAvailabilityFor(supabase, id),
    getAppSettings(supabase),
  ]);
  if (!target) notFound();

  const canEdit = isSelf || settings.staff_can_edit_classes;

  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-(--color-bg)">
      <OverlayHeader eyebrow="Class times · not available" title={isSelf ? "My class schedule" : `${target.full_name}'s classes`} />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <p className="text-[13px] text-(--color-text-62)">
          {isSelf
            ? "Add every class and anything else you cannot miss. Staff see the conflict before they assign you, not after."
            : `You are entering these for ${target.full_name}. Pick every day the class meets, then Block.`}
        </p>
        <AvailabilityEditor profileId={id} blocks={blocks} canEdit={canEdit} />
        {canEdit && <DayOffCard profileId={id} />}
      </div>
    </div>
  );
}
