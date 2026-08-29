import { createClient } from "@/lib/supabase/client";

/** Uploads a file to the `guide-media` bucket and returns its public URL. */
export async function uploadGuideMedia(file: File, prefix: string): Promise<string> {
  const supabase = createClient();
  const path = `${prefix}/${Date.now()}-${file.name}`;
  const { error } = await supabase.storage.from("guide-media").upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from("guide-media").getPublicUrl(path);
  return data.publicUrl;
}
