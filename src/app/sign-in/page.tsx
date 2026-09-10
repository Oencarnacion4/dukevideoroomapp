import { AuthShell } from "@/components/auth/AuthShell";
import { SignInForm } from "@/components/auth/SignInForm";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
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
      <SignInForm next={next} />
    </AuthShell>
  );
}
