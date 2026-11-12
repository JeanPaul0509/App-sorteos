-- 011 · Oferta de los jueves, corregida: solo la 1.ª unidad de cada pieza (por cuenta y por día) sale a S/5;
-- desde la 2.ª se cobra el precio normal. (Reemplaza la regla de S/6 de la migración 010.)

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
  v_promo   boolean := public.is_promo_day();
  v_prev    int;
  v_n5      int;
  v_nr      int;
  v_tier    record;
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

    -- Reparto de precios: S/5 la 1.ª del día, normal desde la 2.ª (solo piezas, solo jueves)
    v_n5 := 0;
    if v_promo and v_prod.category = 'pollo' then
      select coalesce(sum(oi.qty), 0)::int into v_prev
        from order_items oi join orders o on o.id = oi.order_id
       where o.user_id = auth.uid() and o.status <> 'cancelled' and o.id <> v_order.id
         and oi.product_id = v_prod.id
         and (o.created_at at time zone 'America/Lima')::date = (now() at time zone 'America/Lima')::date;
      if v_prev = 0 then v_n5 := 1; end if;
    end if;
    v_nr := v_item.qty - v_n5;

    for v_tier in
      select * from (values
        (v_n5, least(v_prod.price, 5::numeric)),
        (v_nr, v_prod.price)
      ) t(q, pr) where q > 0
    loop
      insert into order_items (order_id, product_id, name, price, qty)
      values (v_order.id, v_prod.id, v_prod.name, v_tier.pr, v_tier.q);
      v_total := v_total + v_tier.pr * v_tier.q;
      v_lines := v_lines || jsonb_build_object('name', v_prod.name, 'price', v_tier.pr, 'qty', v_tier.q);
    end loop;
  end loop;

  update orders set total = v_total where id = v_order.id;

  return jsonb_build_object('id', v_order.id, 'order_no', v_order.order_no, 'total', v_total, 'items', v_lines);
end;
$$;
