"use client";

import { useEffect, useState, useTransition } from "react";
import { cancelClockAction, toggleClockAction } from "@/lib/actions/hours";
import { fmtHours, roundClockedHours } from "@/lib/domain/hours";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
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
  const [cancelOpen, setCancelOpen] = useState(false);
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

  const onCancel = () =>
    startTransition(async () => {
      await cancelClockAction();
      setCancelOpen(false);
      show("Clock-in canceled — nothing was logged.");
    });

  const statusLine = clockInAt ? `On the clock · ${fmtHours(liveHours)} · ${label}` : "Not clocked in";

  const cancelDialog = (
    <Dialog open={cancelOpen} onClose={() => setCancelOpen(false)} title="Cancel this clock-in?">
      <p className="mb-4 text-[13px] text-(--color-text-62)">
        You&apos;ve been on the clock for {fmtHours(liveHours)} — if that&apos;s wrong (forgot to clock out
        earlier, clocked in by mistake), this resets it without logging any hours. You can log the correct time
        manually afterward if needed.
      </p>
      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={() => setCancelOpen(false)}>
          Never mind
        </Button>
        <Button className="flex-1" disabled={pending} onClick={onCancel}>
          Cancel clock-in
        </Button>
      </div>
    </Dialog>
  );

  if (variant === "strip") {
    return (
      <div className="flex flex-col gap-1">
        <Button variant="secondary" fullWidth onClick={onToggle} disabled={pending} className="h-11">
          {clockInAt ? `Clock out · ${statusLine}` : `Clock in · ${statusLine}`}
        </Button>
        {clockInAt && (
          <button
            type="button"
            onClick={() => setCancelOpen(true)}
            className="self-center text-[11px] text-(--color-text-50)"
          >
            Not right? Cancel clock-in
          </button>
        )}
        {cancelDialog}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <Button onClick={onToggle} disabled={pending} className="h-[42px] w-full">
        {clockInAt ? "Clock out" : "Clock in"}
      </Button>
      <p className="text-center text-[11.5px] text-(--color-text-62)">{statusLine}</p>
      {clockInAt && (
        <button
          type="button"
          onClick={() => setCancelOpen(true)}
          className="text-[11px] text-(--color-text-50)"
        >
          Not right? Cancel clock-in
        </button>
      )}
      {cancelDialog}
    </div>
  );
}
