import type { SupabaseClient } from "@supabase/supabase-js";
import type { Task, TaskBucket } from "@/lib/types";

export interface TaskWithCompletion extends Task {
  done: boolean;
}

/** All tasks visible to `profileId`, with today's completion state for that person. */
export async function listTasksWithCompletion(
  supabase: SupabaseClient,
  profileId: string,
  today: string,
): Promise<TaskWithCompletion[]> {
  const [{ data: tasks, error: tasksError }, { data: completions, error: compError }] = await Promise.all([
    supabase.from("tasks").select("*").order("created_at"),
    supabase
      .from("task_completions")
      .select("task_id")
      .eq("profile_id", profileId)
      .eq("completed_on", today),
  ]);
  if (tasksError) throw tasksError;
  if (compError) throw compError;

  const doneIds = new Set((completions ?? []).map((c) => c.task_id));
  return (tasks ?? []).map((t) => ({ ...t, done: doneIds.has(t.id) }));
}

export async function setTaskCompletion(
  supabase: SupabaseClient,
  taskId: string,
  profileId: string,
  today: string,
  done: boolean,
): Promise<void> {
  if (done) {
    const { error } = await supabase
      .from("task_completions")
      .insert({ task_id: taskId, profile_id: profileId, completed_on: today });
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("task_completions")
      .delete()
      .eq("task_id", taskId)
      .eq("profile_id", profileId)
      .eq("completed_on", today);
    if (error) throw error;
  }
}

export async function createTask(
  supabase: SupabaseClient,
  input: { bucket: TaskBucket; title: string; owner_id: string | null },
): Promise<void> {
  const { error } = await supabase.from("tasks").insert(input);
  if (error) throw error;
}
