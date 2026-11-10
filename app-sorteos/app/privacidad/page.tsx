import Link from "next/link";
import Brand from "@/components/Brand";
import TermsText from "@/components/TermsText";

export const metadata = { title: "Política de privacidad | Gekko" };

// Borrador general en lenguaje simple. Debe revisarlo un abogado antes de cobrar (ver CLAUDE.md).
const PRIVACY = `## 1. Qué datos guardamos
- Tu número de celular y tu contraseña. La contraseña se guarda cifrada; nosotros no podemos verla.
- Tu nombre y la dirección o referencia de entrega, cuando haces un pedido o reservas números.
- Tus pedidos (qué pediste, cuánto y el estado del pago) y los números de sorteo que reservas o compras.
- Si verificas tu celular por WhatsApp: tu número de WhatsApp y el código que envías en ese mensaje.

## 2. Para qué los usamos
- Crear tu cuenta, preparar y entregar tus pedidos y permitirte participar en los sorteos.
- Confirmar tus pagos y avisarte por WhatsApp o llamada.
- Verificar que el celular con el que te registras es tuyo.
- Contactarte si ganas un premio y coordinar su entrega.

## 3. Qué se muestra públicamente
- Si ganas, publicamos el número ganador y tu nombre abreviado (por ejemplo, "Juan P."). Nunca publicamos tu celular completo.
- Las demás personas solo ven si un número está disponible, reservado o vendido, sin nombres ni celulares.

## 4. Con quién compartimos datos
No vendemos ni alquilamos tus datos. Usamos estos servicios para que la app funcione:
- Supabase: guarda la base de datos y las cuentas.
- Vercel: aloja la aplicación.
- WhatsApp (Meta): recibe el mensaje de verificación de celular y es el canal donde nos envías la captura de tu pago.
- Yape: procesa tu pago. No recibimos tus datos bancarios.

## 5. Por cuánto tiempo
Guardamos tus datos mientras tu cuenta exista y mientras sean necesarios para los sorteos en los que participaste, incluido el registro de ganadores.

## 6. Tus derechos
Puedes pedirnos que corrijamos tus datos o que eliminemos tu cuenta. Escríbenos por el WhatsApp de contacto de la app y te respondemos.

## 7. Cambios en esta política
Si la actualizamos, publicaremos la nueva versión en esta misma página con su fecha.`;

export default function PrivacidadPage() {
  const wa = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "").replace(/\D/g, "");

  return (
    <div className="min-h-screen">
      <header className="border-b border-gold/25 bg-brand/90">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Brand light />
          <Link href="/tienda" className="text-sm font-semibold text-white/80 hover:text-white">
            Volver
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-3xl font-extrabold" style={{ fontStretch: "110%" }}>
          Política de privacidad
        </h1>
        <p className="mt-1 text-sm text-white/60">Última actualización: 9 de noviembre de 2026</p>
        <article className="card mt-6 p-6 sm:p-8">
          <TermsText text={PRIVACY} />
          {wa && (
            <p className="mt-6 text-[15px]">
              <a
                href={`https://wa.me/${wa}`}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-violet-700 underline underline-offset-4"
              >
                Escríbenos por WhatsApp
              </a>
            </p>
          )}
        </article>
        <p className="mt-4 text-center text-sm text-white/60">
          <Link href="/terminos" className="underline underline-offset-4 hover:text-white">
            Términos y condiciones
          </Link>
        </p>
      </main>
    </div>
  );
}
