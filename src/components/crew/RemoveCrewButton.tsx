"use client";

import { useState, useTransition } from "react";
import { removeCrewAction } from "@/lib/actions/roster";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { useToast } from "@/components/ui/Toast";

interface RemoveCrewButtonProps {
  profileId: string;
  fullName: string;
}

export function RemoveCrewButton({ profileId, fullName }: RemoveCrewButtonProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const { show } = useToast();

  const remove = () =>
    startTransition(async () => {
      const result = await removeCrewAction(profileId);
      if (result.error) {
        show(result.error);
      } else {
        setOpen(false);
        show(`Removed ${fullName} from the crew.`);
      }
    });

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        className="text-[12px] font-medium text-(--color-accent-700)"
      >
        Remove
      </button>

      <Dialog open={open} onClose={() => setOpen(false)} title="Remove from the crew?">
        <p className="mb-4 text-[13px] text-(--color-text-62)">
          {fullName} will be removed from the roster — this can&apos;t be undone. If they have shifts, hours, or
          other history on record, this won&apos;t be allowed.
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button className="flex-1" disabled={pending} onClick={remove}>
            Remove
          </Button>
        </div>
      </Dialog>
    </>
  );
}
