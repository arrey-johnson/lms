-- LMS Schema + RLS Policies
-- Run this in the Supabase SQL Editor

-- Profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique,
  full_name text,
  avatar_url text,
  role text check (role in ('admin', 'student')) default 'student',
  disabled boolean default false,
  created_at timestamptz default now()
);

-- Courses
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  thumbnail_path text, -- course cover image in Supabase Storage
  price_cents integer not null default 1499 check (price_cents > 0),
  created_at timestamptz default now()
);

-- Modules (lessons) — content is slide-based
create table if not exists public.modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses(id) on delete cascade not null,
  title text not null,
  description text,
  video_path text, -- legacy, unused
  thumbnail_path text, -- legacy, unused
  order_index integer not null,
  created_at timestamptz default now()
);

-- Slides within a module
create table if not exists public.slides (
  id uuid primary key default gen_random_uuid(),
  module_id uuid references public.modules(id) on delete cascade not null,
  title text,
  body text not null default '',
  image_path text,
  order_index integer not null,
  created_at timestamptz default now()
);

-- Enrollments
create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  course_id uuid references public.courses(id) on delete cascade not null,
  enrolled_at timestamptz default now(),
  unique(user_id, course_id)
);

-- Progress
create table if not exists public.progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  module_id uuid references public.modules(id) on delete cascade not null,
  completed boolean default false,
  watched_percentage float default 0,
  last_position float default 0,
  updated_at timestamptz default now(),
  unique(user_id, module_id)
);

-- Email confirmation OTPs (sent via Hostinger from support@promptstackclassroom.com)
create table if not exists public.email_otps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  email text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz default now()
);

-- Indexes
create index if not exists modules_course_id_idx on public.modules(course_id);
create index if not exists modules_order_idx on public.modules(course_id, order_index);
create index if not exists slides_module_id_idx on public.slides(module_id);
create index if not exists slides_order_idx on public.slides(module_id, order_index);
create index if not exists enrollments_user_id_idx on public.enrollments(user_id);
create index if not exists enrollments_course_id_idx on public.enrollments(course_id);
create index if not exists progress_user_id_idx on public.progress(user_id);
create index if not exists progress_module_id_idx on public.progress(module_id);
create index if not exists email_otps_email_idx on public.email_otps (email);
create index if not exists email_otps_user_id_idx on public.email_otps (user_id);

-- Helper: check if current user is admin
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and coalesce(disabled, false) = false
  );
$$;

-- Helper: check if current user is enrolled in a course
create or replace function public.is_enrolled(cid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.enrollments
    where user_id = auth.uid() and course_id = cid
  );
$$;

-- Auto-create profile on signup (fallback; admin API also inserts explicitly)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'student')
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(nullif(excluded.full_name, ''), profiles.full_name),
    role = coalesce(nullif(excluded.role, ''), profiles.role);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.modules enable row level security;
alter table public.slides enable row level security;
alter table public.enrollments enable row level security;
alter table public.progress enable row level security;
alter table public.email_otps enable row level security;

-- Profiles policies
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

drop policy if exists "Users can update own profile name" on public.profiles;
create policy "Users can update own profile name"
  on public.profiles for update
  using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

drop policy if exists "Admin can insert profiles" on public.profiles;
create policy "Admin can insert profiles"
  on public.profiles for insert
  with check (public.is_admin() or auth.uid() = id);

drop policy if exists "Admin can delete profiles" on public.profiles;
create policy "Admin can delete profiles"
  on public.profiles for delete
  using (public.is_admin());

-- Courses policies
drop policy if exists "Admin full access courses" on public.courses;
create policy "Admin full access courses"
  on public.courses for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Students read enrolled courses" on public.courses;
create policy "Students read enrolled courses"
  on public.courses for select
  using (public.is_enrolled(id));

-- Modules policies
drop policy if exists "Admin full access modules" on public.modules;
create policy "Admin full access modules"
  on public.modules for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Students read enrolled modules" on public.modules;
create policy "Students read enrolled modules"
  on public.modules for select
  using (public.is_enrolled(course_id));

-- Slides policies
drop policy if exists "Admin full access slides" on public.slides;
create policy "Admin full access slides"
  on public.slides for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Students read enrolled slides" on public.slides;
create policy "Students read enrolled slides"
  on public.slides for select
  using (
    exists (
      select 1
      from public.modules m
      where m.id = slides.module_id
        and (
          public.is_admin()
          or public.is_enrolled(m.course_id)
        )
    )
  );

-- Enrollments policies
drop policy if exists "Admin full access enrollments" on public.enrollments;
create policy "Admin full access enrollments"
  on public.enrollments for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Students read own enrollments" on public.enrollments;
create policy "Students read own enrollments"
  on public.enrollments for select
  using (auth.uid() = user_id);

-- Progress policies
drop policy if exists "Students manage own progress" on public.progress;
create policy "Students manage own progress"
  on public.progress for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Admin read all progress" on public.progress;
create policy "Admin read all progress"
  on public.progress for select
  using (public.is_admin());

-- Storage bucket for course media (thumbnails + slide images)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'course-videos',
  'course-videos',
  false,
  20971520, -- 20MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Storage policies
drop policy if exists "Admin upload course videos" on storage.objects;
create policy "Admin upload course videos"
  on storage.objects for insert
  with check (
    bucket_id = 'course-videos' and public.is_admin()
  );

drop policy if exists "Admin update course videos" on storage.objects;
create policy "Admin update course videos"
  on storage.objects for update
  using (
    bucket_id = 'course-videos' and public.is_admin()
  );

drop policy if exists "Admin delete course videos" on storage.objects;
create policy "Admin delete course videos"
  on storage.objects for delete
  using (
    bucket_id = 'course-videos' and public.is_admin()
  );

drop policy if exists "Enrolled students read course videos" on storage.objects;
create policy "Enrolled students read course videos"
  on storage.objects for select
  using (
    bucket_id = 'course-videos' and (
      public.is_admin()
      or exists (
        select 1
        from public.modules m
        join public.enrollments e on e.course_id = m.course_id
        where e.user_id = auth.uid()
          and (
            m.video_path = name
            or m.thumbnail_path = name
            or name like (m.course_id::text || '/%')
          )
      )
    )
  );

-- OPTIONAL: Promote your first admin after signing up in Auth
-- update public.profiles set role = 'admin' where email = 'you@example.com';
