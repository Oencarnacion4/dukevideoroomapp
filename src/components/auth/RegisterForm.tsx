"use client";

import { useActionState, useMemo, useState } from "react";
import { registerAction, type AuthActionState } from "@/lib/actions/auth";
import { matchRoster, registerButtonState, registerHelperLine, type RegisterRole } from "@/lib/domain/roster";
import { Field, Input } from "@/components/ui/Field";
import { Seg } from "@/components/ui/Seg";
import { Button } from "@/components/ui/Button";

const ROLE_NOTES: Record<RegisterRole, string> = {
  intern: "Interns accept or decline shifts, log their own hours and work the task board.",
  lead: "Head intern: assign shifts, track the whole crew's hours, and keep your own timesheet.",
  staff:
    "Staff build the schedule, assign shifts and post tasks, and see everyone's hours. Salaried — no timesheet of your own.",
};

const initialState: AuthActionState = { error: null };

export function RegisterForm({ rosterNames }: { rosterNames: string[] }) {
  const [state, formAction, pending] = useActionState(registerAction, initialState);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<RegisterRole>("intern");

  const matchedName = useMemo(() => matchRoster(fullName, rosterNames), [fullName, rosterNames]);
  const button = registerButtonState(fullName, email, role, matchedName);
  const helper = registerHelperLine(role, matchedName);

  return (
    <form action={formAction} className="flex flex-col gap-3.5 px-5 py-4.5">
      <Field label="Full name" helper={helper}>
        <Input
          name="fullName"
          autoComplete="name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="e.g. Maya P."
          required
        />
      </Field>

      <Field
        label="Email"
        helper="Any email you actually check — personal is fine. Sign-in and alerts go here."
      >
        <Input
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@gmail.com"
          required
        />
      </Field>

      <Field label="Password">
        <Input
          type="password"
          name="password"
          autoComplete="new-password"
          placeholder="Choose a password"
          required
          minLength={6}
        />
      </Field>

      <Field label="Crew code from staff — optional">
        <Input name="crewCode" placeholder="6 characters" maxLength={6} />
      </Field>

      <Field label="Role" helper={ROLE_NOTES[role]}>
        <input type="hidden" name="role" value={role} />
        <Seg<RegisterRole>
          options={[
            { value: "intern", label: "Intern" },
            { value: "lead", label: "Head intern" },
            { value: "staff", label: "Staff" },
          ]}
          value={role}
          onChange={setRole}
        />
      </Field>

      {state.error && <p className="text-[12.5px] text-(--color-accent-900)">{state.error}</p>}

      <Button type="submit" fullWidth disabled={button.disabled || pending} className="mt-1.5">
        {pending ? "Creating account…" : button.label}
      </Button>
    </form>
  );
}
