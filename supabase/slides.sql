-- Slide-based lessons (replaces video modules)
-- Run in Supabase SQL Editor

create table if not exists public.slides (
  id uuid primary key default gen_random_uuid(),
  module_id uuid references public.modules(id) on delete cascade not null,
  title text,
  body text not null default '',
  image_path text,
  order_index integer not null,
  created_at timestamptz default now()
);

create index if not exists slides_module_id_idx on public.slides (module_id);
create index if not exists slides_order_idx on public.slides (module_id, order_index);

alter table public.slides enable row level security;

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

-- Prefer images going forward (bucket id kept for existing course thumbnails)
update storage.buckets
set
  file_size_limit = 20971520, -- 20MB
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
where id = 'course-videos';
