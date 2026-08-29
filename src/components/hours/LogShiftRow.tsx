"use client";

import { useTransition } from "react";
import { logManualHoursAction, toggleClockAction } from "@/lib/actions/hours";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { fmtHours } from "@/lib/domain/hours";

interface LogShiftRowProps {
  date: string;
  sessionLabel: string;
  startLabel: string;
  hours: number | null;
}

export function LogShiftRow({ date, sessionLabel, startLabel, hours }: LogShiftRowProps) {
  const [pending, startTransition] = useTransition();
  const { show } = useToast();

  const onLog = () =>
    startTransition(async () => {
      if (hours !== null) {
        await logManualHoursAction({ date, sessionLabel, hours });
        show(`Logged ${fmtHours(hours)} for ${sessionLabel}.`);
      } else {
        await toggleClockAction(sessionLabel);
        show("Clocked in. Timer runs until you clock out.");
      }
    });

  return (
    <div className="flex items-center justify-between border border-(--color-divider) p-2.75">
      <div>
        <p className="text-[13.5px]">{sessionLabel}</p>
        <p className="text-[11px] text-(--color-text-50)">
          {hours === null ? `${startLabel} · no set end time` : startLabel}
        </p>
      </div>
      <Button variant="secondary" disabled={pending} onClick={onLog} className="h-9 px-3 text-[13px]">
        {hours === null ? "Use the clock" : `Log ${fmtHours(hours)}`}
      </Button>
    </div>
  );
}
