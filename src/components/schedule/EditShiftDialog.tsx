"use client";

import { useState, useTransition } from "react";
import { updateShiftGroupAction } from "@/lib/actions/shifts";
import { DAYS, TIME_OPTIONS, addDays } from "@/lib/domain/time";
import { SESSIONS, locationFor } from "@/lib/constants";
import { Dialog } from "@/components/ui/Dialog";
import { Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import type { DayOfWeek, SessionType } from "@/lib/types";

const OPEN_END = "Open end";

interface EditShiftDialogProps {
  open: boolean;
  onClose: () => void;
  /** Every row sharing this slot — one per person covering it (plus an open one, if any). All move together. */
  shifts: { id: string; assigneeId: string | null }[];
  initialDay: DayOfWeek;
  initialDate: string;
  initialStart: string;
  initialEnd: string | null;
  initialSession: SessionType;
  initialCameraRole: string | null;
}

/**
 * Corrects a shift slot's day/time/session without deleting and
 * recreating it — that would wipe out everyone's accept/decline
 * response. Moves every row in the group at once, so the whole practice
 * shifts together rather than one person's row at a time.
 */
export function EditShiftDialog({
  open,
  onClose,
  shifts,
  initialDay,
  initialDate,
  initialStart,
  initialEnd,
  initialSession,
  initialCameraRole,
}: EditShiftDialogProps) {
  const [day, setDay] = useState<DayOfWeek>(initialDay);
  const [start, setStart] = useState(initialStart);
  const [end, setEnd] = useState(initialEnd ?? OPEN_END);
  const [session, setSession] = useState<SessionType>(initialSession);
  const [pending, startTransition] = useTransition();
  const { show } = useToast();

  const location = locationFor(session);
  // Same week the shift was already on — moving the day slides within it.
  const weekStart = addDays(initialDate, -DAYS.indexOf(initialDay));
  const date = addDays(weekStart, DAYS.indexOf(day));

  const save = () => {
    startTransition(async () => {
      const result = await updateShiftGroupAction(shifts, {
        day,
        date,
        startLabel: start,
        endLabel: end === OPEN_END ? null : end,
        session,
        cameraRole: initialCameraRole,
        location,
      });
      if (result.error) {
        show(result.error);
        return;
      }
      show(
        shifts.length > 1
          ? `Shift updated for everyone on it — whoever responded keeps that response.`
          : "Shift updated — whoever responded keeps that response.",
      );
      onClose();
    });
  };

  return (
    <Dialog open={open} onClose={onClose} title="Edit this shift">
      <div className="flex flex-col gap-3.5">
        <p className="text-[12.5px] text-(--color-text-62)">
          {shifts.length > 1
            ? `Fixes the day, time, or session for everyone on this slot (${shifts.length} people). Whoever already accepted or declined keeps that response — they'll just be notified the details changed.`
            : "Fixes the day, time, or session on this slot. Whoever already accepted or declined keeps that response — they'll just be notified the details changed."}
        </p>

        <div>
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.08em] text-(--color-text-55)">Day</p>
          <div className="grid grid-cols-7 gap-1">
            {DAYS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDay(d as DayOfWeek)}
                className={cn(
                  "border border-(--color-divider) py-1.5 text-[10.5px] uppercase",
                  day === d && "bg-(--color-accent-800) text-white",
                )}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.08em] text-(--color-text-55)">
            Start and end
          </p>
          <div className="flex items-center gap-2">
            <Select value={start} onChange={(e) => setStart(e.target.value)} className="flex-1">
              {TIME_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
            <span className="text-[13px] text-(--color-text-50)">to</span>
            <Select value={end} onChange={(e) => setEnd(e.target.value)} className="flex-1">
              <option value={OPEN_END}>Open end</option>
              {TIME_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.08em] text-(--color-text-55)">
            Session
          </p>
          <div className="flex flex-wrap gap-2">
            {SESSIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSession(s)}
                className={cn(
                  "border px-2.5 py-1 text-[12.5px]",
                  session === s
                    ? "border-(--color-accent-800) bg-(--color-accent-800) text-white"
                    : "border-(--color-divider)",
                )}
              >
                {s}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-[12px] text-(--color-text-62)">Location: {location}</p>
        </div>

        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={save} disabled={pending}>
            Save changes
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
