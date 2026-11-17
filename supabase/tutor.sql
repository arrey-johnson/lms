-- Interactive tutor sessions for curriculum-based courses.
-- Run this in the Supabase SQL Editor after schema.sql.

alter table public.courses
  add column if not exists curriculum_slug text;

create table if not exists public.tutor_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  course_id uuid references public.courses(id) on delete cascade not null,
  lesson_index integer not null default 0,
  messages jsonb not null default '[]'::jsonb,
  completed boolean not null default false,
  updated_at timestamptz default now(),
  unique (user_id, course_id)
);

create index if not exists tutor_sessions_user_id_idx
  on public.tutor_sessions (user_id);

alter table public.tutor_sessions enable row level security;

drop policy if exists "Learners manage own tutor sessions" on public.tutor_sessions;
create policy "Learners manage own tutor sessions"
  on public.tutor_sessions for all
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and public.is_enrolled(course_id)
  );

drop policy if exists "Admin full access tutor sessions" on public.tutor_sessions;
create policy "Admin full access tutor sessions"
  on public.tutor_sessions for all
  using (public.is_admin())
  with check (public.is_admin());

grant select, insert, update, delete on table public.tutor_sessions to authenticated;
grant all on table public.tutor_sessions to service_role;
