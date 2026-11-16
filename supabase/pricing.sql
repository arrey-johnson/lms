-- Paid courses only — run in Supabase SQL Editor
-- Adds price (cents) and removes free self-enrollment

alter table public.courses
  add column if not exists price_cents integer not null default 1499;

update public.courses
set price_cents = 1499
where price_cents is null or price_cents <= 0;

alter table public.courses
  drop constraint if exists courses_price_cents_positive;

alter table public.courses
  add constraint courses_price_cents_positive check (price_cents > 0);

-- Students can no longer self-enroll for free (admins enroll after purchase)
drop policy if exists "Students enroll themselves" on public.enrollments;
