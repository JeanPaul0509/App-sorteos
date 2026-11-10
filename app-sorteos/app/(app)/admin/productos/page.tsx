"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ConfirmWordModal from "@/components/ConfirmWordModal";
import SafeImg from "@/components/SafeImg";
import { compressImage } from "@/lib/image";
import { createClient } from "@/lib/supabase/client";
import { CATEGORIES } from "@/lib/store";
import type { Product, ProductCategory } from "@/lib/types";
import { money, num } from "@/lib/utils";

const MAX_PHOTO_MB = 15;

interface Draft {
  id: string | null;
  name: string;
  description: string;
  category: ProductCategory;
  price: string;
  stock: string;
  active: boolean;
  image_url: string | null;
}

const EMPTY: Draft = {
  id: null,
  name: "",
  description: "",
  category: "pollo",
  price: "",
  stock: "0",
  active: true,
  image_url: null,
};

export default function AdminProductsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [toDelete, setToDelete] = useState<Product | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("products")
      .select("*")
      .order("sort", { ascending: true })
      .order("created_at", { ascending: true });
    setProducts((data ?? []) as Product[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveStock(p: Product, value: string) {
    const n = parseInt(value, 10);
    if (!Number.isInteger(n) || n < 0 || n > 100000 || n === p.stock) {
      load(); // vuelve al valor guardado
      return;
    }
    const { error } = await supabase.from("products").update({ stock: n }).eq("id", p.id);
    if (error) setMsg(error.message);
    load();
  }

  async function toggleActive(p: Product) {
    const { error } = await supabase.from("products").update({ active: !p.active }).eq("id", p.id);
    if (error) setMsg(error.message);
    load();
  }

  async function remove(p: Product) {
    setBusy(true);
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    setBusy(false);
    if (error) return setMsg(error.message);
    setToDelete(null);
    load();
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Productos</h1>
          <p className="text-white/60">Sube la foto, el precio y las unidades disponibles de cada producto.</p>
        </div>
        <button onClick={() => setDraft({ ...EMPTY })} className="btn btn-primary">
          + Nuevo producto
        </button>
      </div>

      {msg && (
        <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">
          {msg}
        </p>
      )}

      {loading ? (
        <div className="space-y-3" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-20 rounded-2xl" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="card p-10 text-center text-gray-500">Aún no creaste ningún producto.</div>
      ) : (
        <div className="space-y-8">
          {CATEGORIES.map((c) => {
            const list = products.filter((p) => p.category === c.key);
            if (list.length === 0) return null;
            return (
              <section key={c.key}>
                <h2 className="mb-3 text-lg font-extrabold text-white">
                  {c.icon} {c.label}
                </h2>
                <div className="space-y-3">
                  {list.map((p) => (
                    <div key={p.id} className="card flex flex-wrap items-center gap-4 p-4">
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gold-soft">
                        <SafeImg src={p.image_url} alt={p.name} icon={c.icon} iconClassName="text-3xl" className="h-full w-full object-cover" />
                      </div>
                      <div className="min-w-[10rem] flex-1">
                        <p className="font-bold [overflow-wrap:anywhere]">
                          {p.name}{" "}
                          {!p.active && (
                            <span className="ml-1 whitespace-nowrap rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600">
                              Oculto
                            </span>
                          )}
                          {p.active && p.stock === 0 && (
                            <span className="ml-1 whitespace-nowrap rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">
                              Agotado
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-gray-500">{money(p.price)}</p>
                      </div>
                      <label className="flex items-center gap-2 text-sm">
                        <span className="text-gray-600">Unidades</span>
                        <StockInput key={`${p.id}-${p.stock}`} value={p.stock} onSave={(v) => saveStock(p, v)} />
                      </label>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() =>
                            setDraft({
                              id: p.id,
                              name: p.name,
                              description: p.description ?? "",
                              category: p.category,
                              price: String(p.price),
                              stock: String(p.stock),
                              active: p.active,
                              image_url: p.image_url,
                            })
                          }
                          className="btn btn-primary py-2 text-sm"
                        >
                          Editar
                        </button>
                        <button onClick={() => toggleActive(p)} className="btn btn-light py-2 text-sm">
                          {p.active ? "Ocultar" : "Mostrar"}
                        </button>
                        <button onClick={() => setToDelete(p)} className="btn btn-danger py-2 text-sm">
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {draft && (
        <ProductForm
          draft={draft}
          onClose={() => setDraft(null)}
          onSaved={() => {
            setDraft(null);
            setMsg(null);
            load();
          }}
        />
      )}

      {toDelete && (
        <ConfirmWordModal
          key={toDelete.id}
          word="ELIMINAR"
          danger
          busy={busy}
          title="⚠️ Eliminar producto"
          confirmLabel="Eliminar para siempre"
          message={
            <>
              Vas a eliminar <b>{toDelete.name}</b> de la tienda. Los pedidos que ya lo incluían se mantienen. Si
              solo quieres que no se vea, usa <b>Ocultar</b>.
            </>
          }
          onCancel={() => setToDelete(null)}
          onConfirm={() => remove(toDelete)}
        />
      )}
    </div>
  );
}

/** Casilla de unidades: se guarda al salir de la casilla o al presionar Enter. */
function StockInput({ value, onSave }: { value: number; onSave: (v: string) => void }) {
  const [v, setV] = useState(String(value));
  return (
    <input
      className="input w-24 py-2 text-center"
      inputMode="numeric"
      aria-label="Unidades disponibles"
      value={v}
      onChange={(e) => setV(e.target.value.replace(/\D/g, "").slice(0, 6))}
      onBlur={() => onSave(v)}
      onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
    />
  );
}

function ProductForm({
  draft,
  onClose,
  onSaved,
}: {
  draft: Draft;
  onClose: () => void;
  onSaved: () => void;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [d, setD] = useState<Draft>(draft);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(draft.image_url);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !saving && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [saving, onClose]);

  useEffect(() => {
    return () => {
      if (preview && preview.startsWith("blob:")) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((cur) => ({ ...cur, [k]: v }));

  function onPick(f: File | null) {
    if (!f) return;
    if (!f.type.startsWith("image/")) return setError("Elige una foto (JPG o PNG).");
    if (f.size > MAX_PHOTO_MB * 1024 * 1024) return setError(`La foto pesa más de ${MAX_PHOTO_MB} MB. Elige otra.`);
    setError(null);
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const price = Number(d.price.replace(",", "."));
    const stock = parseInt(d.stock, 10);
    if (!d.name.trim()) return setError("Ponle un nombre al producto.");
    if (!Number.isFinite(price) || price < 0 || price > 100000) return setError("El precio no es válido.");
    if (!Number.isInteger(stock) || stock < 0 || stock > 100000) return setError("Las unidades no son válidas.");

    setSaving(true);
    let image_url = d.image_url;
    if (file) {
      const small = await compressImage(file);
      const ext = small.type === "image/jpeg" ? "jpg" : (small.name.split(".").pop() || "jpg").toLowerCase();
      const path = `productos/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("raffle-images")
        .upload(path, small, { cacheControl: "3600", upsert: false, contentType: small.type });
      if (upErr) {
        setSaving(false);
        return setError("No se pudo subir la foto: " + upErr.message);
      }
      image_url = supabase.storage.from("raffle-images").getPublicUrl(path).data.publicUrl;
    }

    const row = {
      name: d.name.trim(),
      description: d.description.trim() || null,
      category: d.category,
      price,
      stock,
      active: d.active,
      image_url,
    };
    const { error: err } = d.id
      ? await supabase.from("products").update(row).eq("id", d.id)
      : await supabase.from("products").insert(row);
    setSaving(false);
    if (err) return setError(err.message);
    onSaved();
  }

  return (
    <div
      className="anim-overlay fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/50 p-3 sm:items-center"
      onClick={(e) => e.target === e.currentTarget && !saving && onClose()}
    >
      <form
        onSubmit={save}
        role="dialog"
        aria-modal="true"
        aria-label={d.id ? "Editar producto" : "Nuevo producto"}
        className="anim-modal card my-auto w-full max-w-md space-y-4 p-6"
      >
        <h3 className="text-xl font-bold">{d.id ? "Editar producto" : "Nuevo producto"}</h3>

        <div>
          <span className="mb-1 block text-sm font-medium">Foto</span>
          <label className="flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50/50 p-3 text-center text-sm text-gray-500 hover:border-violet-400">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Vista previa" className="max-h-48 rounded-xl object-contain" />
            ) : (
              <>
                <span className="text-4xl">📷</span>
                Toca para subir una foto
              </>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => onPick(e.target.files?.[0] ?? null)} />
          </label>
          {preview && <p className="mt-1 text-xs text-gray-500">Toca la foto para cambiarla.</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="p-name">Nombre *</label>
          <input id="p-name" className="input" maxLength={80} placeholder="Ej: Pecho" value={d.name} onChange={(e) => set("name", e.target.value)} />
        </div>

        <div>
          <span className="mb-1 block text-sm font-medium">Categoría</span>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                type="button"
                key={c.key}
                onClick={() => set("category", c.key)}
                aria-pressed={d.category === c.key}
                className={`btn py-2 text-sm ${d.category === c.key ? "btn-primary" : "btn-light"}`}
              >
                {c.icon} {c.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="p-desc">Descripción (opcional)</label>
          <textarea id="p-desc" className="input min-h-20" maxLength={500} placeholder="Ej: Pollo entero · 8 piezas aderezadas" value={d.description} onChange={(e) => set("description", e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="p-price">Precio (S/) *</label>
            <input id="p-price" className="input" inputMode="decimal" placeholder="6.00" value={d.price} onChange={(e) => set("price", e.target.value.replace(/[^0-9.,]/g, ""))} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="p-stock">Unidades *</label>
            <input id="p-stock" className="input" inputMode="numeric" value={d.stock} onChange={(e) => set("stock", e.target.value.replace(/\D/g, "").slice(0, 6))} />
          </div>
        </div>
        {d.price && Number.isFinite(Number(d.price.replace(",", "."))) && (
          <p className="-mt-2 text-xs text-gray-500">
            Se verá como {money(Number(d.price.replace(",", ".")))} · {num(parseInt(d.stock, 10) || 0)} disponibles
          </p>
        )}

        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" className="h-5 w-5 accent-[var(--color-brand)]" checked={d.active} onChange={(e) => set("active", e.target.checked)} />
          Visible en la tienda
        </label>

        {error && (
          <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}

        <div className="flex gap-2">
          <button type="button" onClick={onClose} disabled={saving} className="btn btn-light flex-1">
            Cancelar
          </button>
          <button className="btn btn-primary flex-1" disabled={saving}>
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </div>
  );
}
