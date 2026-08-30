"use client";

import { useMemo, useState, useTransition } from "react";
import {
  acceptShiftAction,
  addCoverAction,
  assignShiftAction,
  claimShiftAction,
  declineShiftAction,
  deleteShiftAction,
  proposeSwapAction,
  saveShiftNoteAction,
} from "@/lib/actions/shifts";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Select } from "@/components/ui/Field";
import { SwapDialog } from "@/components/schedule/SwapDialog";
import { ShiftNoteDialog } from "@/components/schedule/ShiftNoteDialog";
import { useToast } from "@/components/ui/Toast";
import { conflictFor, nextCommitmentAfter, shiftWindow, type AvailabilityBlock } from "@/lib/domain/conflicts";
import { toMinutes } from "@/lib/domain/time";
import type { DayOfWeek, SessionType, ShiftStatus } from "@/lib/types";

interface ShiftActionsProps {
  shiftId: string;
  status: ShiftStatus;
  isMine: boolean;
  isAdmin: boolean;
  note: string;
  shiftSummary: string;
  requireSwapOnDecline: boolean;
  candidates: { id: string; full_name: string; shiftCount: number }[];
  assignableCrew?: { id: string; full_name: string; shiftCount: number }[];
  assigneeId?: string | null;
  noteButtonClassName?: string;
  day?: DayOfWeek;
  date?: string;
  startLabel?: string;
  endLabel?: string | null;
  session?: SessionType;
  cameraRole?: string | null;
  location?: string;
  availability?: AvailabilityBlock[];
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
  assignableCrew,
  assigneeId,
  noteButtonClassName,
  day,
  date,
  startLabel,
  endLabel,
  session,
  cameraRole,
  location,
  availability,
}: ShiftActionsProps) {
  const [pending, startTransition] = useTransition();
  const [swapOpen, setSwapOpen] = useState(false);
  const [noteDialog, setNoteDialog] = useState<"accept" | "edit" | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState("");
  const [coverTarget, setCoverTarget] = useState("");
  const { show } = useToast();

  const crewWithHints = useMemo(() => {
    if (!day || !date || !startLabel || !availability || !assignableCrew) return [];
    const win = shiftWindow(startLabel, endLabel ?? null);
    return assignableCrew.map((c) => {
      const blocks = availability.filter((b) => b.profile_id === c.id);
      const conflict = conflictFor(blocks, day, date, win);
      const nextCommitment = !conflict
        ? nextCommitmentAfter(blocks, day, date, toMinutes(startLabel) ?? 0)
        : null;
      return { ...c, conflict, nextCommitment };
    });
  }, [assignableCrew, availability, day, date, startLabel, endLabel]);

  const assignCandidates = crewWithHints;
  const coverCandidates = useMemo(
    () => crewWithHints.filter((c) => c.id !== assigneeId),
    [crewWithHints, assigneeId],
  );

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

  const assign = () =>
    startTransition(async () => {
      if (!assignTarget) return;
      const person = assignableCrew?.find((c) => c.id === assignTarget);
      await assignShiftAction(
        shiftId,
        assignTarget,
        `New shift: ${session ?? ""}`,
        `${day ?? ""} ${startLabel ?? ""} · ${location ?? ""}`,
      );
      show(`Assigned to ${person?.full_name ?? "them"} — they must accept.`);
      setAssignTarget("");
    });

  const addCover = () =>
    startTransition(async () => {
      if (!coverTarget || !day || !date || !startLabel || !session || !location) return;
      const person = assignableCrew?.find((c) => c.id === coverTarget);
      await addCoverAction({
        day,
        date,
        startLabel,
        endLabel: endLabel ?? null,
        session,
        cameraRole: cameraRole ?? null,
        location,
        note: note.trim() || null,
        assigneeId: coverTarget,
      });
      show(`Added ${person?.full_name ?? "them"} to cover this shift too — they must accept.`);
      setCoverTarget("");
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
        <div className="flex flex-col gap-2">
          <Button className="w-full" disabled={pending} onClick={claim}>
            Claim this slot
          </Button>
          {isAdmin && assignCandidates.length > 0 && (
            <div className="flex flex-col gap-1.5 border-t border-(--color-divider) pt-2">
              <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-(--color-text-55)">
                Or assign someone
              </p>
              <div className="flex gap-2">
                <Select
                  value={assignTarget}
                  onChange={(e) => setAssignTarget(e.target.value)}
                  className="flex-1"
                >
                  <option value="">Choose crew…</option>
                  {assignCandidates.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name}
                      {c.conflict
                        ? ` — conflict: ${c.conflict.label}`
                        : c.nextCommitment
                          ? ` — free until ${c.nextCommitment.start_time}`
                          : ""}
                    </option>
                  ))}
                </Select>
                <Button variant="secondary" disabled={!assignTarget || pending} onClick={assign}>
                  Assign
                </Button>
              </div>
            </div>
          )}
        </div>
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

      {isAdmin && status !== "open" && coverCandidates.length > 0 && (
        <div className="flex flex-col gap-1.5 border-t border-(--color-divider) pt-2">
          <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-(--color-text-55)">
            Need another person on this shift too?
          </p>
          <div className="flex gap-2">
            <Select value={coverTarget} onChange={(e) => setCoverTarget(e.target.value)} className="flex-1">
              <option value="">Choose crew…</option>
              {coverCandidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name}
                  {c.conflict
                    ? ` — conflict: ${c.conflict.label}`
                    : c.nextCommitment
                      ? ` — free until ${c.nextCommitment.start_time}`
                      : ""}
                </option>
              ))}
            </Select>
            <Button variant="secondary" disabled={!coverTarget || pending} onClick={addCover}>
              Add
            </Button>
          </div>
        </div>
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
