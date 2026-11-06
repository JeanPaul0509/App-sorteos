"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Legend from "@/components/Legend";
import Pager, { PAGE_SIZE } from "@/components/Pager";
import { createClient } from "@/lib/supabase/client";
import type { MyTicket, PublicTicket, Raffle } from "@/lib/types";
import { buildWhatsAppUrl, fetchAll, money, pad, plural, YAPE_NAME, YAPE_NUMBER } from "@/lib/utils";

const MAX = 5;

export default function RaffleBoard({ raffle, phone }: { raffle: Raffle; phone: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [tickets, setTickets] = useState<PublicTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<number[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ numbers: number[]; url: string } | null>(null);
  const [myPending, setMyPending] = useState(0); // mis números aún en amarillo

  const active = raffle.status === "active";
  const limit = Math.max(0, MAX - myPending); // cuántos puedo elegir ahora

  const load = useCallback(async () => {
    try {
      const data = await fetchAll<PublicTicket>((from, to) =>
        supabase
          .from("tickets")
          .select("id, number, status")
          .eq("raffle_id", raffle.id)
          .order("number")
          .range(from, to)
      );
      setTickets(data);
      const { data: mine } = await supabase.rpc("my_tickets");
      setMyPending(
        ((mine ?? []) as MyTicket[]).filter((t) => t.raffle_id === raffle.id && t.status === "reserved").length
      );
      const free = new Set(data.filter((t) => t.status === "available").map((t) => t.number));
      setSelected((prev) => prev.filter((n) => free.has(n)));
    } finally {
      setLoading(false);
    }
  }, [supabase, raffle.id]);

  useEffect(() => {
    load();
    const t = setInterval(load, 15000); // se actualiza solo cada 15 s
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    if (!showModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !sending) setShowModal(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showModal, sending]);

  useEffect(() => {
    try {
      setName(localStorage.getItem("sorteo_nombre") ?? "");
    } catch {}
  }, []);

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  function limitMessage() {
    if (myPending === 0) return `Puedes elegir máximo ${MAX} números a la vez`;
    if (limit === 0) return `Tienes ${myPending} números esperando confirmación de pago`;
    return `Puedes elegir ${limit} más: tienes ${myPending} esperando confirmación`;
  }

  function toggle(t: PublicTicket) {
    if (!active) return;
    if (t.status !== "available") {
      flash(t.status === "reserved" ? "Ese número está reservado 🟡" : "Ese número ya fue vendido");
      return;
    }
    if (selected.includes(t.number)) {
      setSelected(selected.filter((n) => n !== t.number));
    } else if (selected.length >= limit) {
      flash(limitMessage());
    } else {
      setSelected([...selected, t.number].sort((a, b) => a - b));
    }
  }

  function randomPick() {
    if (selected.length >= limit) return flash(limitMessage());
    const free = tickets.filter((t) => t.status === "available" && !selected.includes(t.number));
    if (free.length === 0) return flash("No quedan números disponibles");
    const pick = free[Math.floor(Math.random() * free.length)];
    setSelected([...selected, pick.number].sort((a, b) => a - b));
  }

  async function reserve() {
    if (!name.trim()) return setError("Escribe tu nombre");
    setSending(true);
    setError(null);
    const { error } = await supabase.rpc("reserve_tickets", {
      p_raffle_id: raffle.id,
      p_numbers: selected,
      p_name: name.trim(),
    });
    setSending(false);
    if (error) {
      setError(error.message);
      load();
      return;
    }
    try {
      localStorage.setItem("sorteo_nombre", name.trim());
    } catch {}

    const url = buildWhatsAppUrl({
      raffleTitle: raffle.title,
      numbers: selected,
      totalTickets: raffle.total_tickets,
      price: Number(raffle.price),
      name: name.trim(),
      phone,
    });
    setDone({ numbers: selected, url });
    setSelected([]);
    setShowModal(false);
    load();
    window.open(url, "_blank"); // si el navegador lo bloquea, queda el botón verde
  }

  const visible = useMemo(() => {
    const q = search.trim();
    return q ? tickets.filter((t) => String(t.number).includes(q)) : tickets;
  }, [tickets, search]);

  const pages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const curPage = Math.min(page, pages - 1);
  const pageItems = visible.slice(curPage * PAGE_SIZE, (curPage + 1) * PAGE_SIZE);

  const stats = useMemo(() => {
    const s = { available: 0, reserved: 0, sold: 0 };
    tickets.forEach((t) => s[t.status]++);
    return s;
  }, [tickets]);

  const total = selected.length * Number(raffle.price);

  return (
    <section className="card p-5">
      {done && (
        <div className="anim-rise mb-5 rounded-2xl border-2 border-green-500 bg-green-50 p-4">
          <p className="font-bold text-green-800">
            ✅ ¡Listo! Reservaste: {done.numbers.map((n) => pad(n, raffle.total_tickets)).join(", ")}
          </p>
          <p className="mt-1 text-sm text-green-900">
            Ahora yapea{YAPE_NUMBER && <> al <b>{YAPE_NUMBER}</b></>}
            {YAPE_NAME && <> ({YAPE_NAME})</>} y envía la captura por WhatsApp. Tus números quedan en
            amarillo hasta que confirmemos tu pago.
          </p>
          <a href={done.url} target="_blank" rel="noreferrer" className="btn btn-green mt-3 inline-block">
            📲 Enviar mensaje por WhatsApp
          </a>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Elige tus números</h2>
          <p className="text-sm text-gray-500">
            Hasta {MAX} números por compra · {stats.available === 1 ? "queda" : "quedan"}{" "}
            <b>{plural(stats.available, "disponible", "disponibles")}</b>
          </p>
        </div>
        <div className="flex gap-2">
          <input
            className="input w-32 py-2"
            inputMode="numeric"
            placeholder="Buscar #"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value.replace(/\D/g, ""));
              setPage(0);
            }}
          />
          {active && (
            <button onClick={randomPick} className="btn btn-light whitespace-nowrap py-2">
              🎲 Al azar
            </button>
          )}
        </div>
      </div>

      {active && myPending > 0 && (
        <div className="mb-4 rounded-xl border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-900">
          {limit === 0 ? (
            <>
              🟡 Tienes <b>{myPending} números</b> esperando confirmación de pago. Podrás elegir más cuando
              confirmemos tu pago.
            </>
          ) : (
            <>
              🟡 Tienes <b>{plural(myPending, "número", "números")}</b> esperando confirmación. Ahora puedes elegir hasta{" "}
              <b>{limit}</b> más.
            </>
          )}
        </div>
      )}

      <Legend showSelected />

      {!active && (
        <p className="mb-4 rounded-xl bg-gray-100 p-3 text-center text-sm text-gray-600">
          Este sorteo ya finalizó.
        </p>
      )}

      {loading ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(2.9rem,1fr))] gap-2" aria-busy="true">
          {Array.from({ length: 40 }, (_, i) => (
            <span key={i} className="skeleton aspect-square rounded-full" />
          ))}
          <span className="sr-only">Cargando números</span>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(2.9rem,1fr))] gap-2">
          {pageItems.map((t) => {
            const isSel = selected.includes(t.number);
            const cls = isSel ? "ball-selected" : `ball-${t.status}`;
            return (
              <button
                key={t.id}
                onClick={() => toggle(t)}
                className={`ball ${cls} ${t.status === "available" && active ? "cursor-pointer" : "cursor-default"}`}
                aria-label={`Número ${t.number}`}
              >
                {pad(t.number, raffle.total_tickets)}
              </button>
            );
          })}
        </div>
      )}

      {!loading && (
        <Pager page={curPage} pages={pages} first={pageItems[0]?.number}
          last={pageItems[pageItems.length - 1]?.number} onChange={setPage} />
      )}

      {/* Barra inferior con la selección */}
      {selected.length > 0 && (
        <div className="anim-sheet fixed inset-x-0 bottom-0 z-40 border-t border-violet-100 bg-white/95 p-3 text-ink shadow-2xl backdrop-blur">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex flex-wrap gap-1.5">
                {selected.map((n) => (
                  <span key={n} className="rounded-full bg-violet-700 px-2.5 py-0.5 text-sm font-bold text-white">
                    {pad(n, raffle.total_tickets)}
                  </span>
                ))}
              </div>
              <p className="mt-1 text-sm text-gray-600">
                {selected.length}/{limit} · Total: <b>{money(total)}</b>
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setSelected([])} className="btn btn-light">
                Limpiar
              </button>
              <button
                onClick={() => {
                  setError(null);
                  setShowModal(true);
                }}
                className="btn btn-primary"
              >
                Comprar →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: nombre + pago */}
      {showModal && (
        <div
          className="anim-overlay fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 sm:items-center"
          onClick={(e) => e.target === e.currentTarget && !sending && setShowModal(false)}
        >
          <div role="dialog" aria-modal="true" className="anim-modal card w-full max-w-md p-6">
            <h3 className="text-xl font-bold">Confirmar compra</h3>
            <p className="mt-1 text-sm text-gray-500">{raffle.title}</p>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {selected.map((n) => (
                <span key={n} className="ball ball-reserved w-11">
                  {pad(n, raffle.total_tickets)}
                </span>
              ))}
            </div>

            <label className="mb-1 mt-5 block text-sm font-medium">Tu nombre completo</label>
            <input
              className="input"
              autoFocus
              placeholder="Ej: Juan Pérez"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
            />

            <div className="mt-4 rounded-2xl bg-violet-50 p-4 text-sm">
              <p className="flex justify-between">
                <span>
                  {selected.length} × {money(raffle.price)}
                </span>
                <b className="text-lg text-violet-700">{money(total)}</b>
              </p>
              {YAPE_NUMBER && (
                <p className="mt-2 text-gray-700">
                  💜 Yapea al <b>{YAPE_NUMBER}</b>
                  {YAPE_NAME && <> a nombre de <b>{YAPE_NAME}</b></>}
                </p>
              )}
              <p className="mt-2 text-gray-600">
                Al continuar se reservan tus números (🟡) y se abrirá WhatsApp con tu pedido. Solo adjunta
                la captura de Yape y envía.
              </p>
            </div>

            {error && <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

            <div className="mt-5 flex gap-2">
              <button onClick={() => setShowModal(false)} className="btn btn-light flex-1" disabled={sending}>
                Volver
              </button>
              <button onClick={reserve} className="btn btn-gold flex-1" disabled={sending}>
                {sending ? "Reservando..." : "Ir a pagar 📲"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          key={toast}
          role="status"
          className="anim-toast fixed left-1/2 top-20 z-[60] -translate-x-1/2 rounded-full bg-gray-900 px-4 py-2 text-sm text-white shadow-lg"
        >
          {toast}
        </div>
      )}
    </section>
  );
}
