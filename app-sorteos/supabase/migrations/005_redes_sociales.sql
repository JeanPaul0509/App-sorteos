-- =====================================================================
--  REDES SOCIALES (WhatsApp, Instagram, TikTok) — una sola fila global
--  Cómo usarlo: Supabase > SQL Editor > pega todo > Run
-- =====================================================================
create table if not exists public.site_settings (
  id            int primary key default 1 check (id = 1),
  whatsapp_url  text,
  instagram_url text,
  tiktok_url    text,
  updated_at    timestamptz not null default now()
);
insert into public.site_settings (id) values (1) on conflict (id) do nothing;

alter table public.site_settings enable row level security;
drop policy if exists "todos ven redes" on public.site_settings;
drop policy if exists "admin edita redes" on public.site_settings;
-- Visibles también en el login (sin sesión)
create policy "todos ven redes" on public.site_settings for select to anon, authenticated using (true);
create policy "admin edita redes" on public.site_settings for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
grant select on public.site_settings to anon, authenticated;
grant update on public.site_settings to authenticated;
