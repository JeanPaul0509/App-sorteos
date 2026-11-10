-- =====================================================================
--  TORA: TIENDA (productos, pedidos y stock)
--  Cómo usarlo: Supabase > SQL Editor > New query > pega TODO esto > Run
--  Es seguro correrlo más de una vez.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. PRODUCTOS (los crea y edita solo el admin)
-- ---------------------------------------------------------------------
create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(trim(name)) between 1 and 80),
  description text check (char_length(description) <= 500),
  category    text not null default 'pollo' check (category in ('pollo', 'promos', 'belleza')),
  price       numeric(10,2) not null check (price >= 0 and price <= 100000),
  stock       int not null default 0 check (stock >= 0 and stock <= 100000),
  image_url   text,
  active      boolean not null default true,   -- false = oculto en la tienda
  sort        int not null default 0,          -- orden dentro de su categoría
  created_at  timestamptz not null default now()
);

alter table public.products enable row level security;
drop policy if exists "ver productos" on public.products;
drop policy if exists "admin crea productos" on public.products;
drop policy if exists "admin edita productos" on public.products;
drop policy if exists "admin borra productos" on public.products;
create policy "ver productos" on public.products
  for select to authenticated using (active or public.is_admin());
create policy "admin crea productos" on public.products
  for insert to authenticated with check (public.is_admin());
create policy "admin edita productos" on public.products
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin borra productos" on public.products
  for delete to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------
-- 2. PEDIDOS
--    pending = esperando pago | paid = pagado | delivered = entregado | cancelled
-- ---------------------------------------------------------------------
create table if not exists public.orders (
  id           uuid primary key default gen_random_uuid(),
  order_no     bigint generated always as identity,
  user_id      uuid references auth.users(id) on delete set null,
  buyer_name   text not null,
  buyer_phone  text not null,
  address      text,
  note         text,
  total        numeric(10,2) not null default 0,
  status       text not null default 'pending' check (status in ('pending', 'paid', 'delivered', 'cancelled')),
  created_at   timestamptz not null default now(),
  paid_at      timestamptz,
  delivered_at timestamptz
);
create index if not exists orders_user_idx on public.orders (user_id, created_at desc);
create index if not exists orders_status_idx on public.orders (status, created_at desc);

-- Cada línea guarda el nombre y el precio del momento (si cambias el precio después, el pedido no cambia)
create table if not exists public.order_items (
  id         bigint generated always as identity primary key,
  order_id   uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  name       text not null,
  price      numeric(10,2) not null,
  qty        int not null check (qty > 0)
);
create index if not exists order_items_order_idx on public.order_items (order_id);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
drop policy if exists "ver mis pedidos" on public.orders;
drop policy if exists "ver items de mis pedidos" on public.order_items;
create policy "ver mis pedidos" on public.orders
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "ver items de mis pedidos" on public.order_items
  for select to authenticated using (
    exists (select 1 from public.orders o
             where o.id = order_id and (o.user_id = auth.uid() or public.is_admin()))
  );
-- Nadie escribe directo: todo pasa por las funciones de abajo.
revoke all on public.orders from anon, authenticated;
revoke all on public.order_items from anon, authenticated;
grant select on public.orders to authenticated;
grant select on public.order_items to authenticated;

-- ---------------------------------------------------------------------
-- 3. FUNCIONES
-- ---------------------------------------------------------------------

