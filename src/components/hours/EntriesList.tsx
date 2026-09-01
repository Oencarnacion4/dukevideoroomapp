"use client";

import { useState, useTransition } from "react";
import { deleteTimeEntryAction, updateTimeEntryAction } from "@/lib/actions/hours";
import { fmtHours } from "@/lib/domain/hours";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Field";
import { Tag } from "@/components/ui/Tag";
import { useToast } from "@/components/ui/Toast";
import type { TimeEntry } from "@/lib/types";

interface EntriesListProps {
  entries: TimeEntry[];
}

export function EntriesList({ entries }: EntriesListProps) {
  const [pending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editLabel, setEditLabel] = useState("");
  const [editHours, setEditHours] = useState("");
  const { show } = useToast();

  const startEdit = (e: TimeEntry) => {
    setEditingId(e.id);
    setEditDate(e.date);
    setEditLabel(e.session_label);
    setEditHours(String(e.hours));
  };

  const saveEdit = () => {
    if (!editingId) return;
    startTransition(async () => {
      const result = await updateTimeEntryAction({
        id: editingId,
        date: editDate,
        sessionLabel: editLabel,
        hours: Number(editHours),
      });
      if (result.error) {
        show(result.error);
      } else {
        setEditingId(null);
        show("Entry updated.");
      }
    });
  };

  const confirmDelete = () => {
    if (!deletingId) return;
    startTransition(async () => {
      await deleteTimeEntryAction(deletingId);
      setDeletingId(null);
      show("Entry deleted.");
    });
  };

  if (entries.length === 0) {
    return <p className="py-3 text-[13px] text-(--color-text-50)">No entries yet this week.</p>;
  }

  return (
    <div className="flex flex-col">
      {entries.map((e) => {
        if (editingId === e.id) {
          return (
            <div key={e.id} className="flex flex-col gap-2.5 border-b border-(--color-divider) py-2.5 last:border-b-0">
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={editDate}
                  onChange={(ev) => setEditDate(ev.target.value)}
                  className="flex-1"
                />
                <Input
                  type="number"
                  step="0.25"
                  min="0.25"
                  value={editHours}
                  onChange={(ev) => setEditHours(ev.target.value)}
                  className="w-24"
                />
              </div>
              <Input value={editLabel} onChange={(ev) => setEditLabel(ev.target.value)} placeholder="Session label" />
              <div className="flex gap-2">
                <Button variant="secondary" className="flex-1" disabled={pending} onClick={() => setEditingId(null)}>
                  Cancel
                </Button>
                <Button className="flex-1" disabled={pending} onClick={saveEdit}>
                  Save
                </Button>
              </div>
            </div>
          );
        }

        return (
          <div
            key={e.id}
            className="flex items-center gap-2 border-b border-(--color-divider) py-2 last:border-b-0"
          >
            <div className="w-13 shrink-0 text-[11px] uppercase text-(--color-text-50)">
              {new Date(`${e.date}T00:00:00`).toLocaleDateString("en-US", { weekday: "short" })}
            </div>
            <div className="flex-1 text-[13.5px]">{e.session_label}</div>
            <Tag variant="neutral">{e.source === "clocked" ? "Clocked" : "Manual"}</Tag>
            <div className="font-(family-name:--font-heading) text-[15px] font-semibold">
              {fmtHours(Number(e.hours))}
            </div>
            <button
              type="button"
              onClick={() => startEdit(e)}
              className="text-[12px] font-medium text-(--color-accent-700)"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => setDeletingId(e.id)}
              className="text-[12px] font-medium text-(--color-accent-700)"
            >
              Delete
            </button>
          </div>
        );
      })}

      <Dialog open={deletingId !== null} onClose={() => setDeletingId(null)} title="Delete this entry?">
        <p className="mb-4 text-[13px] text-(--color-text-62)">This removes it from your hours — it can&apos;t be undone.</p>
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => setDeletingId(null)}>
            Cancel
          </Button>
          <Button className="flex-1" disabled={pending} onClick={confirmDelete}>
            Delete
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
