import { AuthShell } from "@/components/auth/AuthShell";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      eyebrow="Duke men's basketball"
      title={
        <>
          Reset your
          <br />
          password
        </>
      }
      tagline="No worries — happens to everyone. We'll email you a link."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
