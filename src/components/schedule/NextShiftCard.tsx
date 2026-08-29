import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import { ShiftActions } from "@/components/schedule/ShiftActions";
import { pgTimeToLabel, spanLabel } from "@/lib/domain/time";
import { shiftStatusMeta } from "@/lib/domain/shift-view";
import type { ShiftWithAssignee } from "@/lib/data/shifts";

interface NextShiftCardProps {
  shift: ShiftWithAssignee;
  requireSwapOnDecline: boolean;
  candidates: { id: string; full_name: string; shiftCount: number }[];
}

export function NextShiftCard({ shift, requireSwapOnDecline, candidates }: NextShiftCardProps) {
  const startLabel = pgTimeToLabel(shift.start_time);
  const endLabel = shift.end_time ? pgTimeToLabel(shift.end_time) : null;
  const meta = shiftStatusMeta(shift.status);
  const shiftSummary = `${shift.day_of_week} ${startLabel}`;

  return (
    <Card blueprint className="flex flex-col gap-2.5 p-3.5">
      <div className="flex items-start justify-between">
        <span className="font-(family-name:--font-heading) text-[11px] font-medium uppercase tracking-[0.1em] text-(--color-accent-700)">
          Next shift
        </span>
        <Tag variant={meta.variant}>{meta.label}</Tag>
      </div>
      <h3 className="font-(family-name:--font-heading) text-[21px] font-semibold">{shift.session_type}</h3>
      <p className="text-[13px] text-(--color-text-62)">
        {shift.day_of_week} · {startLabel} · {spanLabel(startLabel, endLabel)}
      </p>
      <div className="grid grid-cols-2 gap-3 border-t border-(--color-divider) pt-2.5">
        <div>
          <p className="text-[10px] uppercase text-(--color-text-50)">Assignment</p>
          <p className="text-[13px]">{shift.camera_role ?? "—"}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase text-(--color-text-50)">Location</p>
          <p className="text-[13px]">{shift.location}</p>
        </div>
      </div>
      <ShiftActions
        shiftId={shift.id}
        status={shift.status}
        isMine
        note={shift.note ?? ""}
        shiftSummary={shiftSummary}
        requireSwapOnDecline={requireSwapOnDecline}
        candidates={candidates}
      />
    </Card>
  );
}
