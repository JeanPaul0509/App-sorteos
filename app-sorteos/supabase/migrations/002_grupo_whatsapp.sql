-- =====================================================================
--  GRUPO DE WHATSAPP POR SORTEO
--  El enlace se guarda en una tabla aparte que los usuarios NO pueden leer.
--  Solo lo reciben quienes tienen al menos un número PAGADO en ese sorteo.
--  Cómo usarlo: Supabase > SQL Editor > pega todo > Run
-- =====================================================================

create table if not exists public.raffle_secrets (
  raffle_id          uuid primary key references public.raffles(id) on delete cascade,
  whatsapp_group_url text
);

alter table public.raffle_secrets enable row level security;
drop policy if exists "admin gestiona secretos" on public.raffle_secrets;
create policy "admin gestiona secretos" on public.raffle_secrets
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Enlace del grupo para el usuario actual (null si aún no tiene números pagados)
create or replace function public.my_group_link(p_raffle_id uuid)
returns text language sql stable security definer set search_path = public as $$
  select s.whatsapp_group_url
    from raffle_secrets s
   where s.raffle_id = p_raffle_id
     and exists (select 1 from tickets t
                  where t.raffle_id = p_raffle_id and t.user_id = auth.uid() and t.status = 'sold');
$$;

-- "Mis números" ahora también devuelve el enlace (solo en números pagados)
drop function if exists public.my_tickets();
create function public.my_tickets()
returns table (raffle_id uuid, raffle_title text, raffle_icon text, price numeric,
               number int, total_tickets int, status text, buyer_name text, group_url text)
language sql stable security definer set search_path = public as $$
  select r.id, r.title, r.icon, r.price, t.number, r.total_tickets, t.status, t.buyer_name,
         case when t.status = 'sold' then s.whatsapp_group_url end
    from tickets t
    join raffles r on r.id = t.raffle_id
    left join raffle_secrets s on s.raffle_id = r.id
   where t.user_id = auth.uid()
   order by r.created_at desc, t.number;
$$;

revoke execute on function public.my_group_link(uuid) from public, anon;
revoke execute on function public.my_tickets() from public, anon;
grant execute on function public.my_group_link(uuid) to authenticated;
grant execute on function public.my_tickets() to authenticated;
