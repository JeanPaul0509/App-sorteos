import { notFound } from "next/navigation";
import RaffleBoard from "@/components/RaffleBoard";
import { createClient } from "@/lib/supabase/server";
import type { Raffle } from "@/lib/types";
import { money } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function RafflePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: raffle }, { data: profile }] = await Promise.all([
    supabase.from("raffles").select("*").eq("id", id).maybeSingle(),
    supabase.from("profiles").select("phone").eq("id", user!.id).single(),
  ]);
  if (!raffle) notFound();
  const r = raffle as Raffle;
  const specs = (r.specs ?? "").split("\n").map((s) => s.trim()).filter(Boolean);

  return (
    <div className="space-y-6">
      <section className="card overflow-hidden md:flex">
        <div className="relative bg-violet-50 md:w-2/5">
          {r.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={r.image_url} alt={r.title} className="h-64 w-full object-cover md:h-full" />
          ) : (
            <div className="flex h-64 items-center justify-center text-8xl">{r.icon}</div>
          )}
        </div>
        <div className="flex-1 p-6">
          <div className="flex items-start gap-3">
            <span className="text-4xl">{r.icon}</span>
            <div>
              <h1 className="text-2xl font-extrabold">{r.title}</h1>
              <p className="text-violet-700">
                <b>{money(r.price)}</b> por número · {r.total_tickets} números
                {r.draw_date && <> · Sorteo: {new Date(r.draw_date + "T12:00:00").toLocaleDateString("es-PE")}</>}
              </p>
            </div>
          </div>
          {r.description && <p className="mt-4 whitespace-pre-line text-gray-700">{r.description}</p>}
          {specs.length > 0 && (
            <ul className="mt-4 grid gap-1.5 text-sm text-gray-700 sm:grid-cols-2">
              {specs.map((s, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-violet-600">✔</span>
                  {s}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <RaffleBoard raffle={r} phone={profile?.phone ?? ""} />
    </div>
  );
}
