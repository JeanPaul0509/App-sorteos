"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AuthShell from "@/components/AuthShell";
import { createClient } from "@/lib/supabase/client";
import { cleanPhone, isValidPhone, phoneToEmail } from "@/lib/utils";

export default function RegisterPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const p = cleanPhone(phone);
    if (!isValidPhone(p)) return setError("Ingresa un celular válido de 9 dígitos (empieza con 9).");
    if (password.length < 6) return setError("La contraseña debe tener al menos 6 caracteres.");
    if (password !== password2) return setError("Las contraseñas no coinciden.");

    setLoading(true);
    const supabase = createClient();
    // Siempre se crea como usuario común: el rol lo decide la base de datos.
    const { data, error } = await supabase.auth.signUp({
      email: phoneToEmail(p),
      password,
      options: { data: { phone: p } },
    });
    setLoading(false);

    if (error) {
      if (error.message.toLowerCase().includes("registered"))
        return setError("Ese celular ya está registrado. Inicia sesión.");
      return setError(error.message);
    }
    if (!data.session) {
      return setError(
        "Cuenta creada, pero falta desactivar 'Confirm email' en Supabase (ver guía)."
      );
    }
    router.replace("/sorteos");
    router.refresh();
  }

  return (
    <AuthShell title="Crear cuenta" subtitle="Regístrate con tu celular para participar">
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Celular</label>
          <input
            className="input"
            inputMode="numeric"
            placeholder="987654321"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            maxLength={12}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Contraseña</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Repite la contraseña</label>
          <input
            className="input"
            type="password"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            required
          />
        </div>
        {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <button className="btn btn-primary w-full" disabled={loading}>
          {loading ? "Creando..." : "Crear cuenta"}
        </button>
        <p className="text-center text-xs text-gray-500">
          Al crear tu cuenta aceptas los{" "}
          <Link href="/terminos" className="font-semibold text-violet-700 underline">
            términos y condiciones
          </Link>
          .
        </p>
      </form>
      <p className="mt-5 text-center text-sm text-gray-500">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-semibold text-violet-700">
          Inicia sesión
        </Link>
      </p>
    </AuthShell>
  );
}
