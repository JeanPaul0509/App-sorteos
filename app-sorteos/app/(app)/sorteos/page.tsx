import RaffleCard from "@/components/RaffleCard";
import { createClient } from "@/lib/supabase/server";
import type { Raffle, RaffleCount } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function SorteosPage() {
  const supabase = await createClient();
  const [{ data: raffles }, { data: counts }] = await Promise.all([
    supabase.from("raffles").select("*").eq("status", "active").order("created_at", { ascending: false }),
    supabase.rpc("raffle_counts"),
  ]);
  const byId = new Map(((counts ?? []) as RaffleCount[]).map((c) => [c.raffle_id, c]));
  const list = (raffles ?? []) as Raffle[];

  return (
    <div>
      <section className="-mx-4 -mt-6 mb-8 bg-ink px-4 pb-10 pt-8 text-white sm:mx-0 sm:mt-0 sm:rounded-2xl sm:px-8">
        <div className="mx-auto max-w-5xl">
          <h1 className="max-w-xl text-3xl font-extrabold leading-tight sm:text-4xl" style={{ fontStretch: "110%" }}>
            Elige tu número. Paga con Yape. Mira el sorteo en vivo.
          </h1>
          <ol className="mt-6 grid gap-3 text-sm sm:grid-cols-3">
            {[
              ["Elige hasta 5 números", "Quedan separados a tu nombre apenas los reservas."],
              ["Paga y envía tu captura", "Confirmamos cada pago a mano y tu número pasa a pagado."],
              ["Sorteo en vivo", "Sacamos el ganador frente a todos, con la lista de compradores."],
            ].map(([t, d], i) => (
              <li key={t} className="flex gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold font-extrabold text-ink">
                  {i + 1}
                </span>
                <span>
                  <b className="block text-white">{t}</b>
                  <span className="text-white/65">{d}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <h2 className="mb-5 text-2xl font-extrabold">Sorteos activos</h2>

      {list.length === 0 ? (
        <div className="card p-10 text-center text-gray-500">
          <div className="mb-2 text-5xl">🎟️</div>
          No hay sorteos abiertos en este momento. Vuelve pronto para ver el próximo premio.
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((r) => (
            <RaffleCard key={r.id} raffle={r} count={byId.get(r.id)} href={`/sorteos/${r.id}`} />
          ))}
        </div>
      )}
    </div>
  );
}
