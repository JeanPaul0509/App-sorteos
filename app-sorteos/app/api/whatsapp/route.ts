import { createHmac, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import { cleanPhone, isValidPhone } from "@/lib/utils";

// Receptor de WhatsApp (Meta). Verificación inversa de celular:
// la persona envía "GT-XXXXXX" al número de verificación y aquí lo confirmamos.
// No se responde nada por WhatsApp, así que no genera costo de mensajes enviados.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface WaPayload {
  entry?: {
    changes?: {
      value?: {
        messages?: { type?: string; from?: string; text?: { body?: string } }[];
      };
    }[];
  }[];
}

/** Meta llama a esta dirección una sola vez para comprobar que es tuya. */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const token = process.env.WHATSAPP_VERIFY_TOKEN;
  if (token && q.get("hub.mode") === "subscribe" && q.get("hub.verify_token") === token) {
    return new Response(q.get("hub.challenge") ?? "", { status: 200 });
  }
  return new Response("No autorizado", { status: 403 });
}

/** Comprueba que el aviso lo firmó Meta (con el App Secret) y no un tercero. */
function validSignature(raw: string, header: string | null) {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret || !header || !header.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", secret).update(raw).digest();
  const got = Buffer.from(header.slice(7), "hex");
  return got.length === expected.length && timingSafeEqual(got, expected);
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (!validSignature(raw, req.headers.get("x-hub-signature-256"))) {
    return new Response("Firma inválida", { status: 401 });
  }

  let body: WaPayload;
  try {
    body = JSON.parse(raw) as WaPayload;
  } catch {
    return new Response("ok", { status: 200 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("whatsapp: falta NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
    return new Response("Falta configuración", { status: 500 });
  }
  const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  let failed = false;
  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      for (const m of change.value?.messages ?? []) {
        if (m.type !== "text") continue;
        const code = String(m.text?.body ?? "").match(/GT-[0-9A-F]{6}/i)?.[0];
        if (!code) continue;
        // "from" llega como 51987654321: lo dejamos en 9 dígitos, como se guarda en profiles.phone
        const phone = cleanPhone(String(m.from ?? ""));
        if (!isValidPhone(phone)) continue;

        const { error } = await admin.rpc("confirm_phone_verification", {
          p_phone: phone,
          p_code: code.toUpperCase(),
        });
        if (error) {
          console.error("whatsapp: no se pudo confirmar:", error.message);
          failed = true;
        }
      }
    }
  }
  // 500 solo si la base falló: Meta reintentará el aviso.
  return new Response(failed ? "error" : "ok", { status: failed ? 500 : 200 });
}
