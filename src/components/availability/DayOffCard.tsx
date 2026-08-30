"use client";

import { useState, useTransition } from "react";
import { addAllDayBlockAction } from "@/lib/actions/availability";
import { DAYS } from "@/lib/domain/time";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import type { DayOfWeek } from "@/lib/types";

export function DayOffCard({ profileId }: { profileId: string }) {
  const [day, setDay] = useState<DayOfWeek>("Sat");
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();
  const { show } = useToast();

  const submit = () => {
    startTransition(async () => {
      await addAllDayBlockAction({ profileId, day, label: reason.trim() || "Day off" });
      setReason("");
      show(`Blocked ${day} — coaches see the conflict before assigning you.`);
    });
  };

  return (
    <Card blueprint className="flex flex-col gap-2.5 p-3.5">
      <span className="font-(family-name:--font-heading) text-[11px] font-medium uppercase tracking-[0.1em] text-(--color-accent-700)">
        Something came up
      </span>
      <p className="text-[13px] text-(--color-text-62)">Block a whole day you cannot work this week.</p>
      <div className="grid grid-cols-7 gap-1">
        {DAYS.map((d) => (
          <button
            key={d}
            onClick={() => setDay(d as DayOfWeek)}
            className={cn(
              "border border-(--color-divider) py-2 text-[11px] uppercase",
              day === d && "bg-(--color-accent-800) text-white",
            )}
          >
            {d}
          </button>
        ))}
      </div>
      <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason — e.g. exam, travel home" />
      <Button disabled={pending} onClick={submit}>
        Block day
      </Button>
    </Card>
  );
}
