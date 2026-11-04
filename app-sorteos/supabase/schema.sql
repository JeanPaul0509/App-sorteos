-- =====================================================================
--  APP DE SORTEOS — Esquema completo para Supabase
--  Cómo usarlo: Supabase > SQL Editor > New query > pega TODO esto > Run
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 1. PERFILES (un perfil por usuario, con su rol)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  phone      text unique not null,
  role       text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

-- Cada usuario nuevo SIEMPRE nace como 'user' (común).
-- Nadie puede volverse admin desde la app: solo tú desde Supabase.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, phone, role)
  values (
    new.id,
    split_part(new.email, '@', 1),   -- el celular sale del "correo" interno
    'user'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

alter table public.profiles enable row level security;
drop policy if exists "ver mi perfil" on public.profiles;
create policy "ver mi perfil" on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_admin());
-- Sin políticas de insert/update/delete: el rol NO se puede cambiar desde la app.

-- ---------------------------------------------------------------------
-- 2. SORTEOS
-- ---------------------------------------------------------------------
create table if not exists public.raffles (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  description   text,
  specs         text,                       -- una especificación por línea
  image_url     text,
  icon          text not null default '🎁',
  price         numeric(10,2) not null default 0 check (price >= 0),
  total_tickets int  not null check (total_tickets between 1 and 10000),
  status        text not null default 'active' check (status in ('active', 'finished')),
  draw_date     date,
  created_at    timestamptz not null default now()
);

alter table public.raffles enable row level security;
drop policy if exists "todos ven sorteos" on public.raffles;
drop policy if exists "admin crea sorteos" on public.raffles;
drop policy if exists "admin edita sorteos" on public.raffles;
drop policy if exists "admin borra sorteos" on public.raffles;
create policy "todos ven sorteos"   on public.raffles for select to authenticated using (true);
create policy "admin crea sorteos"  on public.raffles for insert to authenticated with check (public.is_admin());
create policy "admin edita sorteos" on public.raffles for update to authenticated using (public.is_admin());
create policy "admin borra sorteos" on public.raffles for delete to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------
-- 3. TICKETS (números)
--    available = verde  |  reserved = amarillo  |  sold = gris
-- ---------------------------------------------------------------------
create table if not exists public.tickets (
  id          bigint generated always as identity primary key,
  raffle_id   uuid not null references public.raffles(id) on delete cascade,
  number      int  not null,
  status      text not null default 'available' check (status in ('available', 'reserved', 'sold')),
  user_id     uuid references auth.users(id) on delete set null,
  buyer_name  text,
  buyer_phone text,
  reserved_at timestamptz,
  sold_at     timestamptz,
  unique (raffle_id, number)
);
create index if not exists tickets_raffle_status_idx on public.tickets (raffle_id, status);

-- Al crear un sorteo se generan automáticamente sus números 1..N
create or replace function public.create_raffle_tickets()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.tickets (raffle_id, number)
  select new.id, g from generate_series(1, new.total_tickets) g;
  return new;
end;
$$;

drop trigger if exists after_raffle_insert on public.raffles;
create trigger after_raffle_insert
  after insert on public.raffles
  for each row execute function public.create_raffle_tickets();

alter table public.tickets enable row level security;
drop policy if exists "todos ven tickets" on public.tickets;
create policy "todos ven tickets" on public.tickets for select to authenticated using (true);
-- Los usuarios comunes solo pueden ver número y estado (NO nombres ni celulares de otros).
revoke all on public.tickets from anon, authenticated;
grant select (id, raffle_id, number, status) on public.tickets to authenticated;
-- Todas las escrituras pasan por las funciones de abajo.

-- ---------------------------------------------------------------------
-- 4. FUNCIONES
-- ---------------------------------------------------------------------

-- Reservar: máx. 5 por compra y máx. 5 en espera por persona. Todo o nada.
create or replace function public.reserve_tickets(p_raffle_id uuid, p_numbers int[], p_name text)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_phone   text;
  v_wanted  int;
  v_pending int;
  v_done    int;
