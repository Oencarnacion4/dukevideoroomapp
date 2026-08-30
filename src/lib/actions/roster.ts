"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, removeProfile } from "@/lib/data/profiles";

export async function addRosterNameAction(fullName: string): Promise<void> {
  const trimmed = fullName.trim();
  if (!trimmed) return;

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").insert({ full_name: trimmed, role: "intern" });
  if (error) throw error;

  revalidatePath("/crew");
}

export async function removeCrewAction(profileId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile || (profile.role !== "lead" && profile.role !== "staff")) return { error: "Not allowed." };
  if (profile.id === profileId) return { error: "You can't remove yourself." };

  const result = await removeProfile(supabase, profileId);
  if (result.error) return result;

  revalidatePath("/crew");
  revalidatePath("/schedule");
  revalidatePath("/today");
  return {};
}
