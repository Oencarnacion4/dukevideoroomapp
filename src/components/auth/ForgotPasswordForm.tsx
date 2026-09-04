"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Field, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setPending(false);
    // Show the same confirmation either way — never reveal whether an
    // email is actually on file.
    if (error && error.status && error.status >= 500) {
      setError("Something went wrong — try again in a moment.");
    } else {
      setSent(true);
    }
  };

  if (sent) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-[14px] leading-relaxed">
          If <span className="font-medium">{email}</span> has an account, a reset link is on its way — check
          your email (and spam folder). The link works for a little while, then expires.
        </p>
        <Link href="/sign-in" className="text-[13px] font-medium text-(--color-accent-700)">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <p className="text-[13px] text-(--color-text-62)">
        Enter the email you registered with — we&apos;ll send a link to set a new password.
      </p>
      <Field label="Email">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@gmail.com"
          required
        />
      </Field>
      {error && <p className="text-[12.5px] text-(--color-accent-900)">{error}</p>}
      <Button type="submit" fullWidth disabled={pending} className="mt-1">
        {pending ? "Sending…" : "Send reset link"}
      </Button>
      <Link href="/sign-in" className="mt-1 text-center text-[13px] font-medium text-(--color-accent-700)">
        Back to sign in
      </Link>
    </form>
  );
}
