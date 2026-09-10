"use client";

import { useState, useTransition } from "react";
import { tapClockAction, type GeoPoint } from "@/lib/actions/hours";
import { liveDurationLabel } from "@/lib/domain/hours";
import { Button } from "@/components/ui/Button";

interface TapConfirmProps {
  clockInAt: string | null;
  clockLabel: string | null;
  clockSource: "clocked" | "tap" | null;
}

function getLocation(): Promise<GeoPoint | null> {
  if (!("geolocation" in navigator)) return Promise.resolve(null);
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 },
    );
  });
}

export function TapConfirm({ clockInAt, clockLabel, clockSource }: TapConfirmProps) {
  const [pending, startTransition] = useTransition();
  const [locating, setLocating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [tappedIn, setTappedIn] = useState(!!clockInAt && clockSource === "tap");

  const blockedByAppClock = !!clockInAt && clockSource !== "tap" && !message;

  const onTap = () => {
    setLocating(true);
    getLocation().then((location) => {
      setLocating(false);
      startTransition(async () => {
        const result = await tapClockAction(location);
        setTappedIn(result.clockedIn);
        if (result.error) {
          setMessage(result.error);
          return;
        }
        setMessage(
          result.clockedIn
            ? "Tapped in. Timer's running until you tap out."
            : result.loggedHours
              ? `Tapped out — ${liveDurationLabel(result.loggedHours)} logged and verified.`
              : "Tapped out — under a minute, nothing logged.",
        );
      });
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

  const busy = locating || pending;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
      <p className="text-[15px] text-white/80">
        {locating
          ? "Checking your location…"
          : (message ?? (tappedIn ? "You're tapped in." : "Tap to confirm you're here in the Video Room."))}
      </p>
      <Button
        onClick={onTap}
        disabled={busy}
        className="h-16 w-full max-w-xs border-2 border-white bg-white text-[18px] font-semibold text-(--color-accent-900) hover:bg-white/90"
      >
        {tappedIn ? "Tap out" : "Tap in"}
      </Button>
    </div>
  );
}
