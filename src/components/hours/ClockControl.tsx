"use client";

import { useEffect, useState, useTransition } from "react";
import { toggleClockAction } from "@/lib/actions/hours";
import { fmtHours, roundClockedHours } from "@/lib/domain/hours";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

interface ClockControlProps {
  clockInAt: string | null;
  clockLabel: string | null;
  defaultLabel: string;
  variant: "strip" | "timesheet";
}

export function ClockControl({ clockInAt, clockLabel, defaultLabel, variant }: ClockControlProps) {
  const [now, setNow] = useState(() => Date.now());
  const [pending, startTransition] = useTransition();
  const { show } = useToast();

  useEffect(() => {
    if (!clockInAt) return;
    const id = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(id);
  }, [clockInAt]);

  const liveHours = clockInAt ? (now - new Date(clockInAt).getTime()) / 3_600_000 : 0;
  const label = clockLabel ?? defaultLabel;

  const onToggle = () => {
    const wasClockedIn = !!clockInAt;
    startTransition(async () => {
      await toggleClockAction(defaultLabel);
      show(
        wasClockedIn
          ? `Clocked out — ${fmtHours(roundClockedHours(liveHours))} added to this week.`
          : "Clocked in. Timer runs until you clock out.",
      );
    });
  };

  const statusLine = clockInAt ? `On the clock · ${fmtHours(liveHours)} · ${label}` : "Not clocked in";

  if (variant === "strip") {
    return (
      <Button variant="secondary" fullWidth onClick={onToggle} disabled={pending} className="h-11">
        {clockInAt ? `Clock out · ${statusLine}` : `Clock in · ${statusLine}`}
      </Button>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <Button onClick={onToggle} disabled={pending} className="h-[42px] w-full">
        {clockInAt ? "Clock out" : "Clock in"}
      </Button>
      <p className="text-center text-[11.5px] text-(--color-text-62)">{statusLine}</p>
    </div>
  );
}
