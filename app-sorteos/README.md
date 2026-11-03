# 🎟️ App de Sorteos

Next.js + Supabase + Vercel. Usuarios se registran con celular y contraseña, eligen hasta 5 números,
los reservan (🟡) y envían su pedido por WhatsApp con la captura de Yape. El admin confirma el pago (⚪ gris)
o libera los números (🟢 verde) cuando quiera — sin límite de tiempo.

| Color | Estado |
|---|---|
| 🟢 Verde | Disponible |
| 🟣 Morado | Lo que el usuario está seleccionando |
| 🟡 Amarillo | Reservado, esperando pago |
| ⚪ Gris | Vendido / pagado |

---

## PASO 1 — Supabase (base de datos)

1. Entra a <https://supabase.com> → **New project** (anota la contraseña de la base de datos).
2. Ve a **SQL Editor → New query**, pega todo el archivo `supabase/schema.sql` y dale **Run**.
3. Ve a **Authentication → Sign In / Providers → Email** y:
   - ✅ deja activado **Enable Email provider**
   - ❌ **desactiva "Confirm email"** (importante: los usuarios entran con celular, no reciben correos)
4. Ve a **Project Settings → API** y copia:
   - `Project URL`
   - `anon public` key

### Crear tu usuario ADMIN
Los admins **no** se pueden crear desde la app, solo desde Supabase:

1. **Authentication → Users → Add user → Create new user**
   - Email: `TUCELULAR@celular.sorteos.app` (ej: `987654321@celular.sorteos.app`)
   - Password: la que quieras
   - ✅ Auto Confirm User
2. En **SQL Editor** ejecuta (con tu número):
   ```sql
   update public.profiles set role = 'admin' where phone = '987654321';
   ```
3. Entra a la app con ese celular y contraseña → verás el botón **⚙️ Admin**.

---

## PASO 2 — GitHub (repositorio)

1. En <https://github.com/new> crea un repositorio, por ejemplo `app-sorteos` (puede ser privado).
2. Descomprime el ZIP, abre una terminal dentro de la carpeta y ejecuta:
   ```bash
   git init
   git add .
   git commit -m "App de sorteos"
   git branch -M main
   git remote add origin https://github.com/TU-USUARIO/app-sorteos.git
   git push -u origin main
   ```
   (Si no usas terminal: en la página del repo vacío elige **"uploading an existing file"** y arrastra
   todos los archivos y carpetas.)

---

## PASO 3 — Vercel (publicar la app)

1. Entra a <https://vercel.com> con tu cuenta de GitHub → **Add New → Project** → importa `app-sorteos`.
2. Antes de darle Deploy, abre **Environment Variables** y agrega:

   | Nombre | Valor |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | tu Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | tu anon key |
   | `NEXT_PUBLIC_WHATSAPP_NUMBER` | tu WhatsApp con 51 adelante, ej `51987654321` |
   | `NEXT_PUBLIC_YAPE_NUMBER` | tu número de Yape, ej `987654321` |
   | `NEXT_PUBLIC_YAPE_NAME` | el nombre que aparece en tu Yape |

3. **Deploy**. En 1–2 minutos tendrás tu link `https://app-sorteos-xxx.vercel.app`.

Cada vez que hagas `git push`, Vercel vuelve a publicar solo. Si cambias una variable de entorno,
ve a **Deployments → ⋯ → Redeploy**.

---

## Probar en tu computadora (opcional)

```bash
cp .env.example .env.local   # y rellena los valores
npm install
npm run dev                  # abre http://localhost:3000
```

---

## Cómo funciona

**Usuario común**
1. Se registra con celular + contraseña.
2. Ve los sorteos activos (foto, ícono, precio, progreso).
3. Entra a uno, toca hasta 5 números verdes (o 🎲 Al azar) → **Comprar**.
4. Escribe su nombre → **Ir a pagar**: los números pasan a 🟡 y se abre WhatsApp con un mensaje
   listo para ti con sorteo, números, nombre, celular, total y "Adjunto captura de Yape".
5. En **Mis números** ve el estado de sus números y puede reenviar el mensaje.

**Admin**
- **+ Nuevo sorteo**: foto, nombre, ícono, descripción, especificaciones, cantidad de tickets
  (50, 100, 150… o la que escribas, hasta 10 000), precio y fecha. Los números se crean solos.
- **Gestionar números**: arriba aparecen los *Pagos por confirmar* agrupados por persona con
  botón **✅ Confirmar pago** (→ gris) y **🟢 Liberar** (→ verde). Abajo el tablero completo:
  tocas números y los cambias a pagado, reservado o disponible. También sirve para registrar
  ventas hechas fuera de la app.
- **Finalizar / Reactivar / Eliminar** sorteos.

**Seguridad**
- El registro solo crea usuarios comunes; el rol admin solo se pone desde Supabase.
- Los usuarios comunes no pueden ver nombres ni celulares de otros compradores.
- La reserva es "todo o nada": si dos personas tocan el mismo número a la vez, solo uno lo obtiene.
