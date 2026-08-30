import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data/profiles";
import { getBadgeCount } from "@/lib/data/badge";
import { Header } from "@/components/chrome/Header";
import { TabBar } from "@/components/chrome/TabBar";
import { ToastProvider } from "@/components/ui/Toast";

export default async function TabsLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) redirect("/sign-in");

  const badgeCount = await getBadgeCount(supabase, profile);

  return (
    <ToastProvider>
      <div className="flex min-h-dvh flex-1 flex-col">
        <Header badgeCount={badgeCount} />
        <main className="flex flex-1 flex-col">{children}</main>
        <TabBar role={profile.role} />
      </div>
    </ToastProvider>
  );
}
