-- =====================================================================
--  VERIFICACIÓN DE CELULAR POR WHATSAPP (verificación inversa)
--  La persona envía un mensaje con un código al número de verificación;
--  Meta avisa a la app y el celular queda verificado. No se envía nada
--  hacia la persona, así que no cuesta.
--  Queda APAGADA por defecto (require_phone_verification = false): nadie
--  pierde la posibilidad de comprar hasta que tú la enciendas.
--  Cómo usarlo: Supabase > SQL Editor > pega todo > Run
-- =====================================================================

-- ---------- 1. Marca de verificado en el perfil ----------
alter table public.profiles add column if not exists verified_at timestamptz;

-- ---------- 2. Interruptor global (lo enciendes tú cuando todo funcione) ----------
alter table public.site_settings
  add column if not exists require_phone_verification boolean not null default false;

-- ---------- 3. Códigos pendientes (nadie puede leerlos desde la app) ----------
create table if not exists public.phone_verifications (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  code       text not null unique,
  expires_at timestamptz not null
);
alter table public.phone_verifications enable row level security;
revoke all on public.phone_verifications from anon, authenticated;

-- ---------- 4. Pedir un código (usuario con sesión) ----------
-- Devuelve el código (ej. GT-4F8A21), o null si el celular ya está verificado.
-- Si ya tiene un código vigente, devuelve el mismo.
create or replace function public.start_phone_verification()
returns text language plpgsql security definer set search_path = public as $$
declare
  v_code text;
  v_try  int := 0;
begin
  if auth.uid() is null then raise exception 'Debes iniciar sesión'; end if;
  if exists (select 1 from profiles where id = auth.uid() and verified_at is not null) then
    return null;
  end if;

  select code into v_code
    from phone_verifications
   where user_id = auth.uid() and expires_at > now();
  if v_code is not null then return v_code; end if;

  loop
    v_try := v_try + 1;
    v_code := 'GT-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    begin
      insert into phone_verifications (user_id, code, expires_at)
      values (auth.uid(), v_code, now() + interval '15 minutes')
      on conflict (user_id) do update
        set code = excluded.code, expires_at = excluded.expires_at;
      return v_code;
    exception when unique_violation then
      if v_try >= 5 then raise; end if;
    end;
  end loop;
end;
$$;

-- ---------- 5. Confirmar (SOLO la llama el servidor con la llave secreta) ----------
-- Verifica que el mensaje vino del celular de la cuenta Y trae su código vigente.
create or replace function public.confirm_phone_verification(p_phone text, p_code text)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  v_user uuid;
begin
  select v.user_id into v_user
    from phone_verifications v
    join profiles p on p.id = v.user_id
   where v.code = upper(trim(p_code))
     and v.expires_at > now()
     and p.phone = p_phone
   for update of v;

  if v_user is null then return false; end if;

  update profiles set verified_at = now() where id = v_user and verified_at is null;
  delete from phone_verifications where user_id = v_user;
  return true;
end;
$$;

revoke execute on function public.start_phone_verification() from public, anon;
revoke execute on function public.confirm_phone_verification(text, text) from public, anon, authenticated;
grant execute on function public.start_phone_verification() to authenticated;
grant execute on function public.confirm_phone_verification(text, text) to service_role;

-- ---------- 6. Comprar exige celular verificado (solo si el interruptor está encendido) ----------
-- Igual que antes (límites de 5), más la revisión de verificación. El admin no la necesita.
create or replace function public.reserve_tickets(p_raffle_id uuid, p_numbers int[], p_name text)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_phone   text;
  v_wanted  int;
  v_pending int;
  v_done    int;
begin
  if auth.uid() is null then raise exception 'Debes iniciar sesión'; end if;

  if coalesce((select require_phone_verification from site_settings where id = 1), false)
     and not exists (select 1 from profiles
                      where id = auth.uid() and (verified_at is not null or role = 'admin')) then
    raise exception 'Verifica tu celular por WhatsApp antes de comprar.';
  end if;

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

revoke execute on function public.reserve_tickets(uuid, int[], text) from public, anon;
grant execute on function public.reserve_tickets(uuid, int[], text) to authenticated;

-- =====================================================================
--  CUANDO TODO FUNCIONE (Meta conectado y probado), enciende la regla:
--    update public.site_settings set require_phone_verification = true where id = 1;
--  Para apagarla otra vez:
--    update public.site_settings set require_phone_verification = false where id = 1;
-- =====================================================================
