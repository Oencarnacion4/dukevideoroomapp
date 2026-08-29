"use client";

import { useTransition } from "react";
import { Check } from "lucide-react";
import { toggleTaskAction } from "@/lib/actions/tasks";
import { Tag } from "@/components/ui/Tag";
import { tagVariant } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface TaskRowProps {
  id: string;
  title: string;
  done: boolean;
  meta?: string;
  tag?: string | null;
  size?: "sm" | "lg";
}

export function TaskRow({ id, title, done, meta, tag, size = "sm" }: TaskRowProps) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => toggleTaskAction(id, !done))}
      className="flex w-full items-start gap-2.5 border-b border-[color-mix(in_srgb,var(--color-text)_8%,transparent)] py-2.75 text-left last:border-b-0"
    >
      <span
        className={cn(
          "mt-0.5 flex shrink-0 items-center justify-center border",
          size === "lg" ? "h-5 w-5" : "h-[19px] w-[19px]",
          done ? "border-(--color-accent-600) bg-(--color-accent)" : "border-(--color-accent-600)",
        )}
      >
        {done && <Check size={13} strokeWidth={2.5} className="text-white" />}
      </span>
      <span className="flex-1">
        <span
          className={cn(
            "block text-[14px]",
            done ? "text-(--color-text)/42 line-through" : "text-(--color-text)",
          )}
        >
          {title}
        </span>
        {meta && <span className="mt-0.5 block text-[11px] text-(--color-text-50)">{meta}</span>}
      </span>
      {tag && <Tag variant={tagVariant(tag)}>{tag}</Tag>}
    </button>
  );
}
