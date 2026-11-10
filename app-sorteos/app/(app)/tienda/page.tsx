import Catalog from "@/components/Catalog";
import { createClient } from "@/lib/supabase/server";
import { DELIVERY_NOTE } from "@/lib/store";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

const SELLOS = ["Entregas los domingos", "Pago con Yape", "Confirmación por WhatsApp"];

export default async function TiendaPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("active", true)
    .order("sort", { ascending: true })
    .order("created_at", { ascending: true });

  return (
    <div>
      <section className="-mx-4 -mt-6 mb-10 border-b border-gold/20 px-4 pb-10 pt-10 text-white sm:mx-0 sm:mt-0 sm:rounded-2xl sm:border sm:bg-brand/60 sm:px-10 sm:pt-12">
        <p className="anim-rise text-xs font-semibold uppercase tracking-[0.2em] text-gold">
          Pollo aderezado · Belleza · Sorteos
        </p>
        <h1
          className="anim-rise mt-3 max-w-2xl text-3xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl"
          style={{ fontStretch: "112%", ["--delay" as string]: "60ms" }}
        >
          Listo para cocinar, directo a tu mesa.
        </h1>
        <p className="anim-rise mt-4 max-w-xl text-white/70" style={{ ["--delay" as string]: "120ms" }}>
          {DELIVERY_NOTE}
        </p>
        <ul className="anim-rise mt-6 flex flex-wrap gap-2" style={{ ["--delay" as string]: "180ms" }}>
          {SELLOS.map((s) => (
            <li key={s} className="rounded-full border border-gold/30 px-3 py-1 text-xs font-semibold text-gold">
              {s}
            </li>
          ))}
        </ul>
      </section>
      <Catalog products={(data ?? []) as Product[]} />
    </div>
  );
}