-- Hacer un pedido: revisa el stock, lo descuenta y guarda el pedido. Todo o nada.
-- p_items = [{"product_id": "...", "qty": 2}, ...]
create or replace function public.create_order(p_items jsonb, p_name text, p_address text, p_note text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_phone   text;
  v_pending int;
  v_order   public.orders%rowtype;
  v_item    record;
  v_prod    public.products%rowtype;
  v_total   numeric(10,2) := 0;
  v_lines   jsonb := '[]'::jsonb;
begin
  if auth.uid() is null then raise exception 'Debes iniciar sesión'; end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Tu carrito está vacío';
  end if;
  if jsonb_array_length(p_items) > 30 then raise exception 'Demasiados productos en un solo pedido'; end if;
  if coalesce(trim(p_name), '') = '' then raise exception 'Escribe tu nombre'; end if;
  if char_length(p_name) > 60 then raise exception 'El nombre es muy largo'; end if;
  if coalesce(trim(p_address), '') = '' then raise exception 'Escribe tu dirección o referencia de entrega'; end if;
  if char_length(p_address) > 200 or char_length(coalesce(p_note, '')) > 200 then
    raise exception 'El texto es muy largo';
  end if;

  -- Bloquea al usuario mientras se procesa (evita dos pedidos a la vez)
  select phone into v_phone from profiles where id = auth.uid() for update;

  select count(*) into v_pending from orders where user_id = auth.uid() and status = 'pending';
  if v_pending >= 3 then
    raise exception 'Ya tienes 3 pedidos esperando pago. Podrás hacer otro cuando confirmemos o canceles alguno.';
  end if;

  insert into orders (user_id, buyer_name, buyer_phone, address, note)
  values (auth.uid(), trim(p_name), v_phone, trim(p_address), nullif(trim(coalesce(p_note, '')), ''))
  returning * into v_order;

  for v_item in
    select (e->>'product_id')::uuid as product_id, sum((e->>'qty')::int) as qty
      from jsonb_array_elements(p_items) e
     group by 1
     order by 1
  loop
    if v_item.product_id is null or v_item.qty < 1 or v_item.qty > 50 then
      raise exception 'Cantidad inválida';
    end if;
    select * into v_prod from products where id = v_item.product_id and active for update;
    if not found then raise exception 'Uno de los productos ya no está disponible.'; end if;
    if v_prod.stock < v_item.qty then
      if v_prod.stock = 0 then
        raise exception '% se agotó. Quítalo del carrito para continuar.', v_prod.name;
      end if;
      raise exception 'De % solo quedan %. Baja la cantidad para continuar.', v_prod.name, v_prod.stock;
    end if;

    update products set stock = stock - v_item.qty where id = v_prod.id;
    insert into order_items (order_id, product_id, name, price, qty)
    values (v_order.id, v_prod.id, v_prod.name, v_prod.price, v_item.qty);

    v_total := v_total + v_prod.price * v_item.qty;
    v_lines := v_lines || jsonb_build_object('name', v_prod.name, 'price', v_prod.price, 'qty', v_item.qty);
  end loop;

  update orders set total = v_total where id = v_order.id;

  return jsonb_build_object('id', v_order.id, 'order_no', v_order.order_no, 'total', v_total, 'items', v_lines);
end;
$$;

-- El cliente cancela su propio pedido mientras siga esperando pago (devuelve el stock)
create or replace function public.cancel_my_order(p_order_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_order public.orders%rowtype;
begin
  if auth.uid() is null then raise exception 'Debes iniciar sesión'; end if;
  select * into v_order from orders where id = p_order_id and user_id = auth.uid() for update;
  if not found then raise exception 'Pedido no encontrado'; end if;
  if v_order.status <> 'pending' then
    raise exception 'Solo se puede cancelar un pedido que aún no se pagó. Escríbenos por WhatsApp.';
  end if;

  update products p set stock = p.stock + i.qty
    from order_items i
   where i.order_id = v_order.id and p.id = i.product_id;
  update orders set status = 'cancelled' where id = v_order.id;
end;
$$;

-- ADMIN: cambiar el estado de un pedido (cancelar devuelve el stock)
create or replace function public.admin_set_order_status(p_order_id uuid, p_status text)
returns void language plpgsql security definer set search_path = public as $$
declare v_order public.orders%rowtype;
begin
  if not public.is_admin() then raise exception 'No autorizado'; end if;
  if p_status not in ('pending', 'paid', 'delivered', 'cancelled') then raise exception 'Estado inválido'; end if;

  select * into v_order from orders where id = p_order_id for update;
  if not found then raise exception 'Pedido no encontrado'; end if;
  if v_order.status = p_status then return; end if;
  if v_order.status = 'cancelled' then
    raise exception 'Un pedido cancelado no se puede reactivar. Pide al cliente que haga uno nuevo.';
  end if;

  if p_status = 'cancelled' then
    update products p set stock = p.stock + i.qty
      from order_items i
     where i.order_id = v_order.id and p.id = i.product_id;
    update orders set status = 'cancelled' where id = v_order.id;
  elsif p_status = 'paid' then
    update orders set status = 'paid', paid_at = coalesce(paid_at, now()), delivered_at = null
     where id = v_order.id;
  elsif p_status = 'delivered' then
    update orders set status = 'delivered', paid_at = coalesce(paid_at, now()), delivered_at = now()
     where id = v_order.id;
  else
    update orders set status = 'pending', paid_at = null, delivered_at = null where id = v_order.id;
  end if;
end;
$$;

revoke execute on function public.create_order(jsonb, text, text, text) from public, anon;
revoke execute on function public.cancel_my_order(uuid) from public, anon;
revoke execute on function public.admin_set_order_status(uuid, text) from public, anon;
grant execute on function public.create_order(jsonb, text, text, text) to authenticated;
grant execute on function public.cancel_my_order(uuid) to authenticated;
grant execute on function public.admin_set_order_status(uuid, text) to authenticated;

-- ---------------------------------------------------------------------
-- 4. PRODUCTOS DEL FLYER (solo si aún no hay ninguno). Stock en 0: el admin
--    sube la foto y pone las unidades desde Admin > Productos.
-- ---------------------------------------------------------------------
insert into public.products (name, description, category, price, stock, sort)
select * from (values
  ('Pecho',       'Pollo aderezado, listo para cocinar',      'pollo',  6.00::numeric, 0, 1),
  ('Pierna',      'Pollo aderezado, listo para cocinar',      'pollo',  6.00::numeric, 0, 2),
  ('Ala',         'Pollo aderezado, listo para cocinar',      'pollo',  5.50::numeric, 0, 3),
  ('Entrepierna', 'Pollo aderezado, listo para cocinar',      'pollo',  5.00::numeric, 0, 4),
  ('El banquete entero',  'Pollo entero · 8 piezas aderezadas', 'promos', 40.00::numeric, 0, 1),
  ('La mitad ganadora',   'Medio pollo · 4 piezas aderezadas',  'promos', 21.00::numeric, 0, 2),
  ('Dúo dinámico',        'Pecho + pierna',                     'promos', 11.00::numeric, 0, 3),
  ('El vuelo sabroso',    'Pecho + ala',                        'promos', 10.50::numeric, 0, 4),
  ('El combo poderoso',   'Entrepierna + ala',                  'promos', 10.00::numeric, 0, 5)
) as v(name, description, category, price, stock, sort)
where not exists (select 1 from public.products);
