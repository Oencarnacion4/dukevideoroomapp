import type { SupabaseClient } from "@supabase/supabase-js";
import type { Guide, GuideFormat, GuideStep } from "@/lib/types";

export interface GuideWithAuthor extends Guide {
  author: { full_name: string } | null;
}

export async function listGuides(supabase: SupabaseClient): Promise<GuideWithAuthor[]> {
  const { data, error } = await supabase
    .from("guides")
    .select("*, author:author_id(full_name)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as unknown as GuideWithAuthor[];
}

export async function getGuideWithSteps(
  supabase: SupabaseClient,
  id: string,
): Promise<{ guide: GuideWithAuthor; steps: GuideStep[] } | null> {
  const [{ data: guide, error: guideError }, { data: steps, error: stepsError }] = await Promise.all([
    supabase.from("guides").select("*, author:author_id(full_name)").eq("id", id).maybeSingle(),
    supabase.from("guide_steps").select("*").eq("guide_id", id).order("position"),
  ]);
  if (guideError) throw guideError;
  if (stepsError) throw stepsError;
  if (!guide) return null;
  return { guide: guide as unknown as GuideWithAuthor, steps: steps ?? [] };
}

export async function createGuide(
  supabase: SupabaseClient,
  input: {
    author_id: string;
    kicker: string;
    title: string;
    format: GuideFormat;
    intro: string;
    video_url: string | null;
    document_url: string | null;
    document_name: string | null;
    steps: { title: string; body: string; image_url: string | null }[];
  },
): Promise<string> {
  const { data: guide, error: guideError } = await supabase
    .from("guides")
    .insert({
      author_id: input.author_id,
      kicker: input.kicker,
      title: input.title,
      format: input.format,
      intro: input.intro,
      video_url: input.video_url,
      document_url: input.document_url,
      document_name: input.document_name,
    })
    .select("id")
    .single();
  if (guideError) throw guideError;

  const stepRows = input.steps.map((s, i) => ({ guide_id: guide.id, position: i + 1, ...s }));
  const { error: stepsError } = await supabase.from("guide_steps").insert(stepRows);
  if (stepsError) throw stepsError;

  return guide.id;
}
