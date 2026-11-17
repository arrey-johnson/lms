-- Mobile money payments (Fapshi)
-- Run this in the Supabase SQL Editor on the existing project.
-- Safe to run more than once.

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  amount_xaf integer not null check (amount_xaf >= 100),
  price_cents integer not null check (price_cents > 0),
  status text not null default 'created' check (status in ('created', 'pending', 'successful', 'failed', 'expired')),
  environment text not null default 'sandbox' check (environment in ('sandbox', 'live')),
  trans_id text unique,
  external_id text not null unique,
  phone text,
  medium text,
  payer_name text,
  email text,
  checkout_url text,
  financial_trans_id text,
  revenue_xaf integer,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  confirmed_at timestamptz,
  last_checked_at timestamptz,
  request_notified_at timestamptz,
  success_notified_at timestamptz,
  failure_notified_at timestamptz,
  alerted_at timestamptz
);

create index if not exists payments_user_created_idx on public.payments (user_id, created_at desc);
create index if not exists payments_course_id_idx on public.payments (course_id);
create index if not exists payments_open_idx on public.payments (user_id, course_id, status);

alter table public.payments enable row level security;

drop policy if exists "Users read own payments" on public.payments;
create policy "Users read own payments"
  on public.payments for select
  using (auth.uid() = user_id or public.is_admin());

grant select on public.payments to authenticated;
grant all on public.payments to service_role;
