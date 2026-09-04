"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Field, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

type Status = "checking" | "ready" | "invalid";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status>(() => (searchParams.get("code") ? "checking" : "invalid"));
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) return;
    const supabase = createClient();
    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      setStatus(error ? "invalid" : "ready");
    });
  }, [searchParams]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    setPending(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/today");
  };

  if (status === "checking") {
    return <p className="text-[13px] text-(--color-text-62)">Checking your link…</p>;
  }

  if (status === "invalid") {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-[14px] leading-relaxed">
          This link is expired or already used. Request a new one and try again.
        </p>
        <Link href="/forgot-password" className="text-[13px] font-medium text-(--color-accent-700)">
          Send a new reset link
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <p className="text-[13px] text-(--color-text-62)">Choose a new password for your account.</p>
      <Field label="New password">
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 6 characters"
          required
          minLength={6}
        />
      </Field>
      {error && <p className="text-[12.5px] text-(--color-accent-900)">{error}</p>}
      <Button type="submit" fullWidth disabled={pending} className="mt-1">
        {pending ? "Saving…" : "Save new password"}
      </Button>
    </form>
  );
}
