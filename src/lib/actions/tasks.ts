"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data/profiles";
import { createTask, setTaskCompletion } from "@/lib/data/tasks";
import type { TaskBucket } from "@/lib/types";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function toggleTaskAction(taskId: string, done: boolean): Promise<void> {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) throw new Error("Not signed in");

  await setTaskCompletion(supabase, taskId, profile.id, today(), done);
  revalidatePath("/today");
  revalidatePath("/tasks");
}

export async function addTaskAction(bucket: TaskBucket, title: string): Promise<void> {
  const trimmed = title.trim();
  if (!trimmed) return;

  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) throw new Error("Not signed in");

  await createTask(supabase, {
    bucket,
    title: trimmed,
    owner_id: bucket === "personal" ? profile.id : null,
  });
  revalidatePath("/tasks");
}
