"use client";

import { useMemo, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { OverlayHeader } from "@/components/chrome/OverlayHeader";
import { Textarea } from "@/components/ui/Field";
import { Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { DAYS, TIME_OPTIONS, addDays, spanLabel, toMinutes } from "@/lib/domain/time";
import { conflictFor, nextCommitmentAfter, shiftWindow, type AvailabilityBlock } from "@/lib/domain/conflicts";
import { SESSIONS, locationFor } from "@/lib/constants";
import { postShiftAction } from "@/lib/actions/schedule";
import type { DayOfWeek, Profile, SessionType } from "@/lib/types";

const OPEN_END = "Open end";

interface ShiftBuilderFormProps {
  weekStart: string;
  crew: Profile[];
  availability: AvailabilityBlock[];
  shiftCounts: Record<string, number>;
}

function blocksFor(availability: AvailabilityBlock[], profileId: string): AvailabilityBlock[] {
  return availability.filter((b) => b.profile_id === profileId);
}

export function ShiftBuilderForm({ weekStart, crew, availability, shiftCounts }: ShiftBuilderFormProps) {
  const searchParams = useSearchParams();
  const openByDefault = searchParams.get("open") === "1";

  const [day, setDay] = useState<DayOfWeek>("Mon");
  const [start, setStart] = useState("4:15 PM");
  const [end, setEnd] = useState(OPEN_END);
  const [session, setSession] = useState<SessionType>("Full practice");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [openSlot, setOpenSlot] = useState(openByDefault);
  const [note, setNote] = useState("");
  const [override, setOverride] = useState(false);
  const [pending, startTransition] = useTransition();

  const location = locationFor(session);
  const durationLabel = spanLabel(start, end === OPEN_END ? null : end);
  const dayIndex = DAYS.indexOf(day);
  const date = addDays(weekStart, dayIndex);

  const toggleSelected = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const win = useMemo(() => shiftWindow(start, end === OPEN_END ? null : end), [start, end]);

  const conflicts = useMemo(
    () =>
      selectedIds
        .map((id) => ({
          profile: crew.find((c) => c.id === id)!,
          conflict: conflictFor(blocksFor(availability, id), day, date, win),
        }))
        .filter((x) => x.conflict),
    [selectedIds, crew, availability, day, date, win],
  );

  const blocked = conflicts.length > 0 && !override;

  const selectedProfiles = crew.filter((c) => selectedIds.includes(c.id));
  const summary =
    selectedProfiles.length > 0
      ? `Assigned to ${selectedProfiles.map((p) => p.full_name).join(", ")}${
          openSlot ? " + 1 open slot" : ""
        } — must accept`
      : openSlot
        ? `${day} · ${start} · ${durationLabel === "Open end" ? "open end" : durationLabel} — ${session} · ${location} · open, anyone can claim`
        : "Pick who works it, or leave a slot open.";

  const canSubmit = selectedProfiles.length > 0 || openSlot;

  const submit = () => {
    startTransition(() =>
      postShiftAction({
        day,
        date,
        weekStart,
        start,
        end: end === OPEN_END ? null : end,
        session,
        cameraRole: null,
        location,
        assigneeIds: selectedIds,
        alsoOpen: openSlot,
        note,
      }),
    );
  };

  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-(--color-bg)">
      <OverlayHeader eyebrow="Build a shift" title="Week of shifts" variant="close" />
      <div className="flex flex-1 flex-col gap-4 p-4 pb-40">
        <div>
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.08em] text-(--color-text-55)">Day</p>
          <div className="grid grid-cols-7 gap-1">
            {DAYS.map((d) => (
              <button
                key={d}
                onClick={() => setDay(d as DayOfWeek)}
                className={cn(
                  "border border-(--color-divider) py-2 text-[11px] uppercase",
                  day === d && "bg-(--color-accent-800) text-white",
                )}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.08em] text-(--color-text-55)">Start and end</p>
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
          <p className="mt-1.5 text-[12px] text-(--color-text-62)">
            {end === OPEN_END
              ? "No end time — whoever works it clocks out when practice actually breaks."
              : `Scheduled ${durationLabel} — hours still come from the clock.`}
          </p>
        </div>

        <div>
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.08em] text-(--color-text-55)">Session</p>
          <div className="flex flex-wrap gap-2">
            {SESSIONS.map((s) => (
              <button
                key={s}
                onClick={() => setSession(s)}
                className={cn(
                  "border px-2.5 py-1 text-[12.5px]",
                  session === s ? "border-(--color-accent-800) bg-(--color-accent-800) text-white" : "border-(--color-divider)",
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.08em] text-(--color-text-55)">
            Who works it
          </p>
          <p className="mb-1.5 text-[12px] text-(--color-text-62)">
            Pick everyone needed to cover this — select more than one if it takes a crew.
          </p>
          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => setOpenSlot((v) => !v)}
              className={cn(
                "flex items-center justify-between border p-2.5 text-left",
                openSlot ? "border-(--color-accent-800)" : "border-(--color-divider)",
              )}
            >
              <span className="text-[14px] font-medium">
                {selectedProfiles.length > 0 ? "Also leave a slot open" : "Leave open"}
              </span>
              <span className="text-[12px] text-(--color-text-50)">anyone can claim</span>
            </button>
            {crew.map((c) => {
              const personConflict = conflictFor(blocksFor(availability, c.id), day, date, win);
              const startMinutes = toMinutes(start) ?? 0;
              const nextCommitment = !personConflict
                ? nextCommitmentAfter(blocksFor(availability, c.id), day, date, startMinutes)
                : null;
              const checked = selectedIds.includes(c.id);
              return (
                <button
                  key={c.id}
                  onClick={() => toggleSelected(c.id)}
                  className={cn(
                    "flex items-center justify-between gap-2 border p-2.5 text-left",
                    checked ? "border-(--color-accent-800)" : "border-(--color-divider)",
                  )}
                >
                  <span className="flex items-center gap-2 text-[14px] font-medium">
                    <input type="checkbox" checked={checked} readOnly className="shrink-0" />
                    {c.full_name}
                  </span>
                  {personConflict ? (
                    <span className="text-right text-[12px] font-medium text-(--color-accent-900)">
                      {personConflict.label}{" "}
                      {!personConflict.all_day &&
                        `${personConflict.start_time}–${personConflict.end_time}`}
                    </span>
                  ) : nextCommitment ? (
                    <span className="text-right text-[12px] text-(--color-text-62)">
                      Free until {nextCommitment.start_time} — {nextCommitment.label}
                    </span>
                  ) : (
                    <span className="text-[12px] text-(--color-text-50)">{shiftCounts[c.id] ?? 0} this week</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.08em] text-(--color-text-55)">Notes</p>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Anything the crew should know — has to leave early, doubling up on cameras, meet at the loading dock…"
          />
        </div>
      </div>

      <div className="fixed right-0 bottom-0 left-0 mx-auto flex max-w-[480px] flex-col gap-2 border-t border-(--color-divider) bg-(--color-bg) p-4">
        {conflicts.length > 0 && (
          <div className="border border-(--color-accent-900) p-2.5">
            <p className="mb-1 font-(family-name:--font-heading) text-[10px] font-medium uppercase text-(--color-accent-900)">
              Class conflict
            </p>
            <ul className="mb-2 flex flex-col gap-1 text-[12.5px] text-(--color-text)">
              {conflicts.map(({ profile, conflict }) => (
                <li key={profile.id}>
                  {profile.full_name} has {conflict!.label}
                  {conflict!.specific_date ? " that day" : ` on ${day}`}
                  {!conflict!.all_day && `, ${conflict!.start_time}–${conflict!.end_time}`}. That overlaps this shift.
                </li>
              ))}
            </ul>
            <label className="flex items-center gap-2 text-[12.5px]">
              <input type="checkbox" checked={override} onChange={(e) => setOverride(e.target.checked)} />
              Assign anyway — I cleared it with them
            </label>
          </div>
        )}
        <p className="text-[12.5px] text-(--color-text-62)">{summary}</p>
        <Button fullWidth disabled={!canSubmit || blocked || pending} onClick={submit}>
          {blocked ? "Conflict — check the box to override" : "Post shift"}
        </Button>
      </div>
    </div>
  );
}
