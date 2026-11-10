"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AuthShell from "@/components/AuthShell";
import { createClient } from "@/lib/supabase/client";
import { cleanPhone, isValidPhone, phoneToEmail } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const p = cleanPhone(phone);
    if (!isValidPhone(p)) return setError("Ingresa un celular válido de 9 dígitos (empieza con 9).");
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email: phoneToEmail(p), password });
    setLoading(false);
    if (error)
      return setError(
        error.message === "Invalid login credentials" ? "Celular o contraseña incorrectos." : error.message
      );
    router.replace("/tienda");
    router.refresh();
  }

  return (
    <AuthShell title="Iniciar sesión" subtitle="Entra con tu número de celular">
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
        {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <button className="btn btn-primary w-full" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
      <p className="mt-5 text-center text-sm text-gray-500">
        ¿No tienes cuenta?{" "}
        <Link href="/registro" className="font-semibold text-violet-700">
          Regístrate
        </Link>
      </p>
    </AuthShell>
  );
}
