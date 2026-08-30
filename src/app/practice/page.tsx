"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check } from "lucide-react";
import { PRACTICE_STEPS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export default function PracticePage() {
  const router = useRouter();
  const [done, setDone] = useState<Record<string, boolean>>({});

  const doneCount = PRACTICE_STEPS.filter((s) => done[s.id]).length;
  const pct = Math.round((doneCount / PRACTICE_STEPS.length) * 100);

  const toggle = (id: string) => setDone((d) => ({ ...d, [id]: !d[id] }));

  const end = () => {
    router.push("/tasks?bucket=post&toast=practice-closed");
  };

  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-(--color-accent-900) text-white">
      <div className="px-4 pt-14 pb-4">
        <p className="font-(family-name:--font-heading) text-[11px] font-medium tracking-[0.2em] text-(--color-accent-300) uppercase">
          During practice
        </p>
        <div className="flex items-baseline justify-between">
          <h1 className="font-(family-name:--font-heading) text-[24px] font-semibold">Full practice</h1>
          <span className="font-(family-name:--font-heading) text-[14px] text-(--color-accent-300)">
            {doneCount}/{PRACTICE_STEPS.length}
          </span>
        </div>
        <div className="mt-2 h-[3px] bg-white/15">
          <div className="h-full bg-white transition-[width]" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4">
        {PRACTICE_STEPS.map((step) => {
          const checked = !!done[step.id];
          return (
            <button
              key={step.id}
              onClick={() => toggle(step.id)}
              className="flex w-full items-start gap-3 border-b border-white/14 py-3.5 text-left"
            >
              <span
                className={cn(
                  "mt-0.5 flex h-[22px] w-[22px] shrink-0 items-center justify-center border border-white/50",
                  checked && "bg-white",
                )}
              >
                {checked && <Check size={14} strokeWidth={3} className="text-(--color-accent-900)" />}
              </span>
              <span>
                <span className={cn("block text-[15px]", checked && "line-through opacity-50")}>
                  {step.title}
                </span>
                <span className="mt-0.5 block text-[11.5px] text-(--color-accent-300)">{step.hint}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex gap-2 p-4">
        <button
          onClick={end}
          className="h-11 flex-1 bg-white text-[15px] font-medium text-(--color-accent-900)"
        >
          End practice
        </button>
        <button
          onClick={() => router.push("/today")}
          className="h-11 flex-1 border border-white/40 text-[15px] font-medium text-white"
        >
          Minimize
        </button>
      </div>
    </div>
  );
}
