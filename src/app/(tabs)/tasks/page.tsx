import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data/profiles";
import { listTasksWithCompletion } from "@/lib/data/tasks";
import { TasksView } from "@/components/tasks/TasksView";
import type { TaskBucket } from "@/lib/types";

const VALID_BUCKETS: TaskBucket[] = ["assigned", "daily", "practice", "post", "game", "personal"];

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ bucket?: string }>;
}) {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) redirect("/sign-in");

  const { bucket } = await searchParams;
  const initialBucket = VALID_BUCKETS.find((b) => b === bucket);

  const today = new Date().toISOString().slice(0, 10);
  const tasks = await listTasksWithCompletion(supabase, profile.id, today);

  return <TasksView tasks={tasks} initialBucket={initialBucket} />;
}
