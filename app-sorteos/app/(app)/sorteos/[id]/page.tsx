import { notFound } from "next/navigation";
import GroupLinkBanner from "@/components/GroupLinkBanner";
import RaffleBoard from "@/components/RaffleBoard";
import { createClient } from "@/lib/supabase/server";
import type { Raffle } from "@/lib/types";
import SafeImg from "@/components/SafeImg";
import { isPastDate, money, plural } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function RafflePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: raffle }, { data: profile }, { data: groupUrl }] = await Promise.all([
    supabase.from("raffles").select("*").eq("id", id).maybeSingle(),
    supabase.from("profiles").select("phone").eq("id", user!.id).single(),
    supabase.rpc("my_group_link", { p_raffle_id: id }),
  ]);
  if (!raffle) notFound();
  const r = raffle as Raffle;
  const specs = (r.specs ?? "").split("\n").map((s) => s.trim()).filter(Boolean);

  return (
    <div className="space-y-6">
      <section className="card overflow-hidden md:flex">
        <div className="relative bg-violet-50 md:w-2/5">
          <div className="h-64 md:h-full">
            <SafeImg src={r.image_url} alt={r.title} icon={r.icon} iconClassName="text-8xl" className="h-64 w-full object-cover md:h-full" />
          </div>
        </div>
        <div className="flex-1 p-6">
          <div className="flex items-start gap-3">
            <span className="shrink-0 text-4xl">{r.icon}</span>
            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold [overflow-wrap:anywhere]">{r.title}</h1>
              <p className="text-violet-700">
                <b>{money(r.price)}</b> por número · {plural(r.total_tickets, "número", "números")}
                {r.draw_date &&
                  (r.status === "active" && isPastDate(r.draw_date) ? (
                    <> · Fecha del sorteo por confirmar</>
                  ) : (
                    <> · Sorteo: {new Date(r.draw_date + "T12:00:00").toLocaleDateString("es-PE")}</>
                  ))}
              </p>
            </div>
          </div>
          {r.description && <p className="mt-4 whitespace-pre-line text-gray-700 [overflow-wrap:anywhere]">{r.description.replace(/\n{3,}/g, "\n\n")}</p>}
          {specs.length > 0 && (
            <ul className="mt-4 grid gap-1.5 text-sm text-gray-700 [overflow-wrap:anywhere] sm:grid-cols-2">
              {specs.map((s, i) => (
                <li key={i} className="flex gap-2">
                  <span className="shrink-0 text-violet-600">✔</span>
                  {s}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {typeof groupUrl === "string" && groupUrl && <GroupLinkBanner url={groupUrl} />}

      <RaffleBoard raffle={r} phone={profile?.phone ?? ""} />
    </div>
  );
}
