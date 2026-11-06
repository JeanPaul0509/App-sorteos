"use client";

import { useEffect, useMemo, useState } from "react";
import TermsText from "@/components/TermsText";
import { createClient } from "@/lib/supabase/client";
import { DEFAULT_TERMS } from "@/lib/terms";

/** Admin: editar los Términos y Condiciones que se muestran en /terminos. */
export default function TermsEditor() {
  const supabase = useMemo(() => createClient(), []);
  const [text, setText] = useState("");
  const [saved, setSaved] = useState("");
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("terms_text")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data }) => {
        const t = (data as { terms_text?: string | null } | null)?.terms_text ?? "";
        setText(t || DEFAULT_TERMS);
        setSaved(t);
      });
  }, [supabase]);

  async function save() {
    setBusy(true);
    const { error } = await supabase
      .from("site_settings")
      .update({ terms_text: text.trim(), terms_updated_at: new Date().toISOString() })
      .eq("id", 1);
    setBusy(false);
    if (error) return setMsg({ ok: false, text: error.message });
    setSaved(text.trim());
    setMsg({ ok: true, text: "Términos publicados. Ya se ven en la página de términos." });
  }

  return (
    <section className="card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold">📄 Términos y condiciones</h2>
        <a href="/terminos" target="_blank" rel="noreferrer" className="text-sm font-semibold text-violet-700 underline">
          Ver página pública
        </a>
      </div>
      <p className="mt-1 text-sm text-gray-600">
        Empieza con una plantilla. Completa lo que está entre [corchetes] y haz que un abogado la revise antes de
        publicarla. Usa &quot;## &quot; para títulos y &quot;- &quot; para viñetas.
      </p>
      {!saved && (
        <p className="mt-2 rounded-xl bg-yellow-50 p-3 text-sm text-yellow-900">
          Todavía no publicaste tus términos. Mientras tanto, la página muestra esta plantilla.
        </p>
      )}

      <div className="mt-3 flex gap-2">
        <button onClick={() => setPreview(false)} className={`btn py-1.5 text-sm ${!preview ? "btn-primary" : "btn-light"}`}>
          Editar
        </button>
        <button onClick={() => setPreview(true)} className={`btn py-1.5 text-sm ${preview ? "btn-primary" : "btn-light"}`}>
          Vista previa
        </button>
      </div>

      {preview ? (
        <div className="mt-3 max-h-[28rem] overflow-auto rounded-xl border border-line p-4">
          <TermsText text={text} />
        </div>
      ) : (
        <textarea
          className="input mt-3 min-h-[28rem] font-mono text-sm"
          maxLength={20000}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setMsg(null);
          }}
        />
      )}

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button onClick={save} disabled={busy || text.trim() === saved} className="btn btn-primary py-2">
          {busy ? "Publicando..." : "Publicar términos"}
        </button>
        {msg && <p className={`text-sm ${msg.ok ? "text-green-700" : "text-red-700"}`}>{msg.text}</p>}
      </div>
    </section>
  );
}
