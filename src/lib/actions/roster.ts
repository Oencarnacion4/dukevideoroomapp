"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addRosterNameAction(fullName: string): Promise<void> {
  const trimmed = fullName.trim();
  if (!trimmed) return;

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").insert({ full_name: trimmed, role: "intern" });
  if (error) throw error;

  revalidatePath("/crew");
}
