"use client";

import { useState } from "react";

/**
 * Ventana de confirmación en 2 pasos:
 * 1) muestra la advertencia, 2) obliga a escribir la palabra letra por letra (no se puede pegar).
 */
export default function ConfirmWordModal({
  word,
  title,
  message,
  confirmLabel,
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}: {
  word: string;
  title: string;
  message: React.ReactNode;
  confirmLabel: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [text, setText] = useState("");
  const ok = text.trim().toUpperCase() === word.toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 sm:items-center">
      <div className="card w-full max-w-md p-6">
        <h3 className="text-xl font-bold">{title}</h3>
        <div className="mt-2 text-sm text-gray-700">{message}</div>

        {step === 1 ? (
          <div className="mt-6 flex gap-2">
            <button onClick={onCancel} className="btn btn-light flex-1">
              Cancelar
            </button>
            <button
              onClick={() => setStep(2)}
              className={`btn flex-1 ${danger ? "bg-red-600 text-white" : "btn-gray"}`}
            >
              Continuar
            </button>
          </div>
        ) : (
          <>
            <p className="mt-5 text-sm">
              Para confirmar, escribe <b className="font-mono text-base">{word}</b>:
            </p>
            <input
              className="input mt-2 font-mono uppercase"
              autoFocus
              autoComplete="off"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onPaste={(e) => e.preventDefault()}
              onDrop={(e) => e.preventDefault()}
              placeholder={word}
            />
            <div className="mt-5 flex gap-2">
              <button onClick={onCancel} className="btn btn-light flex-1" disabled={busy}>
                Cancelar
              </button>
              <button
                onClick={onConfirm}
                disabled={!ok || busy}
                className={`btn flex-1 ${danger ? "bg-red-600 text-white" : "btn-gray"}`}
              >
                {busy ? "Procesando..." : confirmLabel}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
