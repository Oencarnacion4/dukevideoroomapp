import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import { ShiftActions } from "@/components/schedule/ShiftActions";
import { pgTimeToLabel, spanLabel } from "@/lib/domain/time";
import { shiftStatusMeta, initialsFor } from "@/lib/domain/shift-view";
import type { ShiftWithAssignee } from "@/lib/data/shifts";

interface ShiftCardProps {
  shift: ShiftWithAssignee;
  currentProfileId: string;
  isAdmin: boolean;
  requireSwapOnDecline: boolean;
  candidates: { id: string; full_name: string; shiftCount: number }[];
}

export function ShiftCard({ shift, currentProfileId, isAdmin, requireSwapOnDecline, candidates }: ShiftCardProps) {
  const startLabel = pgTimeToLabel(shift.start_time);
  const endLabel = shift.end_time ? pgTimeToLabel(shift.end_time) : null;
  const isMine = shift.assignee_id === currentProfileId;
  const meta = shiftStatusMeta(shift.status);
  const shiftSummary = `${shift.session_type} · ${shift.day_of_week} ${startLabel} · ${shift.location}`;

  return (
    <Card blueprint className="flex gap-3 p-3.5">
      <div className="flex w-13 shrink-0 flex-col gap-0.5">
        <span className="font-(family-name:--font-heading) text-[11px] font-medium uppercase text-(--color-accent-700)">
          {shift.day_of_week}
        </span>
        <span className="font-(family-name:--font-heading) text-[15px] font-semibold">{startLabel}</span>
        <span className="text-[11px] text-(--color-text-50)">{spanLabel(startLabel, endLabel)}</span>
      </div>

      <div className="flex flex-1 flex-col gap-2.25">
        <div>
          <h3 className="font-(family-name:--font-heading) text-[17px] font-semibold">{shift.session_type}</h3>
          <p className="text-[12.5px] text-(--color-text)/62">
            {[shift.camera_role, shift.location].filter(Boolean).join(" · ")}
          </p>
        </div>

        {shift.assignee && (
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center bg-(--color-accent-100) font-(family-name:--font-heading) text-[11px] text-(--color-accent-800)">
              {initialsFor(shift.assignee.full_name)}
            </span>
            <span className="text-[13px]">{shift.assignee.full_name}</span>
            <Tag variant={meta.variant}>{meta.label}</Tag>
          </div>
        )}
        {!shift.assignee && (
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
          note={shift.note ?? ""}
          shiftSummary={shiftSummary}
          requireSwapOnDecline={requireSwapOnDecline}
          candidates={candidates}
        />
      </div>
    </Card>
  );
}
