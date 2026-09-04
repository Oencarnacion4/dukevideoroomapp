"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signInAction, type AuthActionState } from "@/lib/actions/auth";
import { Field, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

const initialState: AuthActionState = { error: null };

export function SignInForm() {
  const [state, formAction, pending] = useActionState(signInAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <Field label="Email">
        <Input type="email" name="email" placeholder="you@gmail.com" required />
      </Field>
      <Field label="Password">
        <Input type="password" name="password" placeholder="Your password" required />
      </Field>
      <Link
        href="/forgot-password"
        className="self-end text-[12.5px] font-medium text-(--color-accent-700) hover:text-(--color-accent-900)"
      >
        Forgot password?
      </Link>
      {state.error && <p className="text-[12.5px] text-(--color-accent-900)">{state.error}</p>}
      <Button type="submit" fullWidth disabled={pending} className="mt-1">
        {pending ? "Signing in…" : "Sign in"}
      </Button>
      <p className="mt-2 flex items-center justify-between text-[13px] text-(--color-text-62)">
        New intern this season?
        <Link href="/register" className="font-medium text-(--color-accent-700) hover:text-(--color-accent-900)">
          Register
        </Link>
      </p>
    </form>
  );
}
