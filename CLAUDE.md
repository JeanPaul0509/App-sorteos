# GoldenTicket

App de sorteos (Next.js 15 + Supabase + Vercel). El código está en `app-sorteos/`.

- **Antes de tocar cualquier pantalla, lee `app-sorteos/DESIGN.md`**: colores, tipografía, componentes, movimiento y reglas. Si un cambio no encaja, actualiza primero DESIGN.md.
- Cambios de base de datos: nuevo archivo en `app-sorteos/supabase/migrations/` y la misma parte al final de `supabase/schema.sql`. El usuario corre el SQL a mano en Supabase.
- Montos, conteos y plurales: `money()`, `num()` y `plural()` de `lib/utils.ts`.
- Imágenes de premios: `components/SafeImg.tsx`, nunca `<img>` directo.
