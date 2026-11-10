"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useCart } from "@/components/CartProvider";
import ProductCard from "@/components/ProductCard";
import { CATEGORIES } from "@/lib/store";
import type { Product, ProductCategory } from "@/lib/types";
import { money, plural } from "@/lib/utils";

/** Catálogo con filtro por categoría y barra fija con el total del carrito. */
export default function Catalog({ products }: { products: Product[] }) {
  const [filter, setFilter] = useState<ProductCategory | "all">("all");
  const { lines, count } = useCart();

  const total = useMemo(() => {
    const byId = new Map(products.map((p) => [p.id, p]));
    return lines.reduce((a, l) => a + Number(byId.get(l.id)?.price ?? 0) * l.qty, 0);
  }, [lines, products]);

  const shown = CATEGORIES.filter((c) => filter === "all" || c.key === filter);

  return (
    <div>
      <div
        className="mb-8 inline-flex max-w-full flex-wrap gap-1 rounded-2xl border border-white/10 bg-white/5 p-1"
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

      <div className="space-y-10">
        {shown.map((c) => {
          const list = products.filter((p) => p.category === c.key);
          // En "Todo" no se muestran categorías vacías; al elegir una sí se avisa.
          if (list.length === 0 && filter === "all") return null;
          return (
            <section key={c.key} aria-labelledby={`cat-${c.key}`}>
              <div className="mb-5 flex items-baseline justify-between gap-3 border-b border-gold/25 pb-2">
                <h2
                  id={`cat-${c.key}`}
                  className="text-xl font-extrabold tracking-tight text-white sm:text-2xl"
                  style={{ fontStretch: "108%" }}
                >
                  {c.label}
                </h2>
                <span className="shrink-0 text-sm text-white/50">{plural(list.length, "producto", "productos")}</span>
              </div>
              {list.length === 0 ? (
                <div className="card p-8 text-center text-gray-500">{c.empty}</div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {list.map((p, i) => (
                    <div key={p.id} className="anim-rise h-full" style={{ ["--delay" as string]: `${Math.min(i, 6) * 50}ms` }}>
                      <ProductCard product={p} />
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
