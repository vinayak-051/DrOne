-- ============================================================
-- SIGNUP TRIGGER — Paste in Supabase SQL Editor → Run
-- Creates public.users + public.patients rows automatically when
-- a user registers, using metadata passed from the frontend.
-- Required because with email confirmation enabled the client has
-- no session at signup, so direct inserts are blocked by RLS.
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, role)
  values (new.id, new.email, 'patient')
  on conflict (id) do nothing;

  if new.raw_user_meta_data ? 'name'
     and not exists (select 1 from public.patients where user_id = new.id) then
    insert into public.patients (user_id, name, phone, age, gender)
    values (
      new.id,
      new.raw_user_meta_data->>'name',
      new.raw_user_meta_data->>'phone',
      nullif(new.raw_user_meta_data->>'age', '')::integer,
      new.raw_user_meta_data->>'gender'
    );
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
