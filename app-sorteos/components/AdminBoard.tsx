"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Legend from "@/components/Legend";
import Pager, { PAGE_SIZE } from "@/components/Pager";
import { createClient } from "@/lib/supabase/client";
import type { AdminTicket, Raffle, TicketStatus } from "@/lib/types";
import { buyerWhatsAppUrl, downloadCsv, fetchAll, formatDate, money, pad, timeAgo } from "@/lib/utils";

type Filter = "all" | TicketStatus;

interface Group {
  key: string;
  name: string;
  phone: string;
  reservedAt: string | null;
  tickets: AdminTicket[];
}

export default function AdminBoard({ raffle }: { raffle: Raffle }) {
  const supabase = useMemo(() => createClient(), []);
  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [picked, setPicked] = useState<number[]>([]); // ids de tickets
  const [saleName, setSaleName] = useState("");
  const [busy, setBusy] = useState(false);
  const [lookup, setLookup] = useState("");
  const [onlySold, setOnlySold] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await fetchAll<AdminTicket>((from, to) =>
        supabase.rpc("admin_list_tickets", { p_raffle_id: raffle.id }).range(from, to)
      );
      setTickets(data);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [supabase, raffle.id]);

  useEffect(() => {
    load();
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, [load]);

  async function setStatus(ids: number[], status: TicketStatus, name?: string) {
    if (ids.length === 0) return;
    if (status === "available" && !confirm(`¿Liberar ${ids.length} número(s)? Volverán a estar disponibles (verde).`))
      return;
    setBusy(true);
    const { error } = await supabase.rpc("admin_set_ticket_status", {
      p_ticket_ids: ids,
      p_status: status,
      p_name: name?.trim() || null,
    });
    setBusy(false);
    if (error) return alert(error.message);
    setPicked([]);
    setSaleName("");
    load();
  }

  // Reservas agrupadas por comprador
  const groups = useMemo<Group[]>(() => {
    const m = new Map<string, Group>();
    tickets
      .filter((t) => t.status === "reserved")
      .forEach((t) => {
        const key = `${t.user_id ?? t.buyer_phone ?? ""}|${t.buyer_name ?? ""}`;
        const g = m.get(key) ?? {
          key,
          name: t.buyer_name ?? "Sin nombre",
          phone: t.buyer_phone ?? "",
          reservedAt: t.reserved_at,
          tickets: [],
        };
        g.tickets.push(t);
        if (t.reserved_at && (!g.reservedAt || t.reserved_at < g.reservedAt)) g.reservedAt = t.reserved_at;
        m.set(key, g);
      });
    return [...m.values()].sort((a, b) => (a.reservedAt ?? "").localeCompare(b.reservedAt ?? ""));
  }, [tickets]);

  const stats = useMemo(() => {
    const s = { available: 0, reserved: 0, sold: 0 };
    tickets.forEach((t) => s[t.status]++);
    return s;
  }, [tickets]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tickets.filter((t) => {
      if (filter !== "all" && t.status !== filter) return false;
      if (!q) return true;
      return (
        String(t.number).includes(q) ||
        (t.buyer_name ?? "").toLowerCase().includes(q) ||
        (t.buyer_phone ?? "").includes(q)
      );
    });
  }, [tickets, filter, search]);

  const pages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const curPage = Math.min(page, pages - 1);
  const pageItems = visible.slice(curPage * PAGE_SIZE, (curPage + 1) * PAGE_SIZE);

  const pickedTickets = tickets.filter((t) => picked.includes(t.id));
  const fmt = (n: number) => pad(n, raffle.total_tickets);

  // Lista de compradores (para el sorteo en vivo)
  const buyers = useMemo(
    () => tickets.filter((t) => (onlySold ? t.status === "sold" : t.status !== "available")),
    [tickets, onlySold]
  );

  const found = useMemo(() => {
    const n = parseInt(lookup, 10);
    return isNaN(n) ? null : tickets.find((t) => t.number === n) ?? "none";
  }, [lookup, tickets]);

  function exportExcel() {
    const rows: (string | number)[][] = [["Número", "Nombre", "Celular", "Estado", "Fecha de pago"]];
    buyers.forEach((t) =>
      rows.push([
        t.number,
        t.buyer_name ?? "",
        t.buyer_phone ?? "",
        t.status === "sold" ? "Pagado" : "Reservado",
        formatDate(t.sold_at),
      ])
    );
    const safe = raffle.title.normalize("NFD").replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase();
    downloadCsv(`compradores-${safe}.csv`, rows);
  }

  function togglePick(id: number) {
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }

  const tab = (f: Filter, label: string) => (
    <button
      onClick={() => {
        setFilter(f);
        setPage(0);
      }}
      className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
        filter === f ? "bg-violet-700 text-white" : "bg-gray-100 text-gray-700"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4 text-center">
          <p className="text-2xl font-extrabold text-green-600">{stats.available}</p>
          <p className="text-xs text-gray-500">Disponibles</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-extrabold text-yellow-500">{stats.reserved}</p>
          <p className="text-xs text-gray-500">Reservados</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-extrabold text-gray-500">{stats.sold}</p>
          <p className="text-xs text-gray-500">Vendidos · {money(stats.sold * Number(raffle.price))}</p>
        </div>
      </div>

      {/* Pagos por confirmar */}
      <section>
        <h2 className="mb-3 text-lg font-bold">🟡 Pagos por confirmar ({groups.length})</h2>
        {groups.length === 0 ? (
          <p className="card p-5 text-sm text-gray-500">No hay reservas pendientes.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {groups.map((g) => (
              <div key={g.key} className="card border-l-4 border-yellow-400 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold">{g.name}</p>
                    {g.phone && (
                      <a
                        href={buyerWhatsAppUrl(g.phone)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-green-700 underline"
                      >
                        📱 {g.phone}
                      </a>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">{timeAgo(g.reservedAt)}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {g.tickets.map((t) => (
                    <span key={t.id} className="ball ball-reserved w-10 text-xs">
                      {fmt(t.number)}
                    </span>
                  ))}
                </div>
                <p className="mt-2 text-sm">
                  Debe pagar: <b>{money(g.tickets.length * Number(raffle.price))}</b>
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    disabled={busy}
                    onClick={() => setStatus(g.tickets.map((t) => t.id), "sold")}
                    className="btn btn-gray flex-1 py-2 text-sm"
                  >
                    ✅ Confirmar pago
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => setStatus(g.tickets.map((t) => t.id), "available")}
                    className="btn btn-light py-2 text-sm"
                  >
                    🟢 Liberar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ¿Quién tiene el número? — para el sorteo en vivo */}
      <section className="card border-0 bg-brand p-5 text-white">
        <h2 className="text-lg font-bold">🎤 ¿Quién tiene el número ganador?</h2>
        <p className="text-sm text-white/80">Escribe el número que salió en el sorteo.</p>
        <input
          className="input mt-3 max-w-xs text-2xl font-bold text-gray-900"
          inputMode="numeric"
          placeholder="Ej: 57"
          value={lookup}
          onChange={(e) => setLookup(e.target.value.replace(/\D/g, ""))}
        />
        {found === "none" && <p className="mt-3">Ese número no existe en este sorteo.</p>}
        {found && found !== "none" && (
          <div className="mt-4 rounded-2xl bg-white p-4 text-gray-900">
            <p className="text-4xl font-extrabold text-violet-700">#{fmt(found.number)}</p>
            {found.status === "available" ? (
              <p className="mt-1 text-gray-500">Nadie compró este número.</p>
            ) : (
              <>
                <p className="mt-1 text-2xl font-bold">{found.buyer_name}</p>
                <p className="text-lg">📱 {found.buyer_phone}</p>
                <p className={`mt-1 text-sm font-semibold ${found.status === "sold" ? "text-green-700" : "text-yellow-600"}`}>
                  {found.status === "sold" ? "✅ Pagado" : "⚠️ Reservado, todavía NO pagó"}
                </p>
                {found.buyer_phone && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <a href={`tel:${found.buyer_phone}`} className="btn btn-primary">
                      📞 Llamar
                    </a>
                    <a href={buyerWhatsAppUrl(found.buyer_phone)} target="_blank" rel="noreferrer" className="btn btn-green">
                      WhatsApp
                    </a>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </section>

      {/* Lista de compradores + Excel */}
      <section className="card p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold">📋 Compradores ({buyers.length})</h2>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={onlySold} onChange={(e) => setOnlySold(e.target.checked)} />
              Solo pagados
            </label>
            <button onClick={exportExcel} disabled={buyers.length === 0} className="btn btn-green py-2 text-sm">
              ⬇️ Descargar Excel
            </button>
          </div>
        </div>
        {buyers.length === 0 ? (
          <p className="text-sm text-gray-500">Todavía no hay compradores.</p>
        ) : (
          <div className="max-h-96 overflow-auto rounded-xl border border-gray-100">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">Nombre</th>
                  <th className="px-3 py-2">Celular</th>
                  <th className="px-3 py-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                {buyers.map((t) => (
                  <tr key={t.id} className="border-t border-gray-100">
                    <td className="px-3 py-2 font-bold">{fmt(t.number)}</td>
                    <td className="px-3 py-2">{t.buyer_name}</td>
                    <td className="px-3 py-2">{t.buyer_phone}</td>
                    <td className="px-3 py-2">{t.status === "sold" ? "✅ Pagado" : "🟡 Reservado"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Tablero completo */}
      <section className="card p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {tab("all", `Todos (${tickets.length})`)}
            {tab("available", `🟢 ${stats.available}`)}
            {tab("reserved", `🟡 ${stats.reserved}`)}
            {tab("sold", `⚪ ${stats.sold}`)}
          </div>
          <input
            className="input w-56 py-2"
            placeholder="Buscar número, nombre o celular"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
          />
        </div>
        <Legend />
        <p className="mb-3 text-sm text-gray-500">Toca los números para seleccionarlos y cambiarles el estado.</p>

        {loading ? (
          <p className="py-10 text-center text-gray-400">Cargando...</p>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(2.9rem,1fr))] gap-2">
            {pageItems.map((t) => (
              <button
                key={t.id}
                onClick={() => togglePick(t.id)}
                title={t.buyer_name ? `${t.buyer_name} · ${t.buyer_phone ?? ""}` : "Disponible"}
                className={`ball ball-${t.status} cursor-pointer ${picked.includes(t.id) ? "ball-admin-picked" : ""}`}
              >
                {fmt(t.number)}
              </button>
            ))}
          </div>
        )}
        {!loading && <Pager page={curPage} pages={pages} first={pageItems[0]?.number}
          last={pageItems[pageItems.length - 1]?.number} onChange={setPage} />}
      </section>

      {/* Panel de acciones para la selección */}
      {pickedTickets.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-violet-100 bg-white p-4 text-ink shadow-2xl">
          <div className="mx-auto max-w-5xl">
            <div className="mb-3 max-h-32 space-y-1 overflow-y-auto text-sm">
              {pickedTickets.map((t) => (
                <div key={t.id} className="flex items-center gap-2">
                  <span className={`ball ball-${t.status} w-8 text-[0.65rem]`}>{fmt(t.number)}</span>
                  <span className="text-gray-700">
                    {t.buyer_name ? (
                      <>
                        {t.buyer_name} · {t.buyer_phone} · {timeAgo(t.reserved_at)}
                      </>
                    ) : (
                      <span className="text-gray-400">Sin comprador</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
            {pickedTickets.some((t) => !t.buyer_name) && (
              <input
                className="input mb-3 py-2"
                placeholder="Nombre del comprador (para ventas hechas por fuera de la app)"
                value={saleName}
                onChange={(e) => setSaleName(e.target.value)}
              />
            )}
            <div className="flex flex-wrap gap-2">
              <button disabled={busy} onClick={() => setStatus(picked, "sold", saleName)} className="btn btn-gray">
                ⚪ Marcar pagado
              </button>
              <button disabled={busy} onClick={() => setStatus(picked, "reserved", saleName)} className="btn btn-yellow">
                🟡 Reservado
              </button>
              <button disabled={busy} onClick={() => setStatus(picked, "available")} className="btn btn-green">
                🟢 Liberar
              </button>
              <button onClick={() => setPicked([])} className="btn btn-light ml-auto">
                Cancelar ({pickedTickets.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
