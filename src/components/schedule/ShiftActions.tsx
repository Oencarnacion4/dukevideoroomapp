"use client";

import { useState, useTransition } from "react";
import {
  acceptShiftAction,
  claimShiftAction,
  declineShiftAction,
  deleteShiftAction,
  proposeSwapAction,
  saveShiftNoteAction,
} from "@/lib/actions/shifts";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { SwapDialog } from "@/components/schedule/SwapDialog";
import { ShiftNoteDialog } from "@/components/schedule/ShiftNoteDialog";
import { useToast } from "@/components/ui/Toast";
import type { ShiftStatus } from "@/lib/types";

interface ShiftActionsProps {
  shiftId: string;
  status: ShiftStatus;
  isMine: boolean;
  isAdmin: boolean;
  note: string;
  shiftSummary: string;
  requireSwapOnDecline: boolean;
  candidates: { id: string; full_name: string; shiftCount: number }[];
  noteButtonClassName?: string;
}

export function ShiftActions({
  shiftId,
  status,
  isMine,
  isAdmin,
  note,
  shiftSummary,
  requireSwapOnDecline,
  candidates,
  noteButtonClassName,
}: ShiftActionsProps) {
  const [pending, startTransition] = useTransition();
  const [swapOpen, setSwapOpen] = useState(false);
  const [noteDialog, setNoteDialog] = useState<"accept" | "edit" | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { show } = useToast();

  const accept = () =>
    startTransition(async () => {
      await acceptShiftAction(shiftId);
      show(`Accepted — ${shiftSummary}. Added to your week.`);
      setNoteDialog("accept");
    });

  const decline = () =>
    startTransition(async () => {
      await declineShiftAction(shiftId);
      if (requireSwapOnDecline) {
        setSwapOpen(true);
      } else {
        show("Declined — coaches notified.");
      }
    });

  const claim = () =>
    startTransition(async () => {
      await claimShiftAction(shiftId);
      show("Slot claimed. It is yours.");
    });

  const sendSwap = (toId: string) =>
    startTransition(async () => {
      await proposeSwapAction(shiftId, toId, shiftSummary);
      const to = candidates.find((c) => c.id === toId);
      setSwapOpen(false);
      show(`Swap request sent to ${to?.full_name ?? "them"}. Coaches copied.`);
    });

  const saveNote = (text: string) =>
    startTransition(async () => {
      await saveShiftNoteAction(shiftId, text);
      setNoteDialog(null);
    });

  const remove = () =>
    startTransition(async () => {
      await deleteShiftAction(shiftId);
      setDeleteOpen(false);
      show(`Deleted — ${shiftSummary}.`);
    });

  return (
    <>
      {isMine && status === "pending" && (
        <div className="flex gap-2">
          <Button className="flex-1" disabled={pending} onClick={accept}>
            Accept
          </Button>
          <Button variant="secondary" className="flex-1" disabled={pending} onClick={decline}>
            Decline
          </Button>
        </div>
      )}

      {isMine && status === "declined" && (
        <div className="flex flex-col gap-2">
          <p className="text-[12.5px] text-(--color-text-62)">
            You declined. Name who can cover it — coaches see the swap, not a hole in the schedule.
          </p>
          <Button variant="secondary" onClick={() => setSwapOpen(true)}>
            Propose a replacement
          </Button>
        </div>
      )}

      {status === "open" && (
        <Button className="w-full" disabled={pending} onClick={claim}>
          Claim this slot
        </Button>
      )}

      {isMine && (status === "accepted" || status === "pending") && (
        <button
          type="button"
          onClick={() => setNoteDialog("edit")}
          className={noteButtonClassName ?? "self-end text-[13px] font-medium text-(--color-accent-700)"}
        >
          {note ? "Edit note" : "Add a note"}
        </button>
      )}

      {isAdmin && (
        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          className="self-end text-[13px] font-medium text-(--color-accent-700)"
        >
          Delete slot
        </button>
      )}

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete this slot?">
        <p className="mb-4 text-[13px] text-(--color-text-62)">
          {shiftSummary}. This removes it from the schedule for everyone — it can&apos;t be undone.
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => setDeleteOpen(false)}>
            Cancel
          </Button>
          <Button className="flex-1" disabled={pending} onClick={remove}>
            Delete
          </Button>
        </div>
      </Dialog>

      <SwapDialog
        open={swapOpen}
        onClose={() => setSwapOpen(false)}
        shiftSummary={shiftSummary}
        candidates={candidates}
        onSend={sendSwap}
        pending={pending}
      />
      <ShiftNoteDialog
        open={noteDialog !== null}
        mode={noteDialog ?? "edit"}
        initialNote={note}
        onDismiss={() => setNoteDialog(null)}
        onSave={saveNote}
        pending={pending}
      />
    </>
  );
}
