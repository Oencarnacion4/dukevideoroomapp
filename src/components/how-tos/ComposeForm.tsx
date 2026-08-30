"use client";

import { useState, useTransition } from "react";
import { OverlayHeader } from "@/components/chrome/OverlayHeader";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { Seg } from "@/components/ui/Seg";
import { Button } from "@/components/ui/Button";
import { publishGuideAction } from "@/lib/actions/guides";
import { uploadGuideMedia } from "@/lib/storage/upload";
import type { GuideFormat } from "@/lib/types";

const CATEGORIES = ["Hardware", "Software", "Workflow", "Game day"] as const;

interface DraftStep {
  title: string;
  body: string;
  imageFile: File | null;
}

export function ComposeForm() {
  const [title, setTitle] = useState("");
  const [kicker, setKicker] = useState<(typeof CATEGORIES)[number]>("Software");
  const [format, setFormat] = useState<GuideFormat>("written");
  const [intro, setIntro] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [steps, setSteps] = useState<DraftStep[]>([]);
  const [stepTitle, setStepTitle] = useState("");
  const [stepBody, setStepBody] = useState("");
  const [stepImage, setStepImage] = useState<File | null>(null);
  const [publishing, startTransition] = useTransition();

  const addStep = () => {
    if (!stepTitle.trim()) return;
    setSteps((s) => [...s, { title: stepTitle.trim(), body: stepBody.trim(), imageFile: stepImage }]);
    setStepTitle("");
    setStepBody("");
    setStepImage(null);
  };

  const removeStep = (i: number) => setSteps((s) => s.filter((_, idx) => idx !== i));

  const label = !title.trim() ? "Add a title" : steps.length === 0 ? "Add at least one step" : "Publish to the room";
  const disabled = !title.trim() || steps.length === 0 || publishing;

  const publish = () => {
    startTransition(async () => {
      const video_url = videoFile ? await uploadGuideMedia(videoFile, "videos") : null;
      const resolvedSteps = await Promise.all(
        steps.map(async (s) => ({
          title: s.title,
          body: s.body,
          image_url: s.imageFile ? await uploadGuideMedia(s.imageFile, "steps") : null,
        })),
      );
      await publishGuideAction({ kicker, title: title.trim(), format, intro: intro.trim(), video_url, steps: resolvedSteps });
    });
  };

  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-(--color-bg)">
      <OverlayHeader eyebrow="New how-to" title="Write it once" variant="close" />
      <div className="flex flex-1 flex-col gap-3.5 p-4 pb-24">
        <Field label="Title">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Resetting the corner camera mid-practice"
          />
        </Field>

        <Field label="Category">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setKicker(c)}
                className={
                  "border px-2.5 py-1 text-[12.5px] " +
                  (kicker === c
                    ? "border-(--color-accent-800) bg-(--color-accent-800) text-white"
                    : "border-(--color-divider)")
                }
              >
                {c}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Format">
          <Seg<GuideFormat>
            options={[
              { value: "written", label: "Written steps" },
              { value: "video", label: "Screen recording" },
            ]}
            value={format}
            onChange={setFormat}
          />
        </Field>

        <Field label="Intro — why this matters">
          <Textarea
            value={intro}
            onChange={(e) => setIntro(e.target.value)}
            placeholder="One or two lines. When does someone need this?"
          />
        </Field>

        {format === "video" && (
          <label className="flex h-11 w-full cursor-pointer items-center justify-center border border-(--color-accent-800) text-[14px] font-medium text-(--color-accent-800)">
            {videoFile ? "Recording attached ✓" : "Attach screen recording"}
            <input
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
            />
          </label>
        )}

        <div>
          <p className="mb-1.5 font-(family-name:--font-heading) text-[10px] font-medium uppercase tracking-[0.08em] text-(--color-text-55)">
            Steps · {steps.length}
          </p>
          <div className="flex flex-col gap-2">
            {steps.map((s, i) => (
              <div key={i} className="border border-(--color-divider) p-2.75">
                <div className="flex items-start gap-2">
                  <span className="flex h-5.5 w-5.5 shrink-0 items-center justify-center bg-(--color-accent-800) text-[11px] font-semibold text-white">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-[13.5px] font-medium">{s.title}</p>
                    <p className="text-[12.5px] text-(--color-text-62)">{s.body}</p>
                  </div>
                </div>
                <div className="mt-2 flex justify-end gap-3 text-[12px]">
                  <label className="cursor-pointer font-medium text-(--color-accent-700)">
                    {s.imageFile ? "Screenshot attached ✓" : "No screenshot"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        setSteps((prev) =>
                          prev.map((p, idx) => (idx === i ? { ...p, imageFile: e.target.files?.[0] ?? null } : p)),
                        )
                      }
                    />
                  </label>
                  <button type="button" onClick={() => removeStep(i)} className="font-medium text-(--color-accent-900)">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-2 flex flex-col gap-2 border border-(--color-divider) p-2.75">
            <Input value={stepTitle} onChange={(e) => setStepTitle(e.target.value)} placeholder="Step title" />
            <Textarea value={stepBody} onChange={(e) => setStepBody(e.target.value)} placeholder="Step body" />
            <label className="text-[12px] font-medium text-(--color-accent-700)">
              {stepImage ? "Screenshot selected" : "Attach a screenshot (optional)"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setStepImage(e.target.files?.[0] ?? null)}
              />
            </label>
            <Button variant="secondary" type="button" onClick={addStep}>
              Add step
            </Button>
          </div>
        </div>
      </div>

      <div className="fixed right-0 bottom-0 left-0 mx-auto max-w-[480px] border-t border-(--color-divider) bg-(--color-bg) p-4">
        <Button fullWidth disabled={disabled} onClick={publish}>
          {publishing ? "Publishing…" : label}
        </Button>
      </div>
    </div>
  );
}
