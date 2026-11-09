# GoldenTicket — contexto del proyecto

App web de sorteos/rifas. Los usuarios se registran con celular y contraseña, reservan números, pagan por Yape y envían la captura por WhatsApp. El admin confirma los pagos a mano.

- **Producción:** dominio `.vercel.app` configurado en Vercel → Settings → Domains (el original era app-sorteos-liard.vercel.app; confirmar con el usuario cuál quedó).
- **Repo:** github.com/JeanPaul0509/App-sorteos (rama `main`). El código está en `app-sorteos/`.
- **Stack:** Next.js 15 (App Router) + React 19 + Tailwind v4 + Supabase (Auth, Postgres, Storage) + Vercel.
- **Idioma:** todo en español de Perú. El usuario no es programador: explicar en pasos simples.

## Cómo se trabaja (flujo de actualización)

1. Claude edita el código en el repo y hace `git push` a `main`. **Vercel publica solo** en 1-2 minutos.
2. Si el cambio toca la base de datos: crear `app-sorteos/supabase/migrations/00N_nombre.sql`, agregar lo mismo al final de `supabase/schema.sql` y **darle al usuario el SQL para que lo pegue en Supabase → SQL Editor → Run**. Claude no tiene acceso directo a Supabase.
3. El entorno de Claude no puede hacer `npm install` (registro bloqueado), así que no puede compilar. Hacer revisión de sintaxis con cuidado y pedir al usuario la captura del log de Vercel si el deploy falla.
4. Variables de entorno en Vercel (Settings → Environment Variables, tipo Config): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (publishable key), `NEXT_PUBLIC_WHATSAPP_NUMBER` (51 + número), `NEXT_PUBLIC_YAPE_NUMBER`, `NEXT_PUBLIC_YAPE_NAME`. Después de cambiarlas: Deployments → ⋯ → Redeploy.

## Reglas del código

- **Antes de tocar cualquier pantalla, leer `app-sorteos/DESIGN.md`** (paleta Esmeralda y oro, boletos marfil, tipografía Archivo, movimiento según Emil Kowalski). Si un cambio no encaja, actualizar primero DESIGN.md.
- Montos, conteos y plurales: `money()`, `num()`, `plural()`, `soldPercent()` de `lib/utils.ts`.
- Imágenes de premios: `components/SafeImg.tsx`, nunca `<img>` directo.
- Textos largos: `[overflow-wrap:anywhere]`; probar a 360px de ancho sin scroll horizontal.
- Toda escritura sensible pasa por funciones SQL `security definer` que verifican `is_admin()`; RLS activo en todas las tablas.

## Autenticación

- Login con celular + contraseña. Internamente cada celular es un correo `9XXXXXXXX@celular.sorteos.app` (sin el 51). En Supabase, "Confirm email" está **desactivado**.
- El registro solo crea usuarios comunes. Admin: crear usuario en Supabase (Auth → Add user, Auto Confirm) y luego `update public.profiles set role = 'admin' where phone = '9XXXXXXXX';`.
- Admin actual: celular `994722642`.

## Funciones ya hechas

- Registro/login por celular; sorteos con foto, ícono, especificaciones, precio, cantidad de tickets (1–10,000) y fecha opcional.
- Tablero de números de 100 en 100 (‹ N ›): verde disponible, amarillo reservado, gris vendido. Máximo 5 por compra **y máximo 5 en espera por persona por sorteo** hasta que el admin confirme.
- Compra: pide nombre, reserva y abre WhatsApp (api.whatsapp.com, conserva emojis) con mensaje automático y "Adjunto captura de Yape".
- Mis números: foto del premio, estado, reenviar WhatsApp, botón al grupo de WhatsApp (solo con pago confirmado), aviso "¡Ganaste!".
- Admin: crear sorteo; finalizar/eliminar con confirmación escribiendo FINALIZAR/ELIMINAR; pagos por confirmar agrupados por persona + botón "Avisarle por WhatsApp"; tablero con cambio de estado; buscador del número ganador con llamar/WhatsApp; **publicar ganador** (solo números pagados, nombre abreviado "Juan P.", link de video); lista de compradores paginada + exportar a Excel (CSV protegido contra fórmulas); enlace de grupo de WhatsApp por sorteo; redes sociales (WhatsApp, Instagram, TikTok); **restablecer contraseña** de un usuario; **editor de Términos y condiciones**.
- Página pública `/terminos` (plantilla en `lib/terms.ts`, editable desde el admin). Reglas acordadas: el sorteo se hace cuando se venden todos los números; se contacta al ganador durante 7 días, si no responde se vuelve a sortear sin ese número; la entrega se coordina por WhatsApp.
- Tarjetas con % vendido honesto y conteo de personas; ganador visible en la tarjeta y en el detalle.
- Diseño: boleto dorado animado en el inicio y en el login, ícono propio (`app/icon.svg`, `app/apple-icon.png`), animaciones cortas, esqueletos de carga, casos extremos probados con break-ui.

## Migraciones SQL (`supabase/migrations/`)

002 grupo WhatsApp · 003 límite de 5 en espera · 004 conteo de compradores · 005 redes sociales · 006 límites de texto · 007 ganador + reset de contraseña + términos. El usuario las corre a mano; si algo falla por "función no existe", confirmar que corrió la migración correspondiente.

## Pendientes / ideas

- Verificación de celular gratis por WhatsApp (verificación inversa con la API de Meta; necesita un chip aparte).
- Historial de sorteos pasados con ganadores en el inicio.
- Sorteo al azar dentro de la app para el en vivo.
- Antes de cobrar: consultar con abogado/ONAGI el permiso para rifas y revisar los términos.
- Por uso comercial: Vercel Pro y Supabase Pro (el plan gratis de Supabase se pausa tras ~7 días sin actividad).
