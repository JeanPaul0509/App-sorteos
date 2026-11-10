"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import ConfirmWordModal from "@/components/ConfirmWordModal";
import { createClient } from "@/lib/supabase/client";
import type { Raffle, RaffleCount } from "@/lib/types";
import SafeImg from "@/components/SafeImg";
import { money, num, plural } from "@/lib/utils";

export default function AdminPage() {
  const supabase = useMemo(() => createClient(), []);
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [counts, setCounts] = useState<Map<string, RaffleCount>>(new Map());
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<{ raffle: Raffle; action: "delete" | "finish" } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [{ data: r }, { data: c }] = await Promise.all([
      supabase.from("raffles").select("*").order("created_at", { ascending: false }),
      supabase.rpc("raffle_counts"),
    ]);
    setRaffles((r ?? []) as Raffle[]);
    setCounts(new Map(((c ?? []) as RaffleCount[]).map((x) => [x.raffle_id, x])));
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  async function setStatus(r: Raffle, status: "active" | "finished") {
    setBusy(true);
    const { error } = await supabase.from("raffles").update({ status }).eq("id", r.id);
    setBusy(false);
    if (error) return alert(error.message);
    setPending(null);
    load();
  }

  async function remove(r: Raffle) {
    setBusy(true);
    const { error } = await supabase.from("raffles").delete().eq("id", r.id);
    setBusy(false);
    if (error) return alert(error.message);
    setPending(null);
    load();
  }

  function toggleStatus(r: Raffle) {
    // Reactivar es seguro; finalizar pide confirmación escrita.
    if (r.status === "finished") return setStatus(r, "active");
    setPending({ raffle: r, action: "finish" });
  }

  const pendingTotal = [...counts.values()].reduce((a, c) => a + Number(c.reserved), 0);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Sorteos</h1>
          <p className="text-white/60">
            {pendingTotal > 0 ? (
              <>
                Tienes <b className="text-gold">{plural(pendingTotal, "número reservado", "números reservados")}</b> esperando confirmación
              </>
            ) : (
              "No hay pagos pendientes"
            )}
          </p>
        </div>
        <Link href="/admin/nuevo" className="btn btn-primary">
          + Nuevo sorteo
        </Link>
      </div>

      {loading ? (
        <p className="text-gray-400">Cargando...</p>
      ) : raffles.length === 0 ? (
        <div className="card p-10 text-center text-gray-500">Aún no creaste ningún sorteo.</div>
      ) : (
        <div className="space-y-3">
          {raffles.map((r) => {
            const c = counts.get(r.id);
            return (
              <div key={r.id} className="card flex flex-wrap items-center gap-4 p-4">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-violet-50">
                  <SafeImg src={r.image_url} alt={r.title} icon={r.icon} iconClassName="text-3xl" className="h-full w-full object-cover" />
                </div>
                <div className="min-w-[12rem] flex-1">
                  <p className="font-bold [overflow-wrap:anywhere]">
                    {r.icon} {r.title}{" "}
                    <span
                      className={`ml-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs ${
                        r.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {r.status === "active" ? "Activo" : "Finalizado"}
                    </span>
                  </p>
                  <p className="text-sm text-gray-500">
                    {plural(r.total_tickets, "número", "números")} · {money(r.price)} c/u
                  </p>
                  <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm">
                    <span className="text-green-600">🟢 {num(c?.available ?? r.total_tickets)}</span>
                    <span className="text-yellow-600">🟡 {num(c?.reserved)}</span>
                    <span className="text-gray-500">⚪ {plural(Number(c?.sold ?? 0), "vendido", "vendidos")}</span>
                    <span className="font-semibold text-violet-700">
                      {money(Number(c?.sold ?? 0) * Number(r.price))}
                    </span>
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/admin/sorteos/${r.id}`} className="btn btn-primary py-2 text-sm">
                    Gestionar números
                  </Link>
                  <button onClick={() => toggleStatus(r)} className="btn btn-light py-2 text-sm">
                    {r.status === "active" ? "Finalizar" : "Reactivar"}
                  </button>
                  <button onClick={() => setPending({ raffle: r, action: "delete" })} className="btn btn-danger py-2 text-sm">
                    Eliminar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {pending && (
        <ConfirmWordModal
          key={pending.raffle.id + pending.action}
          word={pending.action === "delete" ? "ELIMINAR" : "FINALIZAR"}
          danger={pending.action === "delete"}
          busy={busy}
          title={pending.action === "delete" ? "⚠️ Eliminar sorteo" : "Finalizar sorteo"}
          confirmLabel={pending.action === "delete" ? "Eliminar para siempre" : "Finalizar sorteo"}
          message={
            pending.action === "delete" ? (
              <>
                Vas a eliminar <b>{pending.raffle.title}</b> con <b>TODOS</b> sus números, compradores y pagos.
                <br />
                <b className="text-red-600">Esto no se puede deshacer.</b>
              </>
            ) : (
              <>
                Vas a finalizar <b>{pending.raffle.title}</b>. Desaparecerá de los sorteos activos y nadie
                podrá comprar más números. Los compradores se mantienen y luego puedes reactivarlo.
              </>
            )
          }
          onCancel={() => setPending(null)}
          onConfirm={() =>
            pending.action === "delete" ? remove(pending.raffle) : setStatus(pending.raffle, "finished")
          }
        />
      )}
    </div>
  );
}
