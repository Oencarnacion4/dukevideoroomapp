"use client";

import { useState, useTransition } from "react";
import { tapClockAction } from "@/lib/actions/hours";
import { liveDurationLabel } from "@/lib/domain/hours";
import { Button } from "@/components/ui/Button";

interface TapConfirmProps {
  clockInAt: string | null;
  clockLabel: string | null;
  clockSource: "clocked" | "tap" | null;
}

export function TapConfirm({ clockInAt, clockLabel, clockSource }: TapConfirmProps) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [tappedIn, setTappedIn] = useState(!!clockInAt && clockSource === "tap");

  const blockedByAppClock = !!clockInAt && clockSource !== "tap" && !message;

  const onTap = () => {
    startTransition(async () => {
      const result = await tapClockAction();
      if (result.error) {
        setMessage(result.error);
        return;
      }
      setTappedIn(result.clockedIn);
      setMessage(
        result.clockedIn
          ? "Tapped in. Timer's running until you tap out."
          : result.loggedHours
            ? `Tapped out — ${liveDurationLabel(result.loggedHours)} logged and verified.`
            : "Tapped out — under a minute, nothing logged.",
      );
    });
  };

  if (blockedByAppClock) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-[15px] text-white/80">
          You&apos;re already clocked in from the app ({clockLabel}). Clock out there first, then come back and tap
          in here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
      <p className="text-[15px] text-white/80">
        {message ?? (tappedIn ? "You're tapped in." : "Tap to confirm you're here in the Video Room.")}
      </p>
      <Button
        onClick={onTap}
        disabled={pending}
        className="h-16 w-full max-w-xs border-2 border-white bg-white text-[18px] font-semibold text-(--color-accent-900) hover:bg-white/90"
      >
        {tappedIn ? "Tap out" : "Tap in"}
      </Button>
    </div>
  );
}
