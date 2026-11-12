"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/components/CartProvider";
import ProductCard from "@/components/ProductCard";
import { createClient } from "@/lib/supabase/client";
import { CATEGORIES, priceTiers, tiersTotal } from "@/lib/store";
import type { Product, ProductCategory } from "@/lib/types";
import { money, plural } from "@/lib/utils";

/** Catálogo con filtro por categoría y barra fija con el total del carrito. */
export default function Catalog({ products }: { products: Product[] }) {
  const [filter, setFilter] = useState<ProductCategory | "all">("all");
  const { lines, count } = useCart();
  const [promo, setPromo] = useState<{ active: boolean; used: Record<string, number> }>({ active: false, used: {} });

  // ¿Es jueves y cuánto pidió ya hoy esta cuenta? (si falta la migración 010, queda sin oferta)
  useEffect(() => {
    createClient()
      .rpc("promo_info")
      .then(({ data }) => {
        if (data) setPromo(data as { active: boolean; used: Record<string, number> });
      });
  }, []);

  const total = useMemo(() => {
    const byId = new Map(products.map((p) => [p.id, p]));
    return lines.reduce((a, l) => {
      const p = byId.get(l.id);
      if (!p) return a;
      return a + tiersTotal(priceTiers(l.qty, Number(p.price), promo.active && p.category === "pollo", promo.used[p.id] ?? 0));
    }, 0);
  }, [lines, products, promo]);

  const shown = CATEGORIES.filter((c) => filter === "all" || c.key === filter);

  return (
    <div>
      <div
        className="mx-auto mb-10 flex w-fit max-w-full flex-wrap justify-center gap-1 rounded-2xl border border-white/10 bg-white/5 p-1"
        role="tablist"
        aria-label="Categorías"
      >
        {[{ key: "all" as const, label: "Todo" }, ...CATEGORIES].map((c) => {
          const active = filter === c.key;
          return (
            <button
              key={c.key}
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(c.key)}
              className={`btn rounded-xl py-2 text-sm ${active ? "bg-gold text-ink" : "text-white/70 hover:text-white"}`}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      <div className="space-y-14">
        {shown.map((c) => {
          const list = products.filter((p) => p.category === c.key);
          // En "Todo" no se muestran categorías vacías; al elegir una sí se avisa.
          if (list.length === 0 && filter === "all") return null;
          return (
            <section key={c.key} aria-labelledby={`cat-${c.key}`}>
              <div className="mb-6">
                <div className="flex items-end justify-between gap-3">
                  <h2
                    id={`cat-${c.key}`}
                    className="font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl"
                  >
                    {c.label}
                  </h2>
                  <span className="eyebrow shrink-0 pb-1.5 !text-white/45">
                    {plural(list.length, "producto", "productos")}
                  </span>
                </div>
                <div className="gold-rule mt-3" />
              </div>
              {list.length === 0 ? (
                <div className="card p-8 text-center text-gray-500">{c.empty}</div>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {list.map((p, i) => (
                    <div key={p.id} className="anim-rise h-full" style={{ ["--delay" as string]: `${Math.min(i, 6) * 50}ms` }}>
                      <ProductCard product={p} promo={promo.active && p.category === "pollo"} used={promo.used[p.id] ?? 0} />
                    </div>
                  ))}
                </div>
              )}
            </section>
          );
        })}
        {products.length === 0 && filter === "all" && (
          <div className="card p-10 text-center text-gray-500">
            Todavía no hay productos. Vuelve pronto.
          </div>
        )}
      </div>

      {count > 0 && (
        <div className="anim-sheet fixed inset-x-0 bottom-0 z-40 border-t border-violet-100 bg-white/95 p-3 text-ink shadow-2xl backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
            <p className="text-sm text-gray-600">
              {plural(count, "producto", "productos")} · Total: <b className="text-base text-ink">{money(total)}</b>
            </p>
            <Link href="/carrito" className="btn btn-primary">
              Ver carrito →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
