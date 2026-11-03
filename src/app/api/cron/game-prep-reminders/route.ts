import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Hit once a day by a scheduler (Vercel Cron, see vercel.json) — no
 * signed-in user, so this runs through Supabase as the anon role. All the
 * actual work happens in send_game_prep_reminders() (migration 0017),
 * which is SECURITY DEFINER and naturally idempotent per day.
 *
 * If CRON_SECRET is set, the caller must send it as a bearer token —
 * matches Vercel's own documented pattern for protecting cron routes.
 * Left unprotected if the env var isn't configured, so this still works
 * for local testing without extra setup.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("send_game_prep_reminders");

  if (error) {
    // Migration 0017 may not have run yet on this Supabase project — fail
    // quietly rather than erroring the cron job every day until it has.
    if (error.message?.includes("send_game_prep_reminders")) {
      return NextResponse.json({ sent: 0, note: "game prep migration not run yet" });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ sent: data ?? 0 });
}
