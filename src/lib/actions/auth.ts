"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUnclaimedRosterNames } from "@/lib/data/profiles";
import { matchRoster, type RegisterRole } from "@/lib/domain/roster";

export interface AuthActionState {
  error: string | null;
}

export async function signInAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  redirect("/today");
}

export async function registerAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "intern") as RegisterRole;

  const supabase = await createClient();

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });
  if (signUpError) {
    return { error: signUpError.message };
  }
  if (!signUpData.user) {
    return { error: "Could not create an account — try again." };
  }

  if (role === "intern") {
    const unclaimed = await getUnclaimedRosterNames(supabase);
    const matchedName = matchRoster(
      fullName,
      unclaimed.map((p) => p.full_name),
    );
    const target = unclaimed.find((p) => p.full_name === matchedName);

    if (target) {
      const { error: claimError } = await supabase.rpc("claim_roster_profile", {
        target_id: target.id,
        p_email: email,
      });
      // Someone else claimed it between the match and the claim — fall back
      // to a fresh, unconfirmed profile rather than failing registration.
      if (!claimError) {
        redirect("/today");
      }
    }
  }

  const { error: insertError } = await supabase.from("profiles").insert({
    full_name: fullName,
    email,
    role,
    auth_user_id: signUpData.user.id,
    roster_confirmed: role !== "intern",
  });

  if (insertError) {
    return { error: insertError.message };
  }

  redirect("/today");
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/sign-in");
}
