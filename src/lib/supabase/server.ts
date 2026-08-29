import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server Component / Server Action / Route Handler client. Runs as the
 * signed-in user (via their session cookie) and is subject to RLS — this
 * app never uses a service-role key at runtime.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component with no request/response to
            // write to — safe to ignore as long as middleware refreshes
            // the session on every navigation (see middleware.ts).
          }
        },
      },
    },
  );
}
