"use client";

import { useMemo, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { OverlayHeader } from "@/components/chrome/OverlayHeader";
import { Textarea } from "@/components/ui/Field";
import { Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { DAYS, TIME_OPTIONS, addDays, spanLabel } from "@/lib/domain/time";
import { conflictFor, shiftWindow, type AvailabilityBlock } from "@/lib/domain/conflicts";
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
  const [who, setWho] = useState<string>(openByDefault ? "open" : "");
  const [note, setNote] = useState("");
  const [override, setOverride] = useState(false);
  const [pending, startTransition] = useTransition();

  const location = locationFor(session);
  const durationLabel = spanLabel(start, end === OPEN_END ? null : end);
  const dayIndex = DAYS.indexOf(day);
  const date = addDays(weekStart, dayIndex);

  const conflict = useMemo(() => {
    if (who === "open" || !who) return null;
    const window = shiftWindow(start, end === OPEN_END ? null : end);
    return conflictFor(blocksFor(availability, who), day, date, window);
  }, [who, availability, start, end, day, date]);

  const blocked = !!conflict && !override;

  const assignedPerson = crew.find((c) => c.id === who);
  const summary = assignedPerson
    ? `Assigned to ${assignedPerson.full_name} — they must accept`
    : `${day} · ${start} · ${durationLabel === "Open end" ? "open end" : durationLabel} — ${session} · ${location}`;

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
        assigneeId: who && who !== "open" ? who : null,
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
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.08em] text-(--color-text-55)">Who works it</p>
          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => setWho("open")}
              className={cn(
                "flex items-center justify-between border p-2.5 text-left",
                who === "open" ? "border-(--color-accent-800)" : "border-(--color-divider)",
              )}
            >
              <span className="text-[14px] font-medium">Leave open</span>
              <span className="text-[12px] text-(--color-text-50)">anyone can claim</span>
            </button>
            {crew.map((c) => {
              const window = shiftWindow(start, end === OPEN_END ? null : end);
              const personConflict = conflictFor(blocksFor(availability, c.id), day, date, window);
              return (
                <button
                  key={c.id}
                  onClick={() => setWho(c.id)}
                  className={cn(
                    "flex items-center justify-between border p-2.5 text-left",
                    who === c.id ? "border-(--color-accent-800)" : "border-(--color-divider)",
                  )}
                >
                  <span className="text-[14px] font-medium">{c.full_name}</span>
                  {personConflict ? (
                    <span className="text-[12px] font-medium text-(--color-accent-900)">
                      {personConflict.label}{" "}
                      {!personConflict.all_day &&
                        `${personConflict.start_time}–${personConflict.end_time}`}
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
        {conflict && (
          <div className="border border-(--color-accent-900) p-2.5">
            <p className="mb-1 font-(family-name:--font-heading) text-[10px] font-medium uppercase text-(--color-accent-900)">
              Class conflict
            </p>
            <p className="mb-2 text-[12.5px] text-(--color-text)">
              {assignedPerson?.full_name} has {conflict.label}
              {conflict.specific_date ? " that day" : ` on ${day}`}
              {!conflict.all_day && `, ${conflict.start_time}–${conflict.end_time}`}. That overlaps this shift.
            </p>
            <label className="flex items-center gap-2 text-[12.5px]">
              <input type="checkbox" checked={override} onChange={(e) => setOverride(e.target.checked)} />
              Assign anyway — I cleared it with them
            </label>
          </div>
        )}
        <p className="text-[12.5px] text-(--color-text-62)">{summary}</p>
        <Button fullWidth disabled={blocked || pending} onClick={submit}>
          {blocked ? "Conflict — check the box to override" : "Post shift"}
        </Button>
      </div>
    </div>
  );
}
