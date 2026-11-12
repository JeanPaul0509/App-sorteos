import type { OrderStatus, ProductCategory } from "@/lib/types";
import { money, WHATSAPP_NUMBER } from "@/lib/utils";

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

/** Oferta de los jueves (solo piezas de pollo): 1.ª unidad S/5, 2.ª S/6, desde la 3.ª el precio normal.
 *  Es por cuenta y por pieza, y cuenta lo ya pedido ese jueves. El precio real lo calcula la base (`create_order`). */
export const PROMO_PRICES = [5, 6];
export const PROMO_NOTE = "Jueves de oferta: la 1.ª de cada pieza a S/5 y la 2.ª a S/6 (por cuenta).";

/** Reparte `qty` unidades en tramos de precio. `prev` = unidades de esa pieza que ya pidió hoy. */
export function priceTiers(qty: number, price: number, promo: boolean, prev = 0): { qty: number; price: number }[] {
  const out: { qty: number; price: number }[] = [];
  let left = qty;
  let k = prev; // unidades ya compradas
  if (promo) {
    for (const pp of PROMO_PRICES) {
      if (k === 0 && left > 0) {
        out.push({ qty: 1, price: Math.min(price, pp) });
        left -= 1;
      } else if (k > 0) {
        k -= 1;
      }
    }
  }
  if (left > 0) out.push({ qty: left, price });
  return out;
}

export function tiersTotal(tiers: { qty: number; price: number }[]) {
  return tiers.reduce((a, t) => a + t.qty * t.price, 0);
}

type Line = { name: string; price: number; qty: number };

function itemLines(items: Line[]) {
  return items.map((i) => `• ${i.qty} × ${i.name} — ${money(i.price * i.qty)}`);
}

function waNumber() {
  return WHATSAPP_NUMBER;
}

/** Mensaje del cliente a Gekko con su pedido (luego adjunta la captura de Yape). */
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
    `¡Hola! 👋 Hice el pedido *N.º ${opts.orderNo}* en Gekko:`,
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

/** Mensaje de Gekko al cliente cuando cambia el estado de su pedido. */
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

/** ¿Hoy es jueves en Lima? (solo para mostrar; el cobro real lo decide la base de datos) */
export function isPromoDayLima(now = new Date()) {
  return new Intl.DateTimeFormat("en-US", { timeZone: "America/Lima", weekday: "short" }).format(now) === "Thu";
}
