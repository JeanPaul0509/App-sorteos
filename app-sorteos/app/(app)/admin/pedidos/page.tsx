"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ORDER_STATUS, orderStatusWhatsAppUrl } from "@/lib/store";
import type { Order, OrderStatus } from "@/lib/types";
import { buyerWhatsAppUrl, money, num, plural, timeAgo } from "@/lib/utils";

type Filter = "pending" | "paid" | "delivered" | "cancelled" | "all";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "pending", label: "Por cobrar" },
  { key: "paid", label: "Por entregar" },
  { key: "delivered", label: "Entregados" },
  { key: "cancelled", label: "Cancelados" },
  { key: "all", label: "Todos" },
];

export default function AdminOrdersPage() {
  const supabase = useMemo(() => createClient(), []);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("pending");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false })
      .limit(300);
    setOrders((data ?? []) as Order[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
    const id = setInterval(load, 20000); // pedidos nuevos aparecen solos
    const onVisible = () => document.visibilityState === "visible" && load();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  async function setStatus(o: Order, status: OrderStatus) {
    setBusyId(o.id);
    setError(null);
    const { error: err } = await supabase.rpc("admin_set_order_status", { p_order_id: o.id, p_status: status });
    setBusyId(null);
    setCancelId(null);
    if (err) setError(err.message);
    load();
  }

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { pending: 0, paid: 0, delivered: 0, cancelled: 0, all: orders.length };
    orders.forEach((o) => c[o.status]++);
    return c;
  }, [orders]);

  const shown = orders.filter((o) => filter === "all" || o.status === filter);

  // Qué preparar para el domingo: suma de lo ya pagado y aún no entregado
  const toPrepare = useMemo(() => {
    const m = new Map<string, number>();
    orders
      .filter((o) => o.status === "paid")
      .forEach((o) => o.order_items.forEach((i) => m.set(i.name, (m.get(i.name) ?? 0) + i.qty)));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [orders]);

  const pendingMoney = orders.filter((o) => o.status === "pending").reduce((a, o) => a + Number(o.total), 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold">Pedidos</h1>
        <p className="text-white/60">
          {counts.pending > 0 ? (
            <>
              <b className="text-gold">{plural(counts.pending, "pedido", "pedidos")}</b> esperando pago (
              {money(pendingMoney)})
            </>
          ) : (
            "No hay pagos pendientes"
          )}
        </p>
      </div>

      <div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label="Estado de los pedidos">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            role="tab"
            aria-selected={filter === f.key}
            onClick={() => setFilter(f.key)}
            className={`btn py-2 text-sm ${filter === f.key ? "bg-gold text-ink" : "bg-white/10 text-white"}`}
          >
            {f.label} <span className="opacity-70">{num(counts[f.key])}</span>
          </button>
        ))}
      </div>

      {filter === "paid" && toPrepare.length > 0 && (
        <div className="card mb-5 p-4">
          <h2 className="font-extrabold">🍗 Para preparar y entregar</h2>
          <ul className="mt-2 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
            {toPrepare.map(([name, qty]) => (
              <li key={name} className="flex justify-between gap-3">
                <span className="[overflow-wrap:anywhere]">{name}</span>
                <b>{num(qty)}</b>
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <div className="space-y-3" aria-busy="true">
          {[0, 1].map((i) => (
            <div key={i} className="skeleton h-36 rounded-2xl" />
          ))}
        </div>
      ) : shown.length === 0 ? (
        <div className="card p-10 text-center text-gray-500">No hay pedidos en esta lista.</div>
      ) : (
        <div className="space-y-4">
          {shown.map((o) => {
            const st = ORDER_STATUS[o.status];
            const items = o.order_items.map((i) => ({ name: i.name, price: Number(i.price), qty: i.qty }));
            const busy = busyId === o.id;
            return (
              <article key={o.id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="font-extrabold [overflow-wrap:anywhere]">
                      N.º {o.order_no} · {o.buyer_name}
                    </h2>
                    <p className="text-sm text-gray-500">
                      <a href={`tel:${o.buyer_phone}`} className="font-semibold text-violet-700">
                        {o.buyer_phone}
                      </a>{" "}
                      · {timeAgo(o.created_at)}
                    </p>
                  </div>
                  <span className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${st.cls}`}>
                    {st.label}
                  </span>
                </div>

                <ul className="mt-3 space-y-1 text-sm">
                  {o.order_items.map((i) => (
                    <li key={i.id} className="flex justify-between gap-3">
                      <span className="[overflow-wrap:anywhere]">
                        {i.qty} × {i.name}
                      </span>
                      <span className="shrink-0">{money(Number(i.price) * i.qty)}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 flex justify-between border-t border-dashed border-[var(--color-line)] pt-3">
                  <span className="text-sm text-gray-600">Total</span>
                  <b className="text-lg text-violet-700">{money(o.total)}</b>
                </p>
                {o.address && <p className="mt-2 text-sm text-gray-700 [overflow-wrap:anywhere]">📍 {o.address}</p>}
                {o.note && <p className="mt-1 text-sm text-gray-700 [overflow-wrap:anywhere]">📝 {o.note}</p>}

                <div className="mt-4 flex flex-wrap gap-2">
                  {o.status === "pending" && (
                    <button onClick={() => setStatus(o, "paid")} disabled={busy} className="btn btn-primary py-2 text-sm">
                      {busy ? "Guardando..." : "Confirmar pago"}
                    </button>
                  )}
                  {o.status === "paid" && (
                    <button onClick={() => setStatus(o, "delivered")} disabled={busy} className="btn btn-primary py-2 text-sm">
                      {busy ? "Guardando..." : "Marcar entregado"}
                    </button>
                  )}
                  <a
                    href={
                      o.status === "pending"
                        ? buyerWhatsAppUrl(o.buyer_phone)
                        : orderStatusWhatsAppUrl({
                            phone: o.buyer_phone,
                            name: o.buyer_name,
                            orderNo: o.order_no,
                            status: o.status,
                            items,
                            total: Number(o.total),
                          })
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-green py-2 text-sm"
                  >
                    {o.status === "pending" ? "Escribirle por WhatsApp" : "Avisarle por WhatsApp"}
                  </a>
                  {(o.status === "pending" || o.status === "paid") &&
                    (cancelId === o.id ? (
                      <>
                        <button onClick={() => setStatus(o, "cancelled")} disabled={busy} className="btn btn-danger py-2 text-sm">
                          {busy ? "Cancelando..." : "Sí, cancelar y devolver stock"}
                        </button>
                        <button onClick={() => setCancelId(null)} disabled={busy} className="btn btn-light py-2 text-sm">
                          No
                        </button>
                      </>
                    ) : (
                      <button onClick={() => setCancelId(o.id)} className="btn btn-light py-2 text-sm">
                        Cancelar
                      </button>
                    ))}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