begin
  if auth.uid() is null then raise exception 'Debes iniciar sesión'; end if;
  if p_numbers is null or coalesce(array_length(p_numbers, 1), 0) = 0 then
    raise exception 'Elige al menos un número';
  end if;
  select count(distinct x) into v_wanted from unnest(p_numbers) x;
  if v_wanted > 5 then raise exception 'Máximo 5 números por compra'; end if;
  if coalesce(trim(p_name), '') = '' then raise exception 'Escribe tu nombre'; end if;
  if not exists (select 1 from raffles where id = p_raffle_id and status = 'active') then
    raise exception 'Este sorteo ya no está activo';
  end if;

  -- Bloquea al usuario mientras se procesa (evita dos pedidos al mismo tiempo)
  select phone into v_phone from profiles where id = auth.uid() for update;

  select count(*) into v_pending
    from tickets
   where raffle_id = p_raffle_id and user_id = auth.uid() and status = 'reserved';

  if v_pending + v_wanted > 5 then
    if v_pending >= 5 then
      raise exception 'Ya tienes 5 números esperando confirmación de pago. Podrás pedir más cuando confirmemos tu pago.';
    end if;
    raise exception 'Tienes % número(s) esperando confirmación. Solo puedes pedir % más por ahora.', v_pending, 5 - v_pending;
  end if;

  update tickets
     set status = 'reserved', user_id = auth.uid(), buyer_name = trim(p_name),
         buyer_phone = v_phone, reserved_at = now(), sold_at = null
   where raffle_id = p_raffle_id and number = any(p_numbers) and status = 'available';
  get diagnostics v_done = row_count;

  if v_done <> v_wanted then
    raise exception 'Alguno de esos números acaba de ser tomado por otra persona. Elige otros.';
  end if;
end;
$$;

-- Conteos por sorteo (incluye cuántas personas distintas compraron)
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

-- Mis números (usuario común)
create or replace function public.my_tickets()
returns table (raffle_id uuid, raffle_title text, raffle_icon text, price numeric,
               number int, total_tickets int, status text, buyer_name text)
language sql stable security definer set search_path = public as $$
  select r.id, r.title, r.icon, r.price, t.number, r.total_tickets, t.status, t.buyer_name
    from tickets t join raffles r on r.id = t.raffle_id
   where t.user_id = auth.uid()
   order by r.created_at desc, t.number;
$$;

-- ADMIN: ver todos los tickets con datos del comprador
create or replace function public.admin_list_tickets(p_raffle_id uuid)
returns setof public.tickets
language sql stable security definer set search_path = public as $$
  select * from tickets where raffle_id = p_raffle_id and public.is_admin() order by number;
$$;

-- ADMIN: cambiar estado (gris = pagado, verde = liberar, amarillo = reservado)
create or replace function public.admin_set_ticket_status(p_ticket_ids bigint[], p_status text, p_name text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'No autorizado'; end if;

  if p_status = 'available' then
    update tickets set status = 'available', user_id = null, buyer_name = null, buyer_phone = null,
                       reserved_at = null, sold_at = null
     where id = any(p_ticket_ids);
  elsif p_status = 'sold' then
    update tickets set status = 'sold', sold_at = now(),
                       buyer_name = coalesce(nullif(trim(p_name), ''), buyer_name),
                       reserved_at = coalesce(reserved_at, now())
     where id = any(p_ticket_ids);
  elsif p_status = 'reserved' then
    update tickets set status = 'reserved', sold_at = null,
                       buyer_name = coalesce(nullif(trim(p_name), ''), buyer_name),
                       reserved_at = coalesce(reserved_at, now())
     where id = any(p_ticket_ids);
  else
    raise exception 'Estado inválido';
  end if;
end;
$$;

revoke execute on function public.reserve_tickets(uuid, int[], text) from public, anon;
revoke execute on function public.raffle_counts() from public, anon;
revoke execute on function public.my_tickets() from public, anon;
revoke execute on function public.admin_list_tickets(uuid) from public, anon;
revoke execute on function public.admin_set_ticket_status(bigint[], text, text) from public, anon;
grant execute on function public.reserve_tickets(uuid, int[], text) to authenticated;
grant execute on function public.raffle_counts() to authenticated;
grant execute on function public.my_tickets() to authenticated;
grant execute on function public.admin_list_tickets(uuid) to authenticated;
grant execute on function public.admin_set_ticket_status(bigint[], text, text) to authenticated;

-- ---------------------------------------------------------------------
-- 5. STORAGE: fotos de los premios
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('raffle-images', 'raffle-images', true)
on conflict (id) do nothing;

drop policy if exists "admin sube imagenes" on storage.objects;
drop policy if exists "admin edita imagenes" on storage.objects;
drop policy if exists "admin borra imagenes" on storage.objects;
create policy "admin sube imagenes" on storage.objects
  for insert to authenticated with check (bucket_id = 'raffle-images' and public.is_admin());
create policy "admin edita imagenes" on storage.objects
  for update to authenticated using (bucket_id = 'raffle-images' and public.is_admin());
create policy "admin borra imagenes" on storage.objects
  for delete to authenticated using (bucket_id = 'raffle-images' and public.is_admin());

-- =====================================================================
--  CREAR UN ADMINISTRADOR (hazlo después de crear el usuario en
--  Authentication > Users > Add user, con correo 9XXXXXXXX@celular.sorteos.app)
--
--  update public.profiles set role = 'admin' where phone = '987654321';
-- =====================================================================

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
