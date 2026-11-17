export type UserRole = "admin" | "student";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url?: string | null;
  role: UserRole;
  disabled: boolean | null;
  created_at: string;
}

export interface Course {
  id: string;
  title: string;
  description: string | null;
  thumbnail_path: string | null;
  /** Price in USD cents (always > 0 — courses are never free) */
  price_cents: number;
  /** Set to a tutor curriculum slug to replace the slide player. */
  curriculum_slug?: string | null;
  created_at: string;
}

export interface TutorMessage {
  role: "tutor" | "learner";
  content: string;
  lessonId: string;
  via?: "voice";
}

export interface Module {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  /** @deprecated legacy video field — unused for slide lessons */
  video_path?: string | null;
  thumbnail_path?: string | null;
  order_index: number;
  created_at: string;
}

export interface Slide {
  id: string;
  module_id: string;
  title: string | null;
  body: string;
  image_path: string | null;
  order_index: number;
  created_at: string;
}

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  enrolled_at: string;
}

export interface Progress {
  id: string;
  user_id: string;
  module_id: string;
  completed: boolean;
  /** Percent of slides reached in the module (0–100) */
  watched_percentage: number;
  /** Current / furthest slide index (0-based) */
  last_position: number;
  updated_at: string;
}

export interface CourseWithProgress extends Course {
  module_count: number;
  completed_modules: number;
  progress_percent: number;
}

export interface StudentWithProgress extends Profile {
  enrollments: { course_id: string; course_title: string }[];
  completed_modules: number;
  total_modules: number;
  progress_unit?: "modules" | "lessons";
}
