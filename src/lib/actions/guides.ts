"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data/profiles";
import { createGuide } from "@/lib/data/guides";
import type { GuideFormat } from "@/lib/types";

export interface ComposeStepInput {
  title: string;
  body: string;
  image_url: string | null;
}

export async function publishGuideAction(input: {
  kicker: string;
  title: string;
  format: GuideFormat;
  intro: string;
  video_url: string | null;
  steps: ComposeStepInput[];
}): Promise<void> {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) throw new Error("Not signed in");

  const guideId = await createGuide(supabase, { ...input, author_id: profile.id });
  redirect(`/how-tos/${guideId}`);
}
