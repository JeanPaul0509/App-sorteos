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
      <h1 className="text-2xl font-extrabold">Sorteos activos</h1>
      <p className="mb-6 text-gray-500">Elige un premio y separa tus números de la suerte 🍀</p>

      {list.length === 0 ? (
        <div className="card p-10 text-center text-gray-500">
          <div className="mb-2 text-5xl">🎁</div>
          Por ahora no hay sorteos activos. ¡Vuelve pronto!
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
