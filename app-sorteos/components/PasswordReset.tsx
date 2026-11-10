"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cleanPhone, isValidPhone } from "@/lib/utils";

function tempPassword() {
  const n = new Uint32Array(1);
  crypto.getRandomValues(n);
  return "Gt" + String(n[0] % 1_000_000).padStart(6, "0");
}

/** Admin: pone una contraseña temporal a un usuario que la olvidó y arma el mensaje para enviársela. */
export default function PasswordReset() {
  const supabase = useMemo(() => createClient(), []);
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ phone: string; password: string } | null>(null);

  async function reset() {
    setError(null);
    setDone(null);
    const p = cleanPhone(phone);
    if (!isValidPhone(p)) return setError("Escribe un celular válido de 9 dígitos (empieza con 9).");
    if (!confirm(`¿Cambiar la contraseña del celular ${p}? Su contraseña actual dejará de funcionar.`)) return;
    const password = tempPassword();
    setBusy(true);
    const { error } = await supabase.rpc("admin_reset_password", { p_phone: p, p_new_password: password });
    setBusy(false);
    if (error) return setError(error.message);
    setDone({ phone: p, password });
    setPhone("");
  }

  const waUrl = done
    ? `https://api.whatsapp.com/send?phone=51${done.phone}&text=${encodeURIComponent(
        `Hola 👋 Te cambiamos la contraseña de Gekko.\n\nCelular: ${done.phone}\nContraseña nueva: *${done.password}*\n\nEntra con estos datos.`
      )}`
    : "";

  return (
    <section className="card p-5">
      <h2 className="text-lg font-bold">🔑 Restablecer contraseña</h2>
      <p className="mt-1 text-sm text-gray-600">
        Si un usuario olvidó su contraseña y te escribe por WhatsApp, ponle una contraseña nueva aquí y envíasela.
        Verifica que te escriba desde el mismo celular de la cuenta.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <input
          className="input min-w-0 flex-1 py-2"
          inputMode="numeric"
          placeholder="Celular del usuario, ej: 987654321"
          maxLength={12}
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            setError(null);
          }}
        />
        <button onClick={reset} disabled={busy} className="btn btn-primary py-2">
          {busy ? "Cambiando..." : "Crear contraseña nueva"}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
      {done && (
        <div className="anim-rise mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-green-50 p-3 text-sm text-green-900">
          <span>
            Contraseña nueva de <b>{done.phone}</b>: <b className="font-mono text-base">{done.password}</b>
          </span>
          <a href={waUrl} target="_blank" rel="noreferrer" className="btn btn-green py-2 text-sm">
            📲 Enviársela por WhatsApp
          </a>
        </div>
      )}
    </section>
  );
}
