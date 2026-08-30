"use client";

import { useState, useTransition } from "react";
import { deleteShiftGroupAction } from "@/lib/actions/shifts";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { useToast } from "@/components/ui/Toast";

interface DeleteShiftGroupButtonProps {
  shiftIds: string[];
  summary: string;
  names: string[];
}

export function DeleteShiftGroupButton({ shiftIds, summary, names }: DeleteShiftGroupButtonProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const { show } = useToast();

  const remove = () =>
    startTransition(async () => {
      await deleteShiftGroupAction(shiftIds);
      setOpen(false);
      show(`Deleted — ${summary}.`);
    });

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-[12px] font-medium text-(--color-accent-700)"
      >
        Delete this shift
      </button>

      <Dialog open={open} onClose={() => setOpen(false)} title="Delete this whole shift?">
        <p className="mb-4 text-[13px] text-(--color-text-62)">
          {summary}
          {names.length > 0 && ` — removes ${names.join(", ")} too`}. This can&apos;t be undone.
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button className="flex-1" disabled={pending} onClick={remove}>
            Delete
          </Button>
        </div>
      </Dialog>
    </>
  );
}
