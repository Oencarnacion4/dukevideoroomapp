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
  const payload = {
    author_id: input.author_id,
    kicker: input.kicker,
    title: input.title,
    format: input.format,
    intro: input.intro,
    video_url: input.video_url,
    document_url: input.document_url,
    document_name: input.document_name,
  };

  let { data: guide, error: guideError } = await supabase.from("guides").insert(payload).select("id").single();

  // document_url/document_name were added in migration 0010. If it hasn't
  // run yet, inserting them fails — as a raw SQL "column does not exist"
  // (42703) or PostgREST's schema-cache-miss error (PGRST204) — retry
  // without them so a written/video guide still publishes.
  if (
    guideError &&
    (guideError.code === "42703" || guideError.code === "PGRST204") &&
    guideError.message.includes("document")
  ) {
    const { document_url: _u, document_name: _n, ...fallbackPayload } = payload;
    const retry = await supabase.from("guides").insert(fallbackPayload).select("id").single();
    guide = retry.data;
    guideError = retry.error;
  }
  if (guideError) throw guideError;
  if (!guide) throw new Error("Guide insert returned no row.");

  const stepRows = input.steps.map((s, i) => ({ guide_id: guide.id, position: i + 1, ...s }));
  const { error: stepsError } = await supabase.from("guide_steps").insert(stepRows);
  if (stepsError) throw stepsError;

  return guide.id;
}
