"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

interface ShiftNoteDialogProps {
  open: boolean;
  mode: "accept" | "edit";
  initialNote: string;
  onDismiss: () => void;
  onSave: (note: string) => void;
  pending: boolean;
}

export function ShiftNoteDialog({ open, mode, initialNote, onDismiss, onSave, pending }: ShiftNoteDialogProps) {
  const [note, setNote] = useState(initialNote);

  const title = mode === "accept" ? "Shift accepted" : "Shift note";
  const body =
    mode === "accept"
      ? "Anything staff should know? Times you have to leave, who is covering the rest."
      : "Everyone on the crew sees this, including staff.";
  const cancelLabel = mode === "accept" ? "No note" : "Cancel";

  return (
    <Dialog open={open} onClose={onDismiss} title={title} zIndex={65}>
      <p className="mb-3 text-[13px] text-(--color-text-62)">{body}</p>
      <Textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="e.g. Need to leave at 4:45 — Tre is covering the rest."
      />
      <div className="mt-4 flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={onDismiss}>
          {cancelLabel}
        </Button>
        <Button className="flex-1" disabled={pending} onClick={() => onSave(note)}>
          Save note
        </Button>
      </div>
    </Dialog>
  );
}
