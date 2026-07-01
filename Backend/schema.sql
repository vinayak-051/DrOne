-- ============================================================
-- DOCTORIFY - Supabase PostgreSQL Schema
-- Paste this in Supabase SQL Editor → Run
-- ============================================================

-- 1. USERS (extends Supabase auth.users)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'patient' check (role in ('patient', 'admin')),
  created_at timestamptz default now()
);

-- 2. PATIENTS
create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  phone text,
  age integer,
  gender text check (gender in ('male', 'female', 'other')),
  created_at timestamptz default now()
);

-- 3. APPOINTMENTS
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  date date not null,
  time_slot text not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
  payment_method text check (payment_method in ('online', 'pay_at_hospital')),
  created_at timestamptz default now(),
  unique(date, time_slot, status) -- prevent double booking (filtered by not-cancelled)
);

-- Remove unique constraint that blocks multi-pending (re-create as partial index)
alter table public.appointments drop constraint if exists appointments_date_time_slot_status_key;
create unique index if not exists idx_active_slot on public.appointments(date, time_slot)
  where status in ('pending', 'confirmed');

-- 4. OP RECORDS
create table if not exists public.op_records (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null unique references public.appointments(id) on delete cascade,
  op_number text not null unique,
  token_number integer,
  queue_status text default 'waiting' check (queue_status in ('waiting', 'in_progress', 'completed')),
  created_at timestamptz default now()
);

-- Auto-assign token number per day
create or replace function assign_token_number()
returns trigger as $$
declare
  appt_date date;
  next_token integer;
begin
  select date into appt_date from public.appointments where id = new.appointment_id;
  select coalesce(max(o.token_number), 0) + 1
    into next_token
    from public.op_records o
    join public.appointments a on a.id = o.appointment_id
    where a.date = appt_date;
  new.token_number := next_token;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_assign_token on public.op_records;
create trigger trg_assign_token
  before insert on public.op_records
  for each row execute function assign_token_number();

-- 5. PAYMENTS
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  amount numeric(10,2) default 500,
  status text not null default 'pending' check (status in ('paid', 'pending', 'failed')),
  method text check (method in ('online', 'pay_at_hospital')),
  created_at timestamptz default now()
);

-- 6. MEDICAL RECORDS
create table if not exists public.medical_records (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  appointment_id uuid references public.appointments(id),
  diagnosis text,
  prescription text,
  notes text,
  created_at timestamptz default now()
);

-- 7. REPORTS
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  file_url text not null,
  file_name text,
  uploaded_by uuid references public.users(id),
  created_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

alter table public.users enable row level security;
alter table public.patients enable row level security;
alter table public.appointments enable row level security;
alter table public.op_records enable row level security;
alter table public.payments enable row level security;
alter table public.medical_records enable row level security;
alter table public.reports enable row level security;

-- Helper: get current user's role
create or replace function get_my_role()
returns text as $$
  select role from public.users where id = auth.uid();
$$ language sql security definer stable;

-- Helper: get current patient id
create or replace function get_my_patient_id()
returns uuid as $$
  select id from public.patients where user_id = auth.uid();
$$ language sql security definer stable;

-- USERS policies
create policy "Users can view own record" on public.users for select using (id = auth.uid() or get_my_role() = 'admin');
create policy "Users can insert own record" on public.users for insert with check (id = auth.uid());
create policy "Users can update own record" on public.users for update using (id = auth.uid());

-- PATIENTS policies
create policy "Patients see own profile" on public.patients for select using (user_id = auth.uid() or get_my_role() = 'admin');
create policy "Patients insert own profile" on public.patients for insert with check (user_id = auth.uid());
create policy "Patients update own profile" on public.patients for update using (user_id = auth.uid() or get_my_role() = 'admin');
create policy "Admin full access patients" on public.patients for all using (get_my_role() = 'admin');

-- APPOINTMENTS policies
create policy "Patients see own appointments" on public.appointments for select using (patient_id = get_my_patient_id() or get_my_role() = 'admin');
create policy "Patients book appointments" on public.appointments for insert with check (patient_id = get_my_patient_id());
create policy "Patients cancel own appointments" on public.appointments for update using (patient_id = get_my_patient_id() or get_my_role() = 'admin');
create policy "Admin manage appointments" on public.appointments for all using (get_my_role() = 'admin');

-- OP RECORDS policies
create policy "Patients see own OP" on public.op_records for select using (
  get_my_role() = 'admin' or
  exists (select 1 from public.appointments a where a.id = op_records.appointment_id and a.patient_id = get_my_patient_id())
);
create policy "Service insert OP" on public.op_records for insert with check (get_my_role() = 'admin' or true);
create policy "Admin manage OP" on public.op_records for all using (get_my_role() = 'admin');

-- PAYMENTS policies
create policy "Patients see own payments" on public.payments for select using (
  get_my_role() = 'admin' or
  exists (select 1 from public.appointments a where a.id = payments.appointment_id and a.patient_id = get_my_patient_id())
);
create policy "Insert payments" on public.payments for insert with check (true);
create policy "Admin manage payments" on public.payments for all using (get_my_role() = 'admin');

-- MEDICAL RECORDS policies
create policy "Patients see own records" on public.medical_records for select using (patient_id = get_my_patient_id() or get_my_role() = 'admin');
create policy "Admin manage medical records" on public.medical_records for all using (get_my_role() = 'admin');

-- REPORTS policies
create policy "Patients see own reports" on public.reports for select using (patient_id = get_my_patient_id() or get_my_role() = 'admin');
create policy "Admin manage reports" on public.reports for all using (get_my_role() = 'admin');

-- ============================================================
-- STORAGE BUCKET
-- Run separately or in Supabase dashboard under Storage
-- ============================================================
-- insert into storage.buckets (id, name, public) values ('reports', 'reports', true);

-- ============================================================
-- CREATE ADMIN USER (run after creating user via Supabase Auth)
-- Replace <admin-user-uuid> with actual UUID from auth.users
-- ============================================================
-- update public.users set role = 'admin' where id = '<admin-user-uuid>';

-- ============================================================
-- REALTIME - Enable for queue updates
-- ============================================================
alter publication supabase_realtime add table public.op_records;
alter publication supabase_realtime add table public.appointments;
