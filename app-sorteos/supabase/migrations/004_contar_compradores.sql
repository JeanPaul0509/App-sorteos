-- =====================================================================
--  CONTEO DE COMPRADORES: cuántas PERSONAS distintas compraron (pagado)
--  Cómo usarlo: Supabase > SQL Editor > pega todo > Run
-- =====================================================================
drop function if exists public.raffle_counts();
create function public.raffle_counts()
returns table (raffle_id uuid, available bigint, reserved bigint, sold bigint, buyers bigint)
language sql stable security definer set search_path = public as $$
  select t.raffle_id,
         count(*) filter (where t.status = 'available'),
         count(*) filter (where t.status = 'reserved'),
         count(*) filter (where t.status = 'sold'),
         count(distinct coalesce(t.user_id::text, t.buyer_phone, t.buyer_name)) filter (where t.status = 'sold')
    from tickets t
   group by t.raffle_id;
$$;
revoke execute on function public.raffle_counts() from public, anon;
grant execute on function public.raffle_counts() to authenticated;
