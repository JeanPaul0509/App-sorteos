import Catalog from "@/components/Catalog";
import { createClient } from "@/lib/supabase/server";
import { DELIVERY_NOTE } from "@/lib/store";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

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
      <section className="-mx-4 -mt-6 mb-8 border-b border-gold/20 bg-brand/80 px-4 pb-8 pt-8 text-white sm:mx-0 sm:mt-0 sm:rounded-2xl sm:border sm:px-8">
        <h1
          className="anim-rise max-w-2xl text-3xl font-extrabold leading-tight sm:text-4xl"
          style={{ fontStretch: "110%" }}
        >
          Pollo aderezado, listo para cocinar.
        </h1>
        <p className="anim-rise mt-3 max-w-xl text-white/70" style={{ ["--delay" as string]: "80ms" }}>
          {DELIVERY_NOTE} Pagas con Yape y confirmamos tu pedido por WhatsApp.
        </p>
      </section>
      <Catalog products={(data ?? []) as Product[]} />
    </div>
  );
}
