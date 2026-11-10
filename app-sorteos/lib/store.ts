import type { OrderStatus, ProductCategory } from "@/lib/types";
import { money } from "@/lib/utils";

export const CATEGORIES: { key: ProductCategory; label: string; icon: string; empty: string }[] = [
  { key: "pollo", label: "Pollo aderezado", icon: "🍗", empty: "Pronto tendremos piezas disponibles." },
  { key: "promos", label: "Promos", icon: "🔥", empty: "Pronto habrá promos nuevas." },
  { key: "belleza", label: "Belleza", icon: "💄", empty: "Pronto llegarán productos de belleza." },
];

export const DELIVERY_NOTE = "Agenda tu pedido durante la semana. Entregamos todos los domingos.";

export const ORDER_STATUS: Record<OrderStatus, { label: string; cls: string }> = {
  pending: { label: "🟡 Esperando pago", cls: "bg-yellow-100 text-yellow-800" },
  paid: { label: "✅ Pagado", cls: "bg-green-100 text-green-700" },
  delivered: { label: "📦 Entregado", cls: "bg-gray-200 text-gray-700" },
  cancelled: { label: "Cancelado", cls: "bg-red-100 text-red-700" },
};

export const MAX_QTY = 50;

type Line = { name: string; price: number; qty: number };

function itemLines(items: Line[]) {
  return items.map((i) => `• ${i.qty} × ${i.name} — ${money(i.price * i.qty)}`);
}

function waNumber() {
  return (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "").replace(/\D/g, "");
}

/** Mensaje del cliente a Tora con su pedido (luego adjunta la captura de Yape). */
export function buildOrderWhatsAppUrl(opts: {
  orderNo: number;
  name: string;
  phone: string;
  address: string;
  note?: string | null;
  items: Line[];
  total: number;
}) {
  const text = [
    `¡Hola! 👋 Hice el pedido *N.º ${opts.orderNo}* en Tora:`,
    "",
    ...itemLines(opts.items),
    "",
    `💰 Total a pagar: *${money(opts.total)}*`,
    `👤 Nombre: ${opts.name}`,
    `📱 Celular: ${opts.phone}`,
    `📍 Entrega: ${opts.address}`,
    ...(opts.note ? [`📝 Nota: ${opts.note}`] : []),
    "",
    "📎 *Adjunto captura de Yape* 👇",
  ].join("\n");
  // api.whatsapp.com conserva los emojis; wa.me a veces los rompe al redirigir
  return `https://api.whatsapp.com/send?phone=${waNumber()}&text=${encodeURIComponent(text)}`;
}

/** Mensaje de Tora al cliente cuando cambia el estado de su pedido. */
export function orderStatusWhatsAppUrl(opts: {
  phone: string;
  name: string;
  orderNo: number;
  status: OrderStatus;
  items: Line[];
  total: number;
}) {
  const p = opts.phone.replace(/\D/g, "");
  const to = p.length === 9 ? "51" + p : p;
  const first = opts.name.trim().split(/\s+/)[0] || "";
  const head =
    opts.status === "paid"
      ? `¡Hola${first ? " " + first : ""}! ✅ Confirmamos tu pago del pedido *N.º ${opts.orderNo}*.`
      : opts.status === "delivered"
        ? `¡Hola${first ? " " + first : ""}! 📦 Tu pedido *N.º ${opts.orderNo}* ya fue entregado. ¡Gracias por tu compra!`
        : opts.status === "cancelled"
          ? `¡Hola${first ? " " + first : ""}! Tu pedido *N.º ${opts.orderNo}* fue cancelado.`
          : `¡Hola${first ? " " + first : ""}! Sobre tu pedido *N.º ${opts.orderNo}*:`;
  const text = [
    head,
    "",
    ...itemLines(opts.items),
    `💰 Total: ${money(opts.total)}`,
    ...(opts.status === "paid" ? ["", "Te lo entregamos el domingo. 🍗"] : []),
  ].join("\n");
  return `https://api.whatsapp.com/send?phone=${to}&text=${encodeURIComponent(text)}`;
}
