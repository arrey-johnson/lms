# LearnSpace LMS

A modern Learning Management System built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, and **Supabase** (Auth, Database, Storage). Instructors upload screen-recorded video classes module-by-module and create student accounts. Students log in and learn for free — no payments.

## Features

- **Admin / Instructor**
  - Secure login
  - Create, edit, delete courses
  - Add ordered modules with title, description, optional thumbnail
  - Upload videos to Supabase Storage (`course-videos`)
  - Drag-and-drop module reordering
  - Create student accounts (email + password) via Supabase Admin API
  - Auto-enroll students in selected courses
  - View student progress; disable or delete accounts
- **Students**
  - Login with instructor-created credentials
  - View enrolled courses with progress %
  - Watch modules in order with Video.js
  - Auto progress tracking (completed at ~90% watched)
  - Resume from last position
- **UI**
  - Clean, mobile-friendly learning UI
  - Dark mode toggle

## Stack

| Layer | Tech |
|--------|------|
| Frontend | Next.js App Router, TypeScript, Tailwind CSS |
| Backend | Server Actions + Route protection via middleware |
| Data / Auth / Storage | Supabase |
| Video | Video.js |
| Deploy | Vercel |

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a project.
2. Open **SQL Editor** and run the full script in [`supabase/schema.sql`](./supabase/schema.sql).
   - Creates tables, RLS policies, helper functions, and the `course-videos` storage bucket.
3. Create your **admin** user:
   - **Authentication → Users → Add user** (email + password), **or** sign up once via the app after temporarily relaxing policies.
   - Then promote the user in SQL:

```sql
update public.profiles
set role = 'admin'
where email = 'your-admin@email.com';
```

## 2. Environment variables

Copy `.env.local.example` to `.env.local` and fill in values from **Supabase → Project Settings → API**:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

> Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser. It is used only on the server to create student accounts.

For Vercel, add the same three variables in **Project Settings → Environment Variables**.

## 3. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 4. Deploy to Vercel

1. Push this repo to GitHub.
2. Import the project in Vercel.
3. Add the env vars above.
4. Deploy.

After deploy, confirm your admin profile `role = 'admin'` in Supabase.

## Key routes

| Route | Purpose |
|--------|---------|
| `/` | Landing |
| `/login` | Auth |
| `/admin` | Instructor overview |
| `/admin/courses` | Manage courses |
| `/admin/courses/[id]` | Modules + video upload |
| `/admin/students` | Create / manage students |
| `/dashboard` | Student course list |
| `/course/[courseId]` | Watch modules |

## Database schema (summary)

- `profiles` — extends `auth.users` with `role` (`admin` \| `student`) and `disabled`
- `courses` — course metadata
- `modules` — lessons with `video_path`, `thumbnail_path`, `order_index`
- `enrollments` — student ↔ course
- `progress` — watched %, last position, completed

RLS ensures students only see enrolled courses/modules and their own progress; only admins mutate catalog data.

## Notes

- Videos are stored privately and streamed via **signed URLs** (not forced download).
- Progress saves on `timeupdate` (throttled), pause, and end.
- Module uploads show an in-progress state while the file is sent to Storage.
