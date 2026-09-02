import { notFound } from "next/navigation";
import { FileText, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getGuideWithSteps } from "@/lib/data/guides";
import { OverlayHeader } from "@/components/chrome/OverlayHeader";
import { StripedPlaceholder } from "@/components/how-tos/StripedPlaceholder";

export default async function GuideDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const result = await getGuideWithSteps(supabase, id);
  if (!result) notFound();
  const { guide, steps } = result;

  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-(--color-bg)">
      <OverlayHeader eyebrow={guide.kicker} title={guide.title} />
      <div className="flex flex-col gap-4 p-4">
        {guide.format === "video" && (
          <StripedPlaceholder label="screen recording" className="aspect-video w-full" />
        )}
        <p className="text-[14px] leading-relaxed">{guide.intro}</p>

        {guide.format === "document" && guide.document_url && (
          <a
            href={guide.document_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 border border-(--color-accent-800) p-3.5"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-(--color-accent-100)">
              <FileText size={18} strokeWidth={1.5} className="text-(--color-accent-700)" />
            </span>
            <span className="flex-1">
              <span className="block text-[14px] font-medium">{guide.document_name ?? "Open document"}</span>
              <span className="block text-[12px] text-(--color-text-50)">Opens in a new tab</span>
            </span>
            <ExternalLink size={16} strokeWidth={1.5} className="text-(--color-accent-700)" />
          </a>
        )}

        <div className="flex flex-col gap-4">
          {steps.map((step) => (
            <div key={step.id} className="flex gap-3">
              <span className="flex h-6.5 w-6.5 shrink-0 items-center justify-center bg-(--color-accent-800) font-(family-name:--font-heading) text-[13px] font-semibold text-white">
                {step.position}
              </span>
              <div className="flex-1">
                <h3 className="font-(family-name:--font-heading) text-[16px] font-semibold">{step.title}</h3>
                <p className="mt-1 text-[13.5px] leading-[1.5] text-(--color-text)/78">{step.body}</p>
                {step.image_url && (
                  <StripedPlaceholder label="screenshot" className="mt-2 h-26 w-full" />
                )}
              </div>
            </div>
          ))}
        </div>

        <p className="border-t border-(--color-divider) pt-3 text-[12px] text-(--color-text-50)">
          Written by {guide.author?.full_name ?? "Unknown"} · last checked{" "}
          {new Date(guide.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </p>
      </div>
    </div>
  );
}
