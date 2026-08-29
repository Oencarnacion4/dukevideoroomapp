"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TASK_BUCKETS } from "@/lib/constants";
import { addTaskAction } from "@/lib/actions/tasks";
import { TaskRow } from "@/components/tasks/TaskRow";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import type { TaskBucket } from "@/lib/types";
import type { TaskWithCompletion } from "@/lib/data/tasks";

export function TasksView({
  tasks,
  initialBucket = "assigned",
}: {
  tasks: TaskWithCompletion[];
  initialBucket?: TaskBucket;
}) {
  const [bucket, setBucket] = useState<TaskBucket>(initialBucket);
  const [draft, setDraft] = useState("");
  const [pending, startTransition] = useTransition();
  const { show } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("toast") === "practice-closed") {
      show("Practice closed. Post-practice list is up next.");
      router.replace("/tasks?bucket=post");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const inBucket = tasks.filter((t) => t.bucket === bucket);
  const bucketLabel = TASK_BUCKETS.find((b) => b.id === bucket)?.label ?? "";

  const submit = () => {
    const value = draft.trim();
    if (!value) return;
    setDraft("");
    startTransition(() => addTaskAction(bucket, value));
  };

  return (
    <div className="flex flex-1 flex-col gap-3 p-4 pb-6">
      <h4 className="font-(family-name:--font-heading) text-[21px] font-semibold">Task board</h4>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {TASK_BUCKETS.map((b) => {
          const count = tasks.filter((t) => t.bucket === b.id && !t.done).length;
          const active = b.id === bucket;
          return (
            <button
              key={b.id}
              onClick={() => setBucket(b.id)}
              className={cn(
                "shrink-0 border px-3 py-1.5 text-[13px] whitespace-nowrap",
                active
                  ? "border-(--color-accent-800) bg-(--color-accent-800) text-white"
                  : "border-(--color-divider) text-(--color-text)",
              )}
            >
              {b.label} · {count}
            </button>
          );
        })}
      </div>

      <p
        className={cn(
          "text-[12px]",
          bucket === "personal" ? "text-(--color-accent-700)" : "text-(--color-text)/50",
        )}
      >
        {bucket === "personal"
          ? "Private — only you see this list."
          : "Shared with the whole crew — anyone can add one or check one off."}
      </p>

      <div className="flex flex-col">
        {inBucket.map((t) => (
          <TaskRow
            key={t.id}
            id={t.id}
            title={t.title}
            done={t.done}
            meta={[t.assigned_by, t.due_label].filter(Boolean).join(" · ")}
            tag={t.tag}
          />
        ))}
        {inBucket.length === 0 && <p className="py-4 text-[13px] text-(--color-text-50)">Nothing here yet.</p>}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="mt-auto flex gap-2 pt-2"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={`Add to ${bucketLabel}…`}
          className="h-11 flex-1 border border-(--color-divider) bg-transparent px-3 text-[14px] placeholder:text-(--color-text-50)"
        />
        <button
          type="submit"
          disabled={pending}
          className="h-11 border border-(--color-accent-800) bg-(--color-accent-800) px-4 text-[15px] font-medium text-white disabled:opacity-50"
        >
          Add
        </button>
      </form>
    </div>
  );
}
