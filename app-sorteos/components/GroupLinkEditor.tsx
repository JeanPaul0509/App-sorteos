"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isValidGroupUrl } from "@/lib/utils";

/** Admin: ver y cambiar el enlace del grupo de WhatsApp de un sorteo. */
export default function GroupLinkEditor({ raffleId }: { raffleId: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [url, setUrl] = useState("");
  const [saved, setSaved] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase
      .from("raffle_secrets")
      .select("whatsapp_group_url")
      .eq("raffle_id", raffleId)
      .maybeSingle()
      .then(({ data }) => {
        setUrl(data?.whatsapp_group_url ?? "");
        setSaved(data?.whatsapp_group_url ?? "");
      });
  }, [supabase, raffleId]);

  async function save() {
    const v = url.trim();
    if (v && !isValidGroupUrl(v))
      return setMsg({ ok: false, text: "El enlace debe empezar con https://chat.whatsapp.com/" });
    setBusy(true);
    const { error } = await supabase
      .from("raffle_secrets")
      .upsert({ raffle_id: raffleId, whatsapp_group_url: v || null });
    setBusy(false);
    if (error) return setMsg({ ok: false, text: error.message });
    setSaved(v);
    setMsg({ ok: true, text: v ? "Enlace guardado." : "Enlace quitado." });
  }

  return (
    <section className="card p-5">
      <h2 className="text-lg font-bold">💬 Grupo de WhatsApp del sorteo</h2>
      <p className="mt-1 text-sm text-gray-600">
        Solo lo ven los compradores con al menos un número pagado (gris). Les aparece en el sorteo y en
        &quot;Mis números&quot;.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <input
          className="input min-w-0 flex-1 py-2"
          placeholder="https://chat.whatsapp.com/..."
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setMsg(null);
          }}
        />
        <button onClick={save} disabled={busy || url.trim() === saved} className="btn btn-primary py-2">
          {busy ? "Guardando..." : "Guardar enlace"}
        </button>
      </div>
      {msg && <p className={`mt-2 text-sm ${msg.ok ? "text-green-700" : "text-red-700"}`}>{msg.text}</p>}
    </section>
  );
}
