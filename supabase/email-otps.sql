-- Email confirmation OTPs (6-digit codes sent via Zoho)
create table if not exists public.email_otps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  email text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists email_otps_email_idx on public.email_otps (email);
create index if not exists email_otps_user_id_idx on public.email_otps (user_id);

alter table public.email_otps enable row level security;

-- No client policies: only service role / server actions use this table.
