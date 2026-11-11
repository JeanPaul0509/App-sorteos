"use client";

import SafeImg from "@/components/SafeImg";
import { useCart } from "@/components/CartProvider";
import { CATEGORIES, MAX_QTY } from "@/lib/store";
import type { Product } from "@/lib/types";
import { money, plural } from "@/lib/utils";

/** Tarjeta de producto: foto cuadrada protagonista, categoría, nombre, precio y botón para agregar al carrito. */
export default function ProductCard({ product: p }: { product: Product }) {
  const { qtyOf, setQty } = useCart();
  const qty = qtyOf(p.id);
  const max = Math.min(p.stock, MAX_QTY);
  const soldOut = p.stock <= 0;
  const cat = CATEGORIES.find((c) => c.key === p.category);

  return (
    <article className="card-lux flex h-full flex-col overflow-hidden p-2.5">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-gold-soft ring-1 ring-black/5">
        <SafeImg
          src={p.image_url}
          alt={p.name}
          icon={cat?.icon ?? "🛒"}
          iconClassName="text-6xl"
          className={`lux-img h-full w-full object-cover ${soldOut ? "opacity-50 grayscale" : ""}`}
        />
        {soldOut && (
          <span className="absolute left-3 top-3 rounded-full bg-ink/90 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-white">
            Agotado
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col px-2 pb-2 pt-4">
        {cat && <p className="eyebrow !text-gold-deep">{cat.label}</p>}
        <h3 className="mt-1 text-lg font-bold leading-snug [overflow-wrap:anywhere]">{p.name}</h3>
        {p.description && (
          <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-gray-600 [overflow-wrap:anywhere]">
            {p.description}
          </p>
        )}

        <div className="mt-auto pt-5">
          <div className="gold-rule mb-4 opacity-70" />
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-[1.65rem] font-extrabold leading-none tracking-tight text-ink">{money(p.price)}</p>
              {!soldOut && p.stock <= 5 && (
                <p className="mt-1.5 text-xs font-semibold text-gold-deep">
                  {p.stock === 1 ? "Última unidad" : `Quedan ${plural(p.stock, "unidad", "unidades")}`}
                </p>
              )}
            </div>

            {soldOut ? (
              <span className="rounded-xl bg-paper px-3 py-2 text-sm font-semibold text-gray-500">Sin stock</span>
            ) : qty === 0 ? (
              <button onClick={() => setQty(p.id, 1)} className="btn btn-primary py-2.5 text-sm">
                Agregar
              </button>
            ) : (
              <div className="flex items-center gap-1 rounded-xl bg-paper p-1" role="group" aria-label={`Cantidad de ${p.name}`}>
                <button
                  onClick={() => setQty(p.id, qty - 1)}
                  aria-label="Quitar uno"
                  className="btn flex h-10 w-10 items-center justify-center bg-white p-0 text-xl"
                >
                  −
                </button>
                <span className="min-w-8 text-center text-base font-extrabold" aria-live="polite">
                  {qty}
                </span>
                <button
                  onClick={() => setQty(p.id, Math.min(max, qty + 1))}
                  disabled={qty >= max}
                  aria-label="Agregar uno más"
                  className="btn flex h-10 w-10 items-center justify-center bg-brand p-0 text-xl text-gold"
                >
                  +
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
