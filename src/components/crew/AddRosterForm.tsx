"use client";

import { useRef, useState, useTransition } from "react";
import { addRosterNameAction } from "@/lib/actions/roster";
import { Button } from "@/components/ui/Button";

export function AddRosterForm() {
  const [name, setName] = useState("");
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = () => {
    const value = name.trim();
    if (!value) return;
    setName("");
    startTransition(() => addRosterNameAction(value));
    inputRef.current?.focus();
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex gap-2"
    >
      <input
        ref={inputRef}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Add a name to the roster"
        className="h-11 flex-1 border border-(--color-divider) bg-transparent px-3 text-[16px] placeholder:text-(--color-text-50)"
      />
      <Button type="submit" disabled={pending}>
        Add
      </Button>
    </form>
  );
}
