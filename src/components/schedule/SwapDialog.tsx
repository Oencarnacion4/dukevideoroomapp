"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { RadioRow } from "@/components/ui/Radio";
import { Button } from "@/components/ui/Button";

interface SwapDialogProps {
  open: boolean;
  onClose: () => void;
  shiftSummary: string;
  candidates: { id: string; full_name: string; shiftCount: number }[];
  onSend: (toProfileId: string) => void;
  pending: boolean;
}

export function SwapDialog({ open, onClose, shiftSummary, candidates, onSend, pending }: SwapDialogProps) {
  const [pick, setPick] = useState<string | null>(null);

  return (
    <Dialog open={open} onClose={onClose} title="Propose a replacement" zIndex={60}>
      <p className="mb-3 text-[13px] text-(--color-text-62)">{shiftSummary}</p>
      <div className="max-h-[212px] overflow-y-auto" role="radiogroup">
        {candidates.map((c) => (
          <RadioRow
            key={c.id}
            label={c.full_name}
            sub={`${c.shiftCount} this week`}
            checked={pick === c.id}
            onSelect={() => setPick(c.id)}
          />
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={onClose}>
          Cancel
        </Button>
        <Button
          className="flex-1"
          disabled={!pick || pending}
          onClick={() => pick && onSend(pick)}
        >
          Send request
        </Button>
      </div>
    </Dialog>
  );
}
