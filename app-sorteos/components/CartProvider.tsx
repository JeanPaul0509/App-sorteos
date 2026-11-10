"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { MAX_QTY } from "@/lib/store";

type Line = { id: string; qty: number };

interface CartCtx {
  lines: Line[];
  ready: boolean;
  count: number; // unidades en total
  qtyOf: (id: string) => number;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
}

const Ctx = createContext<CartCtx | null>(null);
const KEY = "gekko_carrito";

/** El carrito vive en el celular de cada persona (localStorage); el servidor solo ve el pedido final. */
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<Line[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) ?? "[]");
      if (Array.isArray(raw)) {
        setLines(
          raw
            .filter((l) => l && typeof l.id === "string" && Number.isInteger(l.qty) && l.qty > 0)
            .map((l) => ({ id: l.id, qty: Math.min(l.qty, MAX_QTY) }))
        );
      }
    } catch {}
    setReady(true);
  }, []);

  const save = useCallback((next: Line[]) => {
    setLines(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
  }, []);

  const setQty = useCallback(
    (id: string, qty: number) => {
      const q = Math.max(0, Math.min(MAX_QTY, Math.floor(qty)));
      setLines((cur) => {
        const rest = cur.filter((l) => l.id !== id);
        const next = q > 0 ? [...rest, { id, qty: q }] : rest;
        try {
          localStorage.setItem(KEY, JSON.stringify(next));
        } catch {}
        return next;
      });
    },
    []
  );

  const clear = useCallback(() => save([]), [save]);

  const value = useMemo<CartCtx>(
    () => ({
      lines,
      ready,
      count: lines.reduce((a, l) => a + l.qty, 0),
      qtyOf: (id) => lines.find((l) => l.id === id)?.qty ?? 0,
      setQty,
      clear,
    }),
    [lines, ready, setQty, clear]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart debe usarse dentro de CartProvider");
  return c;
}
