import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data/profiles";
import { GameImportForm } from "@/components/schedule/GameImportForm";

export default async function ImportGamesPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile || (profile.role !== "lead" && profile.role !== "staff")) redirect("/today");

  return <GameImportForm />;
}
