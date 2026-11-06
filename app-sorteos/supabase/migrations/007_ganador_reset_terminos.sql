-- =====================================================================
--  GANADOR PUBLICADO + RESTABLECER CONTRASEÑA + TÉRMINOS Y CONDICIONES
--  Cómo usarlo: Supabase > SQL Editor > pega todo > Run
-- =====================================================================

-- ---------- 1. Ganador del sorteo ----------
alter table public.raffles add column if not exists winner_number  int;
alter table public.raffles add column if not exists winner_display text;   -- "Juan P." (nombre abreviado)
alter table public.raffles add column if not exists draw_video_url text;   -- link al video del sorteo en vivo
alter table public.raffles add column if not exists drawn_at       timestamptz;

-- Marca el ganador (debe ser un número PAGADO) y finaliza el sorteo.
-- p_number = null quita el ganador (por si se equivocó).
create or replace function public.admin_set_winner(p_raffle_id uuid, p_number int, p_video text default null)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_name  text;
  v_parts text[];
  v_disp  text;
begin
  if not public.is_admin() then raise exception 'No autorizado'; end if;

  if p_number is null then
    update raffles set winner_number = null, winner_display = null, draw_video_url = null, drawn_at = null
     where id = p_raffle_id;
    return null;
  end if;

  select buyer_name into v_name from tickets
   where raffle_id = p_raffle_id and number = p_number and status = 'sold';
  if not found then
    raise exception 'El número % no está pagado. Solo un número pagado puede ganar.', p_number;
  end if;

  v_parts := regexp_split_to_array(trim(coalesce(v_name, '')), '\s+');
  v_disp := initcap(v_parts[1]);
  if array_length(v_parts, 1) > 1 and v_parts[2] <> '' then
    v_disp := v_disp || ' ' || upper(left(v_parts[2], 1)) || '.';
  end if;

  update raffles
     set winner_number = p_number,
         winner_display = nullif(v_disp, ''),
         draw_video_url = nullif(trim(coalesce(p_video, '')), ''),
         drawn_at = now(),
         status = 'finished'
   where id = p_raffle_id;
  return v_disp;
end;
$$;

-- ---------- 2. Restablecer contraseña de un usuario (solo admin) ----------
create or replace function public.admin_reset_password(p_phone text, p_new_password text)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare
  v_phone text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
begin
  if not public.is_admin() then raise exception 'No autorizado'; end if;
  if v_phone ~ '^519\d{8}$' then v_phone := substr(v_phone, 3); end if;
  if v_phone !~ '^9\d{8}$' then raise exception 'Celular inválido'; end if;
  if char_length(coalesce(p_new_password, '')) < 6 then
    raise exception 'La contraseña debe tener al menos 6 caracteres';
  end if;

  update auth.users
     set encrypted_password = extensions.crypt(p_new_password, extensions.gen_salt('bf')),
         updated_at = now()
   where email = v_phone || '@celular.sorteos.app';
  if not found then raise exception 'No hay ninguna cuenta con el celular %', v_phone; end if;
end;
$$;

-- ---------- 3. Términos y condiciones (editables por el admin) ----------
alter table public.site_settings add column if not exists terms_text text;
alter table public.site_settings add column if not exists terms_updated_at timestamptz;

revoke execute on function public.admin_set_winner(uuid, int, text) from public, anon;
revoke execute on function public.admin_reset_password(text, text) from public, anon;
grant execute on function public.admin_set_winner(uuid, int, text) to authenticated;
grant execute on function public.admin_reset_password(text, text) to authenticated;
