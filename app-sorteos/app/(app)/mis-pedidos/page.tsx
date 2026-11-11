"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { buildOrderWhatsAppUrl, ORDER_STATUS } from "@/lib/store";
import type { Order } from "@/lib/types";
import { formatDate, money, YAPE_NAME, YAPE_NUMBER } from "@/lib/utils";

export default function MisPedidosPage() {
  const supabase = useMemo(() => createClient(), []);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false })
      .limit(50);
    setOrders((data ?? []) as Order[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
    const onVisible = () => document.visibilityState === "visible" && load();
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [load]);

  async function cancel(id: string) {
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.rpc("cancel_my_order", { p_order_id: id });
    setBusy(false);
    setConfirmId(null);
    if (err) setError(err.message);
    load();
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 font-display text-4xl font-semibold tracking-tight">Mis pedidos</h1>

      {error && <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {loading ? (
        <div className="space-y-3" aria-busy="true">
          {[0, 1].map((i) => (
            <div key={i} className="skeleton h-32 rounded-2xl" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="card p-10 text-center text-gray-500">
          <div className="mb-2 text-5xl">🍗</div>
          Aún no hiciste ningún pedido.{" "}
          <Link href="/tienda" className="font-semibold text-violet-700">
            Ver la tienda
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => {
            const st = ORDER_STATUS[o.status];
            const items = o.order_items ?? [];
            return (
              <article key={o.id} className="card p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-extrabold">Pedido N.º {o.order_no}</h2>
                  <span className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${st.cls}`}>
                    {st.label}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{formatDate(o.created_at)}</p>

                <ul className="mt-3 space-y-1 text-sm">
                  {items.map((i) => (
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
                {o.address && <p className="mt-2 text-sm text-gray-600 [overflow-wrap:anywhere]">📍 {o.address}</p>}

                {o.status === "pending" && (
                  <div className="mt-4 space-y-2">
                    <p className="rounded-xl bg-paper p-3 text-sm text-gray-700">
                      Yapea {money(o.total)}
                      {YAPE_NUMBER && <> al <b>{YAPE_NUMBER}</b></>}
                      {YAPE_NAME && <> ({YAPE_NAME})</>} y envía la captura por WhatsApp.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <a
                        href={buildOrderWhatsAppUrl({
                          orderNo: o.order_no,
                          name: o.buyer_name,
                          phone: o.buyer_phone,
                          address: o.address ?? "",
                          note: o.note,
                          items: items.map((i) => ({ name: i.name, price: Number(i.price), qty: i.qty })),
                          total: Number(o.total),
                        })}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-green py-2 text-sm"
                      >
                        Enviar captura por WhatsApp
                      </a>
                      {confirmId === o.id ? (
                        <>
                          <button onClick={() => cancel(o.id)} disabled={busy} className="btn btn-danger py-2 text-sm">
                            {busy ? "Cancelando..." : "Sí, cancelar"}
                          </button>
                          <button onClick={() => setConfirmId(null)} disabled={busy} className="btn btn-light py-2 text-sm">
                            No
                          </button>
                        </>
                      ) : (
                        <button onClick={() => setConfirmId(o.id)} className="btn btn-light py-2 text-sm">
                          Cancelar pedido
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
