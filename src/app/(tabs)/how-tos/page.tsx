import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data/profiles";
import { listGuides } from "@/lib/data/guides";
import { Card } from "@/components/ui/Card";
import { buttonClasses } from "@/components/ui/Button";
import { StripedPlaceholder } from "@/components/how-tos/StripedPlaceholder";

export default async function HowTosPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) redirect("/sign-in");

  const guides = await listGuides(supabase);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pb-6">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-(family-name:--font-heading) text-[21px] font-semibold">How-tos</h4>
          <p className="text-[13px] text-(--color-text-62)">Written by the room, for the room.</p>
        </div>
        <Link href="/how-tos/new" className={buttonClasses("primary", false, "h-9 px-3 text-[13px]")}>
          + New
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        {guides.map((g) => (
          <Link key={g.id} href={`/how-tos/${g.id}`}>
            <Card blueprint className="flex overflow-hidden p-0">
              <StripedPlaceholder
                label={g.format === "video" ? "screen recording" : "photo"}
                className="w-21 shrink-0 border-r border-(--color-divider)"
              />
              <div className="flex flex-1 flex-col justify-center gap-0.5 p-3">
                <span className="font-(family-name:--font-heading) text-[10px] font-medium uppercase tracking-[0.1em] text-(--color-accent-700)">
                  {g.kicker}
                </span>
                <span className="font-(family-name:--font-heading) text-[17px] font-semibold">{g.title}</span>
                <span className="text-[11px] text-(--color-text-50)">
                  {g.format === "written" ? "Written" : "Video"} · {g.author?.full_name ?? "Unknown"}
                </span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
