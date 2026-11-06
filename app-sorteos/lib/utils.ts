// Los celulares se guardan como "correo" interno para usar el login con
// contraseña de Supabase sin necesitar SMS.
export const PHONE_DOMAIN = "celular.sorteos.app";

export function cleanPhone(raw: string) {
  return raw.replace(/\D/g, "").replace(/^51(?=9\d{8}$)/, "");
}

export function isValidPhone(phone: string) {
  return /^9\d{8}$/.test(phone);
}

export function phoneToEmail(phone: string) {
  return `${phone}@${PHONE_DOMAIN}`;
}

export function pad(n: number, total: number) {
  return String(n).padStart(String(total).length, "0");
}

const MONEY = new Intl.NumberFormat("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const INT = new Intl.NumberFormat("es-PE");

/** S/ 1,234.50 */
export function money(v: number | string) {
  const n = Number(v);
  return `S/ ${MONEY.format(Number.isFinite(n) ? n : 0)}`;
}

/** 1,284 */
export function num(v: number | string | null | undefined) {
  const n = Number(v ?? 0);
  return INT.format(Number.isFinite(n) ? n : 0);
}

/** "1 número" / "3 números" */
export function plural(n: number, one: string, many: string) {
  return `${num(n)} ${n === 1 ? one : many}`;
}

/** Porcentaje honesto: nunca "0%" si ya se vendió algo, ni "100%" si aún queda alguno. */
export function soldPercent(sold: number, total: number) {
  if (!total || sold <= 0) return { width: 0, label: "0%" };
  if (sold >= total) return { width: 100, label: "100%" };
  const raw = (sold / total) * 100;
  if (raw < 1) return { width: 1, label: "<1%" };
  const r = Math.min(99, Math.round(raw));
  return { width: r, label: `${r}%` };
}

/** true si la fecha (YYYY-MM-DD) ya pasó, en hora de Lima. */
export function isPastDate(d: string | null) {
  if (!d) return false;
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Lima" });
  return d < today;
}

export const LIMITS = { title: 80, description: 1000, specs: 1000, buyerName: 60 };

export const YAPE_NUMBER = process.env.NEXT_PUBLIC_YAPE_NUMBER ?? "";
export const YAPE_NAME = process.env.NEXT_PUBLIC_YAPE_NAME ?? "";

export function buildWhatsAppUrl(opts: {
  raffleTitle: string;
  numbers: number[];
  totalTickets: number;
  price: number;
  name: string;
  phone: string;
}) {
  const admin = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "").replace(/\D/g, "");
  const nums = [...opts.numbers].sort((a, b) => a - b).map((n) => pad(n, opts.totalTickets));
  const total = opts.price * opts.numbers.length;
  const text = [
    "¡Hola! 👋 Quiero participar en el sorteo:",
    `🎁 *${opts.raffleTitle}*`,
    "",
    `🎟️ Mis números: *${nums.join(", ")}*`,
    `👤 Nombre: ${opts.name}`,
    `📱 Celular: ${opts.phone}`,
    `💰 Total a pagar: ${money(total)}`,
    "",
    "📎 *Adjunto captura de Yape* 👇",
  ].join("\n");
  // api.whatsapp.com conserva los emojis; wa.me a veces los rompe al redirigir (sale �)
  return `https://api.whatsapp.com/send?phone=${admin}&text=${encodeURIComponent(text)}`;
}

export function buyerWhatsAppUrl(phone: string) {
  const p = phone.replace(/\D/g, "");
  return `https://wa.me/${p.length === 9 ? "51" + p : p}`;
}

/** Supabase devuelve máximo 1000 filas por consulta: esto trae todas. */
export async function fetchAll<T>(
  page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>
): Promise<T[]> {
  const size = 1000;
  const all: T[] = [];
  for (let from = 0; ; from += size) {
    const { data, error } = await page(from, from + size - 1);
    if (error) throw new Error(error.message);
    all.push(...(data ?? []));
    if (!data || data.length < size) break;
  }
  return all;
}

/** Descarga un CSV que Excel abre directo (con tildes y columnas bien separadas). */
export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const esc = (v: string | number) => {
    let s = String(v ?? "");
    // Evita que Excel ejecute fórmulas escritas como nombre (inyección CSV)
    if (typeof v === "string" && /^[=+\-@\t\r]/.test(s)) s = "'" + s;
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const body = "sep=;\n" + rows.map((r) => r.map(esc).join(";")).join("\n");
  const blob = new Blob(["﻿" + body], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function formatDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("es-PE", { dateStyle: "short", timeStyle: "short" });
}

export function timeAgo(iso: string | null) {
  if (!iso) return "";
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "hace un momento";
  if (mins < 60) return `hace ${mins} min`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `hace ${h} h`;
  return `hace ${Math.floor(h / 24)} d`;
}

export const ICONS = ["🎁", "📱", "💻", "🎮", "📺", "🎧", "⌚", "🏍️", "🚲", "💵", "🛒", "🍗"];

export function isValidGroupUrl(url: string) {
  return /^https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]+/.test(url.trim());
}

/** Acepta link, @usuario o número y lo convierte en un enlace válido. */
export function normalizeSocial(kind: "whatsapp" | "instagram" | "tiktok", raw: string): string | null {
  const v = raw.trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v;
  if (kind === "whatsapp") {
    const d = v.replace(/\D/g, "");
    if (!d) return null;
    return `https://wa.me/${d.length === 9 ? "51" + d : d}`;
  }
  const user = v.replace(/^@/, "").replace(/\s/g, "");
  if (!user) return null;
  return kind === "instagram" ? `https://instagram.com/${user}` : `https://www.tiktok.com/@${user}`;
}

/** Mensaje para avisarle al comprador que su pago fue confirmado. */
export function paidWhatsAppUrl(opts: {
  phone: string;
  name: string;
  raffleTitle: string;
  numbers: number[];
  totalTickets: number;
}) {
  const p = opts.phone.replace(/\D/g, "");
  const to = p.length === 9 ? "51" + p : p;
  const first = opts.name.trim().split(/\s+/)[0] || "";
  const nums = [...opts.numbers].sort((a, b) => a - b).map((n) => pad(n, opts.totalTickets));
  const text = [
    `¡Hola${first ? " " + first : ""}! ✅ Tu pago fue confirmado.`,
    "",
    `🎁 Sorteo: *${opts.raffleTitle}*`,
    `🎟️ ${nums.length === 1 ? "Tu número" : "Tus números"}: *${nums.join(", ")}*`,
    "",
    "Puedes verlos en GoldenTicket → Mis números. ¡Mucha suerte! 🍀",
  ].join("\n");
  return `https://api.whatsapp.com/send?phone=${to}&text=${encodeURIComponent(text)}`;
}
