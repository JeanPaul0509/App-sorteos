"use client";

import SafeImg from "@/components/SafeImg";
import { useCart } from "@/components/CartProvider";
import { CATEGORIES, MAX_QTY } from "@/lib/store";
import type { Product } from "@/lib/types";
import { money, plural } from "@/lib/utils";

/** Tarjeta de producto: foto 4:3, nombre, precio, unidades que quedan y botón para agregar al carrito. */
export default function ProductCard({ product: p }: { product: Product }) {
  const { qtyOf, setQty } = useCart();
  const qty = qtyOf(p.id);
  const max = Math.min(p.stock, MAX_QTY);
  const soldOut = p.stock <= 0;
  const icon = CATEGORIES.find((c) => c.key === p.category)?.icon ?? "🛒";

  return (
    <article className="card flex h-full flex-col overflow-hidden p-3">
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-gold-soft">
        <SafeImg
          src={p.image_url}
          alt={p.name}
          icon={icon}
          iconClassName="text-5xl"
          className={`h-full w-full object-cover ${soldOut ? "opacity-50 grayscale" : ""}`}
        />
        {soldOut && (
          <span className="absolute left-2 top-2 rounded-full bg-ink px-2.5 py-1 text-xs font-bold text-white">
            Agotado
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col px-1 pb-1 pt-3">
        <h3 className="text-lg font-extrabold leading-snug [overflow-wrap:anywhere]">{p.name}</h3>
        {p.description && (
          <p className="mt-0.5 line-clamp-3 text-sm text-gray-600 [overflow-wrap:anywhere]">{p.description}</p>
        )}

        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div>
            <p className="text-2xl font-extrabold tracking-tight text-violet-700">{money(p.price)}</p>
            {!soldOut && p.stock <= 5 && (
              <p className="text-xs font-semibold text-gold-deep">
                {p.stock === 1 ? "¡Queda 1!" : `¡Quedan ${plural(p.stock, "unidad", "unidades")}!`}
              </p>
            )}
          </div>

          {soldOut ? (
            <span className="rounded-xl bg-paper px-3 py-2 text-sm font-semibold text-gray-500">Sin stock</span>
          ) : qty === 0 ? (
            <button onClick={() => setQty(p.id, 1)} className="btn btn-primary py-2 text-sm">
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
    </article>
  );
}
