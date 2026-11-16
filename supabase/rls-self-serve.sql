-- Allow authenticated learners to browse the catalog
-- Enrollment is admin-only after purchase (no free self-enroll)

drop policy if exists "Authenticated browse courses" on public.courses;
create policy "Authenticated browse courses"
  on public.courses for select
  using (auth.uid() is not null);

drop policy if exists "Students enroll themselves" on public.enrollments;

-- Course cover images visible to any signed-in user (catalog cards)
drop policy if exists "Authenticated read course thumbnails" on storage.objects;
create policy "Authenticated read course thumbnails"
  on storage.objects for select
  using (
    bucket_id = 'course-videos'
    and auth.uid() is not null
    and name like '%/course-thumbnail-%'
  );
