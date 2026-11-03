"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ICONS, money } from "@/lib/utils";

const PRESETS = [50, 100, 150, 200, 500, 1000];

export default function NewRafflePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [specs, setSpecs] = useState("");
  const [icon, setIcon] = useState("🎁");
  const [price, setPrice] = useState("5");
  const [total, setTotal] = useState("100");
  const [drawDate, setDrawDate] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function onFile(f: File | null) {
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const n = parseInt(total, 10);
    const p = Number(price);
    if (!title.trim()) return setError("Ponle un nombre al sorteo.");
    if (!n || n < 1 || n > 10000) return setError("La cantidad de tickets debe estar entre 1 y 10000.");
    if (isNaN(p) || p < 0) return setError("Precio inválido.");

    setSaving(true);
    const supabase = createClient();
    let image_url: string | null = null;

    if (file) {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("raffle-images")
        .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
      if (upErr) {
        setSaving(false);
        return setError("No se pudo subir la foto: " + upErr.message);
      }
      image_url = supabase.storage.from("raffle-images").getPublicUrl(path).data.publicUrl;
    }

    const { data, error } = await supabase
      .from("raffles")
      .insert({
        title: title.trim(),
        description: description.trim() || null,
        specs: specs.trim() || null,
        icon,
        price: p,
        total_tickets: n,
        draw_date: drawDate || null,
        image_url,
      })
      .select("id")
      .single();

    setSaving(false);
    if (error) return setError(error.message);
    router.push(`/admin/sorteos/${data.id}`);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/admin" className="text-sm text-violet-700">
        ← Volver
      </Link>
      <h1 className="mb-5 mt-2 text-2xl font-extrabold">Nuevo sorteo</h1>

      <form onSubmit={onSubmit} className="card space-y-5 p-6">
        <div>
          <label className="mb-1 block text-sm font-medium">Foto del premio</label>
          <label className="flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50/50 p-4 text-center text-sm text-gray-500 hover:border-violet-400">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="" className="max-h-60 rounded-xl object-contain" />
            ) : (
              <>
                <span className="text-4xl">📷</span>
                Toca para subir una foto
              </>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Nombre del premio *</label>
          <input className="input" placeholder="Ej: iPhone 15 128GB" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Ícono</label>
          <div className="flex flex-wrap gap-2">
            {ICONS.map((i) => (
              <button
                type="button"
                key={i}
                onClick={() => setIcon(i)}
                className={`h-11 w-11 rounded-xl text-2xl ${icon === i ? "bg-violet-600 ring-2 ring-violet-300" : "bg-gray-100"}`}
              >
                {i}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Descripción</label>
          <textarea
            className="input min-h-20"
            placeholder="Cuenta algo del premio, reglas, cómo se sortea..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Especificaciones (una por línea)</label>
          <textarea
            className="input min-h-24"
            placeholder={"Color negro\n128 GB\nNuevo en caja"}
            value={specs}
            onChange={(e) => setSpecs(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">¿Cuántos tickets se venderán? *</label>
          <div className="mb-2 flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                type="button"
                key={p}
                onClick={() => setTotal(String(p))}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
                  total === String(p) ? "bg-violet-700 text-white" : "bg-gray-100"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <input
            className="input"
            inputMode="numeric"
            value={total}
            onChange={(e) => setTotal(e.target.value.replace(/\D/g, ""))}
          />
          <p className="mt-1 text-xs text-gray-500">
            Se crearán los números del 1 al {total || "?"}. No se puede cambiar después.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Precio por ticket (S/) *</label>
            <input className="input" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Fecha del sorteo</label>
            <input className="input" type="date" value={drawDate} onChange={(e) => setDrawDate(e.target.value)} />
          </div>
        </div>

        <p className="rounded-xl bg-violet-50 p-3 text-sm text-violet-900">
          Si vendes todo: <b>{money((parseInt(total, 10) || 0) * (Number(price) || 0))}</b>
        </p>

        {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <button className="btn btn-primary w-full" disabled={saving}>
          {saving ? "Creando sorteo..." : "Crear sorteo"}
        </button>
      </form>
    </div>
  );
}
