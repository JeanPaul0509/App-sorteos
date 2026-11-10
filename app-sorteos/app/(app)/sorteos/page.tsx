import Link from "next/link";
import HeroTicket from "@/components/HeroTicket";
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
      <section className="-mx-4 -mt-6 mb-10 border-b border-gold/20 bg-brand/80 px-4 pb-10 pt-8 text-white sm:mx-0 sm:mt-0 sm:rounded-2xl sm:border sm:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col-reverse gap-7 sm:flex-row sm:items-center sm:justify-between">
            <h1
              className="anim-rise max-w-xl text-3xl font-extrabold leading-tight sm:text-4xl"
              style={{ fontStretch: "110%" }}
            >
              Elige tu número. Paga con Yape. Mira el sorteo en vivo.
            </h1>
            <div className="w-64 shrink-0 self-center sm:w-72 sm:self-auto">
              <HeroTicket />
            </div>
          </div>
          <ol className="mt-7 grid gap-3 text-sm sm:grid-cols-3">
            {[
              ["Elige hasta 5 números", "Quedan separados a tu nombre apenas los reservas."],
              ["Paga y envía tu captura", "Confirmamos cada pago a mano y tu número pasa a pagado."],
              ["Sorteo en vivo", "Sacamos el ganador frente a todos, con la lista de compradores."],
            ].map(([t, d], i) => (
              <li
                key={t}
                className="anim-rise flex gap-3 rounded-xl border border-gold/25 bg-white/5 p-4"
                style={{ ["--delay" as string]: `${250 + i * 60}ms` }}
              >
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

      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-2xl font-extrabold text-white">Sorteos activos</h2>
        <Link href="/mis-numeros" className="btn bg-white/10 py-2 text-sm text-white">
          Mis números →
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="card p-10 text-center text-gray-500">
          <div className="mb-2 text-5xl">🎟️</div>
          No hay sorteos abiertos en este momento. Vuelve pronto para ver el próximo premio.
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((r, i) => (
            <div key={r.id} className="anim-rise h-full" style={{ ["--delay" as string]: `${Math.min(i, 6) * 50}ms` }}>
              <RaffleCard raffle={r} count={byId.get(r.id)} href={`/sorteos/${r.id}`} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
