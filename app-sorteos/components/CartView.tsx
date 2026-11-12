"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCart } from "@/components/CartProvider";
import SafeImg from "@/components/SafeImg";
import { createClient } from "@/lib/supabase/client";
import { buildOrderWhatsAppUrl, CATEGORIES, DELIVERY_NOTE, MAX_QTY, priceTiers, PROMO_NOTE, tiersTotal } from "@/lib/store";
import type { Product } from "@/lib/types";
import { money, plural, YAPE_NAME, YAPE_NUMBER } from "@/lib/utils";

interface Done {
  orderNo: number;
  total: number;
  url: string;
}

/** Carrito y pago: revisa el stock real, crea el pedido y abre WhatsApp para enviar la captura de Yape. */
export default function CartView({ phone }: { phone: string }) {
  const supabase = useMemo(() => createClient(), []);
  const { lines, ready, setQty, clear } = useCart();
  const linesRef = useRef(lines);
  linesRef.current = lines;

  const [products, setProducts] = useState<Map<string, Product>>(new Map());
  const [loaded, setLoaded] = useState(false);
  const [promo, setPromo] = useState<{ active: boolean; used: Record<string, number> }>({ active: false, used: {} });
  const [notice, setNotice] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<Done | null>(null);

  // Trae los productos del carrito con su precio y stock de ahora, y ajusta lo que ya no se pueda comprar.
  const refresh = useCallback(async () => {
    const ids = linesRef.current.map((l) => l.id);
    if (ids.length === 0) {
      setLoaded(true);
      return;
    }
    const { data } = await supabase.from("products").select("*").in("id", ids).eq("active", true);
    const map = new Map(((data ?? []) as Product[]).map((p) => [p.id, p]));
    setProducts(map);
    const { data: pi } = await supabase.rpc("promo_info"); // si aún no corrieron la migración 010, queda sin oferta
    if (pi) setPromo(pi as { active: boolean; used: Record<string, number> });

    const removed: string[] = [];
    const lowered: string[] = [];
    for (const l of linesRef.current) {
      const p = map.get(l.id);
      if (!p || p.stock <= 0) {
        removed.push(p?.name ?? "un producto");
        setQty(l.id, 0);
      } else if (l.qty > p.stock) {
        lowered.push(`${p.name} (quedan ${p.stock})`);
        setQty(l.id, p.stock);
      }
    }
    const parts: string[] = [];
    if (removed.length) parts.push(`Se quitó lo que ya no está disponible: ${removed.join(", ")}.`);
    if (lowered.length) parts.push(`Bajamos la cantidad según el stock: ${lowered.join(", ")}.`);
    setNotice(parts.length ? parts.join(" ") : null);
    setLoaded(true);
  }, [supabase, setQty]);

  useEffect(() => {
    if (!ready) return;
    refresh();
    try {
      setName(localStorage.getItem("gekko_nombre") ?? "");
      setAddress(localStorage.getItem("gekko_direccion") ?? "");
    } catch {}
  }, [ready, refresh]);

  const rows = lines
    .map((l) => ({ line: l, product: products.get(l.id) }))
    .filter((r): r is { line: { id: string; qty: number }; product: Product } => !!r.product);
  const tiersOf = (r: { line: { qty: number }; product: Product }) =>
    priceTiers(
      r.line.qty,
      Number(r.product.price),
      promo.active && r.product.category === "pollo",
      promo.used[r.product.id] ?? 0,
    );
  const total = rows.reduce((a, r) => a + tiersTotal(tiersOf(r)), 0);
  const units = rows.reduce((a, r) => a + r.line.qty, 0);

  async function submit() {
    setError(null);
    if (!name.trim()) return setError("Escribe tu nombre.");
    if (!address.trim()) return setError("Escribe tu dirección o una referencia para la entrega.");
    if (rows.length === 0) return setError("Tu carrito está vacío.");

    setSending(true);
    const { data, error: err } = await supabase.rpc("create_order", {
      p_items: rows.map((r) => ({ product_id: r.product.id, qty: r.line.qty })),
      p_name: name.trim(),
      p_address: address.trim(),
      p_note: note.trim(),
    });
    setSending(false);
    if (err) {
      setError(err.message);
      refresh();
      return;
    }
    const order = data as { order_no: number; total: number; items: { name: string; price: number; qty: number }[] };
    try {
      localStorage.setItem("gekko_nombre", name.trim());
      localStorage.setItem("gekko_direccion", address.trim());
    } catch {}

    const url = buildOrderWhatsAppUrl({
      orderNo: order.order_no,
      name: name.trim(),
      phone,
      address: address.trim(),
      note: note.trim() || null,
      items: order.items,
      total: Number(order.total),
    });
    clear();
    setDone({ orderNo: order.order_no, total: Number(order.total), url });
    window.open(url, "_blank"); // si el navegador lo bloquea, queda el botón verde
  }

  if (done) {
    return (
      <div className="mx-auto max-w-lg">
        <div className="card anim-modal p-6 text-center">
          <div className="text-5xl">✅</div>
          <h1 className="mt-2 text-2xl font-extrabold">¡Pedido N.º {done.orderNo} recibido!</h1>
          <p className="mt-2 text-sm text-gray-600">
            Ahora yapea <b>{money(done.total)}</b>
            {YAPE_NUMBER && <> al <b>{YAPE_NUMBER}</b></>}
            {YAPE_NAME && <> ({YAPE_NAME})</>} y envía la captura por WhatsApp. Confirmamos tu pago a mano y te
            avisamos por ahí.
          </p>
          <a href={done.url} target="_blank" rel="noopener noreferrer" className="btn btn-green mt-5 block w-full">
            Abrir WhatsApp y enviar captura 💬
          </a>
          <Link href="/mis-pedidos" className="btn btn-light mt-2 block w-full">
            Ver mis pedidos
          </Link>
          <p className="mt-4 text-xs text-gray-500">{DELIVERY_NOTE}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/tienda" className="text-sm text-gold">
        ← Seguir comprando
      </Link>
      <h1 className="mb-6 mt-2 font-display text-4xl font-semibold tracking-tight">Tu carrito</h1>

      {!ready || !loaded ? (
        <div className="space-y-3" aria-busy="true">
          {[0, 1].map((i) => (
            <div key={i} className="skeleton h-20 rounded-2xl" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="card p-10 text-center text-gray-500">
          <div className="mb-2 text-5xl">🛒</div>
          {notice ?? "Tu carrito está vacío."}
          <div className="mt-4">
            <Link href="/tienda" className="btn btn-primary inline-block">
              Ver productos
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {notice && <p className="rounded-xl bg-yellow-100 p-3 text-sm text-yellow-900">{notice}</p>}
          {promo.active && rows.some((r) => r.product.category === "pollo") && (
            <p className="rounded-xl bg-gold-soft p-3 text-sm font-medium text-gold-deep">{PROMO_NOTE}</p>
          )}

          <ul className="card divide-y divide-[var(--color-line)]">
            {rows.map(({ line, product: p }) => {
              const icon = CATEGORIES.find((c) => c.key === p.category)?.icon ?? "🛒";
              const max = Math.min(p.stock, MAX_QTY);
              const tiers = tiersOf({ line, product: p });
              const lineTotal = tiersTotal(tiers);
              const discounted = lineTotal < Number(p.price) * line.qty;
              return (
                <li key={p.id} className="flex items-center gap-3 p-3">
                  <span className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gold-soft">
                    <SafeImg src={p.image_url} alt={p.name} icon={icon} iconClassName="text-3xl" className="h-full w-full object-cover" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold [overflow-wrap:anywhere]">{p.name}</p>
                    <p className="text-sm text-gray-500">
                      {discounted
                        ? tiers.map((t) => `${t.qty} × ${money(t.price)}`).join(" + ")
                        : `${money(p.price)} c/u`}
                    </p>
                    {discounted && <p className="text-xs font-semibold text-gold-deep">Oferta del jueves</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <b>{money(lineTotal)}</b>
                    <div className="flex items-center gap-1 rounded-xl bg-paper p-1">
                      <button
                        onClick={() => setQty(p.id, line.qty - 1)}
                        aria-label={line.qty === 1 ? `Quitar ${p.name}` : "Quitar uno"}
                        className="btn flex h-9 w-9 items-center justify-center bg-white p-0 text-lg"
                      >
                        {line.qty === 1 ? "🗑" : "−"}
                      </button>
                      <span className="min-w-7 text-center font-extrabold">{line.qty}</span>
                      <button
                        onClick={() => setQty(p.id, Math.min(max, line.qty + 1))}
                        disabled={line.qty >= max}
                        aria-label="Agregar uno más"
                        className="btn flex h-9 w-9 items-center justify-center bg-brand p-0 text-lg text-gold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="card space-y-4 p-5">
            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="c-name">Tu nombre completo</label>
              <input id="c-name" className="input" placeholder="Ej: Juan Pérez" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="c-addr">Dirección o referencia de entrega</label>
              <input id="c-addr" className="input" placeholder="Ej: Av. Los Olivos 123, frente al parque" maxLength={200} value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="c-note">Nota (opcional)</label>
              <input id="c-note" className="input" placeholder="Ej: tocar el timbre dos veces" maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} />
            </div>

            <div className="rounded-2xl bg-violet-50 p-4 text-sm">
              <p className="flex justify-between">
                <span>{plural(units, "unidad", "unidades")}</span>
                <b className="text-lg text-violet-700">{money(total)}</b>
              </p>
              {YAPE_NUMBER && (
                <p className="mt-2 text-gray-700">
                  💜 Yapea al <b>{YAPE_NUMBER}</b>
                  {YAPE_NAME && <> a nombre de <b>{YAPE_NAME}</b></>}
                </p>
              )}
              <p className="mt-2 text-gray-600">
                Al continuar se separa tu pedido y se abre WhatsApp. Solo adjunta la captura de Yape y envía.{" "}
                {DELIVERY_NOTE}
              </p>
            </div>

            {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

            <button onClick={submit} disabled={sending} className="btn btn-gold w-full">
              {sending ? "Enviando pedido..." : "Ir a pagar 📲"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
