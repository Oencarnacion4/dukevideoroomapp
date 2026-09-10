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

type LocationResult = { point: GeoPoint } | { point: null; deniedPermission: boolean };

function getPosition(options: PositionOptions): Promise<LocationResult> {
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({ point: { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy } }),
      (err) => resolve({ point: null, deniedPermission: err.code === err.PERMISSION_DENIED }),
      options,
    );
  });
}

/**
 * Indoors (the K Center is a big steel/concrete building), asking for GPS
 * precision up front often makes phones wait for a satellite lock that
 * never comes. Try the fast, network-based reading first — it's plenty
 * precise for a ~150m radius and works far more reliably indoors — and
 * only fall back to a high-accuracy GPS attempt if that fails outright.
 */
async function getLocation(): Promise<LocationResult> {
  if (!("geolocation" in navigator)) return { point: null, deniedPermission: false };

  const fast = await getPosition({ enableHighAccuracy: false, timeout: 15_000, maximumAge: 120_000 });
  if (fast.point || fast.deniedPermission) return fast;

  return getPosition({ enableHighAccuracy: true, timeout: 20_000, maximumAge: 0 });
}

export function TapConfirm({ clockInAt, clockLabel, clockSource }: TapConfirmProps) {
  const [pending, startTransition] = useTransition();
  const [locating, setLocating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [tappedIn, setTappedIn] = useState(!!clockInAt && clockSource === "tap");

  const blockedByAppClock = !!clockInAt && clockSource !== "tap" && !message;

  const onTap = () => {
    setLocating(true);
    getLocation().then((located) => {
      setLocating(false);

      if (!located.point) {
        setMessage(
          located.deniedPermission
            ? "Location is turned off for this site. Enable it in your browser's site settings and try again."
            : "Couldn't get a location fix — try again, or move closer to a window and retry.",
        );
        return;
      }

      startTransition(async () => {
        const result = await tapClockAction(located.point);
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
