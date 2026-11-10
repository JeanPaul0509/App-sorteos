"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Número de WhatsApp que recibe las verificaciones (con 51 adelante). Es un chip aparte.
const VERIFY_NUMBER = (process.env.NEXT_PUBLIC_VERIFY_WHATSAPP_NUMBER ?? "").replace(/\D/g, "");
const CODE_MINUTES = 15;

export default function VerifyPhoneModal({
  phone,
  onClose,
  onVerified,
}: {
  phone: string;
  onClose: () => void;
  onVerified: () => void;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);
  const [verified, setVerified] = useState(false);
  const [attempt, setAttempt] = useState(0); // sube al pedir otro código
  const expiresAt = useRef(0);
  const userId = useRef<string | null>(null);
  const done = useRef(false);
  // El padre se vuelve a dibujar seguido: guardamos la función en una referencia
  // para que no se pida un código nuevo en cada repintado.
  const onVerifiedRef = useRef(onVerified);
  onVerifiedRef.current = onVerified;

  const finish = useCallback(() => {
    if (done.current) return;
    done.current = true;
    setVerified(true);
    setTimeout(() => onVerifiedRef.current(), 900);
  }, []);

  // Pide el código al abrir (o al pedir otro)
  useEffect(() => {
    let cancelled = false;
    setCode(null);
    setError(null);
    setExpired(false);
    (async () => {
      if (!VERIFY_NUMBER) {
        setError("Falta configurar el número de verificación. Avísale al administrador.");
        return;
      }
      const { data, error } = await supabase.rpc("start_phone_verification");
      if (cancelled) return;
      if (error) return setError(error.message);
      if (data == null) return finish(); // ya estaba verificado
      expiresAt.current = Date.now() + CODE_MINUTES * 60 * 1000;
      setCode(String(data));
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, attempt, finish]);

  // Revisa cada 3 s si ya se verificó (y apenas vuelve a esta pestaña)
  useEffect(() => {
    if (!code || verified || expired) return;
    let stop = false;

    async function check() {
      if (stop || done.current) return;
      if (Date.now() > expiresAt.current) return setExpired(true);
      if (!userId.current) {
        const { data } = await supabase.auth.getUser();
        userId.current = data.user?.id ?? null;
      }
      if (!userId.current) return;
      const { data } = await supabase
        .from("profiles")
        .select("verified_at")
        .eq("id", userId.current)
        .maybeSingle();
      if (!stop && data?.verified_at) finish();
    }

    const t = setInterval(check, 3000);
    const onVisible = () => document.visibilityState === "visible" && check();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stop = true;
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [supabase, code, verified, expired, finish]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const url = code
    ? `https://api.whatsapp.com/send?phone=${VERIFY_NUMBER}&text=${encodeURIComponent(
        `Hola 👋 Quiero verificar mi celular en Gekko.\nCódigo: ${code}`
      )}`
    : null;

  return (
    <div
      className="anim-overlay fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 sm:items-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div role="dialog" aria-modal="true" aria-labelledby="verify-title" className="anim-modal card w-full max-w-md p-6">
        {verified ? (
          <div className="py-6 text-center">
            <p className="text-4xl">✅</p>
            <h3 id="verify-title" className="mt-2 text-xl font-bold">
              ¡Celular verificado!
            </h3>
            <p className="mt-1 text-sm text-gray-600">Ya puedes continuar con tu compra.</p>
          </div>
        ) : (
          <>
            <h3 id="verify-title" className="text-xl font-bold">
              Verifica tu celular
            </h3>
            <p className="mt-1 text-sm text-gray-600 [overflow-wrap:anywhere]">
              Para comprar, confirmamos que el <b>{phone}</b> es tuyo. Es gratis y toma unos segundos.
            </p>

            <ol className="mt-4 space-y-2 text-sm">
              <li className="flex gap-2">
                <b className="text-gold-deep">1.</b> Toca <b>Abrir WhatsApp</b>.
              </li>
              <li className="flex gap-2">
                <b className="text-gold-deep">2.</b> Envía el mensaje tal como aparece, sin cambiarlo.
              </li>
              <li className="flex gap-2">
                <b className="text-gold-deep">3.</b> Vuelve aquí: se confirma solo.
              </li>
            </ol>

            {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

            {expired ? (
              <div className="mt-5">
                <p className="rounded-xl bg-paper p-3 text-sm text-gray-700">
                  El código venció. Pide uno nuevo para intentarlo otra vez.
                </p>
                <button onClick={() => setAttempt((n) => n + 1)} className="btn btn-primary mt-3 w-full">
                  Pedir otro código
                </button>
              </div>
            ) : (
              !error && (
                <div className="mt-5">
                  {url ? (
                    <a href={url} target="_blank" rel="noreferrer" className="btn btn-green block w-full text-center">
                      📲 Abrir WhatsApp
                    </a>
                  ) : (
                    <button className="btn btn-green w-full" disabled>
                      Preparando tu código…
                    </button>
                  )}
                  {code && (
                    <p className="mt-3 text-center text-sm text-gray-600" role="status">
                      Esperando tu mensaje… · Código <b className="tabular-nums">{code}</b>
                    </p>
                  )}
                </div>
              )
            )}

            <button onClick={onClose} className="btn btn-light mt-4 w-full">
              Cerrar
            </button>
          </>
        )}
      </div>
    </div>
  );
}
