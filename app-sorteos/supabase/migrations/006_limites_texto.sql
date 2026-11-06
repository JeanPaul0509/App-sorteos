-- =====================================================================
--  LÍMITES DE TEXTO (protección también en la base de datos)
--  "not valid" = no revisa los datos que ya existen, solo los nuevos/editados.
--  Cómo usarlo: Supabase > SQL Editor > pega todo > Run
-- =====================================================================
alter table public.raffles drop constraint if exists raffles_title_len;
alter table public.raffles drop constraint if exists raffles_description_len;
alter table public.raffles drop constraint if exists raffles_specs_len;
alter table public.tickets drop constraint if exists tickets_buyer_name_len;

alter table public.raffles add constraint raffles_title_len
  check (char_length(title) between 1 and 80) not valid;
alter table public.raffles add constraint raffles_description_len
  check (description is null or char_length(description) <= 1000) not valid;
alter table public.raffles add constraint raffles_specs_len
  check (specs is null or char_length(specs) <= 1000) not valid;
alter table public.tickets add constraint tickets_buyer_name_len
  check (buyer_name is null or char_length(buyer_name) <= 60) not valid;
