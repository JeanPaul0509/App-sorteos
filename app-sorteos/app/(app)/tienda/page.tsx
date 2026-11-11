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
      <section className="relative -mx-4 -mt-6 mb-12 overflow-hidden px-4 pb-14 pt-14 text-center text-white sm:mx-0 sm:mt-0 sm:rounded-3xl sm:border sm:border-gold/20 sm:bg-brand/50 sm:px-10 sm:pb-20 sm:pt-20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-28 h-72 bg-[radial-gradient(closest-side,rgb(214_173_90/0.18),transparent)]"
        />
        <p className="eyebrow anim-rise relative">Pollo aderezado · Belleza · Sorteos</p>
        <h1
          className="anim-rise relative mx-auto mt-5 max-w-3xl font-display text-[2.6rem] font-semibold leading-[1.04] tracking-tight sm:text-6xl"
          style={{ ["--delay" as string]: "60ms" }}
        >
          Sabor que se nota en tu mesa.
        </h1>
        <div className="gold-rule-center anim-rise relative mx-auto my-7 w-28" style={{ ["--delay" as string]: "120ms" }} />
        <p
          className="anim-rise relative mx-auto max-w-md text-base leading-relaxed text-white/70"
          style={{ ["--delay" as string]: "160ms" }}
        >
          {DELIVERY_NOTE}
        </p>
        <ul
          className="anim-rise relative mt-9 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-white/55"
          style={{ ["--delay" as string]: "220ms" }}
        >
          {SELLOS.map((s) => (
            <li key={s} className="before:mr-2.5 before:text-[0.5rem] before:text-gold before:content-['◆']">
              {s}
            </li>
          ))}
        </ul>
      </section>
      <Catalog products={(data ?? []) as Product[]} />
    </div>
  );
}
