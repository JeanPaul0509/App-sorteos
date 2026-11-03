"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Raffle, RaffleCount } from "@/lib/types";
import { money } from "@/lib/utils";

export default function AdminPage() {
  const supabase = useMemo(() => createClient(), []);
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [counts, setCounts] = useState<Map<string, RaffleCount>>(new Map());
  const [loading, setLoading] = useState(true);

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

  async function toggleStatus(r: Raffle) {
    const status = r.status === "active" ? "finished" : "active";
    const { error } = await supabase.from("raffles").update({ status }).eq("id", r.id);
    if (error) return alert(error.message);
    load();
  }

  async function remove(r: Raffle) {
    if (!confirm(`¿Eliminar "${r.title}" y TODOS sus números? Esto no se puede deshacer.`)) return;
    const { error } = await supabase.from("raffles").delete().eq("id", r.id);
    if (error) return alert(error.message);
    load();
  }

  const pendingTotal = [...counts.values()].reduce((a, c) => a + Number(c.reserved), 0);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Panel de administrador</h1>
          <p className="text-gray-500">
            {pendingTotal > 0 ? (
              <>
                Tienes <b className="text-yellow-600">{pendingTotal} números reservados</b> esperando confirmación
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
                  {r.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.image_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-3xl">{r.icon}</div>
                  )}
                </div>
                <div className="min-w-[12rem] flex-1">
                  <p className="font-bold">
                    {r.icon} {r.title}{" "}
                    <span
                      className={`ml-1 rounded-full px-2 py-0.5 text-xs ${
                        r.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {r.status === "active" ? "Activo" : "Finalizado"}
                    </span>
                  </p>
                  <p className="text-sm text-gray-500">
                    {r.total_tickets} números · {money(r.price)} c/u
                  </p>
                  <p className="mt-1 flex gap-3 text-sm">
                    <span className="text-green-600">🟢 {c?.available ?? r.total_tickets}</span>
                    <span className="text-yellow-600">🟡 {c?.reserved ?? 0}</span>
                    <span className="text-gray-500">⚪ {c?.sold ?? 0} vendidos</span>
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
                  <button onClick={() => remove(r)} className="btn btn-danger py-2 text-sm">
                    Eliminar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
