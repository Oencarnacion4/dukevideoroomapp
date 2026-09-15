"use client";

import { useState } from "react";
import { EditShiftDialog } from "@/components/schedule/EditShiftDialog";
import type { DayOfWeek, SessionType } from "@/lib/types";

interface EditShiftGroupButtonProps {
  shifts: { id: string; assigneeId: string | null }[];
  initialDay: DayOfWeek;
  initialDate: string;
  initialStart: string;
  initialEnd: string | null;
  initialSession: SessionType;
  initialCameraRole: string | null;
  className?: string;
}

/** Trigger + dialog for editing every row in a shift slot together — see EditShiftDialog. */
export function EditShiftGroupButton({
  shifts,
  initialDay,
  initialDate,
  initialStart,
  initialEnd,
  initialSession,
  initialCameraRole,
  className,
}: EditShiftGroupButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className ?? "text-[12px] font-medium text-(--color-accent-700)"}
      >
        Edit shift
      </button>
      <EditShiftDialog
        open={open}
        onClose={() => setOpen(false)}
        shifts={shifts}
        initialDay={initialDay}
        initialDate={initialDate}
        initialStart={initialStart}
        initialEnd={initialEnd}
        initialSession={initialSession}
        initialCameraRole={initialCameraRole}
      />
    </>
  );
}
