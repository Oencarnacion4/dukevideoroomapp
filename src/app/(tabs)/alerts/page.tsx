import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data/profiles";
import { listNotifications, markAlertsSeen } from "@/lib/data/notifications";
import { signOutAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/Button";

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60_000);
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

export default async function AlertsPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) redirect("/sign-in");

  const wasUnseen = !profile.alerts_seen_at;
  const notifications = await listNotifications(supabase);
  if (wasUnseen) await markAlertsSeen(supabase, profile.id);

  return (
    <div className="flex flex-1 flex-col gap-3 p-4 pb-6">
      <div className="flex items-center justify-between">
        <h4 className="font-(family-name:--font-heading) text-[21px] font-semibold">Alerts</h4>
        <Link href="/today" className="text-[13px] font-medium text-(--color-accent-700)">
          Done
        </Link>
      </div>

      <div className="flex flex-col">
        {notifications.map((n) => (
          <div key={n.id} className="flex items-start gap-2.5 border-b border-(--color-divider) py-3 last:border-b-0">
            <span
              className={`mt-1.5 h-[7px] w-[7px] shrink-0 ${
                !n.read_at && wasUnseen ? "bg-(--color-accent)" : "bg-(--color-text)/25"
              }`}
            />
            <div className="flex-1">
              <p className="text-[14px]">{n.title}</p>
              {n.body && <p className="mt-0.5 text-[12px] text-(--color-text-62)">{n.body}</p>}
            </div>
            <span className="shrink-0 text-[11px] text-(--color-text-50)">{timeAgo(n.created_at)}</span>
          </div>
        ))}
        {notifications.length === 0 && (
          <p className="py-6 text-center text-[13px] text-(--color-text-50)">No alerts yet.</p>
        )}
      </div>

      <form action={signOutAction} className="mt-auto pt-4">
        <Button type="submit" variant="secondary" fullWidth>
          Sign out
        </Button>
      </form>
    </div>
  );
}
