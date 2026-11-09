"use client";

import { useMemo, useState, useTransition } from "react";
import { addCoverAction } from "@/lib/actions/shifts";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { crewWithAvailabilityHints, type CrewOption } from "@/lib/domain/crew-picker";
import { GAME_ROLES } from "@/lib/domain/games";
import type { AvailabilityBlock } from "@/lib/domain/conflicts";
import type { DayOfWeek, SessionType } from "@/lib/types";

interface AddCoverPickerProps {
  day: DayOfWeek;
  date: string;
  startLabel: string;
  endLabel: string | null;
  session: SessionType;
  /** Every camera_role already on this slot — used to default a Game's role picker to whichever one's still open. */
  existingRoles: (string | null)[];
  location: string;
  excludeIds: string[];
  assignableCrew: CrewOption[];
  availability: AvailabilityBlock[];
}

export function AddCoverPicker({
  day,
  date,
  startLabel,
  endLabel,
  session,
  existingRoles,
  location,
  excludeIds,
  assignableCrew,
  availability,
}: AddCoverPickerProps) {
  const isGame = session === "Game";
  const openRole = GAME_ROLES.find((r) => !existingRoles.includes(r)) ?? GAME_ROLES[0];
  const [pending, startTransition] = useTransition();
  const [target, setTarget] = useState("");
  const [role, setRole] = useState<string>(openRole);
  const { show } = useToast();

  const candidates = useMemo(
    () =>
      crewWithAvailabilityHints(
        assignableCrew.filter((c) => !excludeIds.includes(c.id)),
        availability,
        day,
        date,
        startLabel,
        endLabel,
      ),
    [assignableCrew, excludeIds, availability, day, date, startLabel, endLabel],
  );

  if (candidates.length === 0) return null;

  const addCover = () =>
    startTransition(async () => {
      if (!target) return;
      const person = assignableCrew.find((c) => c.id === target);
      await addCoverAction({
        day,
        date,
        startLabel,
        endLabel,
        session,
        cameraRole: isGame ? role : null,
        location,
        note: null,
        assigneeId: target,
      });
      show(
        isGame
          ? `Added ${person?.full_name ?? "them"} on ${role} — they must accept.`
          : `Added ${person?.full_name ?? "them"} to cover this shift too — they must accept.`,
      );
      setTarget("");
    });

  return (
    <div className="flex flex-col gap-1.5 border-t border-(--color-divider) pt-2">
      <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-(--color-text-55)">
        Need another person on this shift too?
      </p>
      {isGame && (
        <Select value={role} onChange={(e) => setRole(e.target.value)}>
          {GAME_ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </Select>
      )}
      <div className="flex gap-2">
        <Select value={target} onChange={(e) => setTarget(e.target.value)} className="flex-1">
          <option value="">Choose crew…</option>
          {candidates.map((c) => (
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
        <Button variant="secondary" disabled={!target || pending} onClick={addCover}>
          Add
        </Button>
      </div>
    </div>
  );
}
