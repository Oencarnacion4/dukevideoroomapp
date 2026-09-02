import { AuthShell } from "@/components/auth/AuthShell";
import { SignInForm } from "@/components/auth/SignInForm";

export default function SignInPage() {
  return (
    <AuthShell
      eyebrow="Duke men's basketball"
      title={
        <>
          Video
          <br />
          Room
        </>
      }
      tagline="Shifts, hours, task board and resources for the practice video crew."
    >
      <SignInForm />
    </AuthShell>
  );
}
