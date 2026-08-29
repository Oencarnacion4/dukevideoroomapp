"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import { Field, Input } from "@/components/ui/Field";
import { Seg } from "@/components/ui/Seg";
import { Header } from "@/components/chrome/Header";
import { TabBar } from "@/components/chrome/TabBar";

export default function PrimitivesPreview() {
  return (
    <div className="flex flex-1 flex-col">
      <Header badgeCount={3} />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <Card blueprint className="flex flex-col gap-2.5 p-3.5">
          <span className="font-(family-name:--font-heading) text-[11px] font-medium tracking-[0.16em] text-(--color-accent-700) uppercase">
            Next shift
          </span>
          <h3 className="font-(family-name:--font-heading) text-[21px] font-semibold">
            Full practice
          </h3>
          <p className="text-[13px] text-(--color-text-62)">Tue · 3:00 PM · 2h 45m</p>
          <div className="flex gap-2 pt-1">
            <Button variant="primary" className="flex-1">
              Accept shift
            </Button>
            <Button variant="secondary" className="flex-1">
              Can&apos;t make it
            </Button>
          </div>
        </Card>

        <div className="flex flex-wrap gap-2">
          <Tag variant="accent">Priority</Tag>
          <Tag variant="outline">Needs reply</Tag>
          <Tag variant="neutral">Declined</Tag>
        </div>

        <Field label="Email" helper="you@gmail.com">
          <Input type="email" placeholder="you@gmail.com" />
        </Field>

        <Seg
          options={[
            { value: "lead", label: "Head intern" },
            { value: "staff", label: "Staff" },
            { value: "intern", label: "Intern" },
          ]}
          value="lead"
          onChange={() => {}}
        />

        <Button variant="primary" fullWidth>
          Start practice mode
        </Button>
      </div>
      <TabBar role="lead" />
    </div>
  );
}
