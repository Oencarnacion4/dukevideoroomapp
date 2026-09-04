import { Suspense } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <AuthShell
      eyebrow="Duke men's basketball"
      title={
        <>
          New
          <br />
          password
        </>
      }
      tagline="Almost there — set something you'll remember this time."
    >
      <Suspense fallback={<p className="text-[13px] text-(--color-text-62)">Loading…</p>}>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
