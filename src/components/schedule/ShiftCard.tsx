import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import { ShiftActions } from "@/components/schedule/ShiftActions";
import { AddCoverPicker } from "@/components/schedule/AddCoverPicker";
import { DeleteShiftGroupButton } from "@/components/schedule/DeleteShiftGroupButton";
import { pgTimeToLabel, spanLabel } from "@/lib/domain/time";
import { shiftStatusMeta, initialsFor } from "@/lib/domain/shift-view";
import type { ShiftWithAssignee } from "@/lib/data/shifts";
import type { AvailabilityBlock } from "@/lib/domain/conflicts";
import type { CrewOption } from "@/lib/domain/crew-picker";

interface ShiftCardProps {
  /** One or more shifts sharing the same day/date/start/end/session/location — everyone covering this slot. */
  shifts: ShiftWithAssignee[];
  currentProfileId: string;
  isAdmin: boolean;
  requireSwapOnDecline: boolean;
  candidates: CrewOption[];
  assignableCrew: CrewOption[];
  availability: AvailabilityBlock[];
}

export function ShiftCard({
  shifts,
  currentProfileId,
  isAdmin,
  requireSwapOnDecline,
  candidates,
  assignableCrew,
  availability,
}: ShiftCardProps) {
  const first = shifts[0];
  const startLabel = pgTimeToLabel(first.start_time);
  const endLabel = first.end_time ? pgTimeToLabel(first.end_time) : null;
  const assignedIds = shifts.map((s) => s.assignee_id).filter((id): id is string => !!id);

  return (
    <Card blueprint className="flex gap-3 p-3.5">
      <div className="flex w-13 shrink-0 flex-col gap-0.5">
        <span className="font-(family-name:--font-heading) text-[11px] font-medium uppercase text-(--color-accent-700)">
          {first.day_of_week}
        </span>
        <span className="font-(family-name:--font-heading) text-[15px] font-semibold">{startLabel}</span>
        <span className="text-[11px] text-(--color-text-50)">{spanLabel(startLabel, endLabel)}</span>
      </div>

      <div className="flex flex-1 flex-col gap-2.25">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-(family-name:--font-heading) text-[17px] font-semibold">{first.session_type}</h3>
            <p className="text-[12.5px] text-(--color-text)/62">
              {[first.camera_role, first.location].filter(Boolean).join(" · ")}
            </p>
          </div>
          {isAdmin && shifts.length > 1 && (
            <DeleteShiftGroupButton
              shiftIds={shifts.map((s) => s.id)}
              summary={`${first.session_type} · ${first.day_of_week} ${startLabel}`}
              names={shifts.map((s) => s.assignee?.full_name).filter((n): n is string => !!n)}
            />
          )}
        </div>

        {shifts.map((shift, i) => {
          const isMine = shift.assignee_id === currentProfileId;
          const meta = shiftStatusMeta(shift.status);
          const shiftSummary = `${shift.session_type} · ${shift.day_of_week} ${startLabel} · ${shift.location}`;
          return (
            <div
              key={shift.id}
              className={
                i === 0
                  ? "flex flex-col gap-2.25"
                  : "flex flex-col gap-2.25 border-t border-(--color-divider) pt-2.25"
              }
            >
              {shift.assignee ? (
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center bg-(--color-accent-100) font-(family-name:--font-heading) text-[11px] text-(--color-accent-800)">
                    {initialsFor(shift.assignee.full_name)}
                  </span>
                  <span className="text-[13px]">{shift.assignee.full_name}</span>
                  <Tag variant={meta.variant}>{meta.label}</Tag>
                </div>
              ) : (
                <div>
                  <Tag variant={meta.variant}>{meta.label}</Tag>
                </div>
              )}

              {shift.note && (
                <div className="border-t border-(--color-divider) pt-2">
                  <span className="mr-1.5 font-(family-name:--font-heading) text-[10px] font-medium uppercase text-(--color-accent-700)">
                    Note
                  </span>
                  <span className="text-[12.5px] text-(--color-text)/78">{shift.note}</span>
                </div>
              )}

              <ShiftActions
                shiftId={shift.id}
                status={shift.status}
                isMine={isMine}
                isAdmin={isAdmin}
                assigneeId={shift.assignee_id}
                note={shift.note ?? ""}
                shiftSummary={shiftSummary}
                requireSwapOnDecline={requireSwapOnDecline}
                candidates={candidates}
                assignableCrew={assignableCrew}
                day={shift.day_of_week}
                date={shift.date}
                startLabel={startLabel}
                endLabel={endLabel}
                session={shift.session_type}
                location={shift.location}
                availability={availability}
              />
            </div>
          );
        })}

        {isAdmin && (
          <AddCoverPicker
            day={first.day_of_week}
            date={first.date}
            startLabel={startLabel}
            endLabel={endLabel}
            session={first.session_type}
            cameraRole={first.camera_role}
            location={first.location}
            excludeIds={assignedIds}
            assignableCrew={assignableCrew}
            availability={availability}
          />
        )}
      </div>
    </Card>
  );
}
