import Link from "next/link";
import Brand from "@/components/Brand";
import TermsText from "@/components/TermsText";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_TERMS } from "@/lib/terms";

export const dynamic = "force-dynamic";
export const metadata = { title: "Términos y condiciones | GoldenTicket" };

export default async function TerminosPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_settings")
    .select("terms_text, terms_updated_at")
    .eq("id", 1)
    .maybeSingle();
  const text = (data?.terms_text as string | null) || DEFAULT_TERMS;
  const updated = data?.terms_updated_at as string | null;

  return (
    <div className="min-h-screen">
      <header className="border-b border-gold/25 bg-brand/90">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Brand light />
          <Link href="/sorteos" className="text-sm font-semibold text-white/80 hover:text-white">
            Volver
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-3xl font-extrabold" style={{ fontStretch: "110%" }}>
          Términos y condiciones
        </h1>
        {updated && (
          <p className="mt-1 text-sm text-white/60">
            Última actualización: {new Date(updated).toLocaleDateString("es-PE", { dateStyle: "long", timeZone: "America/Lima" })}
          </p>
        )}
        <article className="card mt-6 p-6 sm:p-8">
          <TermsText text={text} />
        </article>
      </main>
    </div>
  );
}
