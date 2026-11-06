"use client";

import { useEffect, useMemo, useState } from "react";
import { FaInstagram, FaTiktok, FaWhatsapp } from "react-icons/fa";
import { createClient } from "@/lib/supabase/client";
import type { SiteSettings } from "@/lib/types";
import { normalizeSocial } from "@/lib/utils";

const FIELDS = [
  { key: "whatsapp_url", kind: "whatsapp", label: "WhatsApp", Icon: FaWhatsapp, ph: "987654321 o https://chat.whatsapp.com/..." },
  { key: "instagram_url", kind: "instagram", label: "Instagram", Icon: FaInstagram, ph: "@tucuenta o https://instagram.com/..." },
  { key: "tiktok_url", kind: "tiktok", label: "TikTok", Icon: FaTiktok, ph: "@tucuenta o https://www.tiktok.com/@..." },
] as const;

/** Admin: configurar redes sociales que se muestran en toda la app. */
export default function SocialSettings() {
  const supabase = useMemo(() => createClient(), []);
  const [form, setForm] = useState<Record<string, string>>({ whatsapp_url: "", instagram_url: "", tiktok_url: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("whatsapp_url, instagram_url, tiktok_url")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data }) => {
        const d = (data ?? {}) as Partial<SiteSettings>;
        setForm({
          whatsapp_url: d.whatsapp_url ?? "",
          instagram_url: d.instagram_url ?? "",
          tiktok_url: d.tiktok_url ?? "",
        });
      });
  }, [supabase]);

  async function save() {
    const values = {
      whatsapp_url: normalizeSocial("whatsapp", form.whatsapp_url),
      instagram_url: normalizeSocial("instagram", form.instagram_url),
      tiktok_url: normalizeSocial("tiktok", form.tiktok_url),
    };
    setBusy(true);
    const { error } = await supabase
      .from("site_settings")
      .update({ ...values, updated_at: new Date().toISOString() })
      .eq("id", 1);
    setBusy(false);
    if (error) return setMsg({ ok: false, text: error.message });
    setForm({
      whatsapp_url: values.whatsapp_url ?? "",
      instagram_url: values.instagram_url ?? "",
      tiktok_url: values.tiktok_url ?? "",
    });
    setMsg({ ok: true, text: "Redes guardadas. Ya se ven en la app." });
  }

  return (
    <section className="card p-5">
      <h2 className="text-lg font-bold">Redes sociales</h2>
      <p className="mt-1 text-sm text-gray-600">
        Aparecen como íconos al pie de todas las páginas y en el login. Deja vacío lo que no quieras mostrar.
      </p>
      <div className="mt-4 space-y-3">
        {FIELDS.map(({ key, label, Icon, ph }) => (
          <label key={key} className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-paper text-ink" title={label}>
              <Icon className="h-5 w-5" />
            </span>
            <span className="sr-only">{label}</span>
            <input
              className="input py-2"
              placeholder={ph}
              value={form[key]}
              onChange={(e) => {
                setForm({ ...form, [key]: e.target.value });
                setMsg(null);
              }}
            />
          </label>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button onClick={save} disabled={busy} className="btn btn-primary py-2">
          {busy ? "Guardando..." : "Guardar redes"}
        </button>
        {msg && <p className={`text-sm ${msg.ok ? "text-green-700" : "text-red-700"}`}>{msg.text}</p>}
      </div>
    </section>
  );
}
